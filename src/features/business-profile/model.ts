import { createDemoId } from "../../lib/demo-id";
import { sectorById } from "../../lib/catalog";
import type { DemoConfig } from "../../lib/demo";

export const BUSINESS_IDS = ["photo", "beauty", "bakery", "repairs"] as const;
export type BusinessId = (typeof BUSINESS_IDS)[number];
export type CatalogItem = {
  id: string;
  title: string;
  description: string;
  kind: "service" | "product";
  price: number;
  duration: number;
  bookable: boolean;
};
export type ProfilePhoto = { id: string; src: string; alt: string };
export type BusinessProfile = {
  id: BusinessId;
  name: string;
  city: string;
  category: string;
  bio: string;
  photos: ProfilePhoto[];
  catalog: CatalogItem[];
};
export const DEMO_PROFILE_EVENT = "nexo-demo-profile-change";
export const DEMO_REQUEST_EVENT = "nexo-demo-requests-change";
export const PROFILE_STORAGE_PREFIX = "nexo-demo-profile-v1-";
export const REQUEST_STORAGE_KEY = "nexo-demo-requests-v1";
export const DEMO_TIME_SLOTS = [
  "09:00",
  "10:30",
  "12:00",
  "16:00",
  "17:30",
] as const;
export const MAX_PROFILE_PHOTO_LENGTH = 500_000;
export const MAX_PROFILE_PHOTOS_LENGTH = 2_500_000;

export type DemoRequest = {
  id: string;
  businessId: BusinessId;
  businessName: string;
  itemId: string;
  itemTitle: string;
  date: string;
  time: string;
  notes: string;
  createdAt: string;
  status: "demo";
};
export type DemoRequestInput = {
  businessId: BusinessId;
  itemId: string;
  date: string;
  time: string;
  notes?: string;
};
export type DemoRequestResult =
  { ok: true; request: DemoRequest } | { ok: false; error: string };

const seeds: Record<BusinessId, BusinessProfile> = {
  photo: {
    id: "photo",
    name: "Lumen Studio",
    city: "Barcelona",
    category: "Fotografía y vídeo",
    bio: "Retratos con personalidad, historias que merecen una imagen. Un estudio de fotografía y vídeo para personas y marcas.",
    photos: [],
    catalog: [
      {
        id: "portrait",
        title: "Sesión de retrato",
        description:
          "Una sesión de estudio para tu mejor versión. Incluye una selección de imágenes de ejemplo.",
        kind: "service",
        price: 90,
        duration: 60,
        bookable: true,
      },
      {
        id: "brand",
        title: "Fotografía para tu marca",
        description:
          "Imágenes de producto y marca. Hablemos primero del proyecto.",
        kind: "service",
        price: 180,
        duration: 90,
        bookable: true,
      },
      {
        id: "prints",
        title: "Pack de copias fotográficas",
        description:
          "Una selección de impresiones para disfrutar tus imágenes en papel.",
        kind: "product",
        price: 24,
        duration: 0,
        bookable: false,
      },
    ],
  },
  beauty: {
    id: "beauty",
    name: "Barbería Norte",
    city: "Barcelona",
    category: "Peluquería y estética",
    bio: "Cortes que encajan contigo. Un espacio tranquilo para el cuidado personal y el tiempo para ti.",
    photos: [],
    catalog: [
      {
        id: "haircut",
        title: "Corte y acabado",
        description: "Un corte personalizado, lavado y acabado a tu estilo.",
        kind: "service",
        price: 25,
        duration: 45,
        bookable: true,
      },
      {
        id: "beard",
        title: "Arreglo de barba",
        description: "Cuidado, forma y acabado de barba.",
        kind: "service",
        price: 15,
        duration: 30,
        bookable: true,
      },
      {
        id: "shampoo",
        title: "Champú de cuidado diario",
        description:
          "Producto de cuidado del cabello. Consulta opciones en la conversación.",
        kind: "product",
        price: 16,
        duration: 0,
        bookable: false,
      },
    ],
  },
  bakery: {
    id: "bakery",
    name: "Dulce Taller",
    city: "Barcelona",
    category: "Panadería y pastelería",
    bio: "Dulces para celebrar lo cotidiano. Repostería artesanal y encargos pensados para cada ocasión.",
    photos: [],
    catalog: [
      {
        id: "cake",
        title: "Tarta de celebración",
        description:
          "Un encargo personalizado. Consulta sabores, tamaño y fecha antes de encargar.",
        kind: "product",
        price: 38,
        duration: 0,
        bookable: false,
      },
      {
        id: "pastries",
        title: "Selección de repostería",
        description:
          "Una caja para compartir. Producto de ejemplo sin stock real.",
        kind: "product",
        price: 18,
        duration: 0,
        bookable: false,
      },
      {
        id: "tasting",
        title: "Degustación para celebraciones",
        description:
          "Una conversación y una selección de sabores para preparar tu evento.",
        kind: "service",
        price: 20,
        duration: 30,
        bookable: true,
      },
    ],
  },
  repairs: {
    id: "repairs",
    name: "Taller Central",
    city: "Barcelona",
    category: "Taller y reparaciones",
    bio: "Reparar también es cuidar. Atención cercana y diagnósticos explicados sin complicaciones.",
    photos: [],
    catalog: [
      {
        id: "diagnostic",
        title: "Revisión y diagnóstico",
        description:
          "Una primera revisión para entender qué necesita tu equipo.",
        kind: "service",
        price: 30,
        duration: 45,
        bookable: true,
      },
      {
        id: "maintenance",
        title: "Mantenimiento básico",
        description:
          "Puesta a punto de ejemplo. El alcance se acuerda según el trabajo.",
        kind: "service",
        price: 45,
        duration: 60,
        bookable: true,
      },
      {
        id: "wheel",
        title: "Kit de recambio",
        description:
          "Piezas de muestra. Consulta compatibilidad y disponibilidad en la conversación.",
        kind: "product",
        price: 12,
        duration: 0,
        bookable: false,
      },
    ],
  },
};

