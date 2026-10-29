import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import {
  BUSINESS_IDS,
  DEMO_PROFILE_EVENT,
  DEMO_REQUEST_EVENT,
  DEMO_TIME_SLOTS,
  MAX_PROFILE_PHOTO_LENGTH,
  PROFILE_STORAGE_PREFIX,
  REQUEST_STORAGE_KEY,
  createDemoRequest,
  getBusinessIdForSector,
  getDemoRequests,
  isBusinessId,
  loadBusinessProfile,
  normalizeBusinessProfile,
  profileFromConfig,
  saveBusinessProfile,
  validateRequestDate,
} from "../../src/features/business-profile/model";
import { DEFAULT_CONFIG } from "../../src/lib/demo";

function mockWindow(t: TestContext, value: object) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  });
}
function memoryWindow(t: TestContext) {
  const values = new Map<string, string>();
  const events: string[] = [];
  mockWindow(t, {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
    dispatchEvent: (event: Event) => {
      events.push(event.type);
      return true;
    },
  });
  return { values, events };
}
const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const image = "data:image/png;base64,aGVsbG8=";

test("perfiles de cuatro negocios ficticios comparten catálogo separado de servicios y productos", () => {
  assert.deepEqual(BUSINESS_IDS, ["photo", "beauty", "bakery", "repairs"]);
  assert.equal(isBusinessId("constructor"), false);
  for (const id of BUSINESS_IDS) {
    assert.equal(isBusinessId(id), true);
    const profile = loadBusinessProfile(id);
    assert.equal(profile.id, id);
    assert.ok(
      profile.catalog.some((item) => item.kind === "service" && item.bookable),
    );
    assert.ok(
      profile.catalog.some((item) => item.kind === "product" && !item.bookable),
    );
    assert.deepEqual(profile.photos, []);
  }
  const original = loadBusinessProfile("photo");
  original.catalog[0].title = "Cambiado";
  assert.equal(
    loadBusinessProfile("photo").catalog[0].title,
    "Sesión de retrato",
  );
});

test("normaliza campos propios, identidad fija y listas intencionalmente vacías", () => {
  const profile = normalizeBusinessProfile(
    {
      id: "repairs",
      name: "   Demo   ",
      city: "  Zona  ",
      bio: "x".repeat(600),
      photos: [],
      catalog: [],
    },
    "photo",
  );
  assert.equal(profile.id, "photo");
  assert.equal(profile.name, "Demo");
  assert.equal(profile.city, "Zona");
  assert.equal(profile.bio.length, 500);
  assert.deepEqual(profile.photos, []);
  assert.deepEqual(profile.catalog, []);
  const inherited = Object.create({
    name: "Inyectado",
    photos: [],
    catalog: [],
  });
  assert.deepEqual(
    normalizeBusinessProfile(inherited, "photo"),
    loadBusinessProfile("photo"),
  );
});

test("las fotos locales excluyen URL remota, SVG, duplicados y exceso de tamaño", () => {
  const photos = [
    { id: "remote", src: "https://example.com/private.jpg", alt: "Remota" },
    { id: "svg", src: "data:image/svg+xml;base64,PHN2Zz4=", alt: "SVG" },
    {
      id: "oversized",
      src: "data:image/png;base64," + "A".repeat(MAX_PROFILE_PHOTO_LENGTH),
      alt: "Grande",
    },
    { id: "local", src: image, alt: "  Mi ejemplo  " },
    { id: "local", src: image, alt: "Duplicada" },
    ...Array.from({ length: 8 }, (_, index) => ({
      id: `more-${index}`,
      src: image,
      alt: "Otra",
    })),
  ];
  const normalized = normalizeBusinessProfile({ photos }, "photo");
  assert.equal(normalized.photos.length, 6);
  assert.equal(normalized.photos[0].alt, "Mi ejemplo");
  assert.ok(normalized.photos.every((photo) => photo.src === image));
});

test("el catálogo filtra importes inválidos, duplicados y reservas de productos", () => {
  const item = loadBusinessProfile("photo").catalog[0];
  const result = normalizeBusinessProfile(
    {
      catalog: [
        { ...item, price: -1 },
        { ...item, price: Infinity },
        { ...item, price: 100_001 },
        { ...item, id: "bad-duration", duration: 500 },
        {
          ...item,
          id: "product",
          kind: "product",
          bookable: true,
          price: 10.125,
          duration: 70,
        },
        item,
        item,
        Object.create(item),
      ],
    },
    "photo",
  );
  assert.equal(result.catalog.length, 2);
  assert.equal(result.catalog[0].price, 10.13);
  assert.equal(result.catalog[0].duration, 0);
  assert.equal(result.catalog[0].bookable, false);
  assert.equal(result.catalog[1].id, "portrait");
});

