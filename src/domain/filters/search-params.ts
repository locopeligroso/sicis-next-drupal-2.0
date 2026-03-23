import {
  createSearchParamsCache,
  parseAsString,
  parseAsInteger,
  parseAsArrayOf,
} from 'nuqs/server';
import { FILTER_REGISTRY, deslugify } from './registry';
import type { ActiveFilter, FilterGroupConfig } from './registry';

/**
 * nuqs server-side cache for filter search params.
 * Used in Server Components (page.tsx) to parse URL state type-safely.
 *
 * Replaces manual searchParams parsing scattered across:
 *   - parse-filters.ts
 *   - page.tsx (sp object destructuring)
 */
export const filterSearchParamsCache = createSearchParamsCache({
  // Path-based filters (single value — radio behaviour)
  collection: parseAsString.withDefault(''),
  category:   parseAsString.withDefault(''),

  // Query-based filters (multi-value — checkbox behaviour)
  color:   parseAsArrayOf(parseAsString).withDefault([]),
  shape:   parseAsArrayOf(parseAsString).withDefault([]),
  finish:  parseAsArrayOf(parseAsString).withDefault([]),
  grout:   parseAsArrayOf(parseAsString).withDefault([]),
  type:    parseAsArrayOf(parseAsString).withDefault([]),
  texture: parseAsArrayOf(parseAsString).withDefault([]),
  fabric:  parseAsArrayOf(parseAsString).withDefault([]),

  // Sorting and pagination
  sort: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
});

// ── Filter Definition type (replaces build-filters.ts:FilterDefinition) ──

export interface FilterDefinition {
  field: string;
  value: string | string[];
  operator: '=' | 'IN' | 'CONTAINS' | 'STARTS_WITH';
}

export interface ParsedFilters {
  contentType: string | null;
  filterDefinitions: FilterDefinition[];
  activeFilters: ActiveFilter[];
  sort?: string;
}

/**
 * Parses active filters from URL slug segments + query params.
 * Migrated from src/lib/parse-filters.ts — now in domain layer.
 *
 * Path filter examples:
 *   /mosaico/murano-smalto → collection=murano-smalto
 *   /mosaico/colori/grigio → color=grigio
 *
 * Query filter examples:
 *   ?shape=hexagon&finish=glossy → shape=hexagon, finish=glossy
 */
export function parseFiltersFromUrl(
  slug: string[],
  searchParams: Record<string, string>,
  locale: string,
): ParsedFilters {
  const filterDefinitions: FilterDefinition[] = [];
  const activeFilters: ActiveFilter[] = [];
  let contentType: string | null = null;
  const sort = searchParams['sort'] || undefined;

  // Find matching product type config from slug segments
  for (const [ct, config] of Object.entries(FILTER_REGISTRY)) {
    const basePath = config.basePaths[locale] ?? config.basePaths['it'];
    const baseSegments = basePath.split('/');

    // Check if slug starts with basePath segments (full match)
    const fullMatch = baseSegments.every((seg, i) => slug[i] === seg);
    // Also try partial match: first segment matches but second doesn't
    // (handles /en/textiles/bedcover where registry says textiles/fabrics)
    const partialMatch = !fullMatch && baseSegments.length > 1 && slug[0] === baseSegments[0];
    if (!fullMatch && !partialMatch) continue;

    contentType = ct;
    const matchedSegments = fullMatch ? baseSegments.length : 1;
    const afterBase = slug.slice(matchedSegments);
    const [pathSeg1, pathSeg2] = afterBase;

    // Detect path-based filters
    for (const filterConfig of Object.values(config.filters)) {
      if (filterConfig.type !== 'path') continue;

      if (filterConfig.pathPrefix) {
        // Color-style: /mosaico/colori/{slug}
        const prefix = filterConfig.pathPrefix[locale] ?? filterConfig.pathPrefix['it'];
        if (pathSeg1 === prefix && pathSeg2) {
          addFilter(filterConfig, pathSeg2, filterDefinitions, activeFilters);
        }
      } else {
        // Collection-style: /mosaico/{slug} (only if not a color prefix)
        const colorConfig = Object.values(config.filters).find(
          (f) => f.type === 'path' && f.pathPrefix,
        );
        const colorPrefix =
          colorConfig?.pathPrefix?.[locale] ?? colorConfig?.pathPrefix?.['it'];
        if (pathSeg1 && pathSeg1 !== colorPrefix && !pathSeg2) {
          addFilter(filterConfig, pathSeg1, filterDefinitions, activeFilters);
        }
      }
    }

    // Detect second P0 via query param (when first P0 is already in the path)
    for (const filterConfig of Object.values(config.filters)) {
      if (filterConfig.type !== 'path') continue;
      // Skip if already resolved from path
      if (activeFilters.some(f => f.key === filterConfig.key)) continue;
      // Check if present as query param
      const queryKey = filterConfig.queryKey ?? filterConfig.key;
      const queryValue = searchParams[queryKey];
      if (queryValue) {
        addFilter(filterConfig, queryValue, filterDefinitions, activeFilters);
        // Override type to 'query' for the second P0
        const lastAdded = activeFilters[activeFilters.length - 1];
        lastAdded.type = 'query';
      }
    }

    // Detect query-based filters
    for (const filterConfig of Object.values(config.filters)) {
      if (filterConfig.type !== 'query' || !filterConfig.queryKey) continue;
      const value = searchParams[filterConfig.queryKey];
      if (value) {
        addFilter(filterConfig, value, filterDefinitions, activeFilters);
      }
    }

    break;
  }

  return { contentType, filterDefinitions, activeFilters, sort };
}

function addFilter(
  config: FilterGroupConfig,
  slugValue: string,
  definitions: FilterDefinition[],
  active: ActiveFilter[],
): void {
  const decoded = decodeURIComponent(slugValue);
  const termName = deslugify(decoded);
  // Operator defaults to '='. Overrides (e.g. STARTS_WITH for NeoColibrì subcollections)
  // are applied by ProductListingAsync via sectionConfig.filterOperator — single source of truth.
  definitions.push({
    field: config.drupalField,
    value: termName,
    operator: '=',
  });
  active.push({
    key: config.key,
    value: decoded,
    label: termName,
    type: config.type,
  });
}
