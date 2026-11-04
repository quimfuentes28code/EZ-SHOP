import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { installSupabaseMock, MOCK_ORGANIZATION_ID, MOCK_USER_ID } from "./helpers/supabase";

// These are browser viewport/keyboard-contract checks with synthetic accounts.
// They do not certify Safari on a physical iPhone or an installed native app.
const dimensions = [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 1000 },
];
const customerLabels = ["Explorar", "Mapa", "Favoritos", "Mensajes", "Perfil"];
const businessLabels = ["Inicio", "Agenda", "Mensajes", "Gestión", "Perfil"];
const navigation = (page: Page, experience: "Cliente" | "Empresa") => page.getByRole("navigation", { name: `Navegación ${experience}`, exact: true });

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth })))
    .toEqual(expect.objectContaining({ width: page.viewportSize()!.width }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}

async function expectAccessibleMain(page: Page, experience: "Cliente" | "Empresa") {
  const mainId = experience === "Cliente" ? "client-main" : "business-main-content";
  const main = page.getByRole("main");
  // Count every DOM landmark, including an accidentally hidden or nested wrapper.
  await expect(page.locator("main")).toHaveCount(1);
  await expect(main).toHaveAttribute("id", mainId);
  const skip = page.getByRole("link", { name: "Saltar al contenido", exact: true });
  await expect(skip).toHaveCount(1);
  await expect(skip).toHaveAttribute("href", `#${mainId}`);
  await skip.focus();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(main).toBeFocused();
}

for (const size of dimensions) {
  test(`Cliente y Empresa conservan navegación y distribución a ${size.width} × ${size.height}`, async ({ page, browserName }) => {
    await page.setViewportSize(size);
    const { tables } = await installSupabaseMock(page);
    tables.business_posts.push({ id: "post-navigation-qa", organization_id: MOCK_ORGANIZATION_ID, body: "Publicación de prueba para comprobar la nueva distribución", media_url: "", media_kind: null, published: true, created_at: "2026-10-31T12:00:00Z" });
    for (const experience of ["Cliente", "Empresa"] as const) {
      await page.goto(experience === "Cliente" ? "/cliente" : "/empresa");
      await expect(page.getByRole("heading", { name: experience === "Cliente" ? /Encuentra lo que necesitas/ : "Estudio de prueba", exact: experience === "Empresa" })).toBeVisible();
      // Deterministic scroll measurements and screenshots; do not capture a
      // frame halfway through the site's smooth scrolling animation.
      await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
      await expectAccessibleMain(page, experience);
      await expectNoHorizontalOverflow(page);
      const bottom = page.locator(".app-bottom-navigation");
      if (size.width <= 860) {
        await expect(bottom).toBeVisible();
        await expect(navigation(page, experience).getByRole("button")).toHaveText(experience === "Cliente" ? customerLabels : businessLabels);
        for (const button of await bottom.getByRole("button").all()) {
          const box = await button.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        const bar = await bottom.boundingBox();
        expect(bar).not.toBeNull();
        expect(bar!.y).toBeGreaterThanOrEqual(0);
        expect(bar!.y + bar!.height).toBeLessThanOrEqual(size.height + 1);
        expect(await bottom.evaluate(element => getComputedStyle(element).position)).toBe("fixed");
      } else {
        await expect(bottom).toBeHidden();
        if (experience === "Empresa") {
          const desktop = page.getByRole("navigation", { name: "Módulos disponibles", exact: true });
          for (const label of ["Inicio", "Agenda", "Mensajes", "Gestión", "Perfil público", "Herramientas"]) await expect(desktop.getByRole("heading", { name: label, exact: true })).toBeVisible();
          await expect(desktop.getByRole("button", { name: "Clientes", exact: true })).toBeVisible();
          await expect(desktop.getByRole("button", { name: "Servicios", exact: true })).toBeVisible();
        } else await expect(navigation(page, "Cliente").getByRole("button")).toHaveText(customerLabels);
      }
      if (browserName === "chromium" && (size.width === 390 || size.width === 1440)) {
        await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo({ top: 0, left: 0, behavior: "instant" }); });
        await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
        await mkdir(resolve("docs/previews"), { recursive: true });
        await page.screenshot({ path: resolve(`docs/previews/navigation-${experience === "Cliente" ? "client" : "business"}-${size.width === 390 ? "mobile" : "desktop"}.png`), fullPage: false });
      }
    }
  });
}

