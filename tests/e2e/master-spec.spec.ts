import { expect, test } from "@playwright/test";
import {
  CUSTOMER_PROFILE_KEY,
  EXPERIENCE_STORAGE_KEY,
} from "../../src/lib/experience";

test("la primera entrada ofrece las dos experiencias bajo una sola marca", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "¿Cómo quieres utilizar AutonoService?",
      exact: true,
    }),
  ).toBeVisible();
  const business = page.getByRole("link", {
    name: "Empezar con AutonoService",
    exact: true,
  });
  const customer = page.getByRole("link", {
    name: "Empezar como Cliente",
    exact: true,
  });
  await expect(business).toHaveAttribute("href", "/onboarding");
  await expect(customer).toHaveAttribute("href", "/registro");
  await expect(
    page.getByText("Gratis · Mejora disponible con AutonoSuite", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Completamente gratis", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    "AutonoService Business",
  );
  await expect(page.locator("body")).not.toContainText("AutonoService Cliente");
  await customer.click();
  await expect(page).toHaveURL(/\/registro$/);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
});

test("el perfil Cliente persiste y permite usar ambas experiencias sin otro registro", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method()))
      mutations.push(`${request.method()} ${request.url()}`);
  });
  await page.goto("/registro");
  await page.locator("#customer-name").fill("  Cris de prueba  ");
  await page.locator("#customer-city").fill("  Valencia  ");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("group", { name: "Intereses del perfil Cliente" })
    .getByRole("button", { name: "Creatividad", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Abrir modo Cliente", exact: true })
    .click();
  await expect(page.locator("#customer-registration-error")).toContainText(
    "Confirma que entiendes",
  );
  await page
    .getByRole("checkbox", {
      name: /Entiendo que este perfil es una demostración local/,
    })
    .check();
  await page
    .getByRole("button", { name: "Abrir modo Cliente", exact: true })
    .click();
  await expect(page).toHaveURL(/\/cliente$/);
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "{}"),
    CUSTOMER_PROFILE_KEY,
  );
  expect(stored.name).toBe("Cris de prueba");
  expect(stored.city).toBe("Valencia");
  expect(stored.interests).toContain("Creatividad");
  const selector = page
    .getByRole("combobox", { name: "Experiencia", exact: true })
    .first();
  await expect(selector).toHaveValue("customer");
  await selector.selectOption("business");
  await expect(page).toHaveURL(/\/empresa$/);
  const organization = page.getByRole("combobox", { name: "Empresa activa", exact: true });
  await organization.selectOption("beauty");
  await expect(organization).toHaveValue("beauty");
  await expect(page.getByRole("heading", { name: "Barbería Norte", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Módulos del negocio" }).getByRole("button", { name: "Citas", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Módulos del negocio" }).getByRole("button", { name: "Proyectos", exact: true })).toHaveCount(0);
  await organization.selectOption("photo");
  await expect(organization).toHaveValue("photo");
  await expect(page.getByRole("heading", { name: "Lumen Studio", exact: true })).toBeVisible();
  await page
    .getByRole("combobox", { name: "Experiencia", exact: true })
    .first()
    .selectOption("customer");
  await expect(page).toHaveURL(/\/cliente$/);
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Experiencia", exact: true }).first(),
  ).toHaveValue("customer");
  expect(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      EXPERIENCE_STORAGE_KEY,
    ),
  ).not.toBeNull();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) || "{}").name,
      CUSTOMER_PROFILE_KEY,
    ),
  ).toBe("Cris de prueba");
  await page.goto("/");
  await expect(page.locator(".resume-experience")).toContainText("Modo cliente");
  await expect(page.getByRole("link", { name: "Continuar donde estabas", exact: true })).toHaveAttribute("href", "/cliente");
  await expect(page.getByRole("link", { name: "Empezar con AutonoService", exact: true })).toBeVisible();
  expect(mutations).toEqual([]);
});

test("Mi plan muestra AutonoSuite como mejora y no realiza compras", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method()))
      mutations.push(`${request.method()} ${request.url()}`);
  });
  await page.goto("/mi-plan");
  await expect(
    page.getByRole("heading", { level: 1, name: "Mi plan", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Un único pago. Sin suscripción obligatoria.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mejorar a AutonoSuite — 99 €", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("No se ha realizado ningún cobro");
  await expect(
    page.locator('input[autocomplete="cc-number"], input[name="cardNumber"]'),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page.goto("/cliente");
  await expect(
    page.getByRole("button", {
      name: "Mejorar a AutonoSuite — 99 €",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(mutations).toEqual([]);
});

test("el tema claro y oscuro se conserva y sigue disponible al cambiar de experiencia", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Cambiar a modo claro", exact: true })
    .first()
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.goto("/cliente");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page
    .getByRole("button", { name: "Cambiar a modo oscuro", exact: true })
    .first()
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

for (const width of [360, 768, 1440]) {
  test(`marca, registro, selector y Mi plan son navegables a ${width}px en claro`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() =>
      localStorage.setItem("autonoservice-theme-v1", "light"),
    );
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    for (const path of [
      "/",
      "/registro",
      "/onboarding",
      "/empresa",
      "/cliente",
      "/explorar",
      "/negocio/photo",
      "/mensajes?como=cliente&conversacion=lumen-alex",
      "/mi-plan",
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      await expect
        .poll(
          () =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          { message: `${path} debe caber en ${width}px` },
        )
        .toBe(true);
      await expect(page.locator("body")).not.toContainText(
        "AutonoService Business",
      );
      await expect(page.locator("body")).not.toContainText(
        "AutonoService Cliente",
      );
    }
    expect(errors).toEqual([]);
  });
}
