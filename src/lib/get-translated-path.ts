'use server';

import { getTranslatedPath as _getTranslatedPath } from '@/lib/api/translate-path';

/**
 * Server Action wrapper for getTranslatedPath.
 * Delegates to lib/api/translate-path.ts (C2 REST endpoint) — single source of truth.
 * The 'use server' directive makes this callable from client components.
 */
export async function getTranslatedPath(
  drupalPath: string,
  currentLocale: string,
  targetLocale: string,
): Promise<string | null> {
  return _getTranslatedPath(drupalPath, currentLocale, targetLocale);
}
