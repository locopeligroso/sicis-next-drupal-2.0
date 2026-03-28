'use server';

import { getTranslatedPath as _getTranslatedPath } from '@/lib/api/translate-path';
import { resolvePath } from '@/lib/api/resolve-path';
import { toDrupalLocale } from '@/i18n/config';

/**
 * Server Action wrapper for getTranslatedPath.
 *
 * Tries translate-path first. If translate-path is unavailable (returns null),
 * falls back to resolve-path which includes aliases for all locales.
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

  // Try translate-path first (legacy endpoint)
  const c2Result = await _getTranslatedPath(
    decodedPath,
    drupalCurrentLocale,
    drupalTargetLocale,
  );
  if (c2Result) {
    // translate-path returns a path with the Drupal locale prefix (e.g. /en/mosaic/...).
    // If targetLocale differs from drupalTargetLocale (e.g. us vs en),
    // replace the Drupal locale prefix with the actual Next.js locale.
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
  const resolved = await resolvePath(decodedPath, currentLocale);
  if (resolved?.aliases?.[targetLocale]) {
    const result = `/${targetLocale}${resolved.aliases[targetLocale]}`;
    return result;
  }

  return null;
}
