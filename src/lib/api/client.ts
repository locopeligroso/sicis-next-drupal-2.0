import { DRUPAL_BASE_URL } from '@/lib/drupal/config';

const API_BASE = `${DRUPAL_BASE_URL}/api/v1`;

export async function apiGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  revalidate: number = 300,
): Promise<T | null> {
  const url = new URL(`${API_BASE}${path}`);
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
