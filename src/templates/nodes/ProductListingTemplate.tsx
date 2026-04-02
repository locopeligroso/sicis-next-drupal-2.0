import { DevBlockOverlay } from '@/components/composed/DevBlockOverlay';
import { SmartBreadcrumb } from '@/components/composed/SmartBreadcrumb';
import type { BreadcrumbSegment } from '@/components/composed/SmartBreadcrumb';
import { ContextBar } from '@/components/composed/ContextBar';
import { AiryHeader } from '@/components/composed/AiryHeader';
import { SpecListingHeader } from '@/components/blocks/SpecListingHeader';
import { SpecFilterSidebar } from '@/components/blocks/SpecFilterSidebar';
import { SpecCategory } from '@/components/blocks/SpecCategory';
import { SpecHubMosaico } from '@/components/blocks/SpecHubMosaico';
import { SpecHubArredo } from '@/components/blocks/SpecHubArredo';
import { SpecProductListing } from '@/components/blocks/SpecProductListing';
import { SpecDeepDiveLinks } from '@/components/blocks/SpecDeepDiveLinks';
import { SpecHubCrossLinks } from '@/components/blocks/SpecHubCrossLinks';
import type { SecondaryLink } from '@/lib/navbar/types';
import type { ProductCard } from '@/lib/api/products';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
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

  // Subcategories of active parent category (Arredo/Illuminazione)
  subcategories?: { slug: string; label: string }[];

  // Whether to show the filter panel — defaults to true for listing modes
  hasFilterPanel?: boolean;

  // Key of the P0 filter active via path — excluded from panel (e.g. 'collection' or 'color')
  activePathFilterKey?: string;

  // Legacy compat — used to derive variant when variant is not provided
  hasActiveP0?: boolean;

  // Deep dive links from Filter & Find mega-menu (for hub Approfondimenti section)
  deepDiveLinks?: SecondaryLink[];

  // Parent NID for category-based hubs (arredo, illuminazione, tessuto)
  // Used by SpecHubArredo to fetch subcategories from categories/{nid} endpoint
  hubParentNid?: number;

  // Translation functions for breadcrumb labels
  tNav?: (key: string) => string;
  tBreadcrumb?: (key: string) => string;
  tProducts?: (key: string) => string;
}

const PRODUCTS_PATH: Record<string, string> = {
  it: '/it/prodotti',
  en: '/en/products',
  fr: '/fr/produits',
  de: '/de/produkte',
  es: '/es/productos',
  ru: '/ru/продукция',
};

const CATEGORY_TYPES = [
  'prodotto_mosaico',
  'prodotto_vetrite',
  'prodotto_arredo',
  'prodotto_illuminazione',
  'prodotto_tessuto',
] as const;

