import { MODULES, type ModuleId, sectorById } from "./catalog";

export type BusinessMode = "local" | "mobile" | "online" | "hybrid";
export type DemoConfig = {
  name: string;
  city: string;
  sectorId: string;
  mode: BusinessMode;
  modules: ModuleId[];
  publicListing: boolean;
};

const KEY = "nexo-demo-business-v1";
export const DEFAULT_CONFIG: DemoConfig = {
  name: "Lumen Studio",
  city: "Barcelona",
  sectorId: "photo",
  mode: "local",
  modules: [...sectorById("photo").suggested],
  publicListing: false,
};

/** Solo demostración UI: localStorage NO es una base de datos ni un sistema seguro. */
export function loadDemoConfig(): DemoConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_CONFIG;
    const obj = parsed as Partial<DemoConfig>;
    return {
      name: typeof obj.name === "string" ? obj.name.slice(0, 80) : DEFAULT_CONFIG.name,
      city: typeof obj.city === "string" ? obj.city.slice(0, 80) : DEFAULT_CONFIG.city,
      sectorId: typeof obj.sectorId === "string" ? sectorById(obj.sectorId).id : "photo",
      mode: obj.mode === "mobile" || obj.mode === "online" || obj.mode === "hybrid" ? obj.mode : "local",
      modules: Array.isArray(obj.modules) ? obj.modules.filter((m): m is ModuleId => typeof m === "string" && m in MODULES) : DEFAULT_CONFIG.modules,
      publicListing: obj.publicListing === true,
    };
  } catch { return DEFAULT_CONFIG; }
}
export function saveDemoConfig(config: DemoConfig) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(config));
}
