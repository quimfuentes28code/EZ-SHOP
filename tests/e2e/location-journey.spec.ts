import { expect, test, type Page } from "@playwright/test";
import { installSupabaseMock, MOCK_ORGANIZATION_ID, MOCK_USER_ID } from "./helpers/supabase";
import { installLeafletMock } from "./helpers/leaflet";

const businessNav = (page: Page, name: string) => page.getByRole("navigation", { name: "Módulos disponibles" }).getByRole("button", { name, exact: true });
const customerNav = (page: Page, name: string) => page.getByRole("navigation", { name: "Navegación Cliente" }).getByRole("button", { name, exact: true });
const switchExperience = async (page: Page, experience: "business" | "customer") => {
  await page.getByRole("combobox", { name: "Cambiar experiencia de la cuenta" }).selectOption(experience);
  await expect(page).toHaveURL(experience === "business" ? /\/empresa$/ : /\/cliente$/);
};

async function expectEmptyMap(page: Page) {
  // Let the intercepted reads finish before asserting absence; an immediate
  // zero-count assertion could accidentally pass while the directory loads.
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("map-marker")).toHaveCount(0);
}

test("alta Empresa → sede privada → publicación consentida → mapa Cliente → perfil → retirada", async ({ page }) => {
  test.setTimeout(90_000);
  const { tables, requests } = await installSupabaseMock(page, { session: false, tables: {
    organizations: [], organization_locations: [], organization_services: [],
    account_types: [{ user_id: MOCK_USER_ID, account_type: "business" }],
  } });
  await installLeafletMock(page);
  await page.goto("/registro/empresa");
  await page.getByLabel("Nombre", { exact: true }).fill("Alex");
  await page.getByLabel("Apellidos", { exact: true }).fill("Prueba");
  await page.getByLabel("Correo electrónico", { exact: true }).fill("persona@example.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("Prueba-sintetica-2026!");
  await page.getByRole("button", { name: "Crear mi cuenta", exact: true }).click();
  await expect(page).toHaveURL(/\/empresa$/);
  await businessNav(page, "Servicios").click();
  await page.getByLabel("Nombre comercial", { exact: true }).fill("Estudio recorrido QA");
  await page.getByLabel("Sector", { exact: true }).fill("Fotografía");
  await page.getByLabel("Ciudad", { exact: true }).fill("Barcelona");
  await page.getByRole("button", { name: "Crear empresa", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sedes y ubicaciones", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Añadir tienda", exact: true }).click();
  await page.getByLabel("Nombre de la tienda", { exact: true }).fill("Sede Terrassa QA");
  await page.getByLabel("Ciudad", { exact: true }).fill("Terrassa");
  await page.getByLabel("Dirección (opcional)", { exact: true }).fill("Dirección sintética QA");
  await page.getByRole("button", { name: "Elegir ubicación de prueba", exact: true }).click();
  await expect(page.getByLabel("Latitud", { exact: true })).toHaveValue("41.563211");
  await expect(page.getByLabel("Longitud", { exact: true })).toHaveValue("2.008755");
  await expect(page.getByRole("checkbox", { name: /^Mostrar esta sede/ })).not.toBeChecked();
  await page.getByRole("button", { name: "Guardar tienda", exact: true }).click();
  await expect.poll(() => tables.organization_locations.length).toBe(1);
  expect(tables.organization_locations[0]).toMatchObject({ city: "Terrassa", latitude: 41.563211, longitude: 2.008755, published: false });
  expect(tables.organizations[0].published).not.toBe(true);
  await page.reload();
  await businessNav(page, "Tiendas y sedes").click();
  await expect(page.locator(".location-card")).toContainText("Sede Terrassa QA");
  await switchExperience(page, "customer");
  await page.getByRole("button", { name: "Activar Cliente con esta cuenta", exact: true }).click();
  await customerNav(page, "Mapa").click();
  await expectEmptyMap(page);

  // Publishing a branch must not silently publish its parent company.
  await switchExperience(page, "business");
  await businessNav(page, "Tiendas y sedes").click();
  await page.locator(".location-card").getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByRole("checkbox", { name: /^Mostrar esta sede/ }).check();
  await page.getByRole("button", { name: "Guardar tienda", exact: true }).click();
  await expect.poll(() => tables.organization_locations[0].published).toBe(true);
  expect(tables.organizations[0].published).not.toBe(true);
  await switchExperience(page, "customer");
  await customerNav(page, "Mapa").click();
  await expectEmptyMap(page);
  await switchExperience(page, "business");
  await businessNav(page, "Tiendas y sedes").click();
  await page.getByRole("button", { name: "Publicar negocio", exact: true }).click();
  await expect.poll(() => tables.organizations[0].published).toBe(true);
  await switchExperience(page, "customer");
  await expect(page.getByRole("heading", { name: "Estudio recorrido QA", exact: true })).toBeVisible();
  await customerNav(page, "Mapa").click();
  const marker = page.getByRole("button", { name: "Pin: Estudio recorrido QA · Sede Terrassa QA", exact: true });
  await expect(marker).toHaveAttribute("data-latitude", "41.563211");
  await expect(marker).toHaveAttribute("data-longitude", "2.008755");
  await marker.click();
  await expect(page.getByRole("dialog")).toContainText("Estudio recorrido QA");
  await expect(page.getByRole("dialog")).toContainText("Sede Terrassa QA");
  await expect(page.getByRole("dialog")).toContainText("Dirección sintética QA");
  await page.keyboard.press("Escape");

  await switchExperience(page, "business");
  await businessNav(page, "Tiendas y sedes").click();
  await page.locator(".location-card").getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByRole("checkbox", { name: /^Mostrar esta sede/ }).uncheck();
  await page.getByRole("button", { name: "Guardar tienda", exact: true }).click();
  await expect.poll(() => tables.organization_locations[0].published).toBe(false);
  await switchExperience(page, "customer");
  await expect(page.getByRole("heading", { name: "Estudio recorrido QA", exact: true })).toBeVisible();
  await customerNav(page, "Mapa").click();
  await expectEmptyMap(page);

  await switchExperience(page, "business");
  await businessNav(page, "Tiendas y sedes").click();
  await page.locator(".location-card").getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByRole("checkbox", { name: /^Mostrar esta sede/ }).check();
  await page.getByRole("button", { name: "Guardar tienda", exact: true }).click();
  await expect.poll(() => tables.organization_locations[0].published).toBe(true);
  await businessNav(page, "Perfil público").click();
  await page.getByRole("button", { name: "Ocultar negocio", exact: true }).click();
  await expect.poll(() => tables.organizations[0].published).toBe(false);
  await switchExperience(page, "customer");
  await expect(page.getByRole("heading", { name: "Estudio recorrido QA", exact: true })).toHaveCount(0);
  await customerNav(page, "Mapa").click();
  await expectEmptyMap(page);
  expect(requests.filter(request => request.method === "POST" && request.url.includes("/auth/v1/signup"))).toHaveLength(1);
  expect(requests.filter(request => request.method === "POST" && request.url.includes("/organization_locations"))).toHaveLength(1);
});

test("mapa y directorio comparten filtros y cada sede abre la empresa correcta", async ({ page }) => {
  const second = "55555555-5555-4555-8555-555555555555";
  const privateBusiness = "66666666-6666-4666-8666-666666666666";
  const base = { owner_id: MOCK_USER_ID, description: "Negocio QA", tagline: "", accent_color: "#A47B53", avatar_url: "", cover_url: "", published: true };
  const location = { address: "Dirección QA", service_mode: "local", availability_mode: "cita", published: true, latitude: 41.56, longitude: 2.01 };
  const { tables } = await installSupabaseMock(page, { tables: {
    organizations: [
      { ...base, id: MOCK_ORGANIZATION_ID, name: "Foto QA", category: "Fotografía", city: "Barcelona" },
      { ...base, id: second, name: "Pan QA", category: "Gastronomía", city: "Terrassa" },
      { ...base, id: privateBusiness, name: "Privada QA", category: "Fotografía", city: "Terrassa", published: false },
    ],
    organization_locations: [
      { ...location, id: "foto-terrassa", organization_id: MOCK_ORGANIZATION_ID, name: "Estudio Terrassa", city: "Terrassa" },
      { ...location, id: "foto-barcelona", organization_id: MOCK_ORGANIZATION_ID, name: "Estudio Barcelona", city: "Barcelona", latitude: 41.38, longitude: 2.17 },
      { ...location, id: "foto-privada", organization_id: MOCK_ORGANIZATION_ID, name: "Domicilio privado", city: "Terrassa", published: false },
      { ...location, id: "pan-terrassa", organization_id: second, name: "Obrador", city: "Terrassa", latitude: 41.57 },
      { ...location, id: "empresa-privada", organization_id: privateBusiness, name: "Sede privada", city: "Terrassa" },
    ],
  } });
  await installLeafletMock(page);
  await page.goto("/cliente");
  await page.getByRole("textbox", { name: "Filtrar por localidad", exact: true }).fill("TERRÀSSA");
  await page.getByRole("textbox", { name: "Buscar negocios o servicios", exact: true }).fill("retrato");
  await expect(page.locator(".as-social-business-card")).toHaveCount(1);
  await expect(page.locator(".as-social-business-card")).toContainText("Foto QA");
  await customerNav(page, "Mapa").click();
  await expect(page.getByTestId("map-marker")).toHaveCount(1);
  await page.getByRole("button", { name: "Pin: Foto QA · Estudio Terrassa", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Foto QA");
  await expect(page.getByRole("dialog")).toContainText("Estudio Barcelona");
  await expect(page.getByRole("dialog")).not.toContainText("Domicilio privado");
  await page.keyboard.press("Escape");
  await page.getByRole("textbox", { name: "Buscar negocios o servicios", exact: true }).fill("");
  await page.getByRole("button", { name: "Gastronomía", exact: true }).click();
  await expect(page.getByTestId("map-marker")).toHaveCount(1);
  await page.getByRole("button", { name: "Pin: Pan QA · Obrador", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Pan QA");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Todos", exact: true }).click();
  await expect(page.getByTestId("map-marker")).toHaveCount(2);
  await page.getByRole("textbox", { name: "Filtrar por localidad", exact: true }).fill("Barcelona");
  await expect(page.getByTestId("map-marker")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Pin: Foto QA · Estudio Barcelona", exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Filtrar por localidad", exact: true }).fill("Sin resultados QA");
  await expect(page.getByTestId("map-marker")).toHaveCount(0);
  await customerNav(page, "Explorar").click();
  await expect(page.locator(".as-social-business-card")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Filtrar por localidad", exact: true }).fill("");
  await customerNav(page, "Mapa").click();
  await expect(page.getByTestId("map-marker")).toHaveCount(3);
  await page.getByRole("button", { name: "Pin: Foto QA · Estudio Terrassa", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Foto QA");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Pin: Foto QA · Estudio Barcelona", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Foto QA");
  await page.keyboard.press("Escape");
  tables.organization_locations[0].name = "Estudio Terrassa actualizado";
  tables.organizations[0].name = "Foto QA actualizada";
  await page.getByRole("button", { name: "Actualizar datos", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pin: Foto QA · Estudio Terrassa", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Pin: Foto QA actualizada · Estudio Terrassa actualizado", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Foto QA actualizada");
});

test("un fallo del CDN conserva el borrador y permite guardar coordenadas manuales válidas", async ({ page }) => {
  const { tables } = await installSupabaseMock(page, { tables: { organization_locations: [] } });
  await page.route("https://unpkg.com/leaflet@*/**", route => route.abort("blockedbyclient"));
  await page.goto("/empresa");
  await businessNav(page, "Tiendas y sedes").click();
  await page.getByRole("button", { name: "Añadir tienda", exact: true }).click();
  await page.getByLabel("Nombre de la tienda", { exact: true }).fill("Sede manual QA");
  await expect(page.getByRole("heading", { name: "Mapa no disponible", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reintentar mapa", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mapa no disponible", exact: true })).toBeVisible();
  await expect(page.getByLabel("Nombre de la tienda", { exact: true })).toHaveValue("Sede manual QA");
  await page.getByLabel("Latitud", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Guardar tienda", exact: true }).click();
  await expect(page.locator(".live-locations > .live-alert")).toContainText("Indica latitud y longitud");
  expect(tables.organization_locations).toHaveLength(0);
  await page.getByLabel("Longitud", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Guardar tienda", exact: true }).click();
  await expect.poll(() => tables.organization_locations.length).toBe(1);
  expect(tables.organization_locations[0]).toMatchObject({ name: "Sede manual QA", latitude: 0, longitude: 0, published: false });
});

test("eliminar una sede exige su nombre exacto y conserva la empresa y otras sedes", async ({ page }) => {
  const { tables, requests } = await installSupabaseMock(page);
  await installLeafletMock(page);
  tables.organization_locations.push({ ...tables.organization_locations[0], id: "otra-sede-qa", name: "Segunda sede QA" });
  await page.goto("/empresa");
  await businessNav(page, "Tiendas y sedes").click();
  await page.getByRole("button", { name: "Eliminar tienda Sede Terrassa", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Eliminar definitivamente", exact: true })).toBeDisabled();
  await dialog.getByLabel("Nombre de la tienda para confirmar", { exact: true }).fill("Sede");
  await expect(dialog.getByRole("button", { name: "Eliminar definitivamente", exact: true })).toBeDisabled();
  await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect(tables.organization_locations).toHaveLength(2);
  await page.getByRole("button", { name: "Eliminar tienda Sede Terrassa", exact: true }).click();
  await dialog.getByLabel("Nombre de la tienda para confirmar", { exact: true }).fill("Sede Terrassa");
  await dialog.getByRole("button", { name: "Eliminar definitivamente", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".location-card")).toHaveCount(1);
  await expect(page.locator(".location-card")).toContainText("Segunda sede QA");
  expect(tables.organization_locations).toHaveLength(1);
  expect(tables.organizations).toHaveLength(1);
  expect(tables.organization_services).toHaveLength(1);
  const deletion = requests.find(request => request.method === "DELETE" && request.url.includes("organization_locations"));
  expect(new URL(deletion!.url).searchParams.get("organization_id")).toBe("eq." + MOCK_ORGANIZATION_ID);
});
