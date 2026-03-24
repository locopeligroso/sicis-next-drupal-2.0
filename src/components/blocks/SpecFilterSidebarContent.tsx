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

  // Auto-deselect P1 query filters whose selected value has count=0
  // (e.g. switching color makes the active finish unavailable)
  const didAutoDeselect = useRef(false);
  useEffect(() => {
    if (didAutoDeselect.current) {
      didAutoDeselect.current = false;
      return;
    }
    for (const af of activeFilters) {
      if (af.type !== 'query') continue;
      const options = filterOptions[af.key];
      if (!options) continue;
      const match = options.find((o) => o.slug === af.value);
      if (match && match.count === 0) {
        didAutoDeselect.current = true;
        clearFilter(af.key);
        return; // one at a time to avoid race conditions
      }
    }
  }, [activeFilters, filterOptions, clearFilter]);

  // Exclude the P0 filter that's active via path (it's shown in the context bar)
  const visibleGroups = Object.values(filters).filter(
    (g) => g.key !== activePathFilterKey,
  );

  const handleRemoveFilter = (key: string) => {
    clearFilter(key);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Subcategory filter — shown when active parent has children */}
      {subcategories && subcategories.length > 0 && (() => {
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

        // For non-swatch/non-image groups: hide if ≤1 visible options (no filtering value)
        const categoryGroup = listingConfig.categoryGroups.find(
          (cg) => cg.filterKey === group.key,
        );
        if (!categoryGroup?.hasColorSwatch && !categoryGroup?.hasImage) {
          const activeForGroupCheck = activeFilters
            .filter((f) => f.key === group.key)
            .map((f) => f.value);
          const visibleOptions = options.filter(
            (o) => o.count == null || o.count > 0 || activeForGroupCheck.includes(o.slug),
          );
          if (visibleOptions.length <= 1) return null;
        }

        // Get active values for this group
        const activeForGroup = activeFilters
          .filter((f) => f.key === group.key)
          .map((f) => f.value);
        const activeValue = activeForGroup[0];

        // Determine the translated label for this group
        const groupLabel = t(group.key);

        return (
          <FilterGroup key={group.key} label={groupLabel}>
            {categoryGroup?.hasColorSwatch ? (
              <ColorSwatchFilter
                options={options}
                activeValue={activeValue}
                onChange={(slug) =>
                  toggleFilter(
                    group.key,
                    slug,
                    group.type,
                    group.pathPrefix?.[locale],
                  )
                }
              />
            ) : categoryGroup?.hasImage ? (
              <ImageListFilter
                options={options}
                activeValue={activeValue}
                onChange={(slug) =>
                  toggleFilter(
                    group.key,
                    slug,
                    group.type,
                    group.pathPrefix?.[locale],
                  )
                }
              />
            ) : (
              <CheckboxFilter
                options={options}
                activeValues={activeForGroup}
                onChange={(slug) =>
                  toggleFilter(
                    group.key,
                    slug,
                    group.type,
                    group.pathPrefix?.[locale],
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
