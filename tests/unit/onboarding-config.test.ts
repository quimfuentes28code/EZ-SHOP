import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_CONFIG,
  DEMO_STORAGE_KEY,
  normalizeDemoConfig,
} from "../../src/lib/demo";

test("la configuración antigua conserva sus valores y recibe preferencias locales seguras", () => {
  const old = {
    name: "Estudio",
    city: "Madrid",
    sectorId: "photo",
    mode: "local",
    modules: ["customers", "galleries"],
    publicListing: false,
  };
  const normalized = normalizeDemoConfig(old);
  assert.equal(normalized.name, old.name);
  assert.deepEqual(normalized.modules, old.modules);
  assert.equal(normalized.entityType, "self_employed");
  assert.deepEqual(normalized.additionalSectorIds, []);
  assert.deepEqual(normalized.availability, {
    days: [1, 2, 3, 4, 5],
    opens: "09:00",
    closes: "18:00",
  });
  assert.equal(normalized.publicListing, false);
  assert.equal(
    DEMO_STORAGE_KEY,
    "nexo-demo-business-v1",
    "mantiene los datos de la versión anterior",
  );
});

test("las actividades mixtas descartan identificadores desconocidos, duplicados y actividad principal", () => {
  const mixed = normalizeDemoConfig({
    sectorId: "photo",
    additionalSectorIds: [
      "photo",
      "beauty",
      "beauty",
      "missing",
      "constructor",
      "bakery",
      "retail",
      "creative",
      "fitness",
      {},
    ],
  });
  assert.deepEqual(mixed.additionalSectorIds, [
    "beauty",
    "bakery",
    "retail",
    "creative",
  ]);
  assert.deepEqual(
    normalizeDemoConfig({ additionalSectorIds: "beauty" }).additionalSectorIds,
    [],
  );
});

test("los horarios de muestra se validan sin coaccionar tipos ni aceptar rangos invertidos", () => {
  const valid = normalizeDemoConfig({
    availability: {
      days: [7, 1, 1, 4, 0, 8, "2", null],
      opens: "08:30",
      closes: "17:15",
    },
  });
  assert.deepEqual(valid.availability, {
    days: [1, 4, 7],
    opens: "08:30",
    closes: "17:15",
  });
  const invalid = normalizeDemoConfig({
    availability: { days: [], opens: "25:01", closes: "8:00" },
  });
  assert.deepEqual(invalid.availability, {
    days: [],
    opens: "09:00",
    closes: "18:00",
  });
  assert.deepEqual(
    normalizeDemoConfig({ availability: { opens: "19:00", closes: "08:00" } })
      .availability,
    DEFAULT_CONFIG.availability,
  );
  const inherited = Object.create({
    entityType: "company",
    coverage: "Publicar dirección",
    availability: { opens: "01:00", closes: "02:00" },
  });
  assert.equal(normalizeDemoConfig(inherited).entityType, "self_employed");
  assert.equal(normalizeDemoConfig(inherited).coverage, "");
});

test("las preferencias de negocio tienen límites y no comparten objetos mutables entre cargas", () => {
  const config = normalizeDemoConfig({
    entityType: "company",
    offering: "both",
    coverage: ` ${"a".repeat(200)} `,
  });
  assert.equal(config.entityType, "company");
  assert.equal(config.offering, "both");
  assert.equal(config.coverage?.length, 160);
  assert.equal(
    normalizeDemoConfig({
      entityType: true,
      offering: "financial",
      coverage: 34,
    }).offering,
    "services",
  );
  config.availability?.days.pop();
  config.additionalSectorIds?.push("beauty");
  assert.deepEqual(
    normalizeDemoConfig(null).availability,
    DEFAULT_CONFIG.availability,
  );
  assert.deepEqual(normalizeDemoConfig(null).additionalSectorIds, []);
});
