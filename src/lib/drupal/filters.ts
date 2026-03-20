// ════════════════════════════════════════════════════════════════════════════
// §9  Filter options functions
// ════════════════════════════════════════════════════════════════════════════

import { cache } from 'react';
import { DRUPAL_BASE_URL, DRUPAL_ORIGIN } from './config';
import type { FilterOption } from '@/domain/filters/registry';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import {
  buildJsonApiFilters,
  type FilterDefinition,
} from '@/domain/filters/search-params';

/**
 * Fetches all terms for a given taxonomy vocabulary in the given locale.
 * Returns FilterOption[] sorted by weight then name.
 */
export async function fetchFilterOptions(
  taxonomyType: string,
  locale: string,
  options?: { includeImage?: boolean },
): Promise<FilterOption[]> {
  const localePrefix = locale ? `/${locale}` : '';
  const url = new URL(
    `${DRUPAL_BASE_URL}${localePrefix}/jsonapi/${taxonomyType.replace('--', '/')}`,
  );
  url.searchParams.set('page[limit]', '200');

  if (options?.includeImage) {
    url.searchParams.set(`fields[${taxonomyType}]`, 'name,path,weight,field_immagine');
    url.searchParams.set('include', 'field_immagine');
  } else {
    url.searchParams.set(`fields[${taxonomyType}]`, 'name,path,weight');
  }

  url.searchParams.set('sort', 'weight,name');

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/vnd.api+json' },
      next: { revalidate: 3600 },
    } as RequestInit);

    if (!res.ok) {
      console.warn(
        `[fetchFilterOptions] HTTP ${res.status} for ${taxonomyType}`,
        { locale, url: url.toString() },
      );
      return [];
    }

    const json = await res.json();

    // Build a lookup map from included entities (for image resolution)
    const includedMap = new Map<string, Record<string, unknown>>();
    if (options?.includeImage && Array.isArray(json.included)) {
      for (const inc of json.included) {
        const incObj = inc as Record<string, unknown>;
        const key = `${incObj.type}--${incObj.id}`;
        includedMap.set(key, incObj);
      }
    }

    return (json.data ?? []).map((item: Record<string, unknown>) => {
      const attrs = item.attributes as Record<string, unknown>;
      const name = (attrs?.name as string) ?? '';
      const pathObj = attrs?.path as { alias?: string } | null;

      const filterOption: FilterOption = {
        id: item.id as string,
        slug: pathToSlug(pathObj?.alias ?? name),
        label: name,
      };

      // Extract image URL from included data if requested
      if (options?.includeImage) {
        const relationships = item.relationships as Record<string, unknown> | undefined;
        const fieldImmagine = relationships?.field_immagine as Record<string, unknown> | undefined;
        const imageData = fieldImmagine?.data as Record<string, unknown> | undefined;
        if (imageData?.type && imageData?.id) {
          const imageKey = `${imageData.type}--${imageData.id}`;
          const includedImage = includedMap.get(imageKey);
          if (includedImage) {
            const imageAttrs = includedImage.attributes as Record<string, unknown> | undefined;
            const uri = imageAttrs?.uri as Record<string, unknown> | undefined;
            const imageUrl = uri?.url as string | undefined;
            if (imageUrl) {
              filterOption.imageUrl = imageUrl.startsWith('/')
                ? `${DRUPAL_ORIGIN}${imageUrl}`
                : imageUrl;
            }
          }
        }
      }

      return filterOption;
    });
  } catch (err) {
    console.error(`[fetchFilterOptions] Network error for ${taxonomyType}`, {
      locale,
      error: err instanceof Error ? err.message : err,
    });
    return [];
  }
}

/**
 * Fetches `node/categoria` nodes used as `field_categoria` on product types.
 *
 * Filters categories by extracting distinct field_categoria values from actual
 * products of the given contentType. This ensures each product type shows only
 * its own categories (e.g. Illuminazione shows Lampadari/Lampade, Arredo shows
 * Divani/Poltrone/Tavoli).
 *
 * Returns FilterOption[] sorted alphabetically by title.
 */
