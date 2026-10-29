import { sectorById, suggestedPreviewModules } from "./catalog";
import {
  DEFAULT_CONFIG,
  loadDemoConfig,
  normalizeDemoConfig,
  saveDemoConfig,
  type DemoConfig,
} from "./demo";

export type DemoExperience = "business" | "customer";
export type OrganizationRole = "owner" | "admin" | "employee";
export type CustomerProfile = {
  name: string;
  city: string;
  interests: string[];
};
export const EXPERIENCE_STORAGE_KEY = "autonoservice-experience-v1";
export const CUSTOMER_PROFILE_KEY = "autonoservice-customer-v1";
export const EXPERIENCE_EVENT = "autonoservice-experience-change";
export const ORGANIZATION_EVENT = "autonoservice-organization-change";
const ACTIVE_ORGANIZATION_KEY = "autonoservice-active-organization-v1";
const ORGANIZATION_CONFIG_PREFIX = "autonoservice-organization-config-v1-";
export const DEMO_IDENTITY = {
  id: "demo-user-alex",
  authentication: "not-connected",
} as const;
export const DEMO_ORGANIZATIONS = [
  { id: "photo", name: "Lumen Studio", sectorId: "photo", role: "owner" },
  { id: "beauty", name: "Barbería Norte", sectorId: "beauty", role: "owner" },
  { id: "bakery", name: "Dulce Taller", sectorId: "bakery", role: "admin" },
  {
    id: "repairs",
    name: "Taller Central",
    sectorId: "repairs",
    role: "employee",
  },
] as const;
export type DemoOrganizationId = (typeof DEMO_ORGANIZATIONS)[number]["id"];
const record = (input: unknown): Record<string, unknown> =>
  input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
const own = (object: Record<string, unknown>, key: string) =>
  Object.hasOwn(object, key) ? object[key] : undefined;
const text = (input: unknown, max: number, fallback: string) =>
  typeof input === "string" ? input.trim().slice(0, max) : fallback;

export function normalizeCustomerProfile(input: unknown): CustomerProfile {
  const value = record(input),
    interests = own(value, "interests");
  return {
    name: text(own(value, "name"), 80, "Alex López") || "Alex López",
    city: text(own(value, "city"), 80, "Barcelona"),
    interests: Array.isArray(interests)
      ? [
          ...new Set(
            interests
              .filter((entry): entry is string => typeof entry === "string")
              .map((entry) => entry.trim().slice(0, 50))
              .filter(Boolean),
          ),
        ].slice(0, 8)
      : [],
  };
}
function read(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as unknown) : null;
  } catch {
    return null;
  }
}
function save(key: string, value: unknown, event: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(event));
    return true;
  } catch {
    return false;
  }
}
export function loadCustomerProfile(): CustomerProfile {
  return normalizeCustomerProfile(read(CUSTOMER_PROFILE_KEY));
}
export function saveCustomerProfile(profile: CustomerProfile): boolean {
  return save(
    CUSTOMER_PROFILE_KEY,
    normalizeCustomerProfile(profile),
    EXPERIENCE_EVENT,
  );
}
export function loadDemoExperience(): DemoExperience {
  return read(EXPERIENCE_STORAGE_KEY) === "customer" ? "customer" : "business";
}
export function setDemoExperience(mode: DemoExperience): boolean {
  if (mode !== "business" && mode !== "customer") return false;
  return save(EXPERIENCE_STORAGE_KEY, mode, EXPERIENCE_EVENT);
}
export function isDemoOrganizationId(id: unknown): id is DemoOrganizationId {
  return DEMO_ORGANIZATIONS.some((organization) => organization.id === id);
}
export function loadActiveOrganization(): DemoOrganizationId {
  const stored = read(ACTIVE_ORGANIZATION_KEY);
  if (isDemoOrganizationId(stored)) return stored;
  const sector = loadDemoConfig().sectorId;
  return isDemoOrganizationId(sector) ? sector : "photo";
}
/** Demo context selection only. A membership must be authorized by the server in Hito 1. */
export function switchDemoOrganization(id: DemoOrganizationId): boolean {
  if (!isDemoOrganizationId(id) || typeof window === "undefined") return false;
  const currentId = loadActiveOrganization();
  const previous = loadDemoConfig();
  const organization = DEMO_ORGANIZATIONS.find((value) => value.id === id)!;
  const archived = read(ORGANIZATION_CONFIG_PREFIX + id);
  const next = normalizeDemoConfig(
    archived ?? {
      ...DEFAULT_CONFIG,
      name: organization.name,
      sectorId: sectorById(organization.sectorId).id,
      modules: suggestedPreviewModules(organization.sectorId),
    },
  );
  try {
    window.localStorage.setItem(
      ORGANIZATION_CONFIG_PREFIX + currentId,
      JSON.stringify(previous),
    );
    if (id !== currentId && !saveDemoConfig(next)) return false;
    window.localStorage.setItem(ACTIVE_ORGANIZATION_KEY, JSON.stringify(id));
    window.dispatchEvent(new Event(ORGANIZATION_EVENT));
    return true;
  } catch {
    return false;
  }
}
