/**
 * Display order for real, public business profile content.
 * Omitted IDs are intentionally hidden. Unknown IDs are ignored so future
 * module changes never cause arbitrary markup to appear on public profiles.
 */
export const PROFILE_SECTIONS = [
  { id: "about", label: "Presentación" },
  { id: "services", label: "Servicios" },
  { id: "locations", label: "Sedes" },
  { id: "posts", label: "Publicaciones" },
  { id: "portfolio", label: "Portfolio" },
] as const;

export type ProfileSectionId = (typeof PROFILE_SECTIONS)[number]["id"];

export const DEFAULT_PROFILE_SECTIONS: ProfileSectionId[] =
  PROFILE_SECTIONS.map((section) => section.id);

const validIds = new Set<string>(DEFAULT_PROFILE_SECTIONS);

export function normalizeProfileSections(value: unknown): ProfileSectionId[] {
  // A missing value belongs to a legacy company and uses the original order.
  if (!Array.isArray(value)) return [...DEFAULT_PROFILE_SECTIONS];
  const result: ProfileSectionId[] = [];
  for (const item of value) {
    if (typeof item === "string" && validIds.has(item) && !result.includes(item as ProfileSectionId)) {
      result.push(item as ProfileSectionId);
    }
  }
  // An empty array is valid: the owner may hide every optional block.
  return result;
}

export function profileSectionPreset(category: string): ProfileSectionId[] {
  if (/foto|video|vídeo|creativ|diseñ|estudio|música|musica/i.test(category)) {
    return ["portfolio", "services", "posts", "about", "locations"];
  }
  if (/peluq|belleza|barber|estética|estetica|sal[oó]n/i.test(category)) {
    return ["services", "portfolio", "posts", "locations", "about"];
  }
  if (/restau|gastronom|cafeter|comida|bar\b|panad/i.test(category)) {
    return ["services", "posts", "locations", "portfolio", "about"];
  }
  return [...DEFAULT_PROFILE_SECTIONS];
}