export function isBusinessId(value: unknown): value is BusinessId {
  return typeof value === "string" && BUSINESS_IDS.some((id) => id === value);
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function own(value: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(value, key)
    ? value[key]
    : undefined;
}
function text(value: unknown, max: number, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, max) : fallback;
}
function identifier(value: unknown): string {
  const id = text(value, 80);
  return /^[a-zA-Z0-9_-]{1,80}$/.test(id) ? id : "";
}
function freshSeed(id: BusinessId): BusinessProfile {
  const seed = seeds[id];
  return {
    ...seed,
    photos: seed.photos.map((photo) => ({ ...photo })),
    catalog: seed.catalog.map((item) => ({ ...item })),
  };
}
function validPhoto(value: unknown): ProfilePhoto | null {
  const input = record(value);
  const id = identifier(own(input, "id"));
  const src = own(input, "src");
  if (
    !id ||
    typeof src !== "string" ||
    src.length > MAX_PROFILE_PHOTO_LENGTH ||
    !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(src)
  )
    return null;
  return {
    id,
    src,
    alt:
      text(own(input, "alt"), 160, "Foto de demostración") ||
      "Foto de demostración",
  };
}
function validCatalogItem(value: unknown): CatalogItem | null {
  const input = record(value);
  const id = identifier(own(input, "id"));
  const title = text(own(input, "title"), 80);
  const kind = own(input, "kind");
  const price = own(input, "price");
  if (
    !id ||
    !title ||
    (kind !== "service" && kind !== "product") ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 100_000
  )
    return null;
  const durationInput = own(input, "duration");
  const duration =
    kind === "service"
      ? typeof durationInput === "number" && Number.isFinite(durationInput)
        ? Math.round(durationInput)
        : 60
      : 0;
  if (kind === "service" && (duration < 15 || duration > 480)) return null;
  return {
    id,
    title,
    description: text(own(input, "description"), 500),
    kind,
    price: Math.round(price * 100) / 100,
    duration,
    bookable: kind === "service" && own(input, "bookable") === true,
  };
}

/** Local demo boundary, not publication or access control. Invalid fields cannot add remote images or operations. */
export function normalizeBusinessProfile(
  input: unknown,
  fallbackId: BusinessId,
): BusinessProfile {
  const id = isBusinessId(fallbackId) ? fallbackId : "photo";
  const base = freshSeed(id);
  const obj = record(input);
  const rawPhotos = own(obj, "photos");
  const rawCatalog = own(obj, "catalog");
  const photos: ProfilePhoto[] = [];
  const photoIds = new Set<string>();
  let totalPhotoLength = 0;
  if (Array.isArray(rawPhotos)) {
    for (const value of rawPhotos) {
      const photo = validPhoto(value);
      if (
        !photo ||
        photoIds.has(photo.id) ||
        photos.length >= 6 ||
        totalPhotoLength + photo.src.length > MAX_PROFILE_PHOTOS_LENGTH
      )
        continue;
      photos.push(photo);
      photoIds.add(photo.id);
      totalPhotoLength += photo.src.length;
    }
  }
  const catalog: CatalogItem[] = [];
  const catalogIds = new Set<string>();
  if (Array.isArray(rawCatalog)) {
    for (const value of rawCatalog) {
      const item = validCatalogItem(value);
      if (!item || catalogIds.has(item.id) || catalog.length >= 12) continue;
      catalog.push(item);
      catalogIds.add(item.id);
    }
  }
  return {
    id,
    name: text(own(obj, "name"), 80, base.name) || base.name,
    city: text(own(obj, "city"), 80, base.city),
    category: text(own(obj, "category"), 80, base.category) || base.category,
    bio: text(own(obj, "bio"), 500, base.bio),
    photos: Array.isArray(rawPhotos) ? photos : base.photos,
    catalog: Array.isArray(rawCatalog) ? catalog : base.catalog,
  };
}

