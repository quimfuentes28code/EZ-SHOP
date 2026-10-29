import { expect, test } from "@playwright/test";
import { installSupabaseMock, MOCK_ORGANIZATION_ID, MOCK_SUPABASE_URL, MOCK_USER_ID } from "./helpers/supabase";

test("los módulos guardados y sus borradores permanecen en su empresa", async ({ page }) => {
  const second = "55555555-5555-4555-8555-555555555555";
  const { tables } = await installSupabaseMock(page, { tables: {
    organizations: [
      { id: MOCK_ORGANIZATION_ID, owner_id: MOCK_USER_ID, name: "Empresa A", category: "Fotografía", city: "Barcelona", description: "Empresa de prueba A", published: true },
      { id: second, owner_id: MOCK_USER_ID, name: "Empresa B", category: "Fotografía", city: "Terrassa", description: "Empresa de prueba B", published: true },
    ],
    organization_module_settings: [{ organization_id: MOCK_ORGANIZATION_ID, modules: ["customers", "services"] }],
  } });
  await page.goto("/empresa");
  await page.getByRole("navigation", { name: "Módulos disponibles" }).getByRole("button", { name: "Herramientas", exact: true }).click();
  const editor = page.locator(".business-live-module-editor");
  await expect(editor.getByRole("checkbox", { name: "Clientes", exact: true })).toBeChecked();
  await editor.getByRole("checkbox", { name: "Clientes", exact: true }).uncheck();
  await expect(editor).toContainText("Tienes cambios sin guardar");
  const primaryGrid = page.locator(".business-live-tool-grid").first();
  await expect(primaryGrid.getByRole("button", { name: /^Clientes/ })).toBeVisible();
  await editor.getByRole("button", { name: "Guardar selección", exact: true }).click();
  await expect(editor).toContainText("Herramientas seleccionadas guardadas");
  await expect(primaryGrid.getByRole("button", { name: /^Clientes/ })).toHaveCount(0);
  await page.getByRole("combobox", { name: "Negocios anteriores", exact: true }).selectOption(second);
  await expect(editor.getByRole("checkbox", { name: "Servicios", exact: true })).not.toBeChecked();
  await expect(primaryGrid.getByRole("button", { name: /^Clientes/ })).toBeVisible();
  expect(tables.organization_module_settings).toHaveLength(1);
  expect(tables.organization_module_settings[0].organization_id).toBe(MOCK_ORGANIZATION_ID);
  await editor.getByRole("checkbox", { name: "Clientes", exact: true }).check();
  await editor.getByRole("button", { name: "Guardar selección", exact: true }).click();
  await expect(editor).toContainText("Herramientas seleccionadas guardadas");
  expect(tables.organization_module_settings.find((row) => row.organization_id === second)?.modules).toEqual(["customers"]);
});

test("una carga fallida de módulos impide sobrescribir las preferencias", async ({ page }) => {
  const { tables } = await installSupabaseMock(page);
  let fail = true;
  await page.route(`${MOCK_SUPABASE_URL}/rest/v1/organization_module_settings?**`, async (route) => {
    if (fail && route.request().method() === "GET") await route.fulfill({ status: 500, json: { message: "Fallo sintético de preferencias" } });
    else await route.fallback();
  });
  await page.goto("/empresa");
  await page.getByRole("navigation", { name: "Módulos disponibles" }).getByRole("button", { name: "Herramientas", exact: true }).click();
  const editor = page.locator(".business-live-module-editor");
  await expect(editor).toContainText("No se pudieron cargar preferencias");
  await expect(editor.getByRole("button", { name: "Guardar selección", exact: true })).toBeDisabled();
  await expect(editor.getByRole("checkbox").first()).toBeDisabled();
  expect(tables.organization_module_settings).toHaveLength(0);
  fail = false;
  await editor.getByRole("button", { name: "Reintentar carga", exact: true }).click();
  await expect(editor.getByRole("button", { name: "Guardar selección", exact: true })).toBeEnabled();
});
