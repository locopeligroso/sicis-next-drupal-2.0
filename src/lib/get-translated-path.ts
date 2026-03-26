'use server';

import { getTranslatedPath as _getTranslatedPath } from '@/lib/api/translate-path';
import { resolvePath } from '@/lib/api/resolve-path';

/**
 * Server Action wrapper for getTranslatedPath.
 *
 * Tries C2 translate-path first. If C2 is unavailable (returns null),
 * falls back to R1 resolve-path which includes aliases for all locales.
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

  // Try C2 first (legacy endpoint)
  const c2Result = await _getTranslatedPath(
    decodedPath,
    currentLocale,
    targetLocale,
  );
  if (c2Result) {
    console.log(
      `[getTranslatedPath] C2 hit: ${decodedPath} (${currentLocale}→${targetLocale}) = ${c2Result}`,
    );
    return c2Result;
  }

  // Fallback: use R1 resolve-path aliases
  const resolved = await resolvePath(decodedPath, currentLocale);
  console.log(
    `[getTranslatedPath] R1 fallback: ${drupalPath} (${currentLocale}→${targetLocale}), resolved=${!!resolved}, aliases=${JSON.stringify(resolved?.aliases)}`,
  );
  if (resolved?.aliases?.[targetLocale]) {
    const result = `/${targetLocale}${resolved.aliases[targetLocale]}`;
    console.log(`[getTranslatedPath] R1 result: ${result}`);
    return result;
  }

  console.log(
    `[getTranslatedPath] FAILED: ${drupalPath} (${currentLocale}→${targetLocale})`,
  );
  return null;
}
