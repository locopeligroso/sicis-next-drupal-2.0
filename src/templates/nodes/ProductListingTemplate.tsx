import { ListingBreadcrumb } from '@/components/composed/ListingBreadcrumb';
import { ContextBar } from '@/components/composed/ContextBar';
import { AiryHeader } from '@/components/composed/AiryHeader';
import { SpecListingHeader } from '@/components/blocks/SpecListingHeader';
import { SpecFilterSidebar } from '@/components/blocks/SpecFilterSidebar';
import { SpecCategory } from '@/components/blocks/SpecCategory';
import { SpecHubMosaico } from '@/components/blocks/SpecHubMosaico';
import { SpecHubArredo } from '@/components/blocks/SpecHubArredo';
import { SpecProductListing } from '@/components/blocks/SpecProductListing';
import type { TypologyNavItem } from '@/components/composed/TypologyNav';
import type { ProductCard } from '@/lib/api/products';
import type {
  ListingConfig,
  FilterOption,
  ActiveFilter,
  FilterGroupConfig,
} from '@/domain/filters/registry';
import type { FilterDefinition } from '@/domain/filters/search-params';

type LayoutVariant = 'hub' | 'context-bar' | 'airy-header';

interface ProductListingTemplateProps {
  // Content
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  swatchColor?: string | null;

  // Product type
  productType: string;
  listingConfig: ListingConfig;
  basePath: string;
  locale: string;

  // Filters
  filters: Record<string, FilterGroupConfig>;
  filterOptions: Record<string, FilterOption[]>;
  activeFilters: ActiveFilter[];
  filterDefinitions: FilterDefinition[];

  // Products
  products?: ProductCard[];
  total?: number;
  currentSort?: string;

  // Layout variant — new prop; when omitted, derived from hasActiveP0
  variant?: LayoutVariant;

  // Context bar specific (only when variant='context-bar')
  changePopoverContent?: React.ReactNode;
  backHref?: string;

  // Typology nav (Arredo/Illuminazione/Tessile)
  typologyNav?: TypologyNavItem[];
  activeTypologySlug?: string;

  // Whether to show the filter panel — defaults to true for listing modes
  hasFilterPanel?: boolean;

  // Legacy compat — used to derive variant when variant is not provided
  hasActiveP0?: boolean;
}

/**
 * Derives the layout variant from legacy props when `variant` is not explicitly set.
 * - No active P0 + category groups → hub
 * - Active P0 → context-bar (safe default; callers will pass airy-header when needed)
 */
function resolveVariant(
  variant: LayoutVariant | undefined,
  hasActiveP0: boolean | undefined,
  listingConfig: ListingConfig,
): LayoutVariant {
  if (variant) return variant;

  // Legacy derivation: hub if no P0 active and there are category groups
  if (!hasActiveP0 && listingConfig.categoryGroups.length > 0) {
    return 'hub';
  }

  // Default to context-bar for backward compat (Mosaico/Vetrite are the most common P0 cases)
  return 'context-bar';
}

/**
 * Maps P0 filter options (subcategory/category) from filterOptions
 * to the shape expected by SpecHubArredo.
 */
function mapCategoriesToHubArredo(
  filterOptions: Record<string, FilterOption[]>,
  basePath: string,
) {
  // Arredo/Illuminazione use 'subcategory', Tessile uses 'category'
  const options =
    filterOptions.subcategory ?? filterOptions.category ?? [];
  return options.map((opt) => ({
    slug: opt.slug,
    label: opt.label,
    imageUrl: opt.imageUrl ?? null,
    href: `${basePath}/${opt.slug}`,
  }));
}

export function ProductListingTemplate(props: ProductListingTemplateProps) {
  const {
    title,
    description,
    imageUrl,
    swatchColor,
    productType,
    listingConfig,
    basePath,
    locale,
    filters,
    filterOptions,
    activeFilters,
    filterDefinitions,
    products,
    total,
    currentSort,
    changePopoverContent,
    backHref,
    typologyNav,
    activeTypologySlug,
    hasFilterPanel: hasFilterPanelProp,
    hasActiveP0,
  } = props;

  const variant = resolveVariant(props.variant, hasActiveP0, listingConfig);

  // In hub mode, no filter panel by default; in listing modes, show it
  const hasFilterPanel = hasFilterPanelProp ?? variant !== 'hub';

  // ── Hub mode: full-width category cards, no filter panel ──────────────
  if (variant === 'hub') {
    const isMosaicoOrVetrite =
      productType === 'prodotto_mosaico' || productType === 'prodotto_vetrite';

    return (
      <div className="max-w-listing mx-auto px-(--spacing-page) pb-(--spacing-section)">
        <ListingBreadcrumb locale={locale} activeCategory={productType} />
        <SpecListingHeader title={title} description={description} />
        {isMosaicoOrVetrite ? (
          <SpecHubMosaico
            filterOptions={filterOptions}
            filters={filters}
            listingConfig={listingConfig}
            basePath={basePath}
            locale={locale}
          />
        ) : (
          <SpecHubArredo
            categories={mapCategoriesToHubArredo(filterOptions, basePath)}
            basePath={basePath}
            locale={locale}
            categoryCardRatio={listingConfig.categoryCardRatio}
          />
        )}
      </div>
    );
  }

  // ── Listing modes: context-bar or airy-header ─────────────────────────
  return (
    <div className="max-w-listing mx-auto px-(--spacing-page) pb-(--spacing-section)">
      <ListingBreadcrumb
        locale={locale}
        activeCategory={productType}
        subcategoryLabel={title}
      />
      <div className="flex gap-5 items-start">
        {hasFilterPanel && (
          <SpecFilterSidebar
            filters={filters}
            filterOptions={filterOptions}
            activeFilters={activeFilters}
            hasActiveP0={true}
            listingConfig={listingConfig}
            basePath={basePath}
            locale={locale}
            totalCount={total}
            typologyNav={typologyNav}
            activeTypologySlug={activeTypologySlug}
          />
        )}
        <main className="flex-1 min-w-0">
          {variant === 'context-bar' ? (
            <ContextBar
              thumbnail={imageUrl}
              swatchColor={swatchColor}
              title={title}
              subtitle={`${total ?? 0} prodotti`}
              changePopoverContent={changePopoverContent}
              backHref={backHref ?? basePath}
            />
          ) : (
            <AiryHeader
              title={title}
              description={description}
              productCount={total}
            />
          )}
          <SpecProductListing
            products={products ?? []}
            total={total ?? 0}
            sortOptions={listingConfig.sortOptions}
            currentSort={currentSort ?? ''}
            productType={productType}
            activeFilters={filterDefinitions}
            pageSize={listingConfig.pageSize}
            locale={locale}
            basePath={basePath}
            productCardRatio={listingConfig.productCardRatio}
          />
        </main>
      </div>
    </div>
  );
}
