import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MODULES,
  SECTORS,
  getModuleStatus,
  isModuleId,
  isPreviewModule,
  sectorById,
  suggestedPreviewModules,
} from "../../src/lib/catalog";

test("el catálogo mantiene módulos y plantillas reutilizables con identificadores únicos", () => {
  assert.equal(Object.keys(MODULES).length, 25);
  assert.equal(SECTORS.length, 28);
  assert.equal(
    new Set(SECTORS.map((sector) => sector.id)).size,
    SECTORS.length,
  );
  for (const sector of SECTORS) {
    assert.ok(
      sector.suggested.includes("customers"),
      `${sector.id} incluye el núcleo de clientes`,
    );
    assert.ok(
      sector.suggested.every(isModuleId),
      `${sector.id} solo recomienda módulos conocidos`,
    );
    assert.ok(
      sector.operations.length > 0,
      `${sector.id} declara sus operaciones`,
    );
  }
});

test("identificadores heredados o desconocidos no son módulos", () => {
  for (const value of [
    "constructor",
    "toString",
    "__proto__",
    "unknown",
    "",
    null,
    {},
    3,
  ]) {
    assert.equal(isModuleId(value), false);
  }
  assert.equal(isModuleId("customers"), true);
});

test("finanzas permanecen planificadas y no activables en el Hito 0", () => {
  assert.equal(getModuleStatus("payments"), "planned");
  assert.equal(getModuleStatus("invoices"), "planned");
  assert.equal(isPreviewModule("payments"), false);
  assert.equal(isPreviewModule("invoices"), false);
  assert.equal(getModuleStatus("projects"), "preview");
  for (const sector of SECTORS) {
    const suggested = suggestedPreviewModules(sector.id);
    assert.ok(!suggested.includes("payments"));
    assert.ok(!suggested.includes("invoices"));
  }
});

test("sectores distintos componen operaciones distintas sin clonar el núcleo", () => {
  const photo = sectorById("photo");
  const beauty = sectorById("beauty");
  const bakery = sectorById("bakery");
  assert.ok(photo.suggested.includes("projects"));
  assert.ok(beauty.suggested.includes("bookings"));
  assert.ok(!bakery.suggested.includes("bookings"));
  assert.ok(bakery.suggested.includes("orders"));
  assert.equal(sectorById("sector-inexistente").id, "photo");
});
