'use client';

import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { useFilterSync } from '@/hooks/use-filter-sync';
import { ActiveFilters } from '@/components/composed/ActiveFilters';
import { FilterGroup } from '@/components/composed/FilterGroup';
import { CheckboxFilter } from '@/components/composed/CheckboxFilter';
import { ColorSwatchFilter } from '@/components/composed/ColorSwatchFilter';
import { ImageListFilter } from '@/components/composed/ImageListFilter';
import { Typography } from '@/components/composed/Typography';
import { Separator } from '@/components/ui/separator';
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
}

const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2 };

export function SpecFilterSidebarContent({
  filters,
  filterOptions,
  activeFilters,
  hasActiveP0,
  listingConfig,
  basePath,
  locale,
}: SpecFilterSidebarContentProps) {
  const { toggleFilter, clearFilter, clearAll, isActive } = useFilterSync({
    basePath,
    locale,
    activeFilters,
  });
  const t = useTranslations('filters');

  // Sort filter groups by priority (P0 first, then P1, then P2)
  const sortedGroups = Object.values(filters).sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3),
  );

  // Determine which groups to show
  const visibleGroups = hasActiveP0
    ? sortedGroups
    : sortedGroups.filter((g) => g.priority === 'P0');

  const handleRemoveFilter = (key: string) => {
    clearFilter(key);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Active filter chips */}
      <ActiveFilters
        filters={activeFilters}
        onRemove={handleRemoveFilter}
        onClearAll={clearAll}
      />

      {/* Filter groups */}
      {visibleGroups.map((group, i) => {
        const options = filterOptions[group.key] ?? [];
        if (options.length === 0) return null;

        // Show separator + label before the first non-P0 filter when P0 is active
        const prevGroup = i > 0 ? visibleGroups[i - 1] : null;
        const showSeparator =
          hasActiveP0 &&
          group.priority !== 'P0' &&
          (prevGroup?.priority === 'P0' || i === 0);

        // Find matching categoryGroupDef for this filter
        const categoryGroup = listingConfig.categoryGroups.find(
          (cg) => cg.filterKey === group.key,
        );

        // Get active values for this group
        const activeForGroup = activeFilters
          .filter((f) => f.key === group.key)
          .map((f) => f.value);
        const activeValue = activeForGroup[0];

        // Determine the translated label for this group
        const groupLabel = t(group.key);

        return (
          <Fragment key={group.key}>
            {showSeparator && (
              <div className="flex flex-col gap-2">
                <Separator />
                <Typography textRole="caption" className="text-muted-foreground">
                  {t('additionalFilters')}
                </Typography>
              </div>
            )}
            <FilterGroup label={groupLabel}>
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
          </Fragment>
        );
      })}
    </div>
  );
}
