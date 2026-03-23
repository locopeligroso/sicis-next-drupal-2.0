import { DRUPAL_BASE_URL } from '@/lib/drupal/config';

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
  revalidate: number = 300,
): Promise<T | null> {
  // path comes in as "/{locale}/endpoint" — insert /api/v1 after locale
  // e.g. "/it/entity" → "/it/api/v1/entity"
  const pathWithApi = path.replace(/^\/([a-z]{2})\//, '/$1/api/v1/');
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
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      console.error(`API error: ${res.status} ${res.statusText} for ${url.pathname}`);
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
    return parsed.pathname;
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
