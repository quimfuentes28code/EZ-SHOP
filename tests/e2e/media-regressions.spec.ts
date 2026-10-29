import { expect, test } from "@playwright/test";
import { BUSINESS_MEDIA_BUCKET } from "../../src/lib/business-media";
import { installSupabaseMock, MOCK_ORGANIZATION_ID, MOCK_SUPABASE_URL } from "./helpers/supabase";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6uH8AAAAASUVORK5CYII=", "base64");
const image = { name: "imagen-prueba.png", mimeType: "image/png", buffer: png };

test("las subidas quedan bloqueadas si la actualización de privacidad no está disponible", async ({ page }) => {
  const { requests, tables } = await installSupabaseMock(page);
  await page.goto("/empresa");
  await page.getByRole("navigation", { name: "Módulos disponibles" }).getByRole("button", { name: "Perfil público", exact: true }).click();
  await page.locator(".social-business-upload-actions input[type=file]").first().setInputFiles(image);
  await expect(page.locator(".social-business-editor")).toContainText("desactivados hasta completar la actualización de protección de medios");
  expect(requests.some(request => request.url.includes("/rpc/autonoservice_business_media_private"))).toBe(true);
  expect(requests.filter(request => request.url.includes("/storage/v1/object/"))).toHaveLength(0);
  expect(tables.organizations[0].avatar_url).toBe("");
});

for (const nativeUuid of [true, false]) {
test(`los medios se guardan como referencias y ambas experiencias muestran solo URLs firmadas${nativeUuid ? "" : " sin randomUUID (HTTP local)"}`, async ({ page }) => {
  if (!nativeUuid) await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, "randomUUID", { value: undefined, configurable: true });
  });
  const legacyPath = `${MOCK_ORGANIZATION_ID}/portada-anterior.jpg`;
  const { tables } = await installSupabaseMock(page);
  tables.organizations[0].cover_url = `${MOCK_SUPABASE_URL}/storage/v1/object/public/${BUSINESS_MEDIA_BUCKET}/${legacyPath}`;
  const signatures: { paths: string[]; expiresIn: number }[] = [];
  const rawDownloads: string[] = [];
  page.on("request", request => { if (request.url().includes(`/object/public/${BUSINESS_MEDIA_BUCKET}/`)) rawDownloads.push(request.url()); });
  const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };
  await page.route(`${MOCK_SUPABASE_URL}/rest/v1/rpc/autonoservice_business_media_private`, async route => {
    await route.fulfill({ json: true, headers });
  });
  await page.route(`${MOCK_SUPABASE_URL}/storage/v1/**`, async route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === "OPTIONS") { await route.fulfill({ status: 204, headers }); return; }
    if (request.method() === "POST" && url.pathname === `/storage/v1/object/sign/${BUSINESS_MEDIA_BUCKET}`) {
      const body = request.postDataJSON() as { paths: string[]; expiresIn: number };
      signatures.push(body);
      await route.fulfill({ json: body.paths.map(path => ({ path, error: null, signedURL: `/object/sign/${BUSINESS_MEDIA_BUCKET}/${path}?token=synthetic-short-lived` })), headers });
      return;
    }
    if (request.method() === "GET" && url.pathname.startsWith(`/storage/v1/object/sign/${BUSINESS_MEDIA_BUCKET}/`)) {
      await route.fulfill({ contentType: "image/png", body: png, headers }); return;
    }
    if (request.method() === "POST" && url.pathname.startsWith(`/storage/v1/object/${BUSINESS_MEDIA_BUCKET}/`)) {
      await route.fulfill({ json: { Id: "synthetic-upload", Key: url.pathname.slice("/storage/v1/object/".length) }, headers }); return;
    }
    await route.fallback();
  });
  await page.goto("/empresa");
  await page.getByRole("navigation", { name: "Módulos disponibles" }).getByRole("button", { name: "Perfil público", exact: true }).click();
  const editor = page.locator(".social-business-editor");
  await expect(editor.getByAltText("Portada de Estudio de prueba")).toHaveAttribute("src", /\/object\/sign\//);
  await editor.locator(".social-business-upload-actions input[type=file]").first().setInputFiles(image);
  await expect(editor).toContainText("Imagen de perfil actualizada");
  expect(tables.organizations[0].avatar_url).toMatch(new RegExp(`^storage://${BUSINESS_MEDIA_BUCKET}/${MOCK_ORGANIZATION_ID}/`));
  await expect(editor.getByAltText("Logo de Estudio de prueba")).toHaveAttribute("src", /\/object\/sign\//);
  const publisher = editor.locator(".social-publish-form");
  await publisher.getByRole("checkbox", { name: "Publicar en mi perfil" }).uncheck();
  await publisher.locator("textarea").fill("Imagen de borrador de prueba");
  await publisher.locator("input[type=file]").setInputFiles(image);
  await publisher.getByRole("button", { name: "Guardar borrador", exact: true }).click();
  await expect(editor).toContainText("Borrador guardado en privado");
  expect(tables.business_posts).toHaveLength(1);
  expect(tables.business_posts[0].published).toBe(false);
  expect(tables.business_posts[0].media_url).toMatch(new RegExp(`^storage://${BUSINESS_MEDIA_BUCKET}/${MOCK_ORGANIZATION_ID}/`));
  const post = editor.locator(".social-post-card");
  await expect(post.getByAltText("Imagen de publicación")).toHaveAttribute("src", /\/object\/sign\//);
  await post.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(editor).toContainText("Publicación visible cuando la empresa esté publicada");
  await page.goto("/cliente");
  await expect(page.getByAltText("Portada de Estudio de prueba")).toHaveAttribute("src", /\/object\/sign\//);
  await page.getByRole("button", { name: "Ver perfil", exact: true }).click();
  await expect(page.getByRole("dialog").getByAltText("Foto publicada por el negocio")).toHaveAttribute("src", /\/object\/sign\//);
  await expect(page.locator('img[src^="storage:"]')).toHaveCount(0);
  expect(rawDownloads).toHaveLength(0);
  expect(signatures.length).toBeGreaterThan(0);
  expect(signatures.every(signature => signature.expiresIn === 60)).toBe(true);
  expect(signatures.some(signature => signature.paths.includes(legacyPath))).toBe(true);
});
}
