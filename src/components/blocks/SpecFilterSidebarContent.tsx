'use client';

import { useTranslations } from 'next-intl';
import { useFilterSync } from '@/hooks/use-filter-sync';
import { ActiveFilters } from '@/components/composed/ActiveFilters';
import { FilterGroup } from '@/components/composed/FilterGroup';
import { CheckboxFilter } from '@/components/composed/CheckboxFilter';
import { ColorSwatchFilter } from '@/components/composed/ColorSwatchFilter';
import { ImageListFilter } from '@/components/composed/ImageListFilter';
import { Typography } from '@/components/composed/Typography';
import { TypologyNav } from '@/components/composed/TypologyNav';
import type { TypologyNavItem } from '@/components/composed/TypologyNav';
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
  typologyNav?: TypologyNavItem[];
  activeTypologySlug?: string;
}

export function SpecFilterSidebarContent({
  filters,
  filterOptions,
  activeFilters,
  hasActiveP0,
  listingConfig,
  basePath,
  locale,
  typologyNav,
  activeTypologySlug,
}: SpecFilterSidebarContentProps) {
  const { toggleFilter, clearFilter, clearAll, isActive } = useFilterSync({
    basePath,
    locale,
    activeFilters,
  });
  const t = useTranslations('filters');

  // Use filters in their natural (registry) order
  const visibleGroups = Object.values(filters);

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
      {visibleGroups.map((group) => {
        const options = filterOptions[group.key] ?? [];
        if (options.length === 0) return null;

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

      {/* Typology navigation */}
      {typologyNav && typologyNav.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <Typography textRole="overline" as="span" className="text-muted-foreground">
              {t('typologies')}
            </Typography>
            <TypologyNav items={typologyNav} activeSlug={activeTypologySlug} />
          </div>
        </>
      )}
    </div>
  );
}
