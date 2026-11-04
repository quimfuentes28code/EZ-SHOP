import { expect, test, type Page } from "@playwright/test";
import { BUSINESS_MEDIA_BUCKET } from "../../src/lib/business-media";
import { installSupabaseMock, MOCK_ORGANIZATION_ID, MOCK_SUPABASE_URL } from "./helpers/supabase";

const sections = (page: Page) => page.getByRole("navigation", { name: "Editar perfil público", exact: true });
const editor = (page: Page) => page.locator(".social-business-editor");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6uH8AAAAASUVORK5CYII=", "base64");

for (const width of [390, 900, 1440]) {
  test(`los checks y las flechas del editor quedan separados y guardan los cambios a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const { tables } = await installSupabaseMock(page);
    await page.goto("/empresa?seccion=perfil&panel=appearance");
    const layout = editor(page).locator(".as-profile-layout-editor");
    const rows = layout.locator(".as-profile-layout-item");
    await expect(rows).toHaveCount(5);

    async function expectReadableRows() {
      for (const row of await rows.all()) {
        const label = row.locator("label");
        const check = row.getByRole("checkbox");
        const text = label.locator("span");
        const moves = row.locator(".as-profile-layout-move");
        await expect(text).toBeVisible();
        const [rowBox, checkBox, textBox, movesBox] = await Promise.all([
          row.boundingBox(), check.boundingBox(), text.boundingBox(), moves.boundingBox(),
        ]);
        expect(rowBox).not.toBeNull(); expect(checkBox).not.toBeNull();
        expect(textBox).not.toBeNull(); expect(movesBox).not.toBeNull();
        expect(checkBox!.width).toBeGreaterThanOrEqual(14);
        expect(checkBox!.width).toBeLessThanOrEqual(24);
        expect(checkBox!.height).toBeGreaterThanOrEqual(14);
        expect(checkBox!.height).toBeLessThanOrEqual(24);
        expect(checkBox!.x).toBeGreaterThanOrEqual(rowBox!.x);
        expect(textBox!.x).toBeGreaterThanOrEqual(checkBox!.x + checkBox!.width + 4);
        expect(textBox!.width).toBeGreaterThan(30);
        expect(textBox!.x + textBox!.width).toBeLessThanOrEqual(movesBox!.x - 4);
        expect(movesBox!.x + movesBox!.width).toBeLessThanOrEqual(rowBox!.x + rowBox!.width);
        for (const button of await moves.getByRole("button").all()) {
          const box = await button.boundingBox();
          expect(box!.width).toBeGreaterThanOrEqual(32);
          expect(box!.height).toBeGreaterThanOrEqual(32);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }

    await expect(layout.getByRole("checkbox", { name: "Publicaciones", exact: true })).toBeEnabled();
    await expectReadableRows();
    await layout.locator("label").getByText("Publicaciones", { exact: true }).click();
    await expect(layout.getByRole("checkbox", { name: "Publicaciones", exact: true })).not.toBeChecked();
    await layout.getByRole("button", { name: "Bajar Presentación", exact: true }).click();
    await expect(rows.nth(0).getByRole("checkbox")).toHaveAccessibleName("Servicios");
    await expect(rows.nth(1).getByRole("checkbox")).toHaveAccessibleName("Presentación");
    await layout.getByRole("button", { name: "Guardar distribución del perfil", exact: true }).click();
    await expect(editor(page)).toContainText("Distribución guardada.");
    expect(tables.organizations[0].profile_sections).toEqual(["services", "about", "locations", "portfolio"]);
    await page.reload();
    await expect(layout.getByRole("checkbox", { name: "Publicaciones", exact: true })).not.toBeChecked();
    await expect(rows.nth(0).getByRole("checkbox")).toHaveAccessibleName("Servicios");
    await expect(rows.nth(1).getByRole("checkbox")).toHaveAccessibleName("Presentación");
    await expectReadableRows();
  });
}

test("el perfil mantiene un único editor y conserva el borrador entre sus subsecciones", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installSupabaseMock(page);
  await page.goto("/empresa?seccion=perfil&panel=appearance");
  await expect(editor(page)).toHaveCount(1);
  await expect(editor(page).getByRole("heading", { name: "Diseño y apariencia", exact: true })).toBeVisible();
  await expect(editor(page).getByRole("heading", { name: "Organizar perfil público", exact: true })).toBeVisible();
  await expect(editor(page).locator(".social-business-upload-actions input")).toHaveCount(2);
  await expect(editor(page).locator(".social-publish-form")).toBeHidden();
  await sections(page).getByRole("button", { name: "Publicaciones y portfolio", exact: true }).click();
  await expect(editor(page).getByRole("heading", { name: "Publicaciones y portfolio", exact: true })).toBeVisible();
  await editor(page).getByPlaceholder("¿Qué novedades quieres compartir con tus clientes?").fill("Borrador conservado al organizar mi perfil");
  await sections(page).getByRole("button", { name: "Diseño y apariencia", exact: true }).click();
  await expect(editor(page).locator(".social-publish-form")).toBeHidden();
  await sections(page).getByRole("button", { name: "Publicaciones y portfolio", exact: true }).click();
  await expect(editor(page).getByPlaceholder("¿Qué novedades quieres compartir con tus clientes?")).toHaveValue("Borrador conservado al organizar mi perfil");
  await expect(page.locator("#profile-layout-title")).toHaveCount(1);
  await expect(editor(page)).toHaveCount(1);
});

test("orden y visibilidad del editor persisten en la misma ficha que consulta Cliente", async ({ page }) => {
  const { tables } = await installSupabaseMock(page, { tables: { business_posts: [{
    id: "post-editor-layout", organization_id: MOCK_ORGANIZATION_ID, body: "Novedad publicada autorizada", media_url: "", media_kind: null, published: true, created_at: "2026-10-30T12:00:00Z",
  }] } });
  await page.goto("/empresa?seccion=perfil&panel=appearance");
  await editor(page).getByRole("button", { name: "Bajar Presentación", exact: true }).click();
  await editor(page).getByRole("checkbox", { name: "Publicaciones", exact: true }).uncheck();
  await editor(page).getByRole("button", { name: "Guardar distribución del perfil", exact: true }).click();
  await expect(editor(page)).toContainText("Distribución guardada. Los clientes verán las secciones en este orden.");
  expect((tables.organizations[0].profile_sections as string[]).slice(0, 2)).toEqual(["services", "about"]);
  expect(tables.organizations[0].profile_sections).not.toContain("posts");
  await page.reload();
  await expect(editor(page).getByRole("checkbox", { name: "Publicaciones", exact: true })).not.toBeChecked();
  await sections(page).getByRole("button", { name: "Ver como Cliente", exact: true }).click();
  await page.getByRole("link", { name: "Abrir perfil como Cliente", exact: false }).click();
  await expect(page).toHaveURL(new RegExp(`/cliente\\?negocio=${MOCK_ORGANIZATION_ID}$`));
  const profile = page.getByRole("dialog");
  await expect(profile.locator(".as-company-hero")).toBeVisible();
  const navigation = profile.getByRole("navigation", { name: /Secciones de/ });
  await expect(navigation.getByRole("button", { name: "Publicaciones", exact: true })).toHaveCount(0);
  await navigation.getByRole("button", { name: "Servicios", exact: true }).click();
  await expect(profile.getByRole("heading", { name: "Qué podemos hacer por ti", exact: true })).toBeVisible();
});

test("la portada subida desde el editor único llega firmada al perfil completo de Cliente", async ({ page }) => {
  const { tables } = await installSupabaseMock(page);
  const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };
  const rawDownloads: string[] = [];
  page.on("request", request => { if (request.url().includes(`/object/public/${BUSINESS_MEDIA_BUCKET}/`)) rawDownloads.push(request.url()); });
  await page.route(`${MOCK_SUPABASE_URL}/rest/v1/rpc/autonoservice_business_media_private`, route => route.fulfill({ json: true, headers }));
  await page.route(`${MOCK_SUPABASE_URL}/storage/v1/**`, async route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    if (request.method() === "POST" && url.pathname === `/storage/v1/object/sign/${BUSINESS_MEDIA_BUCKET}`) {
      const body = request.postDataJSON() as { paths: string[]; expiresIn: number };
      expect(body.expiresIn).toBe(60);
      return route.fulfill({ json: body.paths.map(path => ({ path, error: null, signedURL: `/object/sign/${BUSINESS_MEDIA_BUCKET}/${path}?token=editor-preview` })), headers });
    }
    if (request.method() === "GET" && url.pathname.startsWith(`/storage/v1/object/sign/${BUSINESS_MEDIA_BUCKET}/`)) return route.fulfill({ contentType: "image/png", body: png, headers });
    if (request.method() === "POST" && url.pathname.startsWith(`/storage/v1/object/${BUSINESS_MEDIA_BUCKET}/`)) return route.fulfill({ json: { Id: "synthetic-upload", Key: url.pathname.slice("/storage/v1/object/".length) }, headers });
    return route.fallback();
  });
  await page.goto("/empresa?seccion=perfil&panel=appearance");
  await editor(page).locator(".social-business-upload-actions input[type=file]").nth(1).setInputFiles({ name: "portada-del-negocio.png", mimeType: "image/png", buffer: png });
  await expect(editor(page)).toContainText("Portada actualizada.");
  expect(tables.organizations[0].cover_url).toMatch(new RegExp(`^storage://${BUSINESS_MEDIA_BUCKET}/${MOCK_ORGANIZATION_ID}/`));
  await expect(editor(page).getByAltText("Portada de Estudio de prueba")).toHaveAttribute("src", /\/object\/sign\//);
  await sections(page).getByRole("button", { name: "Ver como Cliente", exact: true }).click();
  await page.getByRole("link", { name: "Abrir perfil como Cliente", exact: false }).click();
  const profile = page.getByRole("dialog");
  await expect(profile.locator(".as-company-cover-photo")).toHaveAttribute("src", /\/object\/sign\//);
  await expect(profile.getByRole("heading", { name: "Estudio de prueba", exact: true })).toBeVisible();
  expect(rawDownloads).toHaveLength(0);
  await expect(page.locator('img[src^="storage:"]')).toHaveCount(0);
});
