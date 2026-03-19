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
    `${DRUPAL_BASE_URL}${localePrefix}/jsonapi/${taxonomyType.replace('--', '/')}`
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
      console.warn(`[fetchFilterOptions] Failed ${res.status} for ${taxonomyType} (${locale})`);
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
    console.error(`[fetchFilterOptions] Error for ${taxonomyType}:`, err);
    return [];
  }
}

/**
 * Fetches `node/categoria` nodes used as `field_categoria` in `prodotto_arredo`.
 *
 * `prodotto_arredo.field_categoria` is an entity_reference to `node--categoria`
 * (not a taxonomy term), so `fetchFilterOptions` cannot be used.
 * The JSON:API filter for arredo products uses `field_categoria.title`, so the
 * `slug` is derived from the node title (slugified) to match how `slugToTermName`
 * reconstructs the term name from a URL slug.
 *
 * Returns FilterOption[] sorted alphabetically by title.
 */
export async function fetchArredoCategoryOptions(
  locale: string,
): Promise<FilterOption[]> {
  const localePrefix = locale ? `/${locale}` : '';
  const url = new URL(
    `${DRUPAL_BASE_URL}${localePrefix}/jsonapi/node/categoria`
  );
  url.searchParams.set('page[limit]', '200');
  url.searchParams.set('fields[node--categoria]', 'title,path');
  url.searchParams.set('filter[status]', '1');
  url.searchParams.set('sort', 'title');

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/vnd.api+json' },
      next: { revalidate: 3600 },
    } as RequestInit);

    if (!res.ok) {
      console.warn(
        `[fetchArredoCategoryOptions] Failed ${res.status} for node/categoria (${locale})`
      );
      return [];
    }

    const json = await res.json();
    return (json.data ?? []).map((item: Record<string, unknown>) => {
      const attrs = item.attributes as Record<string, unknown>;
      const title = (attrs?.title as string) ?? '';
      return {
        id: item.id as string,
        // slug is derived from the title so it round-trips through slugToTermName:
        // slug → title capitalised matches field_categoria.title
        slug: titleToSlug(title),
        label: title,
      } satisfies FilterOption;
    });
  } catch (err) {
    console.error(`[fetchArredoCategoryOptions] Error for node/categoria:`, err);
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
export const fetchAllFilterOptions = cache(async (
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
        options = await fetchArredoCategoryOptions(locale);
      }
      // filters without taxonomyType or nodeType (e.g. grout) → []
      return [filterKey, options] as [string, FilterOption[]];
    }),
  );

  return Object.fromEntries(entries);
});