export async function fetchArredoCategoryOptions(
  locale: string,
  contentType = 'prodotto_arredo',
): Promise<FilterOption[]> {
  const localePrefix = locale ? `/${locale}` : '';

  // Fetch products with field_categoria included to extract unique categories
  const url = new URL(
    `${DRUPAL_BASE_URL}${localePrefix}/jsonapi/node/${contentType}`,
  );
  url.searchParams.set('page[limit]', '50');
  url.searchParams.set(`fields[node--${contentType}]`, 'title');
  url.searchParams.set('include', 'field_categoria,field_categoria.field_immagine');
  url.searchParams.set('fields[node--categoria]', 'title,path,field_immagine');
  url.searchParams.set('filter[status]', '1');

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/vnd.api+json' },
      next: { revalidate: 3600 },
    } as RequestInit);

    if (!res.ok) {
      console.warn(
        `[fetchArredoCategoryOptions] HTTP ${res.status} for ${contentType}`,
        { locale, url: url.toString() },
      );
      return [];
    }

    const json = await res.json();

    // Build included map for image resolution
    const includedMap = new Map<string, Record<string, unknown>>();
    for (const inc of json.included ?? []) {
      includedMap.set(`${inc.type}--${inc.id}`, inc);
    }

    // Extract unique categories from included data
    const seen = new Set<string>();
    const options: FilterOption[] = [];
    for (const item of json.included ?? []) {
      if (item.type === 'node--categoria' && !seen.has(item.id)) {
        seen.add(item.id);
        const attrs = item.attributes as Record<string, unknown>;
        const title = (attrs?.title as string) ?? '';

        // Resolve image from field_immagine relationship
        let imageUrl: string | undefined;
        const relationships = item.relationships as Record<string, unknown> | undefined;
        const fieldImmagine = relationships?.field_immagine as Record<string, unknown> | undefined;
        const imageData = fieldImmagine?.data as Record<string, unknown> | undefined;
        if (imageData?.type && imageData?.id) {
          const imageKey = `${imageData.type}--${imageData.id}`;
          const includedImage = includedMap.get(imageKey);
          if (includedImage) {
            const imageAttrs = includedImage.attributes as Record<string, unknown> | undefined;
            const uri = imageAttrs?.uri as Record<string, unknown> | undefined;
            const url = uri?.url as string | undefined;
            if (url) {
              imageUrl = url.startsWith('/') ? `${DRUPAL_ORIGIN}${url}` : url;
            }
          }
        }

        options.push({
          id: item.id as string,
          slug: titleToSlug(title),
          label: title,
          imageUrl,
        });
      }
    }

    // If we got paginated results, fetch more pages to collect all categories
    let nextHref: string | null = json.links?.next?.href ?? null;
    while (nextHref) {
      try {
        const nextRes = await fetch(nextHref, {
          headers: { Accept: 'application/vnd.api+json' },
          next: { revalidate: 3600 },
        } as RequestInit);
        if (!nextRes.ok) break;
        const nextJson = await nextRes.json();
        for (const item of nextJson.included ?? []) {
          if (item.type === 'node--categoria' && !seen.has(item.id)) {
            seen.add(item.id);
            const attrs = item.attributes as Record<string, unknown>;
            const title = (attrs?.title as string) ?? '';
            options.push({
              id: item.id as string,
              slug: titleToSlug(title),
              label: title,
            });
          }
        }
        nextHref = nextJson.links?.next?.href ?? null;
      } catch {
        break;
      }
    }

    return options.sort((a, b) => a.label.localeCompare(b.label));
  } catch (err) {
    console.error(
      `[fetchArredoCategoryOptions] Network error for ${contentType}`,
      { locale, error: err instanceof Error ? err.message : err },
    );
    return [];
  }
}

