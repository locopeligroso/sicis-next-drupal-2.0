'use server';

import { getTranslatedPath as _getTranslatedPath } from '@/lib/api/translate-path';
import { resolvePath } from '@/lib/api/resolve-path';
import { toDrupalLocale } from '@/i18n/config';
import { translateBasePath } from '@/domain/filters/registry';

/**
 * Server Action wrapper for getTranslatedPath.
 *
 * Fires C2 (translate-path) and R1 (resolve-path) in parallel to avoid
 * sequential timeout when C2 is unavailable. Prefers C2 when it returns a
 * result (canonical Drupal translation), falls back to R1 aliases, then to
 * translateBasePath for product listing URLs.
 * The 'use server' directive makes this callable from client components.
 */
export async function getTranslatedPath(
  drupalPath: string,
  currentLocale: string,
  targetLocale: string,
): Promise<string | null> {
  // Decode URL-encoded paths (e.g. %D0%BC%D0%BE%D0%B7... → мозаика)
  // Browser pathname arrives encoded; Drupal expects decoded UTF-8 aliases.
  const decodedPath = decodeURIComponent(drupalPath);

  // Map locales to Drupal equivalents for API calls (e.g. us → en)
  const drupalCurrentLocale = toDrupalLocale(currentLocale);
  const drupalTargetLocale = toDrupalLocale(targetLocale);

  // Fire C2 and R1 in parallel — C2 often times out (dead endpoint), so
  // running both concurrently means R1 wins without waiting for C2's timeout.
  const [c2Result, resolved] = await Promise.all([
    _getTranslatedPath(
      decodedPath,
      drupalCurrentLocale,
      drupalTargetLocale,
    ).catch(() => null),
    resolvePath(decodedPath, currentLocale).catch(() => null),
  ]);

  // Prefer C2 if available (canonical Drupal translation).
  // translate-path returns a path with the Drupal locale prefix (e.g. /en/mosaic/...).
  // If targetLocale differs from drupalTargetLocale (e.g. us vs en),
  // replace the Drupal locale prefix with the actual Next.js locale.
  if (c2Result) {
    const normalizedC2 =
      drupalTargetLocale !== targetLocale
        ? c2Result.replace(
            new RegExp(`^/${drupalTargetLocale}(/|$)`),
            `/${targetLocale}$1`,
          )
        : c2Result;
    return normalizedC2;
  }

  // Fallback: use resolve-path aliases
  if (resolved?.aliases?.[targetLocale]) {
    return `/${targetLocale}${resolved.aliases[targetLocale]}`;
  }

  // Second fallback: translate listing base paths via FILTER_REGISTRY
  // Handles product listing URLs (e.g. /lighting/table-lamps → /illuminazione/table-lamps)
  // when both C2 and R1 are unavailable or return no result.
  const translatedBase = translateBasePath(decodedPath, targetLocale);
  if (translatedBase !== decodedPath) {
    return `/${targetLocale}${translatedBase}`;
  }

  return null;
}
