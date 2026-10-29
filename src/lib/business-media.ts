import type { SupabaseClient } from "@supabase/supabase-js";

export const BUSINESS_MEDIA_BUCKET = "autonoservice-public-media";
export const BUSINESS_MEDIA_URL_TTL_SECONDS = 60;
const referencePrefix = `storage://${BUSINESS_MEDIA_BUCKET}/`;
const objectPath = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[^?#\\\u0000-\u001f]+$/i;
const validPath = (path: string) => objectPath.test(path) && !path.split('/').some(part => !part || part === '.' || part === '..');

/** Durable database reference. Signed URLs are only presentation values. */
export function businessMediaReference(path: string): string {
  if (!validPath(path)) throw new Error("Ruta de archivo no válida.");
  return referencePrefix + path;
}

/** Reads current references and the public URLs stored by previous versions. */
export function businessMediaPath(value: string): string | null {
  let path: string;
  if (value.startsWith(referencePrefix)) path = value.slice(referencePrefix.length);
  else {
    try {
      const url = new URL(value);
      if (!['https:', 'http:'].includes(url.protocol)) return null;
      const prefix = `/storage/v1/object/`;
      if (!url.pathname.startsWith(prefix)) return null;
      const segments = url.pathname.slice(prefix.length).split('/');
      if (!['public', 'sign', 'authenticated'].includes(segments[0]) || segments[1] !== BUSINESS_MEDIA_BUCKET) return null;
      path = decodeURIComponent(segments.slice(2).join('/'));
    } catch { return null; }
  }
  return validPath(path) ? path : null;
}

/** RLS decides which references may be signed, including published content. */
export async function resolveBusinessMediaUrls(
  db: Pick<SupabaseClient, "storage">,
  values: readonly string[],
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};
  const references = [...new Set(values.filter(Boolean))];
  const paths = [...new Set(references.map(businessMediaPath).filter((path): path is string => path !== null))];
  const resolved = new Map<string, string>();
  if (paths.length) {
    try {
      const { data, error } = await db.storage.from(BUSINESS_MEDIA_BUCKET).createSignedUrls(paths, BUSINESS_MEDIA_URL_TTL_SECONDS);
      if (!error) for (const file of data || []) {
        if (file.path && !file.error && file.signedUrl) resolved.set(file.path, file.signedUrl);
      }
    } catch { /* A network failure must never fall back to a permanent public URL. */ }
  }
  for (const value of references) {
    const path = businessMediaPath(value);
    if (path) urls[value] = resolved.get(path) || "";
    else {
      // Legacy external images remain supported; reject executable URL schemes.
      try { const url = new URL(value); urls[value] = url.protocol === 'https:' ? value : ""; }
      catch { urls[value] = ""; }
    }
  }
  return urls;
}
