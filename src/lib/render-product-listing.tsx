import { unstable_cache } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { parseFiltersFromUrl } from '@/domain/filters/search-params';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import type { FilterOption, ActiveFilter } from '@/domain/filters/registry';
import type { FilterDefinition } from '@/domain/filters/search-params';
import {
  fetchProductListing,
  resolveCollectionTidGroup,
  MOSAIC_COLLECTION_GROUPS,
} from '@/lib/api/product-listing-factory';
import { fetchListingFilterOptions } from '@/lib/api/filter-options';
import { resolvePath } from '@/lib/api/resolve-path';
import { getHubLinks } from '@/lib/navbar/hub-links';
import { ProductListingTemplate } from '@/templates/nodes/ProductListingTemplate';
import type { SecondaryLink } from '@/lib/navbar/types';
import type { ProductCard } from '@/lib/api/products';

// ── Plain-data shape returned by fetchListingData ─────────────────────────────

interface ListingData {
  products: ProductCard[] | undefined;
  total: number | undefined;
  filterOptions: Record<string, FilterOption[]>;
  variant: 'hub' | 'context-bar' | 'airy-header';
  hasFilterPanel: boolean;
  imageUrl: string | undefined;
  swatchColor: string | undefined;
  subcategories: { slug: string; label: string; nid?: number }[] | undefined;
  activePathFilterKey: string | undefined;
  deepDiveLinks: SecondaryLink[];
  crossLinks: SecondaryLink[];
  basePath: string;
  // Parsed filter state — plain serializable objects
  activeFilters: ActiveFilter[];
  filterDefinitions: FilterDefinition[];
  sort: string | undefined;
  hasActiveP0: boolean;
  // Client-side P0 filtering (mosaico collection)
  // Popover data (JSX is built in renderProductListing from these plain values)
  popoverItems:
    | {
        slug: string;
        label: string;
        imageUrl: string | undefined;
        cssColor: string | undefined;
        href: string;
        isActive: boolean;
      }[]
    | undefined;
  popoverIsColorSwatch: boolean;
}

// ── Inner data-fetch function (not yet wrapped) ───────────────────────────────
// Accepts the same params as renderProductListing minus title/description.

