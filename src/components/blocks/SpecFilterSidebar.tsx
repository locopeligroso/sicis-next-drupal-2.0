import { FilterPanel } from '@/components/composed/FilterPanel';
import { MobileFilterTrigger } from '@/components/composed/MobileFilterTrigger';
import { SpecFilterSidebarContent } from './SpecFilterSidebarContent';
import type { TypologyNavItem } from '@/components/composed/TypologyNav';
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
  typologyNav?: TypologyNavItem[];
  activeTypologySlug?: string;
  activePathFilterKey?: string;
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
  typologyNav,
  activeTypologySlug,
  activePathFilterKey,
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
      typologyNav={typologyNav}
      activeTypologySlug={activeTypologySlug}
      activePathFilterKey={activePathFilterKey}
    />
  );

  return (
    <>
      {/* Desktop sidebar -- anchored left panel, full height, always visible on md+ */}
      <FilterPanel className="hidden md:block">{content}</FilterPanel>

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
