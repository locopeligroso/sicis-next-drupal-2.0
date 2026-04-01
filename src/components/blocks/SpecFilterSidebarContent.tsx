'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useFilterSync } from '@/hooks/use-filter-sync';
import { FilterGroup } from '@/components/composed/FilterGroup';
import { CheckboxFilter } from '@/components/composed/CheckboxFilter';
import { ColorSwatchFilter } from '@/components/composed/ColorSwatchFilter';
import { ImageListFilter } from '@/components/composed/ImageListFilter';
import { Typography } from '@/components/composed/Typography';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type {
  FilterGroupConfig,
  FilterOption,
  ActiveFilter as ActiveFilterType,
  ListingConfig,
} from '@/domain/filters/registry';

export interface SpecFilterSidebarContentProps {
  filters: Record<string, FilterGroupConfig>;
  filterOptions: Record<string, FilterOption[]>;
  activeFilters: ActiveFilterType[];
  hasActiveP0: boolean;
  listingConfig: ListingConfig;
  basePath: string;
  locale: string;
  /** Subcategories of the active parent category — shown as inline filter buttons */
  subcategories?: { slug: string; label: string }[];
  /** Key of the P0 filter active via path (e.g. 'collection' or 'color') — excluded from panel */
  activePathFilterKey?: string;
}

export function SpecFilterSidebarContent({
  filters,
  filterOptions,
  activeFilters,
  hasActiveP0,
  listingConfig,
  basePath,
  locale,
  subcategories,
  activePathFilterKey,
}: SpecFilterSidebarContentProps) {
  const { toggleFilter, clearFilter, clearAll, isActive } = useFilterSync({
    basePath,
    locale,
    activeFilters,
  });
  const t = useTranslations('filters');

  // Auto-deselect removed: users can intentionally select count=0 options
  // (dimmed but clickable). The cross-filtering counts update on next render.

  // Exclude the P0 filter that's active via path (it's shown in the context bar)
  // Also exclude filters not present in categoryGroups (e.g. shape — kept in data layer but hidden from sidebar)
  const categoryGroupKeys = new Set(
    listingConfig.categoryGroups.map((cg) => cg.filterKey),
  );
  const visibleGroups = Object.values(filters).filter(
    (g) => g.key !== activePathFilterKey && categoryGroupKeys.has(g.key),
  );

  const handleRemoveFilter = (key: string) => {
    clearFilter(key);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-subcategory filter — shown for arredo-style types where categories
          have children (sedute → sedie, sgabelli). Uses ?sub=slug query param. */}
      {subcategories &&
        subcategories.length > 0 &&
        (() => {
          const activeSub = activeFilters.find((f) => f.key === 'sub')?.value;
          return (
            <>
              <FilterGroup label={t('subcategories')}>
                <div className="flex flex-col gap-0.5">
                  {subcategories.map((sc) => {
                    const isActive = sc.slug === activeSub;
                    return (
                      <button
                        key={sc.slug}
                        type="button"
                        onClick={() => toggleFilter('sub', sc.slug, 'query')}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2 py-1.5 text-left cursor-pointer transition-colors hover:bg-muted',
                          isActive && 'bg-muted ring-1 ring-border',
                        )}
                      >
                        <Typography textRole="body-sm" as="span">
                          {sc.label}
                        </Typography>
                      </button>
                    );
                  })}
                </div>
              </FilterGroup>
              <Separator />
            </>
          );
        })()}

      {/* Filter groups */}
      {visibleGroups.map((group) => {
        const options = filterOptions[group.key] ?? [];
        if (options.length === 0) return null;

        // Hide groups with ≤1 total options or all options at count=0
        const categoryGroup = listingConfig.categoryGroups.find(
          (cg) => cg.filterKey === group.key,
        );
        if (!categoryGroup?.hasColorSwatch && !categoryGroup?.hasImage) {
          if (options.length <= 1) return null;
          // Hide group entirely when ALL options have count=0
          // (e.g. Tappeti has no tipologie available)
          const allZero = options.every(
            (o) => o.count != null && o.count === 0,
          );
          if (allZero) return null;
        }

        // Get active values for this group
        const activeForGroup = activeFilters
          .filter((f) => f.key === group.key)
          .map((f) => f.value);
        const activeValue = activeForGroup[0];

        // Use the registry's labelKey when available (e.g. 'filters.typologies' → 'Tipologie')
        // Fall back to the filter key name (e.g. 'subcategory' → 'Sottocategoria')
        const labelFromRegistry = categoryGroup?.labelKey;
        const groupLabel = labelFromRegistry
          ? t(labelFromRegistry.replace('filters.', ''))
          : t(group.key);

        return (
          <FilterGroup key={group.key} label={groupLabel}>
            {categoryGroup?.hasColorSwatch ? (
              <ColorSwatchFilter
                options={options}
                activeValue={activeValue}
                onChange={(slug, zeroCount) =>
                  toggleFilter(
                    group.key,
                    slug,
                    group.type,
                    group.pathPrefix?.[locale],
                    zeroCount,
                  )
                }
              />
            ) : categoryGroup?.hasImage ? (
              <ImageListFilter
                options={options}
                activeValue={activeValue}
                onChange={(slug, zeroCount) =>
                  toggleFilter(
                    group.key,
                    slug,
                    group.type,
                    group.pathPrefix?.[locale],
                    zeroCount,
                  )
                }
              />
            ) : (
              <CheckboxFilter
                options={options}
                activeValues={activeForGroup}
                onChange={(slug, zeroCount) =>
                  toggleFilter(
                    group.key,
                    slug,
                    group.type,
                    group.pathPrefix?.[locale],
                    zeroCount,
                  )
                }
              />
            )}
          </FilterGroup>
        );
      })}
    </div>
  );
}
