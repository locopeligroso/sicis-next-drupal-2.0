import { DRUPAL_BASE_URL } from '@/lib/drupal/config';
import { toDrupalLocale } from '@/i18n/config';

/**
 * Drupal REST endpoints require locale prefix BEFORE /api/v1:
 *   https://drupal.example.com/{locale}/api/v1/{endpoint}
 *
 * Callers pass paths like `/{locale}/entity` or `/{locale}/products/prodotto_mosaico`.
 * This function inserts `/api/v1` after the locale prefix.
 */
export async function apiGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  revalidate: number = 1800,
): Promise<T | null> {
  // path comes in as "/{locale}/endpoint" — insert /api/v1 after locale
  // e.g. "/it/entity" → "/it/api/v1/entity"
  const pathWithApi = path.replace(
    /^\/([a-z]{2})\//,
    (_match, loc: string) => `/${toDrupalLocale(loc)}/api/v1/`,
  );
  const url = new URL(`${DRUPAL_BASE_URL}${pathWithApi}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate },
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(30000), // 30s timeout — accommodates cold Drupal views cache (first request can take 20-30s)
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      console.error(
        `API error: ${res.status} ${res.statusText} for ${url.pathname}`,
      );
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`API fetch failed for ${url.pathname}:`, error);
    return null;
  }
}

/**
 * Strip domain from Drupal path URLs.
 * Drupal Views return full URLs like "https://www.sicis-stage.com/it/mosaico/..."
 * We need just the path: "/it/mosaico/..."
 */
export function stripDomain(urlOrPath: string | null): string | null {
  if (!urlOrPath) return null;
  try {
    const parsed = new URL(urlOrPath);
    let pathname = parsed.pathname;
    // Strip Drupal base path (e.g. /www.sicis.com_aiweb/httpdocs)
    const drupalBasePath = new URL(DRUPAL_BASE_URL).pathname.replace(/\/$/, '');
    if (drupalBasePath && pathname.startsWith(drupalBasePath)) {
      pathname = pathname.slice(drupalBasePath.length) || '/';
    }
    return pathname;
  } catch {
    // Already a path, not a full URL
    return urlOrPath;
  }
}

/**
 * Normalize empty strings to null (Drupal returns "" for empty image fields)
 */
export function emptyToNull(value: string | null | undefined): string | null {
  if (!value || value === '') return null;
  return value;
}

/**
 * Strip locale prefix from a path.
 * Drupal paths include locale: "/it/ambienti/arredo-bagno"
 * Legacy components prepend locale themselves, so we need: "/ambienti/arredo-bagno"
 */
export function stripLocalePrefix(path: string | null): string | null {
  if (!path) return null;
  // Remove leading /{2-letter-locale}/ prefix
  return path.replace(/^\/[a-z]{2}\//, '/');
}

/**
 * Unified image URL resolver — handles the 4 patterns present in the Drupal data layer:
 *
 *   1. Direct string  — emptyToNull(field_immagine)                  (most fetchers)
 *   2. uri.url object — getDrupalImageUrl() shape from entity endpoint (ProdottoVetrite)
 *   3. url object     — { url: "..." } flat shape                     (edge cases)
 *   4. Anything else  — returns null
 *
 * This is additive. Existing callers are not changed yet.
 */
export function resolveImageUrl(raw: unknown): string | null {
  if (raw == null) return null;

  // Pattern 1: direct string
  if (typeof raw === 'string') return emptyToNull(raw);

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;

    // Pattern 2: { uri: { url: "..." } }  — Drupal file--file relationship
    const uri = obj.uri;
    if (uri != null && typeof uri === 'object') {
      const uriUrl = (uri as Record<string, unknown>).url;
      if (typeof uriUrl === 'string') return emptyToNull(uriUrl);
    }

    // Pattern 3: { url: "..." }  — flat object variant (also covers new { url, width, height })
    if (typeof obj.url === 'string') return emptyToNull(obj.url);
  }

  return null;
}

/**
 * Resolved image with optional dimensions.
 * When Drupal returns the new { url, width, height } format, all three are populated.
 * When it returns the legacy string format, width and height are null.
 */
export interface ResolvedImage {
  url: string;
  width: number | null;
  height: number | null;
}

/**
 * Resolve a single Drupal image field to { url, width, height }.
 * Handles both legacy string format and new { url, width, height } object format.
 * Returns null when the field is empty or not recognisable as an image.
 */
export function resolveImage(raw: unknown): ResolvedImage | null {
  if (raw == null) return null;

  // Legacy: plain string URL
  if (typeof raw === 'string') {
    const url = emptyToNull(raw);
    return url ? { url, width: null, height: null } : null;
  }

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;

    // Legacy object: { uri: { url: string } }  — check FIRST to avoid
    // short-circuiting on empty obj.url when uri.url is valid
    const uri = obj.uri;
    if (uri != null && typeof uri === 'object') {
      const uriUrl = (uri as Record<string, unknown>).url;
      if (typeof uriUrl === 'string') {
        const url = emptyToNull(uriUrl);
        return url ? { url, width: null, height: null } : null;
      }
    }

    // New Freddi format: { url: string, width: number, height: number }
    if (typeof obj.url === 'string') {
      const url = emptyToNull(obj.url);
      if (!url) return null;
      const width = typeof obj.width === 'number' ? obj.width : null;
      const height = typeof obj.height === 'number' ? obj.height : null;
      return { url, width, height };
    }
  }

  return null;
}

/**
 * Resolve an array of Drupal image fields.
 * Filters out any entries that cannot be resolved.
 */
export function resolveImageArray(raw: unknown): ResolvedImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: unknown) => resolveImage(item))
    .filter((img): img is ResolvedImage => img !== null);
}
