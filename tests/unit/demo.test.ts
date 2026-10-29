import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import {
  DEFAULT_CONFIG,
  DEMO_STORAGE_KEY,
  loadDemoConfig,
  normalizeDemoConfig,
  saveDemoConfig,
} from "../../src/lib/demo";

function mockWindow(t: TestContext, value: object) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  });
}

test("la configuración inválida recupera valores demo y devuelve copias independientes", () => {
  for (const invalid of [null, undefined, 42, "abc", [], false]) {
    assert.deepEqual(normalizeDemoConfig(invalid), DEFAULT_CONFIG);
  }
  const config = normalizeDemoConfig(null);
  config.modules.pop();
  assert.deepEqual(normalizeDemoConfig(null).modules, DEFAULT_CONFIG.modules);
});

test("el núcleo es obligatorio, se eliminan duplicados, claves heredadas y finanzas", () => {
  const config = normalizeDemoConfig({
    modules: [
      "projects",
      "projects",
      "payments",
      "invoices",
      "toString",
      "__proto__",
      "constructor",
      "missing",
      null,
      {},
    ],
  });
  assert.deepEqual(config.modules, ["customers", "projects"]);
  assert.deepEqual(normalizeDemoConfig({ modules: [] }).modules, ["customers"]);
});

test("normaliza identidad, sector, modalidad y preferencia pública sin coacciones", () => {
  const config = normalizeDemoConfig({
    name: "  Taller  ",
    city: " Valencia ",
    sectorId: "bakery",
    mode: "online",
    publicListing: "true",
  });
  assert.equal(config.name, "Taller");
  assert.equal(config.city, "Valencia");
  assert.equal(config.sectorId, "bakery");
  assert.equal(config.mode, "online");
  assert.equal(config.publicListing, false);
  assert.deepEqual(config.modules, [
    "customers",
    "products",
    "orders",
    "stock",
  ]);
  const fallback = normalizeDemoConfig({
    name: "  ",
    city: "",
    sectorId: "fake",
    mode: "fake",
    publicListing: true,
  });
  assert.equal(fallback.name, DEFAULT_CONFIG.name);
  assert.equal(fallback.city, "");
  assert.equal(fallback.sectorId, "photo");
  assert.equal(fallback.mode, "local");
  assert.equal(fallback.publicListing, true);
  assert.equal(
    normalizeDemoConfig({ name: "a".repeat(100), city: "b".repeat(100) }).name
      .length,
    80,
  );
  assert.equal(normalizeDemoConfig({ city: "b".repeat(100) }).city.length, 80);
});

test("ignora propiedades de configuración heredadas", () => {
  const input = Object.create({
    name: "Inyectado",
    modules: ["payments"],
    publicListing: true,
  });
  assert.deepEqual(normalizeDemoConfig(input), DEFAULT_CONFIG);
});

test("SSR no necesita window y no intenta guardar", () => {
  assert.equal(typeof window, "undefined");
  assert.deepEqual(loadDemoConfig(), DEFAULT_CONFIG);
  assert.equal(saveDemoConfig(DEFAULT_CONFIG), false);
});

test("JSON corrupto o almacenamiento bloqueado conservan la demo navegable", (t) => {
  mockWindow(t, {
    localStorage: {
      getItem: () => "{broken json",
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    },
  });
  assert.deepEqual(loadDemoConfig(), DEFAULT_CONFIG);
  assert.equal(saveDemoConfig(DEFAULT_CONFIG), false);
});

test("un getter de almacenamiento bloqueado tampoco rompe la carga", (t) => {
  const blocked = Object.defineProperty({}, "localStorage", {
    get() {
      throw new Error("SecurityError");
    },
  });
  mockWindow(t, blocked);
  assert.deepEqual(loadDemoConfig(), DEFAULT_CONFIG);
  assert.equal(saveDemoConfig(DEFAULT_CONFIG), false);
});

test("guardar y recargar usa la clave versionada y normaliza ambas fronteras", (t) => {
  const values = new Map<string, string>();
  mockWindow(t, {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    },
  });
  const config = { ...DEFAULT_CONFIG, name: "  Demo nueva  ", modules: [] };
  assert.equal(saveDemoConfig(config), true);
  assert.ok(values.has(DEMO_STORAGE_KEY));
  assert.equal(loadDemoConfig().name, "Demo nueva");
  assert.deepEqual(loadDemoConfig().modules, ["customers"]);
  assert.deepEqual(
    config.modules,
    [],
    "el guardado no muta el formulario original",
  );
});
