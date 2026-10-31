import { expect, test } from "@playwright/test";
import { installSupabaseMock, MOCK_ORGANIZATION_ID } from "./helpers/supabase";

test("El perfil público muestra la cabecera acordada y pestañas funcionales", async ({ page }) => {
  await installSupabaseMock(page, {
    tables: {
      business_posts: [{
        id: "55555555-5555-4555-8555-555555555555",
        organization_id: MOCK_ORGANIZATION_ID,
        body: "Novedad real de prueba", media_url: "", media_kind: null,
        created_at: "2026-10-01T11:00:00Z", published: true,
      }],
    },
  });
  await page.goto(`/cliente?negocio=${MOCK_ORGANIZATION_ID}`);
  const profile = page.getByRole("dialog");
  await expect(profile.locator(".as-company-stats")).toContainText("1");
  await expect(profile.locator(".as-company-stats")).toContainText("Publicaciones");
  await expect(profile.getByRole("heading", { name: "Qué podemos hacer por ti" })).toBeVisible();
  await expect(profile.getByText("Novedad real de prueba")).toBeVisible();

  const navigation = profile.getByRole("navigation", { name: /Secciones de/ });
  await expect(navigation.getByRole("button", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
  await navigation.getByRole("button", { name: "Servicios" }).click();
  await expect(profile.getByRole("heading", { name: "Qué podemos hacer por ti" })).toBeVisible();
  await expect(profile.getByRole("button", { name: /Solicitar/ }).last()).toBeVisible();
  await navigation.getByRole("button", { name: "Publicaciones" }).click();
  await expect(profile.getByRole("heading", { name: "Publicaciones y novedades" })).toBeVisible();
  await navigation.getByRole("button", { name: "Más" }).click();
  await expect(profile.getByRole("heading", { name: "Conoce el negocio" })).toBeVisible();
  await expect(profile.getByRole("heading", { name: "Sedes y ubicaciones" })).toBeVisible();
});

test("En móvil el perfil emplea portada, métricas, acciones y pestañas sin desbordarse", async ({ page }) => {
  await installSupabaseMock(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/cliente?negocio=${MOCK_ORGANIZATION_ID}`);
  const profile = page.getByRole("dialog");
  await expect(profile.locator(".as-company-hero")).toBeVisible();
  await expect(profile.locator(".as-company-stats")).toBeVisible();
  await expect(profile.getByRole("button", { name: "Mensaje" })).toBeVisible();
  await expect(profile.getByRole("button", { name: "Seguir" })).toBeVisible();
  await expect(profile.getByRole("navigation", { name: /Secciones de/ })).toBeVisible();
  const widths = await profile.locator(".as-company-page").evaluate((element) => ({
    outer: element.getBoundingClientRect().width,
    scroll: element.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.outer + 4);
});
