// ════════════════════════════════════════════════════════════════════════════
// §9  Filter options functions
// ════════════════════════════════════════════════════════════════════════════

import { cache } from 'react';
import { DRUPAL_BASE_URL } from './config';
import type { FilterOption } from '@/domain/filters/registry';
import { FILTER_REGISTRY } from '@/domain/filters/registry';

/**
 * Fetches all terms for a given taxonomy vocabulary in the given locale.
 * Returns FilterOption[] sorted by weight then name.
 */
export async function fetchFilterOptions(
  taxonomyType: string,
  locale: string,
): Promise<FilterOption[]> {
  const localePrefix = locale ? `/${locale}` : '';
  const url = new URL(
    `${DRUPAL_BASE_URL}${localePrefix}/jsonapi/${taxonomyType.replace('--', '/')}`,
  );
  url.searchParams.set('page[limit]', '200');
  url.searchParams.set(`fields[${taxonomyType}]`, 'name,path,weight');
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
    return (json.data ?? []).map((item: Record<string, unknown>) => {
      const attrs = item.attributes as Record<string, unknown>;
      const name = (attrs?.name as string) ?? '';
      const pathObj = attrs?.path as { alias?: string } | null;
      return {
        id: item.id as string,
        slug: pathToSlug(pathObj?.alias ?? name),
        label: name,
      } satisfies FilterOption;
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
  url.searchParams.set('include', 'field_categoria');
  url.searchParams.set('fields[node--categoria]', 'title,path');
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

    // Extract unique categories from included data
    const seen = new Set<string>();
    const options: FilterOption[] = [];
    for (const item of json.included ?? []) {
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
        if (filterConfig.taxonomyType) {
          options = await fetchFilterOptions(filterConfig.taxonomyType, locale);
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
