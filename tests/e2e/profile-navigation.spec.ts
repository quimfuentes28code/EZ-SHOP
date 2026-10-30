import { expect, test } from "@playwright/test";
import { installSupabaseMock, MOCK_ORGANIZATION_ID, MOCK_SUPABASE_URL } from "./helpers/supabase";
import { installLeafletMock } from "./helpers/leaflet";

test("el perfil conserva origen Mapa, filtros y navegación Atrás/Adelante", async ({ page }) => {
  await installSupabaseMock(page, { tables: { organization_locations: [{
    id: "44444444-4444-4444-8444-444444444444", organization_id: MOCK_ORGANIZATION_ID,
    name: "Sede Terrassa", city: "Terrassa", address: "Dirección QA", published: true,
    service_mode: "local", availability_mode: "cita", latitude: 41.56, longitude: 2.01,
  }] } });
  await installLeafletMock(page);
  await page.goto("/cliente");
  await page.getByLabel("Filtrar por localidad", { exact: true }).fill("Terrassa");
  const nav = page.getByRole("navigation", { name: "Navegación Cliente" });
  await nav.getByRole("button", { name: "Mapa", exact: true }).click();
  await expect(page).toHaveURL(/vista=mapa/);
  const historyBefore = await page.evaluate(() => history.length);
  await nav.getByRole("button", { name: "Mapa", exact: true }).click();
  expect(await page.evaluate(() => history.length)).toBe(historyBefore);
  await page.getByTestId("map-marker").click();
  await expect(page).toHaveURL(new RegExp("negocio=" + MOCK_ORGANIZATION_ID));
  await expect(page.getByRole("dialog")).toContainText("Sede Terrassa");
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Filtrar por localidad", { exact: true })).toHaveValue("Terrassa");
  await expect(nav.getByRole("button", { name: "Mapa", exact: true })).toHaveAttribute("aria-current", "page");
  await page.goForward();
  await expect(page.getByRole("dialog")).toContainText("Estudio de prueba");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).not.toHaveURL(/negocio=/);
  await expect(page.getByTestId("map-marker")).toBeFocused();
});

test("un enlace directo carga el perfil y cerrar no abandona Cliente", async ({ page }) => {
  await installSupabaseMock(page);
  await page.goto(`/cliente?negocio=${MOCK_ORGANIZATION_ID}`);
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Estudio de prueba", exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Qué podemos hacer por ti", exact: true })).toBeVisible();
  await page.reload();
  await expect(dialog.getByRole("heading", { name: "Estudio de prueba", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Cerrar ventana", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/cliente$/);
});

test("los perfiles privados o inexistentes no revelan datos comerciales", async ({ page }) => {
  const { tables } = await installSupabaseMock(page);
  tables.organizations[0].published = false;
  await page.goto(`/cliente?negocio=${MOCK_ORGANIZATION_ID}`);
  await expect(page.getByRole("dialog")).toContainText("Este perfil no está disponible públicamente");
  await expect(page.getByRole("dialog")).not.toContainText("Estudio de prueba");
  await expect(page.getByRole("dialog")).not.toContainText("Retrato de prueba");
});

test("la carga lenta y un fallo del directorio no se presentan como perfil privado", async ({ page }) => {
  await installSupabaseMock(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route(`${MOCK_SUPABASE_URL}/rest/v1/organizations?**`, async (route) => {
    // RealExperience also reads organizations before CustomerSocial mounts.
    if (!new URL(route.request().url()).searchParams.get("select")?.includes("accent_color")) return route.fallback();
    await pending;
    await route.fulfill({ status: 500, json: { message: "Fallo sintético de directorio" } });
  });
  await page.goto(`/cliente?negocio=${MOCK_ORGANIZATION_ID}`);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Cargando perfil de empresa");
  await expect(dialog).not.toContainText("Este perfil no está disponible públicamente");
  release();
  await expect(dialog).toContainText("No se ha podido cargar el directorio");
  await expect(dialog).not.toContainText("Este perfil no está disponible públicamente");
});
