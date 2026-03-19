'use client';

import {
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsArrayOf,
} from 'nuqs';

/**
 * Type-safe URL filter state hook using nuqs.
 *
 * Replaces useFilterSync (src/hooks/use-filter-sync.ts) which had:
 *   - Race condition with browser back button (stale activeFilters closure)
 *   - Pagination losing path-based filters
 *   - Manual URL string construction (error-prone)
 *
 * nuqs eliminates all three issues:
 *   - URL is always the source of truth (no stale closure)
 *   - All params updated atomically (no partial state)
 *   - Page resets to 1 on any filter change (declarative)
 */
export function useFilters() {
  const [params, setParams] = useQueryStates(
    {
      collection: parseAsString.withDefault(''),
      category:   parseAsString.withDefault(''),
      color:      parseAsArrayOf(parseAsString).withDefault([]),
      shape:      parseAsArrayOf(parseAsString).withDefault([]),
      finish:     parseAsArrayOf(parseAsString).withDefault([]),
      grout:      parseAsArrayOf(parseAsString).withDefault([]),
      type:       parseAsArrayOf(parseAsString).withDefault([]),
      texture:    parseAsArrayOf(parseAsString).withDefault([]),
      fabric:     parseAsArrayOf(parseAsString).withDefault([]),
      sort:       parseAsString.withDefault(''),
      page:       parseAsInteger.withDefault(1),
    },
    {
      shallow: false,  // Re-render Server Components on change
      history: 'push', // Preserve browser back/forward
    },
  );

  /** Toggle a single-value filter (radio behaviour). Resets page to 1. */
  const setFilter = (key: string, value: string | string[]) =>
    setParams({ [key]: value, page: 1 } as Parameters<typeof setParams>[0]);

  /** Clear a single filter key. Resets page to 1. */
  const clearFilter = (key: string) => {
    const current = params[key as keyof typeof params];
    const empty = Array.isArray(current) ? [] : '';
    setParams({ [key]: empty, page: 1 } as Parameters<typeof setParams>[0]);
  };

  /** Clear all filters and reset to page 1. */
  const clearAll = () =>
    setParams({
      collection: '', category: '',
      color: [], shape: [], finish: [], grout: [],
      type: [], texture: [], fabric: [],
      sort: '', page: 1,
    });

  /** Check if a filter key+value is currently active. */
  const isActive = (key: string, value: string): boolean => {
    const current = params[key as keyof typeof params];
    if (Array.isArray(current)) return current.includes(value);
    return current === value;
  };

  return { params, setFilter, clearFilter, clearAll, isActive };
}
