import { cache } from 'react';
import { apiGet, stripDomain, emptyToNull } from './client';
import type { FilterOption } from '@/domain/filters/registry';
import { FILTER_REGISTRY, SLUG_OVERRIDES } from '@/domain/filters/registry';

// ── Raw REST response shapes ─────────────────────────────────────────────

/** taxonomy endpoint response item — no `path` or `slug` field; slug derived from `name` */
interface TaxonomyItem {
  id: string;
  name: string;
  imageUrl: string;
  weight: string; // Drupal returns weight as string
}

/** category-options endpoint response item */
interface CategoryOptionItem {
  id: string;
  name: string;
  path: string;
  imageUrl: string;
  parentId?: string | null;
  parentPath?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

// Reverse lookup: term name → slug (built once from SLUG_OVERRIDES)
// e.g. "Colibrì" → "colibri", "Red / Orange" → "red-orange"
const NAME_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_OVERRIDES).map(([slug, name]) => [name, slug]),
);

/**
 * Derive a slug from a Drupal path URL or path string.
 * Extracts the last segment after stripping the domain.
 * Falls back to SLUG_OVERRIDES reverse lookup, then basic slugify.
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
  // Check reverse SLUG_OVERRIDES (handles accents, slashes, capitalisation)
  if (NAME_TO_SLUG[name]) return NAME_TO_SLUG[name];
  // Fallback: slugify from name (NFC-normalized, preserves accented chars)
  return name
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u00C0-\u024F-]/g, '');
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Fetches all terms for a given taxonomy vocabulary via the taxonomy endpoint.
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
      slug: deriveSlug(null, item.name),
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
 * Converts a category-options CategoryOptionItem to a FilterOption, determining parent vs child
 * using parentPath depth (1 segment after locale = root, 2+ = child).
 * Children get `parentId` set to the ID of their immediate parent in the items list.
 */
function toFilterOption(
  item: CategoryOptionItem,
  allItems: CategoryOptionItem[],
): FilterOption {
  const imageUrl = emptyToNull(item.imageUrl);

  let resolvedParentId: string | undefined;
  if (item.parentPath) {
    const stripped = stripDomain(item.parentPath);
    const withoutLocale = stripped?.replace(/^\/[a-z]{2}\//, '/') ?? '';
    const segments = withoutLocale.split('/').filter(Boolean);
    // 1 segment (e.g. ["arredo"]) = root; 2+ segments = child
    if (segments.length > 1) {
      // Find the parent in the items list by matching parentId
      const parent = allItems.find((p) => p.id === item.parentId);
      if (parent) {
        resolvedParentId = parent.id;
      }
    }
  }

  return {
    id: item.id,
    slug: deriveSlug(item.path, item.name),
    label: item.name,
    ...(resolvedParentId ? { parentId: resolvedParentId } : {}),
    ...(imageUrl ? { imageUrl } : {}),
  } satisfies FilterOption;
}

/**
 * Fetches category options (node--categoria) for a product type via the category-options endpoint.
 *
 * Also fetches category-options/categoria (all node--categoria) to include hub categories that
 * have no direct products (e.g. "Complementi e accessori", "Complementi notte"
 * under Arredo). These hubs are direct children of the product type's root
 * categoria and must appear in the listing even without products.
 *
 * @param productType - Drupal content type (e.g. 'prodotto_arredo', 'prodotto_illuminazione')
 * @param locale - Language code
 */
export async function fetchCategoryOptions(
  productType: string,
  locale: string,
): Promise<FilterOption[]> {
  // Fetch both endpoints in parallel:
  // - category-options/productType: categories with products for this content type
  // - category-options/categoria: all node--categoria (includes hubs without products)
  const [productResult, allResult] = await Promise.all([
    apiGet<{ items: CategoryOptionItem[] }>(
      `/${locale}/category-options/${productType}`,
      {},
      3600,
    ),
    apiGet<{ items: CategoryOptionItem[] }>(
      `/${locale}/category-options/categoria`,
      {},
      3600,
    ),
  ]);

  const productItems = productResult?.items ?? [];
  if (productItems.length === 0) return [];

  // Find the root categoria for this product type by looking at the
  // most common top-level parentId in the product items.
  // Root items have a 1-segment parentPath (e.g. /it/arredo); their parentId
  // points to the root categoria (e.g. 3522 = "Arredo").
  const rootParentIds = new Set<string>();
  for (const item of productItems) {
    if (item.parentPath) {
      const stripped = stripDomain(item.parentPath);
      const withoutLocale = stripped?.replace(/^\/[a-z]{2}\//, '/') ?? '';
      const segments = withoutLocale.split('/').filter(Boolean);
      if (segments.length === 1 && item.parentId) {
        rootParentIds.add(item.parentId);
      }
    }
  }

  // From category-options/categoria, find hub categories that are direct children of the root
  // but missing from the product-specific endpoint (no direct products).
  const productIds = new Set(productItems.map((i) => i.id));
  const hubItems = (allResult?.items ?? []).filter(
    (item) =>
      item.parentId != null &&
      rootParentIds.has(item.parentId) &&
      !productIds.has(item.id),
  );

  // Merge: product categories + hub categories
  const merged = [...productItems, ...hubItems];

  return merged.map((item) => toFilterOption(item, merged));
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
          options = await fetchFilterOptions(
            filterConfig.taxonomyType,
            locale,
            {
              includeImage,
            },
          );
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
