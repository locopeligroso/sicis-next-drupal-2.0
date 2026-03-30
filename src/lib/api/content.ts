import { cache } from 'react';
import { apiGet } from './client';

// ── Public shape ─────────────────────────────────────────────────────────────

/**
 * Raw content entity returned by the content/{nid} endpoint.
 * Returned as-is — normalization deferred until field shape is finalised.
 */
export interface ContentEntity {
  nid: string;
  type: string;
  [key: string]: unknown;
}

// ── Fetcher ───────────────────────────────────────────────────────────────────

/**
 * Fetches a single content entity by NID.
 *
 * Endpoint: `/{locale}/api/v1/content/{nid}`
 *
 * The endpoint returns an array with a single element — this function unwraps it.
 * Returns null when the entity is not found or the request fails.
 *
 * Revalidate: 300s (editorial content)
 */
export const fetchContent = cache(
  async (nid: number, locale: string): Promise<ContentEntity | null> => {
    const result = await apiGet<ContentEntity[]>(
      `/${locale}/content/${nid}`,
      {},
      300,
    );
    if (!result || result.length === 0) return null;
    return result[0];
  },
);
