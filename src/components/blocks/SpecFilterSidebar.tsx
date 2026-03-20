import { MobileFilterTrigger } from '@/components/composed/MobileFilterTrigger';
import { SpecFilterSidebarContent } from './SpecFilterSidebarContent';
import type {
  FilterGroupConfig,
  FilterOption,
  ActiveFilter,
  ListingConfig,
} from '@/domain/filters/registry';

export interface SpecFilterSidebarProps {
  filters: Record<string, FilterGroupConfig>;
  filterOptions: Record<string, FilterOption[]>;
  activeFilters: ActiveFilter[];
  hasActiveP0: boolean;
  listingConfig: ListingConfig;
  basePath: string;
  locale: string;
  totalCount?: number;
}

export function SpecFilterSidebar({
  filters,
  filterOptions,
  activeFilters,
  hasActiveP0,
  listingConfig,
  basePath,
  locale,
  totalCount,
}: SpecFilterSidebarProps) {
  const content = (
    <SpecFilterSidebarContent
      filters={filters}
      filterOptions={filterOptions}
      activeFilters={activeFilters}
      hasActiveP0={hasActiveP0}
      listingConfig={listingConfig}
      basePath={basePath}
      locale={locale}
    />
  );

  return (
    <>
      {/* Desktop sidebar -- sticky, always visible on md+ */}
      <aside className="sticky top-0 hidden md:block w-64 shrink-0 overflow-y-auto h-screen p-4">
        {content}
      </aside>

      {/* Mobile trigger -- FAB + Sheet drawer, visible below md */}
      <MobileFilterTrigger
        activeFilterCount={activeFilters.length}
        totalCount={totalCount}
      >
        {content}
      </MobileFilterTrigger>
    </>
  );
}