/** Estrae lo slug dall'ultimo segmento del path alias */
function pathToSlug(pathOrName: string): string {
  if (pathOrName.includes('/')) {
    return pathOrName.split('/').filter(Boolean).pop() ?? pathOrName;
  }
  return pathOrName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Converts a node title to a URL slug.
 * Mirrors the inverse of `slugToTermName` so that
 * the round-trip slug → title → filter value is consistent.
 * e.g. "Armchairs" → "armchairs", "Coffee Tables" → "coffee-tables"
 */
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Fetches product counts for each value of a given filter, relative to active filters.
 *
 * Approach: single fetch with client-side count.
 * Fetches all product IDs matching the current active filters (excluding the target
 * filter itself) with the target relationship included, then counts occurrences of
 * each relationship value.
 *
 * This avoids N separate API calls while giving accurate counts that update as
 * filters are applied.
 *
 * @param productType  - Drupal content type (e.g. 'prodotto_mosaico')
 * @param activeFilters - Currently active filter definitions (from parseFiltersFromUrl)
 * @param filterKey     - The filter key being counted (e.g. 'collection')
 * @param drupalField   - Drupal field path (e.g. 'field_collezione.name')
 * @param locale        - Current locale
 * @returns Record mapping filter value labels to product counts
 */
export async function fetchFilterCounts(
  productType: string,
  activeFilters: FilterDefinition[],
  filterKey: string,
  drupalField: string,
  locale: string,
): Promise<Record<string, number>> {
  const localePrefix = locale ? `/${locale}` : '';

  // drupalField is like 'field_collezione.name' or 'field_categoria.title'
  const [relationshipField, attributeName] = drupalField.split('.');

  const url = new URL(
    `${DRUPAL_BASE_URL}${localePrefix}/jsonapi/node/${productType}`,
  );

  // Request only the target relationship (lightweight payload)
  url.searchParams.set(`fields[node--${productType}]`, relationshipField);
  url.searchParams.set('include', relationshipField);
  url.searchParams.set('page[limit]', '50');
  url.searchParams.set('filter[status]', '1');

  // Apply active filters EXCLUDING the one we're counting
  // This gives "how many products match other filters" per value of this filter
  const otherFilters = activeFilters.filter(
    (f) => f.field !== drupalField,
  );
  if (otherFilters.length > 0) {
    buildJsonApiFilters(otherFilters, url.searchParams);
  }

  const counts: Record<string, number> = {};

  try {
    let currentUrl: string | null = url.toString();

    while (currentUrl) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: Response = await fetch(currentUrl, {
        headers: { Accept: 'application/vnd.api+json' },
        next: { revalidate: 60 },
      } as any);

      if (!res.ok) {
        console.warn(
          `[fetchFilterCounts] HTTP ${res.status} for ${productType}.${filterKey}`,
          { locale, url: currentUrl },
        );
        return counts;
      }

      const json = await res.json() as Record<string, unknown>;

      // Build included map: entity id → entity data
      const includedMap = new Map<string, Record<string, unknown>>();
      const includedArr = json.included as Record<string, unknown>[] | undefined;
      for (const inc of includedArr ?? []) {
        includedMap.set(inc.id as string, inc);
      }

      // For each product, extract the relationship value(s) and count
      const dataArr = json.data as Record<string, unknown>[] | undefined;
      for (const product of dataArr ?? []) {
        const rels = product.relationships as
          | Record<string, unknown>
          | undefined;
        const relData = rels?.[relationshipField] as
          | Record<string, unknown>
          | undefined;
        const data = relData?.data;

        if (!data) continue;

        // Handle both single and multi-value relationships
        const references = Array.isArray(data) ? data : [data];

        for (const ref of references) {
          const refObj = ref as { id?: string; type?: string };
          if (!refObj.id) continue;

          const included = includedMap.get(refObj.id);
          if (!included) continue;

          const attrs = included.attributes as
            | Record<string, unknown>
            | undefined;
          // Use the specified attribute (name for taxonomy, title for nodes)
          const label = (attrs?.[attributeName || 'name'] as string) ?? '';
          if (label) {
            counts[label] = (counts[label] ?? 0) + 1;
          }
        }
      }

      // Follow pagination
      const links = json.links as Record<string, unknown> | undefined;
      const nextLink = links?.next as { href?: string } | undefined;
      currentUrl = nextLink?.href ?? null;
    }

    return counts;
  } catch (err) {
    console.error(
      `[fetchFilterCounts] Network error for ${productType}.${filterKey}`,
      { locale, error: err instanceof Error ? err.message : err },
    );
    return counts;
  }
}

/**
 * Fetches all filter options for every filter group of a given content type.
 * Runs all fetches in parallel with Promise.all.
 *
 * - FilterGroupConfig with `taxonomyType` → fetchFilterOptions(taxonomyType, locale)
 * - FilterGroupConfig with `nodeType === 'node--categoria'` → fetchArredoCategoryOptions(locale)
 * - FilterGroupConfig with neither → [] (options not yet available in Drupal)
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
          options = await fetchArredoCategoryOptions(locale, contentType);
        }
        // filters without taxonomyType or nodeType (e.g. grout) → []
        return [filterKey, options] as [string, FilterOption[]];
      }),
    );

    return Object.fromEntries(entries);
  },
);
