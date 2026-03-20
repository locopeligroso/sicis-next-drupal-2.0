import { ListingHeader } from '@/components/blocks/ListingHeader';
import { FilterSidebar } from '@/components/blocks/FilterSidebar';
import { CategorySection } from '@/components/blocks/CategorySection';
import { ProductSection } from '@/components/blocks/ProductSection';
import type { ProductCard } from '@/lib/drupal/products';
import type {
  ListingConfig,
  FilterOption,
  ActiveFilter,
  FilterGroupConfig,
} from '@/domain/filters/registry';
import type { FilterDefinition } from '@/domain/filters/search-params';

interface ProductListingTemplateProps {
  title: string;
  description?: string | null;
  productType: string;
  listingConfig: ListingConfig;
  filters: Record<string, FilterGroupConfig>;
  filterOptions: Record<string, FilterOption[]>;
  activeFilters: ActiveFilter[];
  filterDefinitions: FilterDefinition[];
  hasActiveP0: boolean;
  products?: ProductCard[];
  total?: number;
  currentSort?: string;
  basePath: string;
  locale: string;
}

export function ProductListingTemplate(props: ProductListingTemplateProps) {
  const {
    title,
    description,
    listingConfig,
    filters,
    filterOptions,
    activeFilters,
    filterDefinitions,
    hasActiveP0,
    products,
    total,
    currentSort,
    basePath,
    locale,
    productType,
  } = props;

  const showCategoryCards =
    !hasActiveP0 && listingConfig.categoryGroups.length > 0;

  return (
    <div>
      <ListingHeader title={title} description={description} />
      <div className="max-w-7xl mx-auto px-(--spacing-page) pb-(--spacing-section)">
        <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-8">
          <FilterSidebar
            filters={filters}
            filterOptions={filterOptions}
            activeFilters={activeFilters}
            hasActiveP0={hasActiveP0}
            listingConfig={listingConfig}
            basePath={basePath}
            locale={locale}
            totalCount={total}
          />
          <main>
            {showCategoryCards ? (
              <CategorySection
                categoryGroups={listingConfig.categoryGroups}
                filterOptions={filterOptions}
                filters={filters}
                aspectRatio={listingConfig.categoryCardRatio}
                basePath={basePath}
                locale={locale}
              />
            ) : (
              <ProductSection
                products={products ?? []}
                total={total ?? 0}
                sortOptions={listingConfig.sortOptions}
                currentSort={currentSort ?? ''}
                productType={productType}
                activeFilters={filterDefinitions}
                pageSize={listingConfig.pageSize}
                locale={locale}
                basePath={basePath}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
