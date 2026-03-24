import { cache } from 'react';
import { apiGet, stripDomain, stripLocalePrefix, emptyToNull } from './client';
import type {
  PaginatedResponse,
  CategoryCard as RestCategoryCard,
  PageCard as RestPageCard,
} from './types';

// ── Legacy-compatible card types ────────────────────────────────────────────

/**
 * Legacy-compatible SubcategoryCard shape.
 * Matches `src/lib/drupal/subcategories.ts` → `SubcategoryCard`.
 */
export interface SubcategoryCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
}

export interface SubcategoriesResult {
  subcategories: SubcategoryCard[];
  total: number;
}

/**
 * Legacy-compatible PageCard shape.
 * Matches `src/lib/drupal/pages-by-category.ts` → `PageCard`.
 */
export interface PageCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
}

export interface PagesByCategoryResult {
  pages: PageCard[];
  total: number;
}

// ── V10: Subcategories ──────────────────────────────────────────────────────

/**
 * Fetches child node--categoria entities for a given parent categoria.
 * Drop-in replacement for the old JSON:API-based `fetchSubcategories`.
 *
 * Endpoint: `/{locale}/api/v1/subcategories/{parentId}`
 *
 * The REST Views endpoint expects a NID (integer), not UUID.
 * Callers must pass the NID (e.g. `node._nid` from C1 entity response).
 *
 * @param parentId - NID of the parent node--categoria entity
 * @param locale   - Active locale code
 */
export const fetchSubcategories = cache(
  async (parentId: string, locale = 'it'): Promise<SubcategoriesResult> => {
    const result = await apiGet<PaginatedResponse<RestCategoryCard>>(
      `/${locale}/subcategories/${parentId}`,
      {},
      300,
    );

    if (!result) return { subcategories: [], total: 0 };

    return {
      subcategories: result.items.map((item): SubcategoryCard => ({
        id: item.id,
        title: item.title,
        imageUrl: emptyToNull(item.imageUrl),
        path: stripLocalePrefix(stripDomain(item.path)),
      })),
      total: result.total,
    };
  },
);

// ── V11: Pages by Category ──────────────────────────────────────────────────

/**
 * Fetches published node--page entities filtered by field_categoria.
 * Drop-in replacement for the old JSON:API-based `fetchPagesByCategory`.
 *
 * Endpoint: `/{locale}/api/v1/pages-by-category/{parentId}`
 *
 * The REST Views endpoint expects a NID (integer), not UUID.
 * Callers must pass the NID (e.g. `node._nid` from C1 entity response).
 *
 * @param parentId - NID of the node--categoria entity to filter by
 * @param locale   - Active locale code
 * @param limit    - Max items per page
 * @param offset   - Pagination offset
 */
export const fetchPagesByCategory = cache(
  async (
    parentId: string,
    locale = 'it',
    limit = 48,
    offset = 0,
  ): Promise<PagesByCategoryResult> => {
    const page = Math.floor(offset / limit);
    const result = await apiGet<PaginatedResponse<RestPageCard>>(
      `/${locale}/pages-by-category/${parentId}`,
      { items_per_page: limit, page },
      300,
    );

    if (!result) return { pages: [], total: 0 };

    return {
      pages: result.items.map((item): PageCard => ({
        id: item.id,
        title: item.title,
        imageUrl: emptyToNull(item.imageUrl),
        path: stripLocalePrefix(stripDomain(item.path)),
      })),
      total: result.total,
    };
  },
);
