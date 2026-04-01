'use client';

/**
 * Client-side hook for syncing filter state with URL.
 * Handles both path-based and query-based filter navigation.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { ActiveFilter } from '@/domain/filters/registry';

interface UseFilterSyncOptions {
  basePath: string; // es. '/it/mosaico'
  locale: string;
  activeFilters: ActiveFilter[];
}

interface UseFilterSyncReturn {
  toggleFilter: (
    key: string,
    value: string,
    type: 'path' | 'query',
    pathPrefix?: string,
    isZeroCount?: boolean,
  ) => void;
  clearFilter: (key: string) => void;
  clearAll: () => void;
  isActive: (key: string, value: string) => boolean;
}

export function useFilterSync({
  basePath,
  locale,
  activeFilters,
}: UseFilterSyncOptions): UseFilterSyncReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isActive = useCallback(
    (key: string, value: string) =>
      activeFilters.some((f) => f.key === key && f.value === value),
    [activeFilters],
  );

  const toggleFilter = useCallback(
    (
      key: string,
      value: string,
      type: 'path' | 'query',
      pathPrefix?: string,
      isZeroCount?: boolean,
    ) => {
      if (type === 'path') {
        // Check if another P0 is already active via path
        const otherPathActive = activeFilters.find(
          (f) => f.type === 'path' && f.key !== key,
        );

        if (otherPathActive) {
          // Second P0 clicked while another P0 is active in path.
          // Navigate to the NEW P0's path, dropping all other filters.
          // Example: on /mosaic/colors/navy-blu, click Tephra →
          //   navigate to /mosaic/tephra (clean context switch)
          const prefix = pathPrefix ? `/${pathPrefix}` : '';
          router.push(`${basePath}${prefix}/${value}`);
          return;
        }

        // First P0 → existing path navigation logic
        const currentActive = activeFilters.find((f) => f.key === key);
        if (currentActive?.value === value) {
          // Deselect: go back to base path (clear all query params — new context)
          router.push(basePath);
        } else {
          // Select: navigate to path with filter (clear query params — context changes)
          const prefix = pathPrefix ? `/${pathPrefix}` : '';
          router.push(`${basePath}${prefix}/${value}`);
        }
      } else {
        // Toggle query param filter — keep current pathname (preserves active P0 in path)
        const currentPath = window.location.pathname;

        if (searchParams.get(key) === value) {
          // Deselect: remove this filter, keep others
          const params = new URLSearchParams(searchParams.toString());
          params.delete(key);
          params.delete('page');
          const qs = params.toString();
          router.push(qs ? `${currentPath}?${qs}` : currentPath);
        } else if (isZeroCount) {
          // Select count=0 option: clear all other P1 query params (context switch)
          const params = new URLSearchParams();
          params.set(key, value);
          const qs = params.toString();
          router.push(qs ? `${currentPath}?${qs}` : currentPath);
        } else {
          // Select count>0 option: keep existing P1 params, add/replace this one
          const params = new URLSearchParams(searchParams.toString());
          params.set(key, value);
          params.delete('page');
          const qs = params.toString();
          router.push(qs ? `${currentPath}?${qs}` : currentPath);
        }
        return;
      }
    },
    [basePath, activeFilters, router, searchParams],
  );

  const clearFilter = useCallback(
    (key: string) => {
      const filter = activeFilters.find((f) => f.key === key);
      if (!filter) return;
      if (filter.type === 'path') {
        router.push(`${basePath}?${searchParams.toString()}`);
      } else {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(key);
        params.delete('page');
        router.push(`${basePath}?${params.toString()}`);
      }
    },
    [basePath, activeFilters, router, searchParams],
  );

  const clearAll = useCallback(() => {
    router.push(basePath);
  }, [basePath, router]);

  return { toggleFilter, clearFilter, clearAll, isActive };
}