export function loadBusinessProfile(id: BusinessId): BusinessProfile {
  const safeId = isBusinessId(id) ? id : "photo";
  if (typeof window === "undefined") return freshSeed(safeId);
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_PREFIX + safeId);
    return normalizeBusinessProfile(
      raw ? (JSON.parse(raw) as unknown) : null,
      safeId,
    );
  } catch {
    return freshSeed(safeId);
  }
}

function notify(name: string) {
  // Real browsers expose both APIs. Tests and restricted runtimes can omit events.
  try {
    window.dispatchEvent(new Event(name));
  } catch {
    /* Storage remains the source of truth. */
  }
}

export function saveBusinessProfile(profile: BusinessProfile): boolean {
  if (typeof window === "undefined" || !isBusinessId(profile.id)) return false;
  try {
    const normalized = normalizeBusinessProfile(profile, profile.id);
    window.localStorage.setItem(
      PROFILE_STORAGE_PREFIX + profile.id,
      JSON.stringify(normalized),
    );
    notify(DEMO_PROFILE_EVENT);
    return true;
  } catch {
    return false;
  }
}

export function getBusinessIdForSector(sectorId: string): BusinessId {
  return sectorId === "beauty" ||
    sectorId === "bakery" ||
    sectorId === "repairs"
    ? sectorId
    : "photo";
}

export function profileFromConfig(config: DemoConfig): BusinessProfile {
  const id = getBusinessIdForSector(config.sectorId);
  const profile = loadBusinessProfile(id);
  return {
    ...profile,
    name: text(config.name, 80, profile.name) || profile.name,
    city: text(config.city, 80, profile.city),
    category: sectorById(config.sectorId).label,
  };
}

export function validateRequestDate(
  value: string,
  today: Date = new Date(),
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(today.getTime()))
    return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return false;
  const midnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return date >= midnight;
}

function storedRequest(value: unknown): DemoRequest | null {
  const input = record(value);
  const id = identifier(own(input, "id"));
  const businessId = own(input, "businessId");
  const itemId = identifier(own(input, "itemId"));
  const date = own(input, "date");
  const time = own(input, "time");
  const createdAt = own(input, "createdAt");
  const businessName = text(own(input, "businessName"), 80);
  const itemTitle = text(own(input, "itemTitle"), 80);
  if (
    !id ||
    !isBusinessId(businessId) ||
    !itemId ||
    !businessName ||
    !itemTitle ||
    typeof date !== "string" ||
    !validateRequestDate(date, new Date(1000, 0, 1)) ||
    typeof time !== "string" ||
    !(DEMO_TIME_SLOTS as readonly string[]).includes(time) ||
    typeof createdAt !== "string" ||
    !Number.isFinite(Date.parse(createdAt)) ||
    own(input, "status") !== "demo"
  )
    return null;
  return {
    id,
    businessId,
    businessName,
    itemId,
    itemTitle,
    date,
    time,
    notes: text(own(input, "notes"), 500),
    createdAt,
    status: "demo",
  };
}

export function getDemoRequests(): DemoRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REQUEST_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const ids = new Set<string>();
    const requests: DemoRequest[] = [];
    for (const value of parsed) {
      const request = storedRequest(value);
      if (!request || ids.has(request.id) || requests.length >= 30) continue;
      requests.push(request);
      ids.add(request.id);
    }
    return requests;
  } catch {
    return [];
  }
}

/** Records a local example request only. No slot is held and nothing is sent to a business. */
export function createDemoRequest(input: DemoRequestInput): DemoRequestResult {
  if (!isBusinessId(input.businessId))
    return { ok: false, error: "Ese negocio de ejemplo no está disponible." };
  const profile = loadBusinessProfile(input.businessId);
  const item = profile.catalog.find((entry) => entry.id === input.itemId);
  if (!item || item.kind !== "service" || !item.bookable)
    return {
      ok: false,
      error:
        "Selecciona un servicio que permita preparar una solicitud de ejemplo.",
    };
  if (!validateRequestDate(input.date))
    return { ok: false, error: "Elige hoy o una fecha futura válida." };
  if (!(DEMO_TIME_SLOTS as readonly string[]).includes(input.time))
    return { ok: false, error: "Elige uno de los horarios de ejemplo." };
  if (typeof window === "undefined")
    return {
      ok: false,
      error:
        "Esta solicitud de ejemplo necesita el almacenamiento de tu navegador.",
    };
  const now = new Date();
  const id =
    createDemoId();
  const request: DemoRequest = {
    id,
    businessId: profile.id,
    businessName: profile.name,
    itemId: item.id,
    itemTitle: item.title,
    date: input.date,
    time: input.time,
    notes: text(input.notes, 500),
    createdAt: now.toISOString(),
    status: "demo",
  };
  try {
    const requests = [request, ...getDemoRequests()].slice(0, 30);
    window.localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(requests));
    notify(DEMO_REQUEST_EVENT);
    return { ok: true, request };
  } catch {
    return {
      ok: false,
      error:
        "No hemos podido guardar el ejemplo. El navegador no permite usar el almacenamiento local.",
    };
  }
}
