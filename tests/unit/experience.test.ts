import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import {
  CUSTOMER_PROFILE_KEY,
  EXPERIENCE_STORAGE_KEY,
  loadCustomerProfile,
  loadDemoExperience,
  loadActiveOrganization,
  switchDemoOrganization,
  DEMO_IDENTITY,
  normalizeCustomerProfile,
  saveCustomerProfile,
  setDemoExperience,
} from "../../src/lib/experience";
import {
  DEFAULT_CONFIG,
  loadDemoConfig,
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

test("el perfil Cliente recupera una copia segura ante datos inválidos", () => {
  const fallback = normalizeCustomerProfile(null);
  assert.ok(fallback.name.trim());
  for (const invalid of [undefined, 42, "perfil", [], false]) {
    assert.deepEqual(normalizeCustomerProfile(invalid), fallback);
  }
  const copy = normalizeCustomerProfile(null);
  copy.interests.push("Interés de prueba");
  assert.deepEqual(normalizeCustomerProfile(null), fallback);
});

test("el perfil normaliza texto e intereses sin aceptar propiedades heredadas", () => {
  const profile = normalizeCustomerProfile({
    name: "  Cliente de ejemplo  ",
    city: " Valencia ",
    interests: ["Creatividad", "Creatividad", 7, ""],
  });
  assert.equal(profile.name, "Cliente de ejemplo");
  assert.equal(profile.city, "Valencia");
  assert.deepEqual(profile.interests, ["Creatividad"]);
  assert.deepEqual(
    normalizeCustomerProfile(
      Object.create({
        name: "Inyectado",
        city: "Otra",
        interests: ["Inyectado"],
      }),
    ),
    normalizeCustomerProfile(null),
  );
});

test("SSR no exige navegador ni convierte el selector en autenticación", () => {
  assert.equal(typeof window, "undefined");
  assert.equal(loadDemoExperience(), "business");
  assert.deepEqual(loadCustomerProfile(), normalizeCustomerProfile(null));
  assert.equal(setDemoExperience("customer"), false);
  assert.equal(
    saveCustomerProfile({ name: "Demo", city: "", interests: [] }),
    false,
  );
});

test("cambiar de experiencia conserva un único perfil Cliente local", (t) => {
  const values = new Map<string, string>();
  mockWindow(t, {
    dispatchEvent: () => true,
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  assert.equal(
    saveCustomerProfile({
      name: "  Cris Demo  ",
      city: " Madrid ",
      interests: ["Bienestar"],
    }),
    true,
  );
  assert.equal(setDemoExperience("customer"), true);
  assert.equal(loadDemoExperience(), "customer");
  assert.equal(setDemoExperience("business"), true);
  assert.equal(loadDemoExperience(), "business");
  assert.equal(loadCustomerProfile().name, "Cris Demo");
  assert.equal(loadCustomerProfile().city, "Madrid");
  assert.ok(values.has(CUSTOMER_PROFILE_KEY));
  assert.ok(values.has(EXPERIENCE_STORAGE_KEY));
  assert.equal(setDemoExperience("constructor" as never), false);
  assert.equal(loadDemoExperience(), "business");
});

test("JSON corrupto, modo desconocido y almacenamiento bloqueado no rompen la entrada", (t) => {
  mockWindow(t, {
    dispatchEvent: () => true,
    localStorage: {
      getItem: (key: string) =>
        key === CUSTOMER_PROFILE_KEY ? "{malformado" : "otro",
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    },
  });
  assert.deepEqual(loadCustomerProfile(), normalizeCustomerProfile(null));
  assert.equal(loadDemoExperience(), "business");
  assert.equal(
    saveCustomerProfile({ name: "Demo", city: "", interests: [] }),
    false,
  );
  assert.equal(setDemoExperience("customer"), false);
});

test("un getter de almacenamiento denegado también conserva los valores seguros", (t) => {
  mockWindow(
    t,
    Object.defineProperty({}, "localStorage", {
      get() {
        throw new Error("SecurityError");
      },
    }),
  );
  assert.deepEqual(loadCustomerProfile(), normalizeCustomerProfile(null));
  assert.equal(loadDemoExperience(), "business");
  assert.equal(setDemoExperience("customer"), false);
});

test("el selector recuerda configuraciones de cada negocio sin crear identidades distintas", (t) => {
  const values = new Map<string, string>();
  mockWindow(t, {
    dispatchEvent: () => true,
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  const identityId = DEMO_IDENTITY.id;
  assert.equal(
    saveDemoConfig({
      ...DEFAULT_CONFIG,
      name: "Estudio configurado",
      modules: ["customers", "projects"],
    }),
    true,
  );
  assert.equal(switchDemoOrganization("beauty"), true);
  assert.equal(loadActiveOrganization(), "beauty");
  assert.equal(loadDemoConfig().sectorId, "beauty");
  assert.ok(loadDemoConfig().modules.includes("bookings"));
  assert.equal(switchDemoOrganization("photo"), true);
  assert.equal(loadDemoConfig().name, "Estudio configurado");
  assert.deepEqual(loadDemoConfig().modules, ["customers", "projects"]);
  assert.equal(DEMO_IDENTITY.id, identityId);
  assert.equal(switchDemoOrganization("constructor" as never), false);
  assert.equal(loadActiveOrganization(), "photo");
});
