import { expect, test } from "@playwright/test";

const futureDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 4);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

// All data and attachments created below are synthetic test fixtures. No request
// should leave the browser as a booking, message, payment, or public publication.
test("el catálogo editado por el negocio es el mismo que consulta el cliente", async ({
  page,
}) => {
  // Local HTTP on a phone may not expose randomUUID; the demo must still work.
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, "randomUUID", { value: undefined, configurable: true });
  });
  await page.goto("/empresa?vista=perfil");
  await page
    .getByLabel("Nombre del negocio", { exact: true })
    .fill("Lumen QA de prueba");
  await page.getByLabel("Ciudad de ejemplo", { exact: true }).fill("Valencia");
  await page
    .getByLabel("Descripción del negocio", { exact: true })
    .fill(
      "Estudio de demostración: retratos y producto, con atención personalizada.",
    );
  await page
    .getByRole("button", { name: "Añadir servicio o producto", exact: true })
    .click();
  const form = page.getByRole("dialog", { name: "Nuevo servicio o producto" });
  await form
    .getByLabel("Nombre del servicio o producto", { exact: true })
    .fill("Álbum E2E de muestra");
  await form
    .getByLabel("Tipo de publicación", { exact: true })
    .selectOption("product");
  await form
    .getByLabel("Precio orientativo (€)", { exact: true })
    .fill("34.50");
  await form
    .getByLabel("Descripción", { exact: true })
    .fill(
      "Producto ficticio añadido sólo para comprobar el catálogo compartido.",
    );
  await form
    .getByRole("button", { name: "Añadir al catálogo", exact: true })
    .click();
  await page
    .getByLabel("Añadir fotos de ejemplo", { exact: true })
    .setInputFiles({
      name: "escena-e2e.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBasAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(
    page.getByRole("img", { name: "escena-e2e", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Guardar perfil de ejemplo", exact: true })
    .click();
  await page.goto("/negocio/photo");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Lumen QA de prueba",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Estudio de demostración: retratos y producto, con atención personalizada.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "escena-e2e", exact: true }),
  ).toBeVisible();
  await page.goto("/empresa?vista=perfil");
  await expect(
    page.getByLabel("Nombre del negocio", { exact: true }),
  ).toHaveValue("Lumen QA de prueba");
  await expect(
    page.getByLabel("Ciudad de ejemplo", { exact: true }),
  ).toHaveValue("Valencia");
  await page.goto("/negocio/photo");
  await page
    .getByRole("tab", { name: "Servicios y productos", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Álbum E2E de muestra", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Reservar Álbum E2E de muestra",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Consultar Álbum E2E de muestra", exact: true })
    .click();
  await expect(page).toHaveURL(/\/mensajes\?.*conversacion=lumen-alex/);
  await expect(
    page.getByRole("textbox", { name: "Mensaje de ejemplo", exact: true }),
  ).toBeVisible();
});

test("una reserva de perfil sólo guarda una solicitud local que aparece en la cuenta cliente", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method()))
      mutations.push(`${request.method()} ${request.url()}`);
  });
  await page.goto("/negocio/photo");
  await page
    .getByRole("tab", { name: "Servicios y productos", exact: true })
    .click();
  const reserve = page.getByRole("button", { name: /^Reservar / }).first();
  const serviceTitle = (await reserve.getAttribute("aria-label"))!.replace(
    /^Reservar /,
    "",
  );
  await reserve.click();
  const form = page.getByRole("dialog", {
    name: "Preparar reserva de ejemplo",
  });
  const date = form.getByLabel("Fecha de ejemplo", { exact: true });
  await expect(date).toBeVisible();
  await date.fill("2020-01-01");
  expect(
    await date.evaluate((element) =>
      (element as HTMLInputElement).checkValidity(),
    ),
  ).toBe(false);
  await date.fill(futureDate());
  await form
    .getByLabel("Hora orientativa", { exact: true })
    .selectOption("10:30");
  await form
    .getByRole("button", { name: "Revisar solicitud", exact: true })
    .click();
  await form
    .getByRole("button", { name: "Guardar solicitud de ejemplo", exact: true })
    .click();
  await expect(form.getByRole("alert")).toContainText("Confirma que entiendes");
  await form
    .getByRole("checkbox", {
      name: "Entiendo que esta solicitud no se envía al negocio",
      exact: true,
    })
    .check();
  await form
    .getByRole("button", { name: "Guardar solicitud de ejemplo", exact: true })
    .click();
  await expect(
    page.getByText(
      "Solicitud de ejemplo guardada en este navegador. No se ha enviado al negocio.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.goto("/cliente");
  const request = page
    .locator(".personal-demo-request")
    .filter({ hasText: serviceTitle });
  await expect(request).toBeVisible();
  await expect(request).toContainText("NO ENVIADA · DEMO");
  await page.reload();
  await expect(
    page.locator(".personal-demo-request").filter({ hasText: serviceTitle }),
  ).toBeVisible();
  expect(mutations).toEqual([]);
});

