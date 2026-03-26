import { cache } from 'react';
import { apiGet } from './client';
import type { ResolvePathResponse } from './types';

/**
 * Resolves a Drupal path alias to entity metadata (NID, type, bundle).
 *
 * R1 endpoint: `/{locale}/api/v1/resolve-path?path={alias}`
 *
 * This is the foundational routing endpoint — every page render starts here.
 * It replaces C1's routing function (path → entity identification) without
 * fetching the full entity data. The NID returned is then used to call
 * type-specific data endpoints (e.g. mosaic-product/{nid}).
 *
 * @param path   - Drupal path alias WITHOUT locale prefix (e.g. `/mosaico/pluma/01-bora`)
 * @param locale - Active locale code (e.g. `'it'`, `'en'`)
 * @returns ResolvePathResponse with nid, type, bundle, locale — or `null` if path not found.
 */
export const resolvePath = cache(
  async (path: string, locale: string): Promise<ResolvePathResponse | null> => {
    return apiGet<ResolvePathResponse>(
      `/${locale}/resolve-path`,
      { path },
      3600, // Path aliases rarely change
    );
  },
);