test("guardar perfil comparte datos normalizados y emite su evento local", (t) => {
  const { values, events } = memoryWindow(t);
  const profile = loadBusinessProfile("photo");
  profile.bio = "  Nuestra nueva descripción  ";
  assert.equal(saveBusinessProfile(profile), true);
  assert.equal(loadBusinessProfile("photo").bio, "Nuestra nueva descripción");
  assert.ok(values.has(PROFILE_STORAGE_PREFIX + "photo"));
  assert.deepEqual(events, [DEMO_PROFILE_EVENT]);
  assert.equal(getBusinessIdForSector("bakery"), "bakery");
  assert.equal(getBusinessIdForSector("unknown"), "photo");
  const configured = profileFromConfig({
    ...DEFAULT_CONFIG,
    name: "  Nombre nuevo  ",
    city: "  Valencia  ",
  });
  assert.equal(configured.name, "Nombre nuevo");
  assert.equal(configured.city, "Valencia");
  assert.equal(configured.bio, "Nuestra nueva descripción");
});

test("SSR, JSON corrupto y almacenamiento bloqueado mantienen perfiles navegables sin fingir guardado", (t) => {
  assert.equal(typeof window, "undefined");
  assert.equal(saveBusinessProfile(loadBusinessProfile("photo")), false);
  assert.deepEqual(getDemoRequests(), []);
  mockWindow(t, {
    localStorage: {
      getItem: () => "{broken",
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    },
  });
  assert.equal(loadBusinessProfile("photo").name, "Lumen Studio");
  assert.equal(saveBusinessProfile(loadBusinessProfile("photo")), false);
  assert.deepEqual(getDemoRequests(), []);
  const result = createDemoRequest({
    businessId: "photo",
    itemId: "portrait",
    date: tomorrow(),
    time: DEMO_TIME_SLOTS[0],
  });
  assert.equal(result.ok, false);
});

test("la fecha de solicitud valida calendario real y fecha local actual", () => {
  const today = new Date(2026, 9, 28, 23, 50);
  assert.equal(validateRequestDate("2026-10-28", today), true);
  assert.equal(validateRequestDate("2026-10-29", today), true);
  assert.equal(validateRequestDate("2026-10-27", today), false);
  assert.equal(validateRequestDate("2027-02-29", today), false);
  assert.equal(validateRequestDate("2028-02-29", today), true);
  assert.equal(validateRequestDate("2026-13-01", today), false);
  assert.equal(validateRequestDate("2026-1-01", today), false);
});

test("una solicitud demo usa el catálogo publicado localmente y no acepta productos o horarios arbitrarios", (t) => {
  const { values, events } = memoryWindow(t);
  const profile = loadBusinessProfile("photo");
  profile.catalog[0].title = "Sesión editada en mi perfil";
  assert.equal(saveBusinessProfile(profile), true);
  assert.equal(
    createDemoRequest({
      businessId: "photo",
      itemId: "prints",
      date: tomorrow(),
      time: "09:00",
    }).ok,
    false,
  );
  assert.equal(
    createDemoRequest({
      businessId: "photo",
      itemId: "portrait",
      date: tomorrow(),
      time: "23:59",
    }).ok,
    false,
  );
  assert.equal(
    createDemoRequest({
      businessId: "photo",
      itemId: "portrait",
      date: "2000-01-01",
      time: "09:00",
    }).ok,
    false,
  );
  const created = createDemoRequest({
    businessId: "photo",
    itemId: "portrait",
    date: tomorrow(),
    time: "09:00",
    notes: "  Una consulta  ",
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.request.status, "demo");
  assert.equal(created.request.itemTitle, "Sesión editada en mi perfil");
  assert.equal(created.request.notes, "Una consulta");
  assert.equal(getDemoRequests().length, 1);
  assert.ok(values.has(REQUEST_STORAGE_KEY));
  assert.deepEqual(events, [DEMO_PROFILE_EVENT, DEMO_REQUEST_EVENT]);
});

test("las solicitudes corruptas, heredadas o duplicadas no aparecen en la cuenta cliente", (t) => {
  const { values } = memoryWindow(t);
  const result = createDemoRequest({
    businessId: "beauty",
    itemId: "haircut",
    date: tomorrow(),
    time: "10:30",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  values.set(
    REQUEST_STORAGE_KEY,
    JSON.stringify([
      result.request,
      result.request,
      { ...result.request, id: "corrupt", businessId: "unknown" },
      { ...result.request, id: "real", status: "confirmed" },
      {},
    ]),
  );
  assert.deepEqual(getDemoRequests(), [result.request]);
});