test("el menú de cuenta responde a teclado y devuelve el foco al cerrar con Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installSupabaseMock(page);
  for (const path of ["/cliente", "/empresa"]) {
    await page.goto(path);
    const menu = page.locator(".app-account-actions");
    const trigger = menu.locator("summary");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(menu).toHaveAttribute("open", "");
    await page.keyboard.press("Tab");
    await expect(menu.getByRole("button", { name: "Mi cuenta y configuración", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).not.toHaveAttribute("open", "");
    await expect(trigger).toBeFocused();
  }
});

test("el área segura simulada deja accesible la acción final del formulario de Cliente", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installSupabaseMock(page);
  await page.goto("/cliente");
  await page.evaluate(() => document.documentElement.style.setProperty("--app-safe-bottom", "24px"));
  await navigation(page, "Cliente").getByRole("button", { name: "Perfil", exact: true }).click();
  await page.getByRole("button", { name: /^Mis datos/ }).click();
  const save = page.getByRole("button", { name: "Guardar perfil", exact: true });
  await save.scrollIntoViewIfNeeded();
  const bar = await page.locator(".app-bottom-navigation").boundingBox();
  const action = await save.boundingBox();
  expect(bar).not.toBeNull(); expect(action).not.toBeNull();
  expect(bar!.height).toBeGreaterThanOrEqual(92);
  expect(action!.y + action!.height).toBeLessThanOrEqual(bar!.y);
});

test("al reducir visualViewport por teclado se retira la barra inferior y vuelve al cerrar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    Object.defineProperty(viewport, "height", { configurable: true, get: () => (window as Window & { qaViewportHeight?: number }).qaViewportHeight ?? innerHeight });
  });
  await installSupabaseMock(page, { tables: { conversations: [{ id: "keyboard-thread", organization_id: MOCK_ORGANIZATION_ID, customer_id: MOCK_USER_ID, customer_display_name: "Alex QA", created_at: "2026-10-31T12:00:00Z" }] } });
  await page.goto("/cliente");
  await navigation(page, "Cliente").getByRole("button", { name: "Mensajes", exact: true }).click();
  const compose = page.getByRole("textbox", { name: "Tu mensaje", exact: true });
  await compose.fill("Borrador conservado con teclado");
  await page.evaluate(() => {
    (window as Window & { qaViewportHeight?: number }).qaViewportHeight = innerHeight - 320;
    visualViewport!.dispatchEvent(new Event("resize"));
  });
  const bar = page.locator(".app-bottom-navigation");
  await expect(bar).toBeHidden();
  await expect(bar).toHaveAttribute("data-keyboard-hidden", "true");
  await expect(compose).toHaveValue("Borrador conservado con teclado");
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    (window as Window & { qaViewportHeight?: number }).qaViewportHeight = innerHeight;
    visualViewport!.dispatchEvent(new Event("resize"));
  });
  await expect(bar).toBeVisible();
  await expect(bar.getByRole("button")).toHaveCount(5);
});

test("Mensajes oculto conserva el borrador sin consultar ni marcar nuevos mensajes como leídos", async ({ page }) => {
  test.setTimeout(30_000);
  const thread = "66666666-6666-4666-8666-666666666666";
  const initial = { id: "read-before", conversation_id: thread, sender_id: "99999999-9999-4999-8999-999999999999", actor_role: "business", body: "Mensaje visible", created_at: "2026-10-31T12:00:00Z", attachment_path: "", attachment_name: "", attachment_mime: "", attachment_size: null };
  const mock = await installSupabaseMock(page, { tables: { conversations: [{ id: thread, organization_id: MOCK_ORGANIZATION_ID, customer_id: MOCK_USER_ID, customer_display_name: "Alex QA", created_at: "2026-10-31T11:00:00Z" }], conversation_messages: [initial] } });
  await page.goto("/cliente");
  await navigation(page, "Cliente").getByRole("button", { name: "Mensajes", exact: true }).click();
  await expect(page.getByText("Mensaje visible", { exact: true })).toBeVisible();
  await expect.poll(() => mock.requests.filter(request => request.method === "POST" && request.url.includes("conversation_read_states")).length).toBeGreaterThan(0);
  await page.getByRole("textbox", { name: "Tu mensaje", exact: true }).fill("Borrador en otra sección");
  await navigation(page, "Cliente").getByRole("button", { name: "Perfil", exact: true }).click();
  await page.waitForLoadState("networkidle");
  const conversationCalls = () => mock.requests.filter(request => /\/(conversations|conversation_messages|conversation_read_states)(?:\?|$)/.test(request.url));
  const before = conversationCalls().length;
  mock.tables.conversation_messages.push({ ...initial, id: "read-after", body: "Mensaje recibido mientras Perfil estaba abierto", created_at: "2026-10-31T12:05:00Z" });
  // One complete six-second polling period must elapse to prove it is paused.
  await page.waitForTimeout(6_500);
  expect(conversationCalls()).toHaveLength(before);
  await navigation(page, "Cliente").getByRole("button", { name: "Mensajes", exact: true }).click();
  await expect(page.getByText("Mensaje recibido mientras Perfil estaba abierto", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Tu mensaje", exact: true })).toHaveValue("Borrador en otra sección");
  await expect.poll(() => mock.requests.some(request => request.method === "POST" && request.url.includes("conversation_read_states") && (request.body as { read_at?: string } | null)?.read_at === "2026-10-31T12:05:00Z")).toBe(true);
});
