'use client';

/**
 * Client-side hook for syncing filter state with URL.
 * Handles both path-based and query-based filter navigation.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { ActiveFilter } from '@/domain/filters/registry';

interface UseFilterSyncOptions {
  basePath: string;       // es. '/it/mosaico'
  locale: string;
  activeFilters: ActiveFilter[];
}

interface UseFilterSyncReturn {
  toggleFilter: (key: string, value: string, type: 'path' | 'query', pathPrefix?: string) => void;
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
      activeFilters.some(f => f.key === key && f.value === value),
    [activeFilters],
  );

  const toggleFilter = useCallback(
    (key: string, value: string, type: 'path' | 'query', pathPrefix?: string) => {
      if (type === 'path') {
        // Check if another P0 is already active via path
        const otherPathActive = activeFilters.find(
          f => f.type === 'path' && f.key !== key,
        );

        if (otherPathActive) {
          // Second P0 → use query param instead of path navigation
          const params = new URLSearchParams(searchParams.toString());
          const queryKey = key;
          if (params.get(queryKey) === value) {
            params.delete(queryKey);
          } else {
            params.set(queryKey, value);
          }
          params.delete('page');
          const currentPath = window.location.pathname;
          router.push(`${currentPath}?${params.toString()}`);
          return;
        }

        // First P0 → existing path navigation logic
        const currentActive = activeFilters.find(f => f.key === key);
        if (currentActive?.value === value) {
          // Deselect: go back to base path
          router.push(`${basePath}?${searchParams.toString()}`);
        } else {
          // Select: navigate to path with filter
          const prefix = pathPrefix ? `/${pathPrefix}` : '';
          router.push(`${basePath}${prefix}/${value}?${searchParams.toString()}`);
        }
      } else {
        // Toggle query param filter — keep current pathname (preserves active P0 in path)
        const params = new URLSearchParams(searchParams.toString());
        if (params.get(key) === value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
        // Reset pagination when filter changes
        params.delete('page');
        const currentPath = window.location.pathname;
        const qs = params.toString();
        router.push(qs ? `${currentPath}?${qs}` : currentPath);
      }
    },
    [basePath, activeFilters, router, searchParams],
  );

  const clearFilter = useCallback(
    (key: string) => {
      const filter = activeFilters.find(f => f.key === key);
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