async function _fetchListingData(
  productType: string,
  slug: string[],
  searchParams: Record<string, string | string[]> | undefined,
  locale: string,
  resolvedTid: number | undefined,
  resolvedColorTid: number | undefined,
  resolvedCategoryNid: number | undefined,
  hubParentNid: number | undefined,
): Promise<ListingData> {
  const config = FILTER_REGISTRY[productType];
  // Caller guards against this, but satisfy type system
  if (!config) {
    return {
      products: undefined,
      total: undefined,
      filterOptions: {},
      variant: 'airy-header',
      hasFilterPanel: false,
      imageUrl: undefined,
      swatchColor: undefined,
      subcategories: undefined,
      activePathFilterKey: undefined,
      deepDiveLinks: [],
      crossLinks: [],
      basePath: `/${locale}`,
      activeFilters: [],
      filterDefinitions: [],
      sort: undefined,
      hasActiveP0: false,
      popoverItems: undefined,
      popoverIsColorSwatch: false,
    };
  }

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
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (k !== 'page') spRecord[k] = Array.isArray(v) ? v[0] : v;
    });
  }
  const parsed = parseFiltersFromUrl(slug, spRecord, locale);

  // Determine if any P0 filter is active (drives hub vs product grid state)
  const p0Keys = Object.values(filters)
    .filter((f) => f.priority === 'P0')
    .map((f) => f.key);
  const hasActiveP0 = parsed.activeFilters.some((f) => p0Keys.includes(f.key));

  let products: ProductCard[] | undefined;
  let total: number | undefined;
  let filterOptions: Record<string, FilterOption[]> = {};
  // Pre-launch promise for hub deep dive links — declared here so hub mode can
  // start the menu fetch concurrently with the sync variant/filter calculations.
  let hubLinksPromise: ReturnType<typeof getHubLinks> | undefined;

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
      // If the resolved category has no children (flat structure like illuminazione),
      // fall back to fetching siblings from hubParentNid.
      const activeP0 = parsed.activeFilters.find((f) => f.type === 'path');
      if (activeP0 && resolvedCategoryNid) {
        const { fetchHubCategories } = await import('@/lib/api/category-hub');
        const children = await fetchHubCategories(resolvedCategoryNid, locale);
        // Only populate subcategories when the resolved category has ACTUAL children
        // (arredo: sedute → sedie, sgabelli). Flat types (illuminazione, tessili)
        // have resolvedCategoryNid === hubParentNid so children are siblings —
        // those are already shown via categoryGroups, not as sub-subcategories.
        if (children.length > 0 && resolvedCategoryNid !== hubParentNid) {
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
          const subParam = Array.isArray(searchParams?.sub)
            ? searchParams.sub[0]
            : searchParams?.sub;
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
  // even if parseFiltersFromUrl didn't detect it. Skip hub mode and go to product grid.
  const forceProductGrid = resolvedCategoryNid != null;

  if (!hasActiveP0 && listing.categoryGroups.length > 0 && !forceProductGrid) {
    // ── State 1: Hub mode — show category cards, no product grid ──────────

    filterOptions = {};
    products = undefined;
    total = undefined;

    // Pre-launch menu fetch for deep dive links so it runs concurrently with
    // the sync variant/filter calculations below.
    hubLinksPromise = getHubLinks(productType, locale);
  } else {
    // ── State 2: Product grid mode — fetch products + all filter options ───

    // Start filter options fetch immediately — runs concurrently with fetchHubCategories below.
    const filterOptionsPromise = fetchListingFilterOptions(
      productType,
      locale,
      hubParentNid,
    );

    const isCategoryType =
      productType === 'prodotto_arredo' ||
      productType === 'prodotto_illuminazione' ||
      productType === 'prodotto_tessuto';

    const effectiveCategoryNid = subCategoryNid ?? resolvedCategoryNid;

    // Resolve query-param filter TIDs (shape, finish, and second P0 as query).
    // filterOptions are already being fetched — await them to map slug → TID.
    let shapeTid: number | undefined;
    let finishTid: number | undefined;
    let tipologiaTid: number | undefined;
    let queryCollectionTid: number | undefined;
    let queryColorTid: number | undefined;
    if (
      productType === 'prodotto_mosaico' ||
      productType === 'prodotto_vetrite'
    ) {
      const shapeFilter = parsed.activeFilters.find((f) => f.key === 'shape');
      const finishFilter = parsed.activeFilters.find((f) => f.key === 'finish');
      // Second P0 as query param (e.g. /mosaico/blends?color=navy-blu)
      const colorQueryFilter = parsed.activeFilters.find(
        (f) => f.key === 'color' && f.type === 'query',
      );
      const collectionQueryFilter = parsed.activeFilters.find(
        (f) => f.key === 'collection' && f.type === 'query',
      );

      // Resolve shape/finish TIDs from filterOptions (they have tid as id)
      if (shapeFilter || finishFilter) {
        const opts = await filterOptionsPromise;
        if (shapeFilter && opts.shape) {
          const match = opts.shape.find((o) => o.slug === shapeFilter.value);
          if (match?.id) shapeTid = Number(match.id);
        }
        if (finishFilter && opts.finish) {
          const match = opts.finish.find((o) => o.slug === finishFilter.value);
          if (match?.id) finishTid = Number(match.id);
        }
      }

      // Resolve P0 query params via resolve-path (slug → TID).
      // Collections/colors hub endpoints don't include TID, so we resolve
      // the Drupal path alias to get the taxonomy term ID.
      if (colorQueryFilter) {
        const colorPrefix =
          config.filters['color']?.pathPrefix?.[locale] ??
          config.filters['color']?.pathPrefix?.['it'] ??
          'colori';
        const colorPath = `/${config.basePaths[locale] ?? config.basePaths['it']}/${colorPrefix}/${colorQueryFilter.value}`;
        const resolved = await resolvePath(colorPath, locale);
        if (resolved) queryColorTid = resolved.nid;
      }
      if (collectionQueryFilter) {
        const collPath = `/${config.basePaths[locale] ?? config.basePaths['it']}/${collectionQueryFilter.value}`;
        const resolved = await resolvePath(collPath, locale);
        if (resolved) queryCollectionTid = resolved.nid;
      }
    }

    // Resolve tessuto tipologia TID from query param slug → TID via filterOptions
    if (productType === 'prodotto_tessuto') {
      const tipologiaFilter = parsed.activeFilters.find(
        (f) => f.key === 'tipologia',
      );
      if (tipologiaFilter) {
        const opts = await filterOptionsPromise;
        if (opts.tipologia) {
          const match = opts.tipologia.find(
            (o) => o.slug === tipologiaFilter.value,
          );
          if (match?.id) tipologiaTid = Number(match.id);
        }
      }
    }

    // Effective TIDs: path-resolved takes priority, query-resolved as fallback
    const effectiveCollectionTid = resolvedTid ?? queryCollectionTid;
    const effectiveColorTid = resolvedColorTid ?? queryColorTid;

    const listingParams: import('@/lib/api/product-listing-factory').ListingParams =
      productType === 'prodotto_mosaico' || productType === 'prodotto_vetrite'
        ? {
            tid1: resolveCollectionTidGroup(effectiveCollectionTid ?? 'all'),
            tid2: effectiveColorTid ?? 'all',
            shapeTid,
            finishTid,
          }
        : isCategoryType
          ? productType === 'prodotto_tessuto'
            ? { nid: effectiveCategoryNid ?? 'all', tipologiaTid }
            : { nid: effectiveCategoryNid ?? 'all' }
          : undefined;

    let productFetch: Promise<{
      products: ProductCard[];
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
        // Deduplicate by nid
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
      filterOptionsPromise,
    ]);
    products = productResult.products;
    total = productResult.total;
    filterOptions = allFilterOptions;

    // ── Mosaic cross-filtering: merge faceted counts into all 4 filter dimensions ──
    if (productType === 'prodotto_mosaico') {
      const { fetchMosaicProductCounts } = await import('@/lib/api/mosaic-hub');

      // For collection groups (NeoColibrì=72→74+75+76, Neoglass=67→77+78+79),
      // the parent TID has 0 products — counts must be fetched per sub-collection
      // and summed. Same endpoints, parallel fetches.
      const collectionGroup = effectiveCollectionTid
        ? resolveCollectionTidGroup(effectiveCollectionTid)
        : 'all';
      const subTids =
        typeof collectionGroup === 'string' && collectionGroup.includes('+')
          ? collectionGroup
              .split('+')
              .map(Number)
              // Exclude the parent TID — it has 0 products (all products are in children)
              .filter((tid) => tid !== effectiveCollectionTid)
          : null;

      // Fetch two sets of counts in parallel:
      // 1. `counts` — with ALL active filters (P0 + P1) → used for P1 filter counts
      // 2. `baseCounts` — with only P0 filters (no shape/finish) → used as baseCount
      //    to distinguish "collection doesn't exist for this color" (baseCount=0 → hide)
      //    from "collection exists but no products with this finish" (baseCount>0, count=0 → dim)
      const hasP1Filters = shapeTid != null || finishTid != null;

      type CountItem = { tid: number; name: string; count: number };
      const sumByKey = (
        results: Awaited<ReturnType<typeof fetchMosaicProductCounts>>[],
        dimension: 'shapes' | 'finishes' | 'collections' | 'colors',
      ): CountItem[] => {
        const map = new Map<number, CountItem>();
        for (const result of results) {
          for (const item of result[dimension]) {
            const existing = map.get(item.tid);
            if (existing) {
              existing.count += item.count;
            } else {
              map.set(item.tid, { ...item });
            }
          }
        }
        return Array.from(map.values());
      };

      let counts: Awaited<ReturnType<typeof fetchMosaicProductCounts>>;
      let baseCounts: Awaited<
        ReturnType<typeof fetchMosaicProductCounts>
      > | null = null;

      if (subTids) {
        const [subResults, baseSubResults] = await Promise.all([
          Promise.all(
            subTids.map((tid) =>
              fetchMosaicProductCounts(
                locale,
                tid,
                effectiveColorTid,
                shapeTid,
                finishTid,
              ),
            ),
          ),
          hasP1Filters
            ? Promise.all(
                subTids.map((tid) =>
                  fetchMosaicProductCounts(
                    locale,
                    tid,
                    effectiveColorTid,
                    undefined,
                    undefined,
                  ),
                ),
              )
            : null,
        ]);
        counts = {
          shapes: sumByKey(subResults, 'shapes'),
          finishes: sumByKey(subResults, 'finishes'),
          collections: sumByKey(subResults, 'collections'),
          colors: sumByKey(subResults, 'colors'),
        };
        if (baseSubResults) {
          baseCounts = {
            shapes: sumByKey(baseSubResults, 'shapes'),
            finishes: sumByKey(baseSubResults, 'finishes'),
            collections: sumByKey(baseSubResults, 'collections'),
            colors: sumByKey(baseSubResults, 'colors'),
          };
        }
      } else {
        const [mainCounts, mainBaseCounts] = await Promise.all([
          fetchMosaicProductCounts(
            locale,
            effectiveCollectionTid ?? 'all',
            effectiveColorTid,
            shapeTid,
            finishTid,
          ),
          hasP1Filters
            ? fetchMosaicProductCounts(
                locale,
                effectiveCollectionTid ?? 'all',
                effectiveColorTid,
                undefined,
                undefined,
              )
            : null,
        ]);
        counts = mainCounts;
        baseCounts = mainBaseCounts;
      }

      // Helper: merge counts into filter options.
      // Matches by TID (opt.id) first, then falls back to name (opt.label)
      // because collections/colors hub endpoints don't include TID.
      // When baseCountItems is provided, sets baseCount (P0-only count) so the UI
      // can distinguish "doesn't exist" (baseCount=0 → hide) from "filtered out
      // by P1" (baseCount>0, count=0 → dim).
      const mergeCounts = (
        options: FilterOption[] | undefined,
        countItems: { tid: number; name: string; count: number }[],
        baseCountItems?: { tid: number; name: string; count: number }[],
      ): FilterOption[] | undefined => {
        if (!options || countItems.length === 0) return options;
        const byTid = new Map(countItems.map((c) => [String(c.tid), c.count]));
        const byName = new Map(countItems.map((c) => [c.name, c.count]));
        const baseTid = baseCountItems
          ? new Map(baseCountItems.map((c) => [String(c.tid), c.count]))
          : null;
        const baseName = baseCountItems
          ? new Map(baseCountItems.map((c) => [c.name, c.count]))
          : null;
        return options.map((opt) => {
          const count = byTid.get(opt.id ?? '') ?? byName.get(opt.label) ?? 0;
          return {
            ...opt,
            count,
            // When no P1 is active, baseCount = count (same thing — no P1 distinction).
            // This ensures hideZeroCount hides count=0 options instead of dimming them.
            baseCount: baseTid
              ? (baseTid.get(opt.id ?? '') ?? baseName?.get(opt.label) ?? 0)
              : count,
          };
        });
      };

      // Special merge for collections: NeoColibrì/Neoglass are single entries
      // in the hub but split into sub-collections (Barrels/Cubes/Domes) in counts.
      // Sum sub-collection counts for each parent group.
      const mergeCollectionCounts = (
        options: FilterOption[] | undefined,
        countItems: { tid: number; name: string; count: number }[],
        baseCountItems?: { tid: number; name: string; count: number }[],
      ): FilterOption[] | undefined => {
        if (!options || countItems.length === 0) return options;

        // Build a reverse map: sub-collection TID → parent TID
        const subToParent = new Map<number, number>();
        for (const [parentTid, groupStr] of Object.entries(
          MOSAIC_COLLECTION_GROUPS,
        )) {
          const parent = Number(parentTid);
          for (const tid of groupStr.split('+').map(Number)) {
            if (tid !== parent) subToParent.set(tid, parent);
          }
        }

        const sumGroup = (
          items: { tid: number; name: string; count: number }[],
        ) => {
          const byName = new Map<string, number>();
          for (const item of items) {
            const parentTid = subToParent.get(item.tid);
            if (parentTid != null) {
              const parentOpt = options.find(
                (o) =>
                  o.id === String(parentTid) ||
                  item.name.toLowerCase().startsWith(o.label.toLowerCase()),
              );
              if (parentOpt) {
                byName.set(
                  parentOpt.label,
                  (byName.get(parentOpt.label) ?? 0) + item.count,
                );
                continue;
              }
            }
            byName.set(item.name, (byName.get(item.name) ?? 0) + item.count);
          }
          return byName;
        };

        const byName = sumGroup(countItems);
        const baseByName = baseCountItems ? sumGroup(baseCountItems) : null;

        return options.map((opt) => {
          const count = byName.get(opt.label) ?? 0;
          return {
            ...opt,
            count,
            baseCount: baseByName ? (baseByName.get(opt.label) ?? 0) : count,
          };
        });
      };

      const mergedShape = mergeCounts(
        filterOptions.shape,
        counts.shapes,
        baseCounts?.shapes,
      );
      const mergedFinish = mergeCounts(
        filterOptions.finish,
        counts.finishes,
        baseCounts?.finishes,
      );
      const mergedCollection = mergeCollectionCounts(
        filterOptions.collection,
        counts.collections,
        baseCounts?.collections,
      );
      const mergedColor = mergeCounts(
        filterOptions.color,
        counts.colors,
        baseCounts?.colors,
      );
      if (mergedShape) filterOptions.shape = mergedShape;
      if (mergedFinish) filterOptions.finish = mergedFinish;
      if (mergedCollection) filterOptions.collection = mergedCollection;
      if (mergedColor) filterOptions.color = mergedColor;
    }

    // ── Vetrite cross-filtering: merge faceted counts into 3 filter dimensions ──
    if (productType === 'prodotto_vetrite') {
      const { fetchVetriteProductCounts } =
        await import('@/lib/api/vetrite-hub');

      // Fetch two sets of counts in parallel when a P1 filter (finish) is active:
      // 1. `counts` — with ALL active filters (P0 + P1) → used for P1 filter counts
      // 2. `baseCounts` — with only P0 filters (no finish) → used as baseCount
      //    to distinguish "collection doesn't exist for this color" (baseCount=0 → hide)
      //    from "collection exists but no products with this finish" (baseCount>0, count=0 → dim)
      const hasP1Filters = finishTid != null;

      const [counts, baseCounts] = await Promise.all([
        fetchVetriteProductCounts(
          locale,
          effectiveCollectionTid ?? 'all',
          effectiveColorTid,
          finishTid,
        ),
        hasP1Filters
          ? fetchVetriteProductCounts(
              locale,
              effectiveCollectionTid ?? 'all',
              effectiveColorTid,
              undefined,
            )
          : null,
      ]);

      // Helper: merge counts into filter options.
      // Matches by TID (opt.id) first, then falls back to name (opt.label)
      // because collections/colors hub endpoints don't include TID.
      // When baseCountItems is provided, sets baseCount (P0-only count) so the UI
      // can distinguish "doesn't exist" (baseCount=0 → hide) from "filtered out
      // by P1" (baseCount>0, count=0 → dim).
      const mergeCounts = (
        options: FilterOption[] | undefined,
        countItems: { tid: number; name: string; count: number }[],
        baseCountItems?: { tid: number; name: string; count: number }[],
      ): FilterOption[] | undefined => {
        if (!options || countItems.length === 0) return options;
        const byTid = new Map(countItems.map((c) => [String(c.tid), c.count]));
        const byName = new Map(countItems.map((c) => [c.name, c.count]));
        const baseTid = baseCountItems
          ? new Map(baseCountItems.map((c) => [String(c.tid), c.count]))
          : null;
        const baseName = baseCountItems
          ? new Map(baseCountItems.map((c) => [c.name, c.count]))
          : null;
        return options.map((opt) => {
          const count = byTid.get(opt.id ?? '') ?? byName.get(opt.label) ?? 0;
          return {
            ...opt,
            count,
            // When no P1 is active, baseCount = count (same thing — no P1 distinction).
            // This ensures hideZeroCount hides count=0 options instead of dimming them.
            baseCount: baseTid
              ? (baseTid.get(opt.id ?? '') ?? baseName?.get(opt.label) ?? 0)
              : count,
          };
        });
      };

      const mergedFinish = mergeCounts(
        filterOptions.finish,
        counts.finishes,
        baseCounts?.finishes,
      );
      const mergedCollection = mergeCounts(
        filterOptions.collection,
        counts.collections,
        baseCounts?.collections,
      );
      const mergedColor = mergeCounts(
        filterOptions.color,
        counts.colors,
        baseCounts?.colors,
      );
      if (mergedFinish) filterOptions.finish = mergedFinish;
      if (mergedCollection) filterOptions.collection = mergedCollection;
      if (mergedColor) filterOptions.color = mergedColor;
    }

    // ── Tessuto cross-filtering: merge faceted counts into tipologia filter ──
    if (productType === 'prodotto_tessuto' && filterOptions.tipologia) {
      const { fetchTessutoProductCounts } =
        await import('@/lib/api/category-hub');

      const counts = await fetchTessutoProductCounts(
        locale,
        effectiveCategoryNid,
      );

      // Merge counts into tipologia options. When counts is empty (e.g. Tappeti
      // has 0 tipologie), set count=0 on all options so they get hidden/dimmed.
      const countItems = counts.tipologie;
      if (countItems.length > 0) {
        const byTid = new Map(countItems.map((c) => [String(c.tid), c.count]));
        const byName = new Map(countItems.map((c) => [c.name, c.count]));
        filterOptions.tipologia = filterOptions.tipologia.map((opt) => ({
          ...opt,
          count: byTid.get(opt.id ?? '') ?? byName.get(opt.label) ?? 0,
        }));
      } else {
        // No counts = no products for any tipologia in this category → all zero
        filterOptions.tipologia = filterOptions.tipologia.map((opt) => ({
          ...opt,
          count: 0,
        }));
      }
    }
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

  // ── hasFilterPanel — false for hub, true when filter options exist ──
  const hasFilterOptions = Object.values(filterOptions).some(
    (opts) => opts.length > 0,
  );
  const hasFilterPanel = variant === 'hub' ? false : hasFilterOptions;

  // ── Active P0 filter key (the one in the URL path, excluded from panel) ──
  const activePathP0 = parsed.activeFilters.find((f) => f.type === 'path');
  const activePathFilterKey = TYPOLOGY_TYPES.has(productType)
    ? undefined
    : activePathP0?.key;

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

  // ── Popover data — build plain items list (JSX built in renderProductListing) ──
  let popoverItems:
    | {
        slug: string;
        label: string;
        imageUrl: string | undefined;
        cssColor: string | undefined;
        href: string;
        isActive: boolean;
      }[]
    | undefined;
  let popoverIsColorSwatch = false;

  if (variant === 'context-bar' && activePathP0) {
    const popoverOptions = filterOptions[activePathP0.key] ?? [];
    const categoryGroup = listing.categoryGroups.find(
      (cg) => cg.filterKey === activePathP0.key,
    );
    popoverIsColorSwatch = categoryGroup?.hasColorSwatch ?? false;
    const pathPrefix = filters[activePathP0.key]?.pathPrefix?.[locale];

    const isTypologyType = TYPOLOGY_TYPES.has(productType);
    const filteredPopoverOptions = (
      isTypologyType
        ? popoverOptions.filter((opt) => !opt.parentId)
        : popoverOptions.filter((opt) => !opt.label.includes(' - '))
    ).filter((opt) => {
      // Use baseCount (P0-only) to hide genuinely non-existent options.
      // count=0 with baseCount>0 means option exists but filtered by P1 — keep it.
      const guard = opt.baseCount ?? opt.count;
      return guard == null || guard > 0;
    });

    popoverItems = filteredPopoverOptions.map((opt) => ({
      slug: opt.slug,
      label: opt.label,
      imageUrl: opt.imageUrl,
      cssColor: opt.cssColor,
      href: pathPrefix
        ? `${basePath}/${pathPrefix}/${opt.slug}`
        : `${basePath}/${opt.slug}`,
      isActive: opt.slug === activePathP0.value,
    }));
  }

  // ── Deep dive + cross links for hub mode ──────────────────────────────
  const hubLinks =
    variant === 'hub'
      ? await (hubLinksPromise ?? getHubLinks(productType, locale))
      : { deepDiveLinks: [], crossLinks: [] };

  return {
    products,
    total,
    filterOptions,
    variant,
    hasFilterPanel,
    imageUrl,
    swatchColor,
    subcategories,
    activePathFilterKey,
    deepDiveLinks: hubLinks.deepDiveLinks,
    crossLinks: hubLinks.crossLinks,
    basePath,
    activeFilters: parsed.activeFilters,
    filterDefinitions: parsed.filterDefinitions,
    sort: parsed.sort,
    hasActiveP0,
    popoverItems,
    popoverIsColorSwatch,
  };
}

// ── unstable_cache wrapper ────────────────────────────────────────────────────
// Must be created ONCE at module scope — not per-request.
// Next.js auto-appends all serialized function arguments to the base key,
// giving per-(productType, locale, slug, searchParams, ...) cache isolation.
// Tags: 'listing' only (static) — use revalidateTag('listing') for on-demand
// invalidation. Per-productType tags require dynamic cacheTag() ('use cache').
const _cachedFetchListingData = unstable_cache(_fetchListingData, ['listing'], {
  revalidate: 300,
  tags: ['listing'],
});

// ── Helper: renderizza listing prodotti con ProductListingTemplate ─────────
// Replaces the old renderListingLayout (SpecFilterSidebar + ProductListing grid).
// Uses FILTER_REGISTRY to determine state (hub with category cards vs product grid)
// and fetches data accordingly.
//
// Two-layer caching:
//   1. apiGet() within _fetchListingData uses next: { revalidate } (Data Cache).
//   2. _fetchListingData itself is wrapped with unstable_cache (Full Route Cache
//      for the plain-data payload, keyed on all filter-relevant params, 300s TTL).
//   JSX construction (changePopoverContent) stays outside the cache since
//   React nodes are not serializable.
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

  const tNav = await getTranslations('nav');
  const tBreadcrumb = await getTranslations('breadcrumb');
  const tProducts = await getTranslations('products');

  // Fetch all plain data — module-scope cached function (unstable_cache, 300s TTL).
  // Argument order matches _fetchListingData signature; Next.js auto-appends them to the cache key.
  const data = await _cachedFetchListingData(
    productType,
    slug,
    sp,
    locale,
    resolvedTid,
    resolvedColorTid,
    resolvedCategoryNid,
    hubParentNid,
  );

  // ── Build changePopoverContent JSX (not cacheable — React nodes) ──────────
  let changePopoverContent: React.ReactNode | undefined;

  if (data.variant === 'context-bar' && data.popoverItems) {
    const { CollectionPopoverContent } =
      await import('@/components/composed/CollectionPopoverContent');
    changePopoverContent = (
      <CollectionPopoverContent
        items={data.popoverItems}
        mode={data.popoverIsColorSwatch ? 'swatches' : 'list'}
      />
    );
  }

  return (
    <ProductListingTemplate
      title={title}
      description={description}
      productType={productType}
      listingConfig={config.listing}
      filters={config.filters}
      filterOptions={data.filterOptions}
      activeFilters={data.activeFilters}
      filterDefinitions={data.filterDefinitions}
      hasActiveP0={data.hasActiveP0}
      products={data.products}
      total={data.total}
      currentSort={data.sort}
      basePath={data.basePath}
      locale={locale}
      variant={data.variant}
      hasFilterPanel={data.hasFilterPanel}
      imageUrl={data.imageUrl}
      swatchColor={data.swatchColor}
      backHref={data.basePath}
      changePopoverContent={changePopoverContent}
      subcategories={data.subcategories}
      activePathFilterKey={data.activePathFilterKey}
      deepDiveLinks={data.deepDiveLinks}
      crossLinks={data.crossLinks}
      hubParentNid={hubParentNid}
      tNav={(key: string) => tNav(key)}
      tBreadcrumb={(key: string) => tBreadcrumb(key)}
      tProducts={(key: string) => tProducts(key)}
    />
  );
}
