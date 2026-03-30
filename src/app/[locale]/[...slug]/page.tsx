import { cache } from 'react';
import { notFound } from 'next/navigation';
// fetchEntity (C1 legacy) removed — replaced by content/{nid} + blocks/{nid}
import { resolvePath } from '@/lib/api/resolve-path';
import { fetchContent } from '@/lib/api/content';
import { fetchBlocks } from '@/lib/api/blocks';
import { fetchMosaicProduct } from '@/lib/api/mosaic-product';
import { fetchVetriteProduct } from '@/lib/api/vetrite-product';
import type { VetriteProduct } from '@/lib/api/vetrite-product';
import { fetchTextileProduct } from '@/lib/api/textile-product';
import type { TextileProduct } from '@/lib/api/textile-product';
import { fetchPixallProduct } from '@/lib/api/pixall-product';
import type { PixallProduct } from '@/lib/api/pixall-product';
import { fetchMosaicProductListing } from '@/lib/api/mosaic-product-listing';
import { fetchVetriteProductListing } from '@/lib/api/vetrite-product-listing';
import { fetchPixallProductListing } from '@/lib/api/pixall-product-listing';
import { fetchTextileProductListing } from '@/lib/api/textile-product-listing';
import { fetchArredoProductListing } from '@/lib/api/arredo-product-listing';
import { fetchIlluminazioneProductListing } from '@/lib/api/illuminazione-product-listing';
import { fetchIlluminazioneProduct } from '@/lib/api/illuminazione-product';
import type { IlluminazioneProduct } from '@/lib/api/illuminazione-product';
import { fetchArredoProduct } from '@/lib/api/arredo-product';
import type { ArredoProduct } from '@/lib/api/arredo-product';
import {
  vetriteToLegacyNode,
  textileToLegacyNode,
  pixallToLegacyNode,
  illuminazioneToLegacyNode,
  arredoToLegacyNode,
} from '@/lib/adapters/legacy-node-adapters';
import { getComponentName } from '@/lib/node-resolver';
import UnknownEntity from '@/components_legacy/UnknownEntity';
import { getSectionConfigAsync } from '@/domain/routing/section-config';
import { getRoutingRegistry } from '@/domain/routing/routing-registry';
import { parseFiltersFromUrl } from '@/domain/filters/search-params';
// fetchAllFilterOptions removed — all V3/V4 legacy endpoints are dead
// fetchProducts (V1 legacy) removed — all product types use type-specific listing endpoints
import { FILTER_REGISTRY, deslugify } from '@/domain/filters/registry';
import type { FilterOption } from '@/domain/filters/registry';
import { getHubDeepDiveLinks } from '@/lib/navbar/hub-links';
import { ProductListingTemplate } from '@/templates/nodes/ProductListingTemplate';
import { MosaicProductPreview } from '@/templates/nodes/MosaicProductPreview';
import ProjectListing from '@/components_legacy/ProjectListing';
import EnvironmentListing from '@/components_legacy/EnvironmentListing';
import BlogListing from '@/components_legacy/BlogListing';
import ShowroomListing from '@/components_legacy/ShowroomListing';
import DocumentListing from '@/components_legacy/DocumentListing';
import {
  fetchEnvironments,
  fetchShowrooms,
  fetchProjects,
  fetchBlogPosts,
  fetchDocuments,
} from '@/lib/api/listings';

