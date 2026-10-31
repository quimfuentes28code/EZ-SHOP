import { expect, test } from "@playwright/test";
import { installSupabaseMock, MOCK_ORGANIZATION_ID } from "./helpers/supabase";

test("Empresa muestra Diseño del perfil como pantalla propia y guarda el orden por negocio", async ({ page }) => {
  const { tables } = await installSupabaseMock(page);
  await page.goto("/empresa");
  const navigation = page.getByRole("navigation", { name: "Módulos disponibles" });
  await expect(navigation.getByRole("button", { name: "Diseño del perfil" })).toBeVisible();
  await navigation.getByRole("button", { name: "Diseño del perfil" }).click();
  await expect(page.getByRole("heading", { name: "Organizar perfil público" })).toBeVisible();

  await page.getByRole("button", { name: "Bajar Presentación" }).click();
  await page.getByRole("button", { name: "Guardar distribución del perfil" }).click();
  await expect(page.getByText("Distribución guardada. Los clientes verán las secciones en este orden.")).toBeVisible();
  const layout = tables.organizations[0].profile_sections as string[];
  expect(layout.slice(0, 2)).toEqual(["services", "about"]);

  await page.goto(`/cliente?negocio=${MOCK_ORGANIZATION_ID}`);
  const profile = page.getByRole("dialog");
  const sections = profile.getByRole("navigation", { name: /Secciones de/ }).getByRole("button");
  await expect(sections.first()).toHaveText("Servicios");
  await expect(sections.nth(1)).toHaveText("Presentación");
});

test("en pantalla móvil existe acceso directo al Diseño del perfil", async ({ page }) => {
  await installSupabaseMock(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/empresa");
  const navigation = page.getByRole("navigation", { name: "Espacios conectados" });
  const link = navigation.getByRole("button", { name: "Diseño del perfil" });
  await link.scrollIntoViewIfNeeded();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page.getByRole("heading", { name: "Organizar perfil público" })).toBeVisible();
});
