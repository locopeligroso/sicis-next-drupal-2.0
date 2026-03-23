import { cache } from 'react';
import { apiGet, stripDomain, emptyToNull } from './client';
import type { FilterOption } from '@/domain/filters/registry';
import { FILTER_REGISTRY } from '@/domain/filters/registry';

// ── Raw REST response shapes ─────────────────────────────────────────────

/** V3 taxonomy endpoint response item (no `slug` field — derive from `path`) */
interface TaxonomyItem {
  id: string;
  name: string;
  path: string;
  imageUrl: string;
  weight: number;
}

/** V4 category-options endpoint response item */
interface CategoryOptionItem {
  id: string;
  name: string;
  path: string;
  imageUrl: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Derive a slug from a Drupal path URL or path string.
 * Extracts the last segment after stripping the domain.
 * Falls back to slugifying the name.
 */
function deriveSlug(path: string | null, name: string): string {
  if (path) {
    const stripped = stripDomain(path);
    if (stripped) {
      const segments = stripped.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      if (lastSegment) return decodeURIComponent(lastSegment);
    }
  }
  // Fallback: slugify from name
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Fetches all terms for a given taxonomy vocabulary via the REST V3 endpoint.
 * Returns FilterOption[] (domain shape) sorted by weight then name.
 *
 * @param taxonomyType - e.g. `"taxonomy_term--mosaico_collezioni"` — vocabulary extracted by splitting on `--`
 * @param locale - Language code (it, en, fr, de, es, ru)
 * @param options - Optional: includeImage preserved for caller compatibility (REST always returns imageUrl)
 */
export async function fetchFilterOptions(
  taxonomyType: string,
  locale: string,
  options?: { includeImage?: boolean },
): Promise<FilterOption[]> {
  // Extract vocabulary name: "taxonomy_term--mosaico_collezioni" → "mosaico_collezioni"
  const vocabulary = taxonomyType.split('--')[1];
  if (!vocabulary) {
    console.warn(`[fetchFilterOptions] Invalid taxonomyType: ${taxonomyType}`);
    return [];
  }

  const result = await apiGet<{ items: TaxonomyItem[] }>(
    `/${locale}/taxonomy/${vocabulary}`,
    {},
    3600,
  );

  if (!result?.items) return [];

  return result.items.map((item) => {
    const filterOption: FilterOption = {
      id: item.id,
      slug: deriveSlug(item.path, item.name),
      label: item.name,
    };

    // REST always includes imageUrl; only propagate if caller wants it and value is non-empty
    if (options?.includeImage) {
      const imageUrl = emptyToNull(item.imageUrl);
      if (imageUrl) {
        filterOption.imageUrl = imageUrl;
      }
    }

    return filterOption;
  });
}

/**
 * Fetches category options (node--categoria) for a product type via the REST V4 endpoint.
 * Replaces `fetchArredoCategoryOptions`.
 *
 * @param productType - Drupal content type (e.g. 'prodotto_arredo', 'prodotto_illuminazione')
 * @param locale - Language code
 */
export async function fetchCategoryOptions(
  productType: string,
  locale: string,
): Promise<FilterOption[]> {
  const result = await apiGet<{ items: CategoryOptionItem[] }>(
    `/${locale}/category-options/${productType}`,
    {},
    3600,
  );

  if (!result?.items) return [];

  return result.items
    .map((item) => {
      const imageUrl = emptyToNull(item.imageUrl);
      return {
        id: item.id,
        slug: deriveSlug(item.path, item.name),
        label: item.name,
        ...(imageUrl ? { imageUrl } : {}),
      } satisfies FilterOption;
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** @deprecated Alias for backward compatibility — use `fetchCategoryOptions` */
export const fetchArredoCategoryOptions = (
  locale: string,
  contentType = 'prodotto_arredo',
) => fetchCategoryOptions(contentType, locale);

/**
 * Fetches all filter options for every filter group of a given content type.
 * Runs all fetches in parallel with Promise.all.
 *
 * Returns Record<filterKey, FilterOption[]>
 */
export const fetchAllFilterOptions = cache(
  async (
    contentType: string,
    locale: string,
  ): Promise<Record<string, FilterOption[]>> => {
    const config = FILTER_REGISTRY[contentType];
    if (!config) return {};

    const entries = await Promise.all(
      Object.entries(config.filters).map(async ([filterKey, filterConfig]) => {
        let options: FilterOption[] = [];

        // Check if this filter needs images (from listing categoryGroups config)
        const categoryGroup = config.listing?.categoryGroups.find(
          (g) => g.filterKey === filterKey,
        );
        const includeImage = categoryGroup
          ? categoryGroup.hasImage || categoryGroup.hasColorSwatch
          : false;

        if (filterConfig.taxonomyType) {
          options = await fetchFilterOptions(filterConfig.taxonomyType, locale, {
            includeImage,
          });
        } else if (filterConfig.nodeType === 'node--categoria') {
          options = await fetchCategoryOptions(contentType, locale);
        }
        // filters without taxonomyType or nodeType (e.g. grout) → []
        return [filterKey, options] as [string, FilterOption[]];
      }),
    );

    return Object.fromEntries(entries);
  },
);
