import {
  isModuleId,
  isPreviewModule,
  sectorById,
  suggestedPreviewModules,
  SECTORS,
  type ModuleId,
} from "./catalog";

export type BusinessMode = "local" | "mobile" | "online" | "hybrid";
export type BusinessEntityType = "self_employed" | "company" | "team";
export type BusinessOffering = "services" | "products" | "both";
export type DemoAvailability = {
  days: number[];
  opens: string;
  closes: string;
};
export type DemoConfig = {
  name: string;
  city: string;
  sectorId: string;
  mode: BusinessMode;
  modules: ModuleId[];
  publicListing: boolean;
  entityType?: BusinessEntityType;
  additionalSectorIds?: string[];
  offering?: BusinessOffering;
  coverage?: string;
  availability?: DemoAvailability;
};

export const DEMO_STORAGE_KEY = "nexo-demo-business-v1";
export const DEFAULT_CONFIG: DemoConfig = {
  name: "Lumen Studio",
  city: "Barcelona",
  sectorId: "photo",
  mode: "local",
  modules: suggestedPreviewModules("photo"),
  publicListing: false,
  entityType: "self_employed",
  additionalSectorIds: [],
  offering: "services",
  coverage: "",
  availability: { days: [1, 2, 3, 4, 5], opens: "09:00", closes: "18:00" },
};

function ownValue(record: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(record, key)
    ? record[key]
    : undefined;
}

function normalizedText(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim().slice(0, 80) : fallback;
}

/**
 * Frontera de validación para datos locales no fiables, no autorización.
 * Cada llamada devuelve una configuración nueva, también al usar los valores base.
 */
export function normalizeDemoConfig(input: unknown): DemoConfig {
  const record =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const rawSector = ownValue(record, "sectorId");
  const sectorId = sectorById(
    typeof rawSector === "string" ? rawSector : DEFAULT_CONFIG.sectorId,
  ).id;
  const rawMode = ownValue(record, "mode");
  const mode =
    rawMode === "mobile" || rawMode === "online" || rawMode === "hybrid"
      ? rawMode
      : "local";
  const rawModules = ownValue(record, "modules");
  const candidates = Array.isArray(rawModules)
    ? rawModules
    : suggestedPreviewModules(sectorId);
  const modules = [
    ...new Set<ModuleId>([
      "customers",
      ...candidates.filter(isModuleId).filter(isPreviewModule),
    ]),
  ];
  const rawEntity = ownValue(record, "entityType");
  const rawOffering = ownValue(record, "offering");
  const rawAdditional = ownValue(record, "additionalSectorIds");
  const additionalSectorIds = Array.isArray(rawAdditional)
    ? [
        ...new Set(
          rawAdditional.filter(
            (value): value is string =>
              typeof value === "string" &&
              value !== sectorId &&
              SECTORS.some((sector) => sector.id === value),
          ),
        ),
      ].slice(0, 4)
    : [];
  const rawCoverage = ownValue(record, "coverage");
  const rawAvailability = ownValue(record, "availability");
  const availability =
    rawAvailability &&
    typeof rawAvailability === "object" &&
    !Array.isArray(rawAvailability)
      ? (rawAvailability as Record<string, unknown>)
      : {};
  const rawDays = ownValue(availability, "days");
  const days = Array.isArray(rawDays)
    ? [
        ...new Set(
          rawDays.filter(
            (value): value is number =>
              typeof value === "number" &&
              Number.isInteger(value) &&
              value >= 1 &&
              value <= 7,
          ),
        ),
      ].sort((a, b) => a - b)
    : [1, 2, 3, 4, 5];
  const time = (value: unknown, fallback: string) =>
    typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
      ? value
      : fallback;
  const opens = time(ownValue(availability, "opens"), "09:00");
  const proposedClose = time(ownValue(availability, "closes"), "18:00");
  // This is a same-day illustrative schedule, never a live availability engine.
  const scheduleValid = opens < proposedClose;

  return {
    name:
      normalizedText(ownValue(record, "name"), DEFAULT_CONFIG.name) ||
      DEFAULT_CONFIG.name,
    city: normalizedText(ownValue(record, "city"), DEFAULT_CONFIG.city),
    sectorId,
    mode,
    modules,
    publicListing: ownValue(record, "publicListing") === true,
    entityType:
      rawEntity === "company" || rawEntity === "team"
        ? rawEntity
        : "self_employed",
    additionalSectorIds,
    offering:
      rawOffering === "products" || rawOffering === "both"
        ? rawOffering
        : "services",
    coverage:
      typeof rawCoverage === "string" ? rawCoverage.trim().slice(0, 160) : "",
    availability: {
      days,
      opens: scheduleValid ? opens : "09:00",
      closes: scheduleValid ? proposedClose : "18:00",
    },
  };
}

/** Solo demostración UI: localStorage NO es una base de datos ni un sistema seguro. */
export function loadDemoConfig(): DemoConfig {
  if (typeof window === "undefined") return normalizeDemoConfig(null);
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    return normalizeDemoConfig(raw ? (JSON.parse(raw) as unknown) : null);
  } catch {
    // Navegación privada, almacenamiento bloqueado o JSON corrupto: demo utilizable.
    return normalizeDemoConfig(null);
  }
}

/** No envía datos. Devuelve false cuando el navegador impide guardar la demo. */
export function saveDemoConfig(config: DemoConfig): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify(normalizeDemoConfig(config)),
    );
    return true;
  } catch {
    return false;
  }
}
