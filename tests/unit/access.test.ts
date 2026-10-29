import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FEATURE_CATALOG,
  getFeatureAccess,
  type AccessContext,
  type FeatureId,
} from "../../src/lib/access";

const owner: AccessContext = {
  experience: "business",
  role: "owner",
  plan: "free",
  moduleEnabled: true,
  platform: "web",
};

test("la versión gratuita permite herramientas básicas sin una licencia premium", () => {
  for (const feature of [
    "crm.basic",
    "agenda.local",
    "projects.basic",
    "quotes.basic",
    "profile.edit",
    "modules.configure",
  ] as const) {
    assert.deepEqual(getFeatureAccess(owner, feature), {
      allowed: true,
      reason: "allowed",
    });
  }
  assert.deepEqual(getFeatureAccess(owner, "crm.advanced"), {
    allowed: false,
    reason: "plan",
  });
});

test("el contexto Cliente y una membresía ausente no autorizan herramientas empresariales", () => {
  assert.deepEqual(
    getFeatureAccess(
      { ...owner, experience: "customer", plan: "suite", licenseVersion: 1 },
      "crm.basic",
    ),
    { allowed: false, reason: "business-context" },
  );
  assert.deepEqual(getFeatureAccess({ ...owner, role: null }, "crm.basic"), {
    allowed: false,
    reason: "role",
  });
});

test("los roles contextuales permiten trabajo básico y limitan la configuración", () => {
  const employee = { ...owner, role: "employee" as const };
  assert.equal(getFeatureAccess(employee, "crm.basic").allowed, true);
  assert.deepEqual(getFeatureAccess(employee, "profile.edit"), {
    allowed: false,
    reason: "role",
  });
  assert.deepEqual(getFeatureAccess(employee, "modules.configure"), {
    allowed: false,
    reason: "role",
  });
  assert.equal(
    getFeatureAccess({ ...owner, role: "admin" }, "modules.configure").allowed,
    true,
  );
});

test("un módulo desactivado no se habilita por tener AutonoSuite", () => {
  assert.deepEqual(
    getFeatureAccess({ ...owner, moduleEnabled: false }, "crm.basic"),
    { allowed: false, reason: "module-disabled" },
  );
  assert.deepEqual(
    getFeatureAccess(
      { ...owner, plan: "suite", licenseVersion: 1, moduleEnabled: false },
      "projects.advanced",
    ),
    { allowed: false, reason: "module-disabled" },
  );
});

test("una licencia de versión adquirida conserva sus funciones y no presupone compra entre plataformas", () => {
  const suite: AccessContext = {
    ...owner,
    plan: "suite",
    licenseVersion: 1,
    licensePlatform: "web",
  };
  assert.deepEqual(getFeatureAccess(suite, "projects.advanced"), {
    allowed: true,
    reason: "allowed",
  });
  assert.equal(FEATURE_CATALOG["projects.advanced"].minimumVersion, 1);
  for (const licenseVersion of [
    undefined,
    0,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ]) {
    assert.deepEqual(
      getFeatureAccess({ ...suite, licenseVersion }, "projects.advanced"),
      { allowed: false, reason: "license-version" },
    );
  }
  assert.deepEqual(
    getFeatureAccess({ ...suite, platform: "ios" }, "projects.advanced"),
    { allowed: false, reason: "platform" },
  );
  assert.equal(
    getFeatureAccess(
      { ...suite, platform: "android", licensePlatform: "android" },
      "projects.advanced",
    ).allowed,
    true,
  );
});

test("finanzas reales, IA prevista e identificadores desconocidos permanecen cerrados", () => {
  const suite: AccessContext = { ...owner, plan: "suite", licenseVersion: 999 };
  for (const feature of ["invoices.issue", "ai.assistant"] as const)
    assert.deepEqual(getFeatureAccess(suite, feature), {
      allowed: false,
      reason: "planned",
    });
  for (const feature of ["constructor", "__proto__", "missing"])
    assert.deepEqual(getFeatureAccess(suite, feature as unknown as FeatureId), {
      allowed: false,
      reason: "unknown-feature",
    });
});
