import { expect, test } from "@playwright/test";
import { installSupabaseMock, MOCK_ORGANIZATION_ID } from "./helpers/supabase";

test("las cuentas reales conservan una identidad al cambiar entre experiencias", async ({ page }) => {
  const { requests } = await installSupabaseMock(page);
  await page.goto("/empresa");
  await expect(page.getByRole("heading", { name: "Estudio de prueba", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Cambiar experiencia de la cuenta" }).selectOption("customer");
  await expect(page).toHaveURL(/\/cliente$/);
  await expect(page.getByText("Tu espacio personal · Gratis", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Cambiar experiencia de la cuenta" }).selectOption("business");
  await expect(page).toHaveURL(/\/empresa$/);
  await expect(page.getByText("persona@example.test", { exact: true })).toBeVisible();
  expect(requests.filter((request) => request.url.includes("/auth/v1/signup"))).toHaveLength(0);
});

test("Cliente encuentra una sede por ciudad y el perfil permite cerrar con Escape", async ({ page }) => {
  await installSupabaseMock(page);
  await page.goto("/cliente");
  await page.getByRole("textbox", { name: "Filtrar por localidad" }).fill("Terrassa");
  await expect(page.getByRole("heading", { name: "Estudio de prueba", exact: true })).toBeVisible();
  const profile = page.getByRole("button", { name: "Ver perfil", exact: true });
  await profile.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Sede Terrassa");
  await expect(dialog.locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(profile).toBeFocused();
});

test("los favoritos conectados se guardan y sobreviven a una recarga", async ({ page }) => {
  const { tables, requests } = await installSupabaseMock(page);
  await page.goto("/cliente");
  await page.getByRole("button", { name: "Guardar en favoritos", exact: true }).click();
  await expect(page.getByRole("button", { name: "Quitar de favoritos", exact: true })).toBeVisible();
  expect(tables.customer_favorites[0].organization_id).toBe(MOCK_ORGANIZATION_ID);
  await page.reload();
  await page.getByRole("navigation", { name: "Navegación Cliente" }).getByRole("button", { name: "Favoritos", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Estudio de prueba", exact: true })).toBeVisible();
  expect(requests.filter((request) => request.method === "POST" && request.url.includes("/customer_favorites"))).toHaveLength(1);
});

test("un visitante llega al registro real sin crear una cuenta automáticamente", async ({ page }) => {
  const { requests } = await installSupabaseMock(page, { session: false });
  await page.goto("/");
  await page.getByRole("link", { name: "Empezar como Cliente", exact: true }).click();
  await expect(page).toHaveURL(/\/registro\/cliente$/);
  await expect(page.getByLabel("Contraseña", { exact: true })).toBeVisible();
  expect(requests.filter((request) => request.method === "POST")).toHaveLength(0);
});
