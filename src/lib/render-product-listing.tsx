import { parseFiltersFromUrl } from '@/domain/filters/search-params';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import type { FilterOption } from '@/domain/filters/registry';
import { fetchProductListing } from '@/lib/api/product-listing-factory';
import { fetchListingFilterOptions } from '@/lib/api/filter-options';
import { getHubDeepDiveLinks } from '@/lib/navbar/hub-links';
import { ProductListingTemplate } from '@/templates/nodes/ProductListingTemplate';

// ── Helper: renderizza listing prodotti con ProductListingTemplate ─────────
// Replaces the old renderListingLayout (SpecFilterSidebar + ProductListing grid).
// Uses FILTER_REGISTRY to determine state (hub with category cards vs product grid)
// and fetches data accordingly.
export async function renderProductListing({
  productType,
  title,
  description,
  slug,
  searchParams: sp,
  locale,
  resolvedTid,
  resolvedColorTid,
  resolvedCategoryNid,
  hubParentNid,
}: {
  productType: string;
  title: string;
  description?: string | null;
  slug: string[];
  searchParams: Record<string, string | string[]> | undefined;
  locale: string;
  /** Collection TID from resolve-path — skips taxonomy name→TID lookup for mosaic-products endpoint */
  resolvedTid?: number;
  /** Color TID from resolve-path — for mosaic-products/all/{colorTid} */
  resolvedColorTid?: number;
  /** Category NID from resolve-path — for textile-products/{categoryNid} */
  resolvedCategoryNid?: number;
  /** Parent NID for category hub (arredo, illuminazione) — for categories/{nid} endpoint */
  hubParentNid?: number;
}) {
  const config = FILTER_REGISTRY[productType];
  if (!config) return null;

  const { listing, filters } = config;
  // Build basePath from the actual URL slug by matching leading segments against
  // the registry basePath. Only include slug segments that match the registry base —
  // filter segments (e.g. /textiles/bedcover) must not be included in basePath.
  const registryBaseSegments = (
    config.basePaths[locale] ?? config.basePaths['it']
  ).split('/');
  let matchCount = 0;
  for (let i = 0; i < registryBaseSegments.length && i < slug.length; i++) {
    if (
      decodeURIComponent(slug[i]).normalize('NFC') === registryBaseSegments[i]
    ) {
      matchCount++;
    } else {
      break;
    }
  }
  // Use at least 1 segment (the product type slug)
  const basePath = `/${locale}/${slug.slice(0, Math.max(1, matchCount)).join('/')}`;

  // Flatten searchParams to Record<string, string> for parseFiltersFromUrl
  const spRecord: Record<string, string> = {};
  if (sp) {
    Object.entries(sp).forEach(([k, v]) => {
      if (k !== 'page') spRecord[k] = Array.isArray(v) ? v[0] : v;
    });
  }
  const parsed = parseFiltersFromUrl(slug, spRecord, locale);

  // Determine if any P0 filter is active (drives hub vs product grid state)
  const p0Keys = Object.values(filters)
    .filter((f) => f.priority === 'P0')
    .map((f) => f.key);
  const hasActiveP0 = parsed.activeFilters.some((f) => p0Keys.includes(f.key));

  let products;
  let total;
  let filterOptions: Record<string, FilterOption[]> = {};

  // ── Subcategory override (?sub=slug) for category-based types ──────
  // Must run BEFORE product fetch so filterDefinitions are updated.
  const TYPOLOGY_TYPES = new Set([
    'prodotto_arredo',
    'prodotto_illuminazione',
    'prodotto_tessuto',
  ]);
  let subcategories:
    | { slug: string; label: string; nid?: number }[]
    | undefined;
  // When ?sub=slug is active, this holds the child NID to fetch products from
  let subCategoryNid: number | undefined;

  if (TYPOLOGY_TYPES.has(productType) && hasActiveP0) {
    const p0FilterKey = Object.values(filters).find(
      (f) => f.priority === 'P0',
    )?.key;
    if (p0FilterKey) {
      // Subcategory resolution via categories/{nid} endpoint.
      // When resolvedCategoryNid is set (from resolve-path), fetch its children.
      // (Legacy fetchCategoryOptions V4 endpoint is dead — 404)
      const activeP0 = parsed.activeFilters.find((f) => f.type === 'path');
      if (activeP0 && resolvedCategoryNid) {
        const { fetchHubCategories } = await import('@/lib/api/category-hub');
        const children = await fetchHubCategories(resolvedCategoryNid, locale);
        if (children.length > 0) {
          subcategories = children.map((child) => ({
            slug: child.name
              .normalize('NFC')
              .toLowerCase()
              .replace(/\s*\/\s*/g, '-')
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9\u00C0-\u024F\u0400-\u04FF-]/g, ''),
            label: child.name,
            nid: Number(child.nid),
          }));

          // If ?sub=slug is active, override the category filter to the subcategory
          // AND use the child's NID for the product fetch (instead of merging all children)
          const subParam = Array.isArray(sp?.sub) ? sp.sub[0] : sp?.sub;
          if (subParam && subcategories.some((sc) => sc.slug === subParam)) {
            const subMatch = subcategories.find((sc) => sc.slug === subParam)!;
            subCategoryNid = subMatch.nid;
            const catFieldIndex = parsed.filterDefinitions.findIndex(
              (fd) => fd.field === 'field_categoria.title',
            );
            if (catFieldIndex >= 0) {
              parsed.filterDefinitions[catFieldIndex] = {
                ...parsed.filterDefinitions[catFieldIndex],
                value: subMatch.label,
              };
            }
            parsed.activeFilters.push({
              key: 'sub',
              value: subParam,
              type: 'query',
              label: subMatch.label,
            });
          }
        }
      }
    }
  }

  // When resolvedCategoryNid is set, a specific category is selected
  // even if parseFiltersFromUrl didn't detect it (e.g. EN basePath = 'textiles/fabrics'
  // where the category IS the basePath). Skip hub mode and go to product grid.
  const forceProductGrid = resolvedCategoryNid != null;

  if (!hasActiveP0 && listing.categoryGroups.length > 0 && !forceProductGrid) {
    // ── State 1: Hub mode — show category cards, no product grid ──────────

    // Hub mode — category cards are rendered by Spec*Hub components that fetch
    // their own data (SpecHubMosaico, SpecHubArredo). No filter options needed here.
    filterOptions = {};

    products = undefined;
    total = undefined;
  } else {
    // ── State 2: Product grid mode — fetch products + all filter options ───

    // Build params for the factory based on the product type's param shape.
    // dual-tid types (mosaic, vetrite): tid1 = collectionTid, tid2 = colorTid
    // single-nid types (arredo, illuminazione, tessuto): nid = categoryNid
    // none (pixall): no params
    const isCategoryType =
      productType === 'prodotto_arredo' ||
      productType === 'prodotto_illuminazione' ||
      productType === 'prodotto_tessuto';

    // When ?sub=slug is active, fetch from the subcategory NID directly
    // instead of merging parent + all children.
    const effectiveCategoryNid = subCategoryNid ?? resolvedCategoryNid;

    const listingParams =
      productType === 'prodotto_mosaico' || productType === 'prodotto_vetrite'
        ? { tid1: resolvedTid ?? 'all', tid2: resolvedColorTid ?? 'all' }
        : isCategoryType
          ? { nid: effectiveCategoryNid ?? 'all' }
          : undefined;

    // For category-based types: if the category has children (e.g. "Seats" → Chairs + Stools),
    // fetch products from ALL children and merge. This handles parent categories that act as
    // groupings rather than direct product containers.
    // Skip merge when ?sub= is active — subCategoryNid targets a specific child.
    let productFetch: Promise<{
      products: import('@/lib/api/products').ProductCard[];
      total: number;
    }>;

    if (isCategoryType && effectiveCategoryNid != null && !subCategoryNid) {
      const { fetchHubCategories } = await import('@/lib/api/category-hub');
      const children = await fetchHubCategories(effectiveCategoryNid, locale);

      if (children.length > 0) {
        // Parent category with children — fetch products from parent + all children in parallel
        const allFetches = await Promise.all([
          fetchProductListing(productType, locale, {
            nid: effectiveCategoryNid,
          }),
          ...children.map((child) =>
            fetchProductListing(productType, locale, {
              nid: Number(child.nid),
            }),
          ),
        ]);
        const mergedProducts = allFetches.flatMap((r) => r.products);
        // Deduplicate by nid (a product might appear under both parent and child)
        const seen = new Set<string>();
        const deduped = mergedProducts.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        productFetch = Promise.resolve({
          products: deduped,
          total: deduped.length,
        });
      } else {
        productFetch = fetchProductListing(productType, locale, listingParams);
      }
    } else {
      productFetch = fetchProductListing(productType, locale, listingParams);
    }

    const [productResult, allFilterOptions] = await Promise.all([
      productFetch,
      fetchListingFilterOptions(productType, locale, hubParentNid),
    ]);
    products = productResult.products;
    total = productResult.total;
    filterOptions = allFilterOptions;
  }

  // ── Determine layout variant ──────────────────────────────────────────
  let variant: 'hub' | 'context-bar' | 'airy-header';
  if (!hasActiveP0 && listing.categoryGroups.length > 0 && !forceProductGrid) {
    variant = 'hub';
  } else if (hasActiveP0 || forceProductGrid) {
    variant = 'context-bar';
  } else {
    variant = 'airy-header';
  }

  // ── hasFilterPanel — false for hub, true when filters AND options exist ──
  const hasFilterOptions = Object.values(filterOptions).some(
    (opts) => opts.length > 0,
  );
  const hasFilterPanel =
    variant === 'hub'
      ? false
      : Object.keys(filters).length > 0 && hasFilterOptions;

  // ── Active P0 filter key (the one in the URL path, excluded from panel) ──
  const activePathP0 = parsed.activeFilters.find((f) => f.type === 'path');
  // For category-based types (arredo/illuminazione/tessuto), do NOT exclude the
  // subcategory filter from the sidebar — they have no P1 filters, so the sidebar
  // needs the full category list for navigation.
  const activePathFilterKey = TYPOLOGY_TYPES.has(productType)
    ? undefined
    : activePathP0?.key;

  // Base counts (P0-only) removed — V2 product-counts endpoint is dead (404).
  // Was adding 2-4s latency per filtered listing page.
  // TODO: re-add when Freddi creates new filter count endpoints.

  // ── Context-bar props: imageUrl / swatchColor from active P0 option ──
  let imageUrl: string | undefined;
  let swatchColor: string | undefined;

  if (variant === 'context-bar') {
    const activeP0 = activePathP0;
    if (activeP0) {
      const options = filterOptions[activeP0.key] ?? [];
      const activeOption = options.find((o) => o.slug === activeP0.value);
      if (activeOption?.imageUrl) {
        imageUrl = activeOption.imageUrl;
      } else if (activeOption?.cssColor) {
        swatchColor = activeOption.cssColor;
      }
    }
  }

  // ── Change popover content for context-bar (collections or colors) ──
  let changePopoverContent: React.ReactNode | undefined;

  if (variant === 'context-bar' && activePathP0) {
    // The popover shows the OTHER P0 options (same key as the active one)
    const popoverOptions = filterOptions[activePathP0.key] ?? [];
    const categoryGroup = listing.categoryGroups.find(
      (cg) => cg.filterKey === activePathP0.key,
    );
    const isColorSwatch = categoryGroup?.hasColorSwatch ?? false;
    const pathPrefix = filters[activePathP0.key]?.pathPrefix?.[locale];

    // For category-based types (arredo/illuminazione/tessuto), show only parents in popover
    const isTypologyType = TYPOLOGY_TYPES.has(productType);
    const filteredPopoverOptions = isTypologyType
      ? popoverOptions.filter((opt) => !opt.parentId)
      : popoverOptions.filter((opt) => !opt.label.includes(' - '));

    const popoverItems = filteredPopoverOptions.map((opt) => ({
      slug: opt.slug,
      label: opt.label,
      imageUrl: opt.imageUrl,
      cssColor: opt.cssColor,
      href: pathPrefix
        ? `${basePath}/${pathPrefix}/${opt.slug}`
        : `${basePath}/${opt.slug}`,
      isActive: opt.slug === activePathP0.value,
    }));

    const { CollectionPopoverContent } =
      await import('@/components/composed/CollectionPopoverContent');
    changePopoverContent = (
      <CollectionPopoverContent
        items={popoverItems}
        mode={isColorSwatch ? 'swatches' : 'list'}
      />
    );
  }

  // ── Deep dive links for hub mode (from Filter & Find mega-menu) ────
  const deepDiveLinks =
    variant === 'hub' ? await getHubDeepDiveLinks(productType, locale) : [];

  return (
    <ProductListingTemplate
      title={title}
      description={description}
      productType={productType}
      listingConfig={listing}
      filters={filters}
      filterOptions={filterOptions}
      activeFilters={parsed.activeFilters}
      filterDefinitions={parsed.filterDefinitions}
      hasActiveP0={hasActiveP0}
      products={products}
      total={total}
      currentSort={parsed.sort}
      basePath={basePath}
      locale={locale}
      variant={variant}
      hasFilterPanel={hasFilterPanel}
      imageUrl={imageUrl}
      swatchColor={swatchColor}
      backHref={basePath}
      changePopoverContent={changePopoverContent}
      subcategories={subcategories}
      activePathFilterKey={activePathFilterKey}
      deepDiveLinks={deepDiveLinks}
      hubParentNid={hubParentNid}
    />
  );
}
