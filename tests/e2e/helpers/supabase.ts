import type { Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

// Synthetic transport fixtures only. They do not exercise PostgreSQL/RLS.
export const MOCK_SUPABASE_URL = "https://autonoservice-test.supabase.co";
export const MOCK_USER_ID = "11111111-1111-4111-8111-111111111111";
export const MOCK_ORGANIZATION_ID = "22222222-2222-4222-8222-222222222222";
type Row = Record<string, unknown>;
type RecordedRequest = { method: string; url: string; body: unknown };

function parts(value: string): string[] {
  let depth = 0;
  let start = 0;
  const result: string[] = [];
  for (let index = 0; index < value.length; index++) {
    if (value[index] === "(") depth++;
    if (value[index] === ")") depth--;
    if (value[index] === "," && depth === 0) {
      result.push(value.slice(start, index));
      start = index + 1;
    }
  }
  return [...result, value.slice(start)];
}

function comparison(actual: unknown, operator: string, expected: string): boolean {
  if (operator === "in") return parts(expected.slice(1, -1)).includes(String(actual));
  if (operator === "is") return expected === "null" ? actual == null : String(actual) === expected;
  if (operator === "not") {
    const [next, ...rest] = expected.split(".");
    return !comparison(actual, next, rest.join("."));
  }
  const value = String(actual ?? "");
  if (operator === "eq") return value === expected;
  if (operator === "neq") return value !== expected;
  if (operator === "lt") return value < expected;
  if (operator === "lte") return value <= expected;
  if (operator === "gt") return value > expected;
  if (operator === "gte") return value >= expected;
  throw new Error(`Filtro de mock no implementado: ${operator}`);
}

function expression(row: Row, input: string): boolean {
  if (input.startsWith("and(") || input.startsWith("or(")) {
    const isAnd = input.startsWith("and(");
    const children = parts(input.slice(isAnd ? 4 : 3, -1));
    return isAnd ? children.every((child) => expression(row, child)) : children.some((child) => expression(row, child));
  }
  const [key, operator, ...value] = input.split(".");
  return comparison(row[key], operator, value.join("."));
}

function matches(row: Row, params: URLSearchParams): boolean {
  for (const [key, filter] of params) {
    if (["select", "order", "offset", "limit", "on_conflict", "columns"].includes(key)) continue;
    if (key === "or" || key === "and") {
      const options = parts(filter.slice(1, -1));
      if (key === "or" ? !options.some((value) => expression(row, value)) : !options.every((value) => expression(row, value))) return false;
    } else {
      const [operator, ...value] = filter.split(".");
      if (!comparison(row[key], operator, value.join("."))) return false;
    }
  }
  return true;
}

export async function installSupabaseMock(page: Page, options: { session?: boolean; tables?: Record<string, Row[]> } = {}) {
  const user = {
    id: MOCK_USER_ID,
    email: "persona@example.test",
    aud: "authenticated",
    role: "authenticated",
    created_at: "2026-01-01T12:00:00Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { first_name: "Alex", last_name: "Prueba" },
  };
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, role: "authenticated", exp: expires })).toString("base64url")}.synthetic-signature`;
  const session = { access_token: token, refresh_token: "synthetic-refresh", expires_at: expires, expires_in: 3600, token_type: "bearer", user };
  const tables: Record<string, Row[]> = {
    account_types: [{ user_id: user.id, account_type: "business" }, { user_id: user.id, account_type: "customer" }],
    person_profiles: [{ user_id: user.id, first_name: "Alex", last_name: "Prueba", city: "Barcelona", phone: "" }],
    organizations: [{ id: MOCK_ORGANIZATION_ID, owner_id: user.id, name: "Estudio de prueba", category: "Fotografía", city: "Barcelona", description: "Fotografía profesional de prueba", tagline: "", accent_color: "#A47B53", avatar_url: "", cover_url: "", published: true, created_at: "2026-01-01T12:00:00Z" }],
    organization_services: [{ id: "33333333-3333-4333-8333-333333333333", organization_id: MOCK_ORGANIZATION_ID, title: "Retrato de prueba", description: "Servicio sintético", price_eur: 50, active: true }],
    organization_locations: [{ id: "44444444-4444-4444-8444-444444444444", organization_id: MOCK_ORGANIZATION_ID, name: "Sede Terrassa", city: "Terrassa", address: "Dirección sintética", service_mode: "local", availability_mode: "cita", published: true, latitude: null, longitude: null }],
    organization_customers: [], service_requests: [], customer_favorites: [], business_posts: [],
    conversations: [], conversation_messages: [], conversation_read_states: [], organization_module_settings: [], business_work_items: [],
    ...options.tables,
  };
  const requests: RecordedRequest[] = [];
  await page.addInitScript(({ session, signedIn }) => {
    if (signedIn && !localStorage.getItem("sb-autonoservice-test-auth-token")) localStorage.setItem("sb-autonoservice-test-auth-token", JSON.stringify(session));
  }, { session, signedIn: options.session !== false });
  // Even if somebody accidentally points the runner at a different build,
  // these account tests must never contact a configured real backend.
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== MOCK_SUPABASE_URL && /^\/(?:auth|rest|storage)\/v1\//.test(url.pathname)) {
      await route.abort("blockedbyclient");
    } else await route.fallback();
  });
  await page.route(`${MOCK_SUPABASE_URL}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    let body: unknown = null;
    try { body = request.postDataJSON(); } catch { /* GET or binary upload. */ }
    requests.push({ method: request.method(), url: request.url(), body });
    const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };
    if (request.method() === "OPTIONS") { await route.fulfill({ status: 204, headers }); return; }
    if (url.pathname === "/auth/v1/logout") { await route.fulfill({ status: 204, headers }); return; }
    if (url.pathname.startsWith("/auth/")) {
      await route.fulfill({ json: url.pathname.endsWith("/user") ? user : session, headers });
      return;
    }
    if (url.pathname.startsWith("/storage/")) {
      await route.fulfill({ status: 400, json: { message: "No se suben archivos en esta prueba de navegación." }, headers });
      return;
    }
    const table = url.pathname.split("/rest/v1/")[1];
    if (!table || !Object.hasOwn(tables, table)) {
      await route.fulfill({ status: 400, json: { message: `Tabla inesperada en la prueba: ${table}` }, headers });
      return;
    }
    let rows = tables[table].filter((row) => matches(row, url.searchParams));
    if (request.method() === "POST") {
      rows = (Array.isArray(body) ? body : [body]).map((value) => {
        const incoming = value as Row;
        const keys = (url.searchParams.get("on_conflict") || "id").split(",");
        const existing = request.headers().prefer?.includes("resolution=merge-duplicates")
          ? tables[table].find((row) => keys.every((key) => incoming[key] !== undefined && row[key] === incoming[key])) : undefined;
        if (existing) { Object.assign(existing, incoming); return existing; }
        const row = { id: randomUUID(), created_at: new Date().toISOString(), ...incoming };
        tables[table].push(row);
        return row;
      });
    } else if (request.method() === "PATCH") {
      rows.forEach((row) => Object.assign(row, body));
    } else if (request.method() === "DELETE") {
      tables[table] = tables[table].filter((row) => !rows.includes(row));
    } else if (request.method() !== "GET" && request.method() !== "HEAD") {
      await route.fulfill({ status: 405, json: { message: "Método inesperado" }, headers });
      return;
    }
    const orders = url.searchParams.get("order")?.split(",") || [];
    rows.sort((a, b) => {
      for (const item of orders) {
        const [key, direction] = item.split(".");
        const difference = String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
        if (difference) return direction === "desc" ? -difference : difference;
      }
      return 0;
    });
    const range = request.headers().range?.split("-").map(Number);
    const offset = Number(url.searchParams.get("offset") || range?.[0] || 0);
    const limit = Number(url.searchParams.get("limit") || (range ? range[1] - range[0] + 1 : rows.length));
    rows = rows.slice(offset, offset + limit);
    const singular = request.headers().accept?.includes("application/vnd.pgrst.object+json");
    const representation = request.method() === "GET" || request.method() === "HEAD" || request.headers().prefer?.includes("return=representation");
    await route.fulfill({ status: representation ? 200 : 204, ...(representation ? { json: singular ? rows[0] || null : rows } : {}), headers });
  });
  return { tables, requests };
}
