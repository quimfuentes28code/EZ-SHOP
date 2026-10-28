import {
  isModuleId,
  isPreviewModule,
  sectorById,
  suggestedPreviewModules,
  type ModuleId,
} from "./catalog";

export type BusinessMode = "local" | "mobile" | "online" | "hybrid";
export type DemoConfig = {
  name: string;
  city: string;
  sectorId: string;
  mode: BusinessMode;
  modules: ModuleId[];
  publicListing: boolean;
};

export const DEMO_STORAGE_KEY = "nexo-demo-business-v1";
export const DEFAULT_CONFIG: DemoConfig = {
  name: "Lumen Studio",
  city: "Barcelona",
  sectorId: "photo",
  mode: "local",
  modules: suggestedPreviewModules("photo"),
  publicListing: false,
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

  return {
    name:
      normalizedText(ownValue(record, "name"), DEFAULT_CONFIG.name) ||
      DEFAULT_CONFIG.name,
    city: normalizedText(ownValue(record, "city"), DEFAULT_CONFIG.city),
    sectorId,
    mode,
    modules,
    publicListing: ownValue(record, "publicListing") === true,
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