// Node components
import Page from '@/templates/nodes/Page';
import LandingPage from '@/templates/nodes/LandingPage';
import ProdottoMosaico from '@/templates/nodes/ProdottoMosaico';
import ProdottoArredo from '@/templates/nodes/ProdottoArredo';
import ProdottoIlluminazione from '@/templates/nodes/ProdottoIlluminazione';
import ProdottoPixall from '@/templates/nodes/ProdottoPixall';
import ProdottoTessuto from '@/templates/nodes/ProdottoTessuto';
import ProdottoVetrite from '@/templates/nodes/ProdottoVetrite';
import Articolo from '@/templates/nodes/Articolo';
import News from '@/templates/nodes/News';
import Tutorial from '@/templates/nodes/Tutorial';
import Progetto from '@/templates/nodes/Progetto';
import Showroom from '@/templates/nodes/Showroom';
import Ambiente from '@/templates/nodes/Ambiente';
import Categoria from '@/templates/nodes/Categoria';
import CategoriaBlog from '@/templates/nodes/CategoriaBlog';
import Documento from '@/templates/nodes/Documento';
import Tag from '@/templates/nodes/Tag';
import ProductsMasterPage from '@/templates/nodes/ProductsMasterPage';

// Taxonomy components
import MosaicoCollezione from '@/templates/taxonomy/MosaicoCollezione';
import MosaicoColore from '@/templates/taxonomy/MosaicoColore';
import VetriteCollezione from '@/templates/taxonomy/VetriteCollezione';
import VetriteColore from '@/templates/taxonomy/VetriteColore';
import TaxonomyTerm from '@/templates/taxonomy/TaxonomyTerm';

/**
 * React.cache() deduplicates identical calls within the same request.
 * Both generateMetadata() and SlugPage() call this with the same args,
 * so the second call returns the cached result — eliminating the double fetch.
 *
 * Primary path: resolvePath → fetchContent + fetchBlocks in parallel.
 * Fallback: fetchEntity (C1) — used when content/blocks endpoints return null.
 */
const getPageData = cache(async (locale: string, drupalPath: string) => {
  // PRIMARY: resolve-path → content/{nid} + blocks/{nid}
  const resolved = await resolvePath(drupalPath, locale);
  if (resolved) {
    const [contentData, blocksData] = await Promise.all([
      fetchContent(resolved.nid, locale),
      fetchBlocks(resolved.nid, locale),
    ]);
    if (contentData) {
      return {
        ...contentData,
        type: `${resolved.type}--${resolved.bundle}`,
        id: String(resolved.nid),
        _nid: resolved.nid,
        field_blocchi: blocksData,
      } as Record<string, unknown>;
    }
  }

  // FALLBACK: C1 entity endpoint — DISABLED.
  // C1 is dead (returns HTML, ~6s timeout). All entity types now use content+blocks.
  // Product types (prodotto_*) are not covered by content/{nid} — they use type-specific
  // fetchers (mosaic-product, vetrite-product, etc.) in Stage 1.5 of SlugPage.
  // Keeping fetchEntity call commented for rollback reference.
  // const entity = await fetchEntity(drupalPath, locale);
  // if (!entity) return null;
  return null;
});

// Fallback: used when registry is null (Drupal menu unavailable).
// Slug che devono bypassare translatePath perché Drupal ha nodi (categoria_blog,
// documento, page) con lo stesso alias che verrebbero renderizzati al posto del
// listing prodotti corretto. getSectionConfig gestisce il productType.
const LISTING_SLUG_OVERRIDES = new Set([
  // Mosaico — collide con categoria_blog in IT e ES
  'mosaico', // IT + ES
  'mosaic', // EN
  'mosaïque', // FR
  'mosaik', // DE
  'мозаика', // RU
  // Arredo
  'arredo', // IT
  'furniture-and-accessories', // EN
  'ameublement', // FR
  'einrichtung', // DE
  'mueble', // ES
  'обстановка', // RU
  'furniture',
  'mobilier',
  'moebel', // legacy
  // Illuminazione
  'illuminazione', // IT
  'lighting', // EN
  'éclairage', // FR
  'leuchten', // DE
  'iluminación', // ES
  'освещение', // RU
  // Pixall — collide con documento NID 2547
  'pixall',
  // Vetrite — slug localizzati (le pagine dedicate hanno priorità sul catch-all)
  'lastre-vetro-vetrite', // IT
  'vetrite-glass-slabs', // EN
  'plaque-en-verre-vetrite', // FR
  'glasscheibe-vetrite', // DE
  'láminas-de-vidrio-vetrite', // ES
  'стеклянные-листы-vetrite', // RU
  // Tessili — slug singoli categoria tessuto (path reali Drupal)
  'arazzi',
  'coperte',
  'tappeti',
  'cuscini', // IT
  'tapestries',
  'bedcover',
  'carpets',
  'cushions', // EN
  'tapisseries',
  'couvertures',
  'tapis',
  'coussins', // FR
  'wandteppiche',
  'decken',
  'teppiche',
  'kissen', // DE
  'tapices',
  'mantas',
  'alfombras',
  'cojines', // ES
  'гобелены',
  'одеяла',
  'ковры',
  'подушки', // RU
  // Legacy aliases tessili
  'tessili',
  'tessuti',
  'fabrics',
  'tissus',
  'stoffe',
  'telas',
]);

