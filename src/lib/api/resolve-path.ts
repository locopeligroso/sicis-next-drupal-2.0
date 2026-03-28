import { cache } from 'react';
import { apiGet } from './client';
import { locales, toDrupalLocale } from '@/i18n/config';
import type { ResolvePathResponse } from './types';

/**
 * Resolves a Drupal path alias to entity metadata (NID, type, bundle).
 *
 * resolve-path endpoint: `/{locale}/api/v1/resolve-path?path={alias}`
 *
 * This is the foundational routing endpoint — every page render starts here.
 * It replaces entity's routing function (path → entity identification) without
 * fetching the full entity data. The NID returned is then used to call
 * type-specific data endpoints (e.g. mosaic-product/{nid}).
 *
 * @param path   - Drupal path alias WITHOUT locale prefix (e.g. `/mosaico/pluma/01-bora`)
 * @param locale - Active locale code (e.g. `'it'`, `'en'`)
 * @returns ResolvePathResponse with nid, type, bundle, locale — or `null` if path not found.
 */
export const resolvePath = cache(
  async (path: string, locale: string): Promise<ResolvePathResponse | null> => {
    const data = await apiGet<ResolvePathResponse>(
      `/${locale}/resolve-path`,
      { path },
      3600, // Path aliases rarely change
    );

    if (!data) return null;

    // Expand aliases for locales that alias to a Drupal locale (e.g. us → en).
    // Drupal has no 'us' locale, so aliases will never include a 'us' key.
    // Mirror the Drupal locale's alias so callers can look up by Next.js locale.
    if (data.aliases) {
      for (const loc of locales) {
        const drupalLoc = toDrupalLocale(loc);
        if (
          drupalLoc !== loc &&
          data.aliases[drupalLoc] &&
          !data.aliases[loc]
        ) {
          data.aliases[loc] = data.aliases[drupalLoc];
        }
      }
    }

    return data;
  },
);
