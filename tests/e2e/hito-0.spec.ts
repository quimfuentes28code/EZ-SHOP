import { expect, test } from "@playwright/test";
import { DEMO_STORAGE_KEY } from "../../src/lib/demo";

const templates = [
  {
    id: "photo",
    query: "fotografía",
    label: "Fotografía y vídeo",
    enabled: "projects",
    disabled: "orders",
  },
  {
    id: "beauty",
    query: "peluquería",
    label: "Peluquería y estética",
    enabled: "bookings",
    disabled: "projects",
  },
  {
    id: "bakery",
    query: "panadería",
    label: "Panadería y pastelería",
    enabled: "orders",
    disabled: "bookings",
  },
  {
    id: "hybrid",
    query: "mixta",
    label: "Otro negocio o actividad mixta",
    enabled: "services",
    disabled: "bookings",
  },
];

for (const template of templates) {
  test(`onboarding ${template.id}: composición de módulos y persistencia local`, async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await page.locator("#sector-search").fill(template.query);
    const sector = page
      .getByRole("group", { name: "Plantillas de actividad" })
      .getByRole("button", { name: new RegExp(template.label) });
    await sector.click();
    await expect(sector).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /^Online/ }).click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Menos ruido. Más posibilidades." }),
    ).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Clientes, módulo base incluido" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Cobros, próximamente" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Facturación, próximamente" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page
      .getByLabel("Nombre de tu negocio")
      .fill(`  Negocio demo ${template.id}  `);
    await page.getByLabel("Ciudad o zona de actividad").fill("  Valencia  ");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(
      page.getByText("Perfil público desactivado", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Abrir mi panel", exact: true })
      .click();
    await expect(page).toHaveURL(/\/empresa$/);
    const persisted = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) || "{}"),
      DEMO_STORAGE_KEY,
    );
    expect(persisted.name).toBe(`Negocio demo ${template.id}`);
    expect(persisted.city).toBe("Valencia");
    expect(persisted.sectorId).toBe(template.id);
    expect(persisted.mode).toBe("online");
    expect(persisted.publicListing).toBe(false);
    expect(persisted.modules).toContain("customers");
    expect(persisted.modules).toContain(template.enabled);
    expect(persisted.modules).not.toContain(template.disabled);
    expect(persisted.modules).not.toContain("payments");
    expect(persisted.modules).not.toContain("invoices");
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: `Negocio demo ${template.id}`,
        exact: true,
      }),
    ).toBeVisible();
  });
}

test("los módulos cambian la navegación de empresa y se conservan al recargar", async ({
  page,
}) => {
  await page.goto("/empresa");
  const navigation = page.getByRole("navigation", {
    name: "Módulos del negocio",
  });
  await expect(
    navigation.getByRole("button", { name: "Proyectos", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Módulos", exact: true }).click();
  await page
    .getByRole("button", { name: "Desactivar Proyectos", exact: true })
    .click();
  await expect(
    page.getByText("Configuración guardada en este navegador.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("button", { name: "Proyectos", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    navigation.getByRole("button", { name: "Proyectos", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Módulos", exact: true }).click();
  await page
    .getByRole("button", { name: "Activar Proyectos", exact: true })
    .click();
  await expect(
    navigation.getByRole("button", { name: "Proyectos", exact: true }),
  ).toBeVisible();
  await navigation
    .getByRole("button", { name: "Proyectos", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Proyectos", exact: true }).first(),
  ).toBeVisible();
});

test("el onboarding valida identidad y comunica un fallo real de almacenamiento", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked for test", "SecurityError");
    };
  });
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Nombre de tu negocio").fill("   ");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#onboarding-error")).toContainText(
    "Añade un nombre de negocio",
  );
  await page.getByLabel("Nombre de tu negocio").fill("Negocio ficticio");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Abrir mi panel", exact: true })
    .click();
  await expect(page.locator("#onboarding-error")).toContainText(
    "No hemos podido guardar",
  );
  await expect(page).toHaveURL(/\/onboarding$/);
});

