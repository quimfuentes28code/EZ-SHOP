import assert from "node:assert/strict";
import { test } from "node:test";
import { createDemoId } from "../../src/lib/demo-id";

test("usa randomUUID cuando el navegador lo admite", () => {
  assert.equal(createDemoId({ randomUUID: () => "id-de-prueba" }), "id-de-prueba");
});

test("sin contexto seguro usa getRandomValues, también si randomUUID lanza un error", () => {
  const getRandomValues = (bytes: Uint8Array) => bytes.fill(42);
  assert.match(createDemoId({ getRandomValues }), /^demo-[a-f0-9]{32}$/);
  assert.match(createDemoId({ randomUUID: () => { throw new Error("Secure context required"); }, getRandomValues }), /^demo-[a-f0-9]{32}$/);
});

test("sin APIs crypto conserva IDs locales distintos sin exigir una cuenta", () => {
  const first = createDemoId(null), second = createDemoId(null);
  assert.notEqual(first,second);
  assert.match(first,/^demo-[a-z0-9]+-[a-z0-9]+$/);
});