for (const width of [360, 768, 1440]) {
  test(`perfiles y conversaciones se adaptan a ${width}px sin errores de ejecución`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    for (const path of [
      "/negocio/photo",
      "/negocio/bakery",
      "/mensajes?como=cliente&conversacion=lumen-alex",
      "/mensajes?como=empresa&conversacion=lumen-alex",
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1 }).first(),
      ).toBeVisible();
      await expect
        .poll(
          () =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          { message: `${path} cabe en ${width}px` },
        )
        .toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test("cliente y negocio revisan el mismo hilo local sin enviar mensajes reales", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method()))
      mutations.push(`${request.method()} ${request.url()}`);
  });
  await page.goto(
    "/mensajes?como=empresa&negocio=photo&conversacion=lumen-alex",
  );
  await page
    .getByRole("textbox", { name: "Mensaje de ejemplo", exact: true })
    .fill("  Mensaje sintético del estudio para QA.  ");
  await page
    .getByRole("button", { name: "Guardar mensaje", exact: true })
    .click();
  await expect(
    page.getByRole("log", { name: "Mensajes de la conversación" }),
  ).toContainText("Mensaje sintético del estudio para QA.");
  await expect(
    page.getByText(
      "Mensaje guardado en este navegador. No se ha enviado a otra persona.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Revisar perspectiva Cliente", exact: true })
    .click();
  await expect(
    page.getByRole("log", { name: "Mensajes de la conversación" }),
  ).toContainText("Mensaje sintético del estudio para QA.");
  await page
    .getByRole("textbox", { name: "Mensaje de ejemplo", exact: true })
    .fill("Respuesta sintética del cliente para QA.");
  await page
    .getByRole("textbox", { name: "Mensaje de ejemplo", exact: true })
    .press("Enter");
  await expect(
    page.getByRole("log", { name: "Mensajes de la conversación" }),
  ).toContainText("Respuesta sintética del cliente para QA.");
  await page
    .getByRole("link", { name: "Revisar perspectiva Mi negocio", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("log", { name: "Mensajes de la conversación" }),
  ).toContainText("Respuesta sintética del cliente para QA.");
  expect(mutations).toEqual([]);
});

test("los adjuntos de prueba se descargan durante la sesión y avisan al caducar", async ({
  page,
}) => {
  // Local HTTP on a phone may not expose randomUUID; the demo must still work.
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, "randomUUID", { value: undefined, configurable: true });
  });
  await page.goto(
    "/mensajes?como=empresa&negocio=photo&conversacion=lumen-alex",
  );
  await page
    .getByLabel("Archivo de prueba", { exact: true })
    .setInputFiles({
      name: "no-permitido.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"),
    });
  await expect(page.locator(".as-chat-error")).toContainText(
    "Adjunta una imagen JPG, PNG o WebP",
  );
  const contents = "Archivo TXT de prueba E2E. Sin información personal.";
  await page
    .getByLabel("Archivo de prueba", { exact: true })
    .setInputFiles({
      name: "entrega-qa.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(contents),
    });
  await page
    .getByRole("button", { name: "Guardar mensaje", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Revisar perspectiva Cliente", exact: true })
    .click();
  const downloadLink = page.getByRole("link", {
    name: "Descargar entrega-qa.txt",
    exact: true,
  });
  await expect(downloadLink).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    downloadLink.click(),
  ]);
  expect(download.suggestedFilename()).toBe("entrega-qa.txt");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  if (!stream) throw new Error("La descarga local no produjo un archivo.");
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString()).toBe(contents);
  await page.reload();
  await expect(
    page.getByText("Archivo de otra sesión. Vuelve a adjuntarlo.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Descargar entrega-qa.txt", exact: true }),
  ).toHaveCount(0);
});

test("la selección de perspectiva demo no mezcla los hilos de los negocios de muestra", async ({
  page,
}) => {
  await page.goto(
    "/mensajes?como=empresa&negocio=beauty&conversacion=lumen-alex",
  );
  await expect(
    page.getByRole("heading", { name: "Alex López", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Consulta sobre un corte · Ejemplo", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Conversación con Clara Torres",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.goto("/mensajes?como=cliente&conversacion=lumen-clara");
  await expect(
    page.getByRole("button", {
      name: "Conversación con Lumen Studio",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Fotografía de producto · Ejemplo", { exact: true }),
  ).toHaveCount(0);
});
