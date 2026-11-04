import { expect, test } from "@playwright/test";
import { installSupabaseMock, MOCK_ORGANIZATION_ID } from "./helpers/supabase";
import { openBusinessProfileSection } from "./helpers/navigation";

test("Empresa unifica Diseño y apariencia en Perfil público y guarda el orden por negocio", async ({ page }) => {
  const { tables } = await installSupabaseMock(page);
  await page.goto("/empresa");
  await expect(page.getByRole("navigation", { name: "Módulos disponibles" }).getByRole("button", { name: "Diseño del perfil", exact: true })).toHaveCount(0);
  await openBusinessProfileSection(page, "Diseño y apariencia");
  await expect(page.locator(".social-business-editor")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Organizar perfil público" })).toBeVisible();

  await page.getByRole("button", { name: "Bajar Presentación" }).click();
  await page.getByRole("button", { name: "Guardar distribución del perfil" }).click();
  await expect(page.getByText("Distribución guardada. Los clientes verán las secciones en este orden.")).toBeVisible();
  const layout = tables.organizations[0].profile_sections as string[];
  expect(layout.slice(0, 2)).toEqual(["services", "about"]);

  await page.goto(`/cliente?negocio=${MOCK_ORGANIZATION_ID}`);
  const profile = page.getByRole("dialog");
  const sections = profile.getByRole("navigation", { name: /Secciones de/ }).getByRole("button");
  await expect(sections.first()).toHaveText("Inicio");
  await expect(sections.nth(1)).toHaveText("Servicios");
  await expect(sections.nth(2)).toHaveText("Más");
  await sections.nth(2).click();
  await expect(profile.getByRole("heading", { name: "Conoce el negocio" })).toBeVisible();
});

test("en pantalla móvil Perfil permite abrir el diseño y conservar el editor único", async ({ page }) => {
  await installSupabaseMock(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/empresa");
  const navigation = page.getByRole("navigation", { name: "Navegación Empresa", exact: true });
  await expect(navigation.getByRole("button")).toHaveCount(5);
  await openBusinessProfileSection(page, "Diseño y apariencia");
  await expect(page.locator(".social-business-editor")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Organizar perfil público" })).toBeVisible();
});
