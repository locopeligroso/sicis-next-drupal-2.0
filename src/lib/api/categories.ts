import { cache } from 'react';
import { apiGet, stripDomain, emptyToNull } from './client';
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
 * NOTE: The REST Views endpoint expects a NID (integer), not UUID.
 * Currently `Categoria.tsx` passes `node.id` which is the UUID from JSON:API
 * deserialization. This will be corrected in Task 7 (C1 migration) when
 * `node.id` becomes the NID. Until then, the endpoint may return empty results.
 *
 * @param parentId - ID of the parent node--categoria entity
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
        path: stripDomain(item.path),
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
 * NOTE: Same NID caveat as fetchSubcategories — see above.
 *
 * @param parentId - ID of the node--categoria entity to filter by
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
        path: stripDomain(item.path),
      })),
      total: result.total,
    };
  },
);