test("la cuenta cliente permite revisar detalles, favoritos y preferencias de muestra", async ({
  page,
}) => {
  await page.goto("/cliente");
  await page
    .locator(".personal-experience")
    .first()
    .getByText("Ver detalles de ejemplo")
    .click();
  await expect(
    page
      .locator(".personal-experience")
      .first()
      .getByText("Sin reserva, pago ni comunicación real."),
  ).toBeVisible();
  const activityTab = page.getByRole("tab", { name: /^Mi actividad/ });
  await activityTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Favoritos", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("tab", { name: "Favoritos", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("heading", { name: "Lumen Studio", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("heading", { name: "Alex, perfil de ejemplo" }),
  ).toBeVisible();
  const reminders = page.getByRole("switch", {
    name: "Recordatorios de actividad",
  });
  await expect(reminders).toHaveAttribute("aria-checked", "true");
  await reminders.click();
  await expect(reminders).toHaveAttribute("aria-checked", "false");
  await expect(page.locator(".personal-feedback")).toContainText(
    "No se enviarán mensajes",
  );
  await page.reload();
  await page.getByRole("tab", { name: "Perfil", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Recordatorios de actividad" }),
  ).toHaveAttribute("aria-checked", "false");
});

test("el directorio filtra sólo ejemplos y el mapa permanece como prototipo", async ({
  page,
}) => {
  await page.goto("/explorar");
  await expect(page.locator(".explore-business")).toHaveCount(4);
  await page
    .getByRole("combobox", { name: "Filtrar por sector" })
    .selectOption("bakery");
  await expect(page.locator(".explore-business")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Dulce Taller", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Buscar negocios" })
    .fill("nada-que-exista-en-la-demo");
  await expect(
    page.getByRole("heading", { name: "Aún no tenemos ese ejemplo." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Restablecer filtros" }).click();
  await expect(page.locator(".explore-business")).toHaveCount(4);
  await page.getByRole("button", { name: "Mapa futuro", exact: true }).click();
  await expect(
    page.getByText("Esta vista no contiene pines ni direcciones ficticias.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.locator(".explore-business")).toHaveCount(0);
  await page.getByRole("button", { name: "Volver a los ejemplos" }).click();
  await expect(page.locator(".explore-business")).toHaveCount(4);
});

for (const width of [360, 768, 1440]) {
  test(`las cinco vistas son navegables sin desbordamiento a ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    for (const path of [
      "/",
      "/onboarding",
      "/empresa",
      "/cliente",
      "/explorar",
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
      ).toBeVisible();
      await expect
        .poll(
          () =>
            page.evaluate(
              () =>
                document.documentElement.scrollWidth <= window.innerWidth + 1,
            ),
          { message: `${path} debe caber en ${width}px` },
        )
        .toBe(true);
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus")).toBeVisible();
    }
    expect(errors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

test("el menú móvil conserva el foco y cierra al navegar entre módulos", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/empresa");
  const menu = page.getByRole("button", { name: "Abrir menú", exact: true });
  const sidebar = page.locator("#business-navigation");
  await expect(sidebar).toHaveAttribute("inert", "");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(sidebar).not.toHaveAttribute("inert", "");
  await expect(
    page.getByRole("navigation", { name: "Módulos del negocio" }),
  ).toBeInViewport();
  await expect(
    sidebar.getByRole("link", { name: "AutonoService, inicio" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator(".account-switch")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(sidebar).toHaveAttribute("inert", "");
  await expect(menu).toBeFocused();
  await menu.click();
  await page
    .getByRole("navigation", { name: "Módulos del negocio" })
    .getByRole("button", { name: "Clientes", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Clientes", exact: true }),
  ).toBeVisible();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(sidebar).toHaveAttribute("inert", "");
  await page
    .getByRole("textbox", { name: "Buscar en este módulo" })
    .fill("Laura");
  await expect(page.getByText("Laura Martínez", { exact: true })).toBeVisible();
  await expect(page.getByText("NOVA Clothing", { exact: true })).toHaveCount(0);
});