// Products master page slugs — one per locale.
// Must be checked BEFORE LISTING_SLUG_OVERRIDES because "prodotti" is a
// single-slug path that should render the master page, not a product listing.
const PRODUCTS_MASTER_SLUGS = new Set([
  'prodotti', // IT
  'products', // EN
  'produits', // FR
  'produkte', // DE
  'productos', // ES
  'продукция', // RU
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENT_MAP: Record<
  string,
  React.ComponentType<{
    node: any;
    currentPage?: number;
    pageSize?: number;
    basePath?: string;
    searchParams?: Record<string, string | string[]>;
  }>
> = {
  Page,
  LandingPage,
  ProdottoMosaico,
  ProdottoArredo,
  ProdottoIlluminazione,
  ProdottoPixall,
  ProdottoTessuto,
  ProdottoVetrite,
  Articolo,
  News,
  Tutorial,
  Progetto,
  Showroom,
  Ambiente,
  Categoria,
  CategoriaBlog,
  Documento,
  Tag,
  MosaicoCollezione,
  MosaicoColore,
  VetriteCollezione,
  VetriteColore,
  TaxonomyTerm,
};

const PAGE_SIZE = 48;

// ── Helper: renderizza listing prodotti con ProductListingTemplate ─────────
// Replaces the old renderListingLayout (SpecFilterSidebar + ProductListing grid).
// Uses FILTER_REGISTRY to determine state (hub with category cards vs product grid)
// and fetches data accordingly.
async function renderProductListing({
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
  let subcategories: { slug: string; label: string }[] | undefined;

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
          }));

          // If ?sub=slug is active, override the category filter to the subcategory
          const subParam = Array.isArray(sp?.sub) ? sp.sub[0] : sp?.sub;
          if (subParam && subcategories.some((sc) => sc.slug === subParam)) {
            const subLabel = subcategories.find(
              (sc) => sc.slug === subParam,
            )!.label;
            const catFieldIndex = parsed.filterDefinitions.findIndex(
              (fd) => fd.field === 'field_categoria.title',
            );
            if (catFieldIndex >= 0) {
              parsed.filterDefinitions[catFieldIndex] = {
                ...parsed.filterDefinitions[catFieldIndex],
                value: subLabel,
              };
            }
            parsed.activeFilters.push({
              key: 'sub',
              value: subParam,
              type: 'query',
              label: subLabel,
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

    // Category-based hubs (arredo, illuminazione) fetch their own data inside
    // SpecHubArredo via fetchHubCategories. Skip legacy filter/count fetches
    // (V4 category-options + V2 product-counts endpoints are dead).
    // ALL hub types fetch internally — legacy V3/V4 endpoints are dead (404).
    // Mosaico/Vetrite: SpecHubMosaico fetches via mosaic-hub/vetrite-hub
    // Arredo/Illuminazione/Tessuto: SpecHubArredo fetches via category-hub
    // Pixall: no hub mode (categoryGroups: [])
    const SELF_FETCHING_HUBS = new Set([
      'prodotto_mosaico',
      'prodotto_vetrite',
      'prodotto_arredo',
      'prodotto_illuminazione',
      'prodotto_tessuto',
    ]);
    // All hub types fetch internally — filterOptions not needed in hub mode.
    // SpecHubMosaico/SpecHubArredo handle their own data fetching.
    filterOptions = {};

    products = undefined;
    total = undefined;
  } else {
    // ── State 2: Product grid mode — fetch products + all filter options ───
    const pageStr = Array.isArray(sp?.page) ? sp.page[0] : sp?.page;
    const currentPage = Math.max(1, parseInt((pageStr as string) ?? '1', 10));
    const offset = (currentPage - 1) * listing.pageSize;

    // When resolvedTid or resolvedColorTid is available (from resolve-path),
    // use the new TID-based listing endpoints directly — avoids the broken products (legacy)
    // endpoint and the extra taxonomy name→TID lookup.
    const hasResolvedTid = resolvedTid != null || resolvedColorTid != null;
    // ALL product types now use new listing endpoints — legacy fetchProducts (V1) is dead (404).
    // Mosaico/vetrite use 'all' when no TID resolved; tessuto uses 'all' when no category resolved.
    const useNewListingEndpoint = true;

    const newListingFetcher = () => {
      if (productType === 'prodotto_pixall') {
        return fetchPixallProductListing(locale);
      }
      if (productType === 'prodotto_arredo') {
        return fetchArredoProductListing(locale, resolvedCategoryNid ?? 'all');
      }
      if (productType === 'prodotto_illuminazione') {
        return fetchIlluminazioneProductListing(
          locale,
          resolvedCategoryNid ?? 'all',
        );
      }
      if (productType === 'prodotto_tessuto') {
        return fetchTextileProductListing(locale, resolvedCategoryNid ?? 'all');
      }
      if (productType === 'prodotto_vetrite') {
        return fetchVetriteProductListing(
          locale,
          resolvedTid ?? 'all',
          resolvedColorTid ?? 'all',
        );
      }
      return fetchMosaicProductListing(
        locale,
        resolvedTid ?? 'all',
        resolvedColorTid ?? 'all',
      );
    };

    const [productResult, allFilterOptions] = await Promise.all([
      newListingFetcher(),
      // Filter options skipped — legacy V3/V2 endpoints are dead (404).
      // Sidebar renders empty until new filter endpoints exist.
      Promise.resolve({} as Record<string, FilterOption[]>),
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

  // ── hasFilterPanel — false for hub, true when filters exist ──────────
  const hasFilterPanel =
    variant === 'hub' ? false : Object.keys(filters).length > 0;

  // ── Active P0 filter key (the one in the URL path, excluded from panel) ──
  const activePathP0 = parsed.activeFilters.find((f) => f.type === 'path');
  const activePathFilterKey = activePathP0?.key;

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

interface SlugPageProps {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}

export async function generateMetadata({ params }: SlugPageProps) {
  const { locale, slug } = await params;

  // Products master page — return i18n title without fetching from Drupal
  const singleSlug = slug.length === 1 ? slug[0] : null;
  if (singleSlug && PRODUCTS_MASTER_SLUGS.has(singleSlug)) {
    const { getTranslations } = await import('next-intl/server');
    const t = await getTranslations({ locale, namespace: 'breadcrumb' });
    return { title: t('filterAndFind') };
  }

  // Drupal aliases do NOT include locale prefix
  const drupalPath = `/${slug.join('/')}`;

  try {
    // getPageData is React.cache()-wrapped — if SlugPage already called it with
    // the same args, this returns the cached result (no extra network request).
    const resource = await getPageData(locale, drupalPath);
    if (resource) {
      const title = resource?.field_titolo_main as string | undefined;
      return {
        title: title ?? (resource as { title?: string })?.title ?? 'Sicis',
      };
    }

    return { title: 'Sicis' };
  } catch {
    return { title: 'Sicis' };
  }
}

export default async function SlugPage({
  params,
  searchParams,
}: SlugPageProps) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  const pageStr = Array.isArray(sp?.page) ? sp.page[0] : sp?.page;
  const currentPage = Math.max(1, parseInt(pageStr ?? '1', 10));
  const offset = (currentPage - 1) * PAGE_SIZE;
  // Full path with locale (used for ProductListing basePath and logging)
  const path = `/${locale}/${slug.join('/')}`;
  // Drupal aliases do NOT include locale prefix — strip it for translate-path
  // decodeURIComponent handles non-Latin scripts (e.g. Cyrillic мозаика, French mosaïque)
  const drupalPath = decodeURIComponent(`/${slug.join('/')}`);

  // Menu-derived routing registry (null when Drupal menu unavailable)
  const registry = await getRoutingRegistry();

  const singleSlugRaw = slug.length === 1 ? slug[0] : null;
  // Decode + NFC-normalize so encoded slugs (mosa%C3%AFque, %D0%BC%D0%BE%D0%B7%D0%B0%D0%B8%D0%BA%D0%B0)
  // match the literal entries in LISTING_SLUG_OVERRIDES / PRODUCTS_MASTER_SLUGS.
  const singleSlug = singleSlugRaw
    ? decodeURIComponent(singleSlugRaw).normalize('NFC')
    : null;

  // ── Products master page interception ─────────────────────────────────────
  // /prodotti (IT), /products (EN), etc. — static page listing all product categories.
  // Must be checked BEFORE LISTING_SLUG_OVERRIDES to avoid falling through to Drupal.
  if (singleSlug && PRODUCTS_MASTER_SLUGS.has(singleSlug)) {
    return <ProductsMasterPage locale={locale} />;
  }

  // Bypass translatePath per slug che devono essere listing prodotti ma hanno nodi Drupal
  // con lo stesso alias (categoria_blog, documento, page) che verrebbero renderizzati al posto.
  const isListingSlug =
    registry?.listingSlugs.has(singleSlug!) ??
    LISTING_SLUG_OVERRIDES.has(singleSlug!);
  if (singleSlug && isListingSlug) {
    const sectionConfig = await getSectionConfigAsync(slug, locale);
    if (sectionConfig) {
      // For category-based hubs (arredo, illuminazione), resolve the parent NID
      // so SpecHubArredo can fetch subcategories from categories/{nid} endpoint.
      const CATEGORY_HUB_TYPES = new Set([
        'prodotto_arredo',
        'prodotto_illuminazione',
        'prodotto_tessuto',
      ]);
      let hubParentNid: number | undefined;
      if (CATEGORY_HUB_TYPES.has(sectionConfig.productType)) {
        const resolved = await resolvePath(drupalPath, locale);
        if (resolved) hubParentNid = resolved.nid;
      }

      return renderProductListing({
        productType: sectionConfig.productType,
        title: deslugify(singleSlug),
        slug,
        searchParams: sp,
        locale,
        hubParentNid,
      });
    }
    notFound();
  }

  // ── Product detail page interception (new REST endpoints) ────────────────
  // For URLs with 2+ segments, try resolve-path FIRST to detect product detail
  // pages before the listing interception claims them as filtered listings.
  // This handles paths like /mosaico/neocolibrì-barrels/515-barrels which would
  // otherwise be intercepted as a collection filter.
  if (slug.length > 1) {
    const resolved = await resolvePath(drupalPath, locale);
    if (resolved) {
      if (resolved.bundle === 'prodotto_mosaico') {
        const product = await fetchMosaicProduct(resolved.nid, locale);
        if (product) {
          return <MosaicProductPreview product={product} locale={locale} />;
        }
      }
      if (resolved.bundle === 'prodotto_vetrite') {
        const product = await fetchVetriteProduct(resolved.nid, locale);
        if (product) {
          const legacyNode = vetriteToLegacyNode(product, locale);
          return <ProdottoVetrite node={legacyNode} />;
        }
      }
      if (resolved.bundle === 'prodotto_tessuto') {
        const product = await fetchTextileProduct(resolved.nid, locale);
        if (product) {
          const legacyNode = textileToLegacyNode(product, locale);
          return <ProdottoTessuto node={legacyNode} />;
        }
      }
      if (resolved.bundle === 'prodotto_pixall') {
        const product = await fetchPixallProduct(resolved.nid, locale);
        if (product) {
          const legacyNode = pixallToLegacyNode(product, locale);
          return <ProdottoPixall node={legacyNode} />;
        }
      }
      if (resolved.bundle === 'prodotto_arredo') {
        const product = await fetchArredoProduct(resolved.nid, locale);
        if (product) {
          const legacyNode = arredoToLegacyNode(product, locale);
          return <ProdottoArredo node={legacyNode} />;
        }
      }
      if (resolved.bundle === 'prodotto_illuminazione') {
        const product = await fetchIlluminazioneProduct(resolved.nid, locale);
        if (product) {
          // TODO: migrate to DS template — for now use legacy with adapter
          const legacyNode = illuminazioneToLegacyNode(product, locale);
          return <ProdottoIlluminazione node={legacyNode} />;
        }
      }
      // ── Taxonomy terms: mosaico_collezioni / mosaico_colori → mosaic-products endpoint ──
      // resolve-path gives us the TID directly — pass it to renderProductListing
      // so it uses the new endpoint without an extra taxonomy name→TID fetch.
      if (resolved.bundle === 'mosaico_collezioni') {
        return renderProductListing({
          productType: 'prodotto_mosaico',
          title: deslugify(slug[slug.length - 1]),
          slug,
          searchParams: sp,
          locale,
          resolvedTid: resolved.nid,
        });
      }
      if (resolved.bundle === 'mosaico_colori') {
        return renderProductListing({
          productType: 'prodotto_mosaico',
          title: deslugify(slug[slug.length - 1]),
          slug,
          searchParams: sp,
          locale,
          resolvedColorTid: resolved.nid,
        });
      }
      // ── Taxonomy terms: vetrite_collezioni / vetrite_colori → vetrite-products endpoint ──
      if (resolved.bundle === 'vetrite_collezioni') {
        return renderProductListing({
          productType: 'prodotto_vetrite',
          title: deslugify(slug[slug.length - 1]),
          slug,
          searchParams: sp,
          locale,
          resolvedTid: resolved.nid,
        });
      }
      if (resolved.bundle === 'vetrite_colori') {
        return renderProductListing({
          productType: 'prodotto_vetrite',
          title: deslugify(slug[slug.length - 1]),
          slug,
          searchParams: sp,
          locale,
          resolvedColorTid: resolved.nid,
        });
      }
      // ── node--categoria → type-specific listing endpoint ──
      // Textile, arredo, and illuminazione categories share the generic 'categoria' bundle.
      // Match the first slug segment against each product type's basePaths across ALL locales
      // (not just the current one) to handle cross-locale URLs like /it/lighting/table-lamps.
      if (resolved.bundle === 'categoria') {
        const firstSlug = decodeURIComponent(slug[0]).normalize('NFC');
        const categoryProductTypes = [
          'prodotto_tessuto',
          'prodotto_arredo',
          'prodotto_illuminazione',
        ] as const;
        for (const pt of categoryProductTypes) {
          const ptConfig = FILTER_REGISTRY[pt];
          if (ptConfig) {
            // Check basePaths of ALL locales, not just current
            const matchesAnyLocale = Object.values(ptConfig.basePaths).some(
              (bp) => firstSlug === bp.split('/')[0],
            );
            if (matchesAnyLocale) {
              return renderProductListing({
                productType: pt,
                title: deslugify(slug[slug.length - 1]),
                slug,
                searchParams: sp,
                locale,
                resolvedCategoryNid: resolved.nid,
              });
            }
          }
        }
      }
    }
  }

  // ── Multi-slug listing interception ──────────────────────────────────────
  // When the URL has 2+ segments (e.g. /mosaico/murano-smalto, /mosaico/colori/rosso),
  // check if it's a product listing with an active P0 filter. If so, render
  // with the new ProductListingTemplate instead of falling through to Drupal
  // node resolution (which would render old taxonomy templates).
  if (slug.length > 1) {
    const sectionConfig = await getSectionConfigAsync(slug, locale);
    if (sectionConfig) {
      // Check if this is a product detail page (3+ segments after base for some types)
      // by verifying getSectionConfig returns a productType (it returns null for detail pages)
      const parsed = parseFiltersFromUrl(
        slug,
        (sp as Record<string, string>) ?? {},
        locale,
      );
      if (parsed.activeFilters.length > 0) {
        // Title = the active P0 filter's label (e.g. "Murano Smalto", "Rosso", "Seats")
        // Falls back to deslugify of the filter value or last slug segment
        const activeP0 = parsed.activeFilters.find((f) => f.type === 'path');
        const listingTitle =
          activeP0?.label ?? deslugify(slug[slug.length - 1]);
        return renderProductListing({
          productType: sectionConfig.productType,
          title: listingTitle,
          slug,
          searchParams: sp,
          locale,
        });
      }
    }
  }

  let resource: Record<string, unknown> | null = null;

  try {
    // getPageData is React.cache()-wrapped — generateMetadata() already called it
    // with the same args, so this returns the cached result (no extra network request).
    resource = await getPageData(locale, drupalPath);
  } catch (error) {
    console.error(
      `[SlugPage] Failed to fetch resource for path: ${path}`,
      error,
    );
  }

  // Fallback: if getPageData returned null, check for type-specific product renderers
  // and section listing pages before giving up.
  if (!resource) {
    // prodotto_mosaico uses a dedicated renderer (MosaicProductPreview) rather than
    // the generic COMPONENT_MAP dispatch — check it here via resolvePath.
    const resolved = await resolvePath(drupalPath, locale);
    if (resolved?.bundle === 'prodotto_mosaico') {
      const product = await fetchMosaicProduct(resolved.nid, locale);
      if (product) {
        return <MosaicProductPreview product={product} locale={locale} />;
      }
    }

    // Last resort: try as a section listing page
    const sectionConfig = await getSectionConfigAsync(slug, locale);
    if (sectionConfig) {
      return renderProductListing({
        productType: sectionConfig.productType,
        title: deslugify(slug[slug.length - 1] ?? slug[0] ?? 'Prodotti'),
        slug,
        searchParams: sp,
        locale,
      });
    }
    notFound();
  }

  // TypeScript narrowing: resource is guaranteed non-null here (notFound() throws above)
  const resolvedResource = resource as Record<string, unknown>;
  const type = resolvedResource.type as string;

  // ── Subcategory listing interception (Option B2 — Apollo decision) ──────
  // When translatePath resolves a node--categoria that corresponds to a product
  // listing section (e.g. /arredo/poltrone → node--categoria "Poltrone"),
  // render the listing layout with SpecFilterSidebar instead of the generic Categoria
  // component (which would show "Categoria non mappata").
  //
  // The guard is: type === 'node--categoria' AND getSectionConfig returns a config
  // with filterField (meaning it's a subcategory listing, not a hub category).
  if (type === 'node--categoria') {
    const sectionConfig = await getSectionConfigAsync(slug, locale);
    if (sectionConfig && sectionConfig.filterField) {
      // Use the CMS node title for the page heading (preserves SEO data from Drupal)
      const nodeTitle =
        (resolvedResource.field_titolo_main as { value?: string } | undefined)
          ?.value ??
        (resolvedResource.title as string | undefined) ??
        slug[slug.length - 1];
      return renderProductListing({
        productType: sectionConfig.productType,
        title: nodeTitle,
        slug,
        searchParams: sp,
        locale,
      });
    }
  }

  // ── node--page listing interception (slug-based, replaces field_page_id) ───
  // Drupal uses node--page nodes as hub pages for listing sections.
  // Listing type is determined from the URL slug, not from field_page_id.
  // Product types (tessile) are handled earlier by LISTING_SLUG_OVERRIDES.
  // Content listings below await new Drupal endpoints from Freddi (V5-V9 are dead).
  if (type === 'node--page') {
    const nodeTitle =
      (resolvedResource.field_titolo_main as string | undefined) ??
      (resolvedResource.title as string | undefined) ??
      slug[slug.length - 1];

    // Slug → listing type mapping (all locales)
    const SLUG_TO_LISTING: Record<string, string> = {
      // Progetti
      progetti: 'progetti',
      projects: 'progetti',
      projets: 'progetti',
      projekte: 'progetti',
      proyectos: 'progetti',
      проекты: 'progetti',
      // Ambienti
      ambienti: 'environments',
      environments: 'environments',
      // Showroom
      showroom: 'showroom',
      // Download cataloghi
      'libreria-cataloghi-arredo': 'download_catalogues',
      'furniture-catalogue-library': 'download_catalogues',
      'catalogues-dameublement': 'download_catalogues',
      einrichtungskataloge: 'download_catalogues',
      'catálogos-de-mobiliario': 'download_catalogues',
      'каталоги-мебели': 'download_catalogues',
    };

    const firstSlug =
      singleSlug ?? decodeURIComponent(slug[0]).normalize('NFC');
    const listingType = SLUG_TO_LISTING[firstSlug];

    if (listingType) {
      const basePath = `/${locale}/${slug.join('/')}`;
      const CONTENT_LISTING_RENDERERS: Record<
        string,
        () => Promise<React.ReactElement>
      > = {
        progetti: async () => {
          const { projects, total } = await fetchProjects(
            locale,
            PAGE_SIZE,
            offset,
          );
          return (
            <ProjectListing
              title={nodeTitle}
              projects={projects}
              total={total}
              locale={locale}
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              basePath={basePath}
            />
          );
        },
        environments: async () => {
          const { environments, total } = await fetchEnvironments(
            locale,
            PAGE_SIZE,
            offset,
          );
          return (
            <EnvironmentListing
              title={nodeTitle}
              environments={environments}
              total={total}
              locale={locale}
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              basePath={basePath}
            />
          );
        },
        showroom: async () => {
          const { showrooms, total } = await fetchShowrooms(
            locale,
            PAGE_SIZE,
            offset,
          );
          return (
            <ShowroomListing
              title={nodeTitle}
              showrooms={showrooms}
              total={total}
              locale={locale}
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              basePath={basePath}
            />
          );
        },
        download_catalogues: async () => {
          const { documents, total } = await fetchDocuments(
            locale,
            PAGE_SIZE,
            offset,
          );
          return (
            <DocumentListing
              title={nodeTitle}
              documents={documents}
              total={total}
              locale={locale}
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              basePath={basePath}
            />
          );
        },
      };
      const renderer = CONTENT_LISTING_RENDERERS[listingType];
      if (renderer) {
        return renderer();
      }
    }
  }

  const componentName = getComponentName(type);
  // For unmapped taxonomy terms, use generic TaxonomyTerm instead of UnknownEntity
  const resolvedName =
    componentName === 'UnknownEntity' && type.startsWith('taxonomy_term--')
      ? 'TaxonomyTerm'
      : componentName;
  const Component = COMPONENT_MAP[resolvedName];

  if (!Component) {
    console.warn(`[SlugPage] No component mapped for type: ${type}`);
    return <UnknownEntity node={resolvedResource} />;
  }

  return (
    <Component
      node={resolvedResource}
      currentPage={currentPage}
      pageSize={PAGE_SIZE}
      basePath={path}
      searchParams={sp}
    />
  );
}

// ISR revalidation removed — each fetch() call has its own revalidate value:
// Products: 60s, Editorial: 300s, Taxonomy/paths: 3600s, Menu: 600s
// Removing the blanket 60s prevents unnecessary cache misses for static/taxonomy pages.
// export const revalidate = 60;

// Adapter functions extracted to src/lib/adapters/legacy-node-adapters.ts