const CATEGORY_LABEL_KEYS: Record<string, { ns: 'nav' | 'products'; key: string }> = {
  prodotto_mosaico: { ns: 'nav', key: 'mosaico' },
  prodotto_vetrite: { ns: 'nav', key: 'vetrite' },
  prodotto_arredo: { ns: 'nav', key: 'arredo' },
  prodotto_illuminazione: { ns: 'products', key: 'lighting' },
  prodotto_tessuto: { ns: 'nav', key: 'tessuto' },
};

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
  const options = filterOptions.subcategory ?? filterOptions.category ?? [];
  // Only top-level categories (not children) for the hub
  const parents = options.filter((opt) => !opt.parentId);
  return parents.map((opt) => ({
    slug: opt.slug,
    label: opt.label,
    imageUrl: opt.imageUrl ?? null,
    href: `${basePath}/${opt.slug}`,
    count: opt.count,
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
    subcategories,
    hasFilterPanel: hasFilterPanelProp,
    activePathFilterKey,
    hasActiveP0,
    deepDiveLinks,
    hubParentNid,
    tNav,
    tBreadcrumb,
    tProducts,
  } = props;

  const getCategoryLabel = (type: string) => {
    const mapping = CATEGORY_LABEL_KEYS[type];
    if (!mapping || !tNav || !tProducts) return type;
    return mapping.ns === 'nav' ? tNav(mapping.key) : tProducts(mapping.key);
  };

  const getCategoryHref = (type: string) => {
    const config = FILTER_REGISTRY[type];
    if (!config) return '#';
    const bp = config.basePaths[locale] ?? config.basePaths.it;
    return `/${locale}/${bp}`;
  };

  const categorySiblings = CATEGORY_TYPES.map((type) => ({
    label: getCategoryLabel(type),
    href: getCategoryHref(type),
  }));

  const baseSegments: BreadcrumbSegment[] = [
    {
      label: tBreadcrumb?.('filterAndFind') ?? 'Products',
      href: PRODUCTS_PATH[locale] ?? PRODUCTS_PATH.it,
    },
    {
      label: getCategoryLabel(productType),
      href: getCategoryHref(productType),
      siblings: categorySiblings,
    },
  ];

  const variant = resolveVariant(props.variant, hasActiveP0, listingConfig);

  // In hub mode, no filter panel by default; in listing modes, show it
  const hasFilterPanel = hasFilterPanelProp ?? variant !== 'hub';

  // ── Hub mode: full-width category cards, no filter panel ──────────────
  if (variant === 'hub') {
    const isMosaicoOrVetrite =
      productType === 'prodotto_mosaico' || productType === 'prodotto_vetrite';

    return (
      <div className="flex flex-col gap-(--spacing-section) pb-(--spacing-section)">
        <DevBlockOverlay name="SpecListingHeader" status="ds">
          <SpecListingHeader title={title} description={description} breadcrumbSegments={baseSegments} />
        </DevBlockOverlay>
        {isMosaicoOrVetrite ? (
          <DevBlockOverlay name="SpecHubMosaico" status="ds">
            <SpecHubMosaico
              filterOptions={Object.fromEntries(
                Object.entries(filterOptions).map(([key, opts]) => [
                  key,
                  opts.filter((o) => !o.label.includes(' - ')),
                ]),
              )}
              filters={filters}
              listingConfig={listingConfig}
              basePath={basePath}
              locale={locale}
              productType={productType}
            />
          </DevBlockOverlay>
        ) : (
          <DevBlockOverlay name="SpecHubArredo" status="ds">
            <SpecHubArredo
              parentNid={hubParentNid!}
              basePath={basePath}
              locale={locale}
              productType={productType}
            />
          </DevBlockOverlay>
        )}
        <DevBlockOverlay name="SpecHubCrossLinks" status="ds">
          <SpecHubCrossLinks productType={productType} locale={locale} />
        </DevBlockOverlay>
        <DevBlockOverlay name="SpecDeepDiveLinks" status="ds">
          <SpecDeepDiveLinks links={deepDiveLinks ?? []} />
        </DevBlockOverlay>
      </div>
    );
  }

  // ── Listing modes: context-bar or airy-header ─────────────────────────
  return (
    <div>
      {/* Panel — fixed to left edge */}
      {hasFilterPanel && (
        <DevBlockOverlay name="SpecFilterSidebar" status="ds">
          <SpecFilterSidebar
            filters={filters}
            filterOptions={filterOptions}
            activeFilters={activeFilters}
            hasActiveP0={true}
            listingConfig={listingConfig}
            basePath={basePath}
            locale={locale}
            totalCount={total}
            subcategories={subcategories}
            activePathFilterKey={activePathFilterKey}
          />
        </DevBlockOverlay>
      )}
      {/* Content — offset by sidebar width when panel present */}
      <main className={`min-w-0 max-w-listing mx-auto px-(--spacing-page) ${hasFilterPanel ? 'md:ml-[300px]' : ''}`}>
        <SmartBreadcrumb
          segments={[
            ...baseSegments,
            ...(title !== getCategoryLabel(productType)
              ? [{
                  label: title,
                  href: basePath,
                  siblings: activePathFilterKey && filterOptions[activePathFilterKey]
                    ? filterOptions[activePathFilterKey]
                        .filter((o) => !o.parentId)
                        .map((o) => ({
                          label: o.label,
                          href: `${getCategoryHref(productType)}/${o.slug}`,
                        }))
                    : undefined,
                }]
              : []),
          ]}
        />
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
        <DevBlockOverlay name="SpecProductListing" status="ds">
          <SpecProductListing
            products={products ?? []}
            total={total ?? 0}
            currentSort={currentSort ?? ''}
            productType={productType}
            activeFilters={filterDefinitions}
            pageSize={listingConfig.pageSize}
            locale={locale}
            basePath={basePath}
            productCardRatio={listingConfig.productCardRatio}
            imageFit={
              productType === 'prodotto_illuminazione' ||
              productType === 'prodotto_arredo'
                ? 'contain'
                : 'cover'
            }
          />
        </DevBlockOverlay>
      </main>
    </div>
  );
}
