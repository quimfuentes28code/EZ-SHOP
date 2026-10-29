import { expect, test } from "@playwright/test";

test("la exportación sirve rutas anidadas, HEAD, 404 y solo admite lectura", async ({ request }) => {
  const nested = await request.get("/registro/empresa");
  expect(nested.status()).toBe(200);
  expect(nested.headers()["content-type"]).toContain("text/html");
  expect(nested.headers()["x-content-type-options"]).toBe("nosniff");
  const head = await request.head("/registro/empresa");
  expect(head.status()).toBe(200);
  expect((await head.body()).length).toBe(0);
  const missing = await request.get("/ruta-que-no-existe");
  expect(missing.status()).toBe(404);
  const mutation = await request.post("/registro/empresa", { data: "sin cambios" });
  expect(mutation.status()).toBe(405);
  expect(mutation.headers().allow).toBe("GET, HEAD");
});
