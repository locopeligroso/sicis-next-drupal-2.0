'use client';

/**
 * Client-side hook for syncing filter state with URL.
 * Handles both path-based and query-based filter navigation.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
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
  isPending: boolean;
}

export function useFilterSync({
  basePath,
  locale,
  activeFilters,
}: UseFilterSyncOptions): UseFilterSyncReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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
          // Keep current path, add the new P0 as query param (coexist).
          // Clear all P1 query params (shape, finish, etc.) — context changes.
          // Example: /mosaico/colori/blu-scuro?finish=metallic + click "Tephra"
          //        → /mosaico/colori/blu-scuro?collection=tephra (finish cleared)
          const currentPath = window.location.pathname;
          const queryKey = key;
          // Start fresh: only keep the P0 query param, drop all P1 filters
          const params = new URLSearchParams();
          const currentP0Value = searchParams.get(queryKey);
          if (currentP0Value === value) {
            // Deselect: remove this P0 query param (params already empty)
          } else {
            params.set(queryKey, value);
          }
          const qs = params.toString();
          startTransition(() => router.push(qs ? `${currentPath}?${qs}` : currentPath));
          return;
        }

        // First P0 → existing path navigation logic
        const currentActive = activeFilters.find((f) => f.key === key);
        if (currentActive?.value === value) {
          // Deselect: go back to base path (clear all query params — new context)
          startTransition(() => router.push(basePath));
        } else {
          // Select: navigate to path with filter (clear query params — context changes)
          const prefix = pathPrefix ? `/${pathPrefix}` : '';
          startTransition(() => router.push(`${basePath}${prefix}/${value}`));
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
          startTransition(() => router.push(qs ? `${currentPath}?${qs}` : currentPath));
        } else if (isZeroCount) {
          // Select count=0 option: clear all other P1 query params (context switch)
          const params = new URLSearchParams();
          params.set(key, value);
          const qs = params.toString();
          startTransition(() => router.push(qs ? `${currentPath}?${qs}` : currentPath));
        } else {
          // Select count>0 option: keep existing P1 params, add/replace this one
          const params = new URLSearchParams(searchParams.toString());
          params.set(key, value);
          params.delete('page');
          const qs = params.toString();
          startTransition(() => router.push(qs ? `${currentPath}?${qs}` : currentPath));
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
        // Clear path P0 → go back to base (drop all query params — context changes)
        startTransition(() => router.push(basePath));
      } else {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(key);
        params.delete('page');
        startTransition(() => router.push(`${basePath}?${params.toString()}`));
      }
    },
    [basePath, activeFilters, router, searchParams],
  );

  const clearAll = useCallback(() => {
    startTransition(() => router.push(basePath));
  }, [basePath, router]);

  return { toggleFilter, clearFilter, clearAll, isActive, isPending };
}
