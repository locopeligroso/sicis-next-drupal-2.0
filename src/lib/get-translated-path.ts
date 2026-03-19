'use server';

import { getTranslatedPath as _getTranslatedPath } from './drupal/translated-path';

/**
 * Server Action wrapper for getTranslatedPath.
 * Delegates to lib/drupal/translated-path.ts — single source of truth.
 * The 'use server' directive makes this callable from client components.
 */
export async function getTranslatedPath(
  drupalPath: string,
  currentLocale: string,
  targetLocale: string,
): Promise<string | null> {
  return _getTranslatedPath(drupalPath, currentLocale, targetLocale);
}
