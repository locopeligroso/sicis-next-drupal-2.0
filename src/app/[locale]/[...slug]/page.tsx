import { cache } from 'react';
import { notFound } from 'next/navigation';
import { fetchEntity } from '@/lib/api/entity';
import { resolvePath } from '@/lib/api/resolve-path';
import { fetchMosaicProduct } from '@/lib/api/mosaic-product';
import type { MosaicProduct } from '@/lib/api/mosaic-product';
import { fetchVetriteProduct } from '@/lib/api/vetrite-product';
import type { VetriteProduct } from '@/lib/api/vetrite-product';
import { fetchTextileProduct } from '@/lib/api/textile-product';
import type { TextileProduct } from '@/lib/api/textile-product';
import { fetchPixallProduct } from '@/lib/api/pixall-product';
import type { PixallProduct } from '@/lib/api/pixall-product';
import { fetchMosaicProductListing } from '@/lib/api/mosaic-product-listing';
import { getComponentName } from '@/lib/node-resolver';
import UnknownEntity from '@/components_legacy/UnknownEntity';
import { getSectionConfigAsync } from '@/domain/routing/section-config';
import { getRoutingRegistry } from '@/domain/routing/routing-registry';
import { parseFiltersFromUrl } from '@/domain/filters/search-params';
import {
  fetchAllFilterOptions,
  fetchFilterOptions,
  fetchCategoryOptions,
} from '@/lib/api/filters';
import { fetchProducts, fetchFilterCounts } from '@/lib/api/products';
import { FILTER_REGISTRY, deslugify } from '@/domain/filters/registry';
import type { FilterOption } from '@/domain/filters/registry';
import { getHubDeepDiveLinks } from '@/lib/navbar/hub-links';
import { ProductListingTemplate } from '@/templates/nodes/ProductListingTemplate';
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
 * Uses the C1 entity endpoint which returns pre-resolved relationships and
 * paragraphs — no INCLUDE_MAP or secondary fetches needed.
 */
const getPageData = cache(async (locale: string, drupalPath: string) => {
  const entity = await fetchEntity(drupalPath, locale);
  if (!entity) return null;

  // Construct the compound entity type (e.g. "node--prodotto_mosaico")
  // that COMPONENT_MAP and getComponentName expect
  const entityType = `${entity.meta.type}--${entity.meta.bundle}`;

  return {
    ...entity.data,
    // Inject `type` in the JSON:API compound format for COMPONENT_MAP dispatch
    type: entityType,
    // Inject UUID as `id` for backward compatibility with templates
    id: entity.meta.uuid,
    // NID for V10/V11 REST endpoints (subcategories, pages-by-category)
    _nid: entity.meta.id,
  } as Record<string, unknown>;
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
}: {
  productType: string;
  title: string;
  description?: string | null;
  slug: string[];
  searchParams: Record<string, string | string[]> | undefined;
  locale: string;
  /** Collection TID from resolve-path — skips V3 name→TID lookup for mosaic-products endpoint */
  resolvedTid?: number;
  /** Color TID from resolve-path — for mosaic-products/all/{colorTid} */
  resolvedColorTid?: number;
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
    if (decodeURIComponent(slug[i]).normalize('NFC') === registryBaseSegments[i]) {
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
  let filterOptions: Record<string, FilterOption[]>;

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
      // Pre-fetch category options to find children of active parent
      const categoryOptions = await fetchCategoryOptions(productType, locale);
      const activeP0 = parsed.activeFilters.find((f) => f.type === 'path');
      if (activeP0) {
        const activeOption = categoryOptions.find(
          (o) => o.slug === activeP0.value,
        );
        if (activeOption?.id) {
          const children = categoryOptions.filter(
            (o) => o.parentId === activeOption.id,
          );
          if (children.length > 0) {
            subcategories = children.map((child) => ({
              slug: child.slug,
              label: child.label,
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
  }

  if (!hasActiveP0 && listing.categoryGroups.length > 0) {
    // ── State 1: Hub mode — show category cards, no product grid ──────────
    // Fetch only the filter options needed for category card groups + sidebar
    const optionPromises: [string, Promise<FilterOption[]>][] = [];
    for (const group of listing.categoryGroups) {
      const filterConfig = filters[group.filterKey];
      if (filterConfig?.taxonomyType) {
        optionPromises.push([
          group.filterKey,
          fetchFilterOptions(filterConfig.taxonomyType, locale, {
            includeImage: group.hasImage || group.hasColorSwatch,
          }),
        ]);
      } else if (filterConfig?.nodeType === 'node--categoria') {
        optionPromises.push([
          group.filterKey,
          fetchCategoryOptions(config.contentType, locale),
        ]);
      }
    }
    const resolved = await Promise.all(
      optionPromises.map(
        async ([key, promise]) =>
          [key, await promise] as [string, FilterOption[]],
      ),
    );
    filterOptions = Object.fromEntries(resolved);

    // Fetch counts for each P0 group (no active filters = total products per option)
    const countPromises = listing.categoryGroups.map(async (group) => {
      const filterConfig = filters[group.filterKey];
      if (!filterConfig)
        return [group.filterKey, {} as Record<string, number>] as const;
      const counts = await fetchFilterCounts(
        productType,
        [], // no active filters in state 1
        group.filterKey,
        filterConfig.drupalField,
        locale,
      );
      return [group.filterKey, counts] as const;
    });
    const countResults = await Promise.all(countPromises);
    for (const [key, counts] of countResults) {
      const options = filterOptions[key];
      if (options) {
        for (const option of options) {
          option.count = counts[option.label] ?? 0;
        }
      }
    }

    products = undefined;
    total = undefined;
  } else {
    // ── State 2: Product grid mode — fetch products + all filter options ───
    const pageStr = Array.isArray(sp?.page) ? sp.page[0] : sp?.page;
    const currentPage = Math.max(1, parseInt((pageStr as string) ?? '1', 10));
    const offset = (currentPage - 1) * listing.pageSize;

    // When resolvedTid or resolvedColorTid is available (from resolve-path),
    // use the new mosaic-products endpoint directly — avoids the broken V1
    // endpoint and the extra V3 name→TID lookup.
    const useMosaicEndpoint =
      productType === 'prodotto_mosaico' &&
      (resolvedTid != null || resolvedColorTid != null);

    const [productResult, allFilterOptions] = await Promise.all([
      useMosaicEndpoint
        ? fetchMosaicProductListing(
            locale,
            resolvedTid ?? 'all',
            resolvedColorTid ?? 'all',
          )
        : fetchProducts({
            productType,
            locale,
            limit: listing.pageSize,
            offset,
            filters:
              parsed.filterDefinitions.length > 0
                ? parsed.filterDefinitions
                : undefined,
            sort: parsed.sort || undefined,
          }),
      fetchAllFilterOptions(productType, locale),
    ]);
    products = productResult.products;
    total = productResult.total;
    filterOptions = allFilterOptions;

    // Live counts per filter value — REST V2 endpoint does server-side aggregation
    // (no more client-side pagination loops that caused 27s+ page loads with JSON:API)
    const countPromises = Object.entries(filters)
      .filter(([, cfg]) => !cfg.nodeType)
      .map(async ([key, filterConfig]) => {
        const counts = await fetchFilterCounts(
          productType,
          parsed.filterDefinitions,
          key,
          filterConfig.drupalField,
          locale,
        );
        return [key, counts] as const;
      });
    const countResults = await Promise.all(countPromises);
    for (const [key, counts] of countResults) {
      const options = filterOptions[key];
      if (options) {
        for (const option of options) {
          option.count = counts[option.label] ?? 0;
        }
      }
    }
  }

  // ── Determine layout variant ──────────────────────────────────────────
  let variant: 'hub' | 'context-bar' | 'airy-header';
  if (!hasActiveP0 && listing.categoryGroups.length > 0) {
    variant = 'hub';
  } else if (hasActiveP0) {
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

  // ── Base counts (P0-only) for non-P0 filter groups ───────────────────
  // Distinguishes "not in collection" (baseCount=0) from "filtered out by P1"
  if (activePathP0 && parsed.filterDefinitions.length > 0) {
    const p0Config = filters[activePathP0.key];
    const p0OnlyDefs = parsed.filterDefinitions.filter(
      (fd) => p0Config && fd.field === p0Config.drupalField,
    );

    const baseCountPromises = Object.entries(filters)
      .filter(([key, cfg]) => key !== activePathP0.key && !cfg.nodeType)
      .map(async ([key, filterConfig]) => {
        const counts = await fetchFilterCounts(
          productType,
          p0OnlyDefs,
          key,
          filterConfig.drupalField,
          locale,
        );
        return [key, counts] as const;
      });

    const baseResults = await Promise.all(baseCountPromises);
    for (const [key, counts] of baseResults) {
      const options = filterOptions[key];
      if (options) {
        for (const option of options) {
          option.baseCount = counts[option.label] ?? 0;
        }
      }
    }
  }

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
    const title = resource?.field_titolo_main as string | undefined;
    return {
      title: title ?? (resource as { title?: string })?.title ?? 'Sicis',
    };
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

  const singleSlug = slug.length === 1 ? slug[0] : null;

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
      // Hub page — title is the section display name, derived from sectionConfig
      // deslugify converts the slug to a human-readable name (e.g. "mosaico" → "Mosaico")
      return renderProductListing({
        productType: sectionConfig.productType,
        title: deslugify(singleSlug),
        slug,
        searchParams: sp,
        locale,
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
      // ── Taxonomy terms: mosaico_collezioni / mosaico_colori → mosaic-products endpoint ──
      // resolve-path gives us the TID directly — pass it to renderProductListing
      // so it uses the new endpoint without an extra V3 name→TID fetch.
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
      // Future: add more product bundles here (prodotto_arredo, prodotto_illuminazione)
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

  // Fallback: if no Drupal node found via C1, try resolve-path + type-specific endpoint
  if (!resource) {
    const resolved = await resolvePath(drupalPath, locale);
    if (resolved) {
      if (resolved.bundle === 'prodotto_mosaico') {
        const product = await fetchMosaicProduct(resolved.nid, locale);
        if (product) {
          return <MosaicProductPreview product={product} locale={locale} />;
        }
      }
      // Future: add more bundle handlers here as endpoints are built
      // if (resolved.bundle === 'prodotto_vetrite') { ... }
    }

    // If resolve-path also failed, try as a section listing page
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

  // ── node--page with field_page_id → listing interception ──────────────────
  // Drupal uses node--page nodes as hub pages for listing sections.
  // field_page_id is set in Drupal and maps 1:1 to a content type.
  // Product types render with SpecFilterSidebar; content types render standalone.
  if (type === 'node--page') {
    const pageId = resolvedResource.field_page_id as string | undefined;
    if (pageId) {
      const nodeTitle =
        (resolvedResource.field_titolo_main as string | undefined) ??
        (resolvedResource.title as string | undefined) ??
        slug[slug.length - 1];

      // Product listing (with ProductListingTemplate)
      const PAGE_ID_TO_PRODUCT_TYPE: Record<string, string> = {
        tessile: 'prodotto_tessuto',
      };
      const productType = PAGE_ID_TO_PRODUCT_TYPE[pageId];
      if (productType) {
        return renderProductListing({
          productType,
          title: nodeTitle,
          slug,
          searchParams: sp,
          locale,
        });
      }

      // Content listing (without SpecFilterSidebar) — maps field_page_id → fetcher + component
      const basePath = `/${locale}/${slug.join('/')}`;
      const PAGE_ID_TO_CONTENT_LISTING: Record<
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
        blog: async () => {
          const { posts, total } = await fetchBlogPosts(
            locale,
            PAGE_SIZE,
            offset,
          );
          return (
            <BlogListing
              title={nodeTitle}
              posts={posts}
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
      const contentRenderer = PAGE_ID_TO_CONTENT_LISTING[pageId];
      if (contentRenderer) {
        return contentRenderer();
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

export const revalidate = 60;

// ── Product page using DS Spec* blocks (data from P1 mosaic-product endpoint) ─
// Uses the same SpecProductHero, SpecProductDetails, SpecProductSpecs,
// SpecProductResources, SpecProductGallery as the full ProdottoMosaico template.
// Renders all blocks when collection data is available; gracefully omits blocks
// when relations are not yet included in the endpoint response.

async function MosaicProductPreview({
  product,
  locale,
}: {
  product: MosaicProduct;
  locale: string;
}) {
  const { SpecProductHero } =
    await import('@/components/blocks/SpecProductHero');
  const { SpecProductDetails } =
    await import('@/components/blocks/SpecProductDetails');
  const { SpecProductSpecs } =
    await import('@/components/blocks/SpecProductSpecs');
  const { SpecProductResources } =
    await import('@/components/blocks/SpecProductResources');
  const { SpecProductGallery } =
    await import('@/components/blocks/SpecProductGallery');
  const { sanitizeHtml } = await import('@/lib/sanitize');
  const { formatRetinatura } = await import('@/lib/product-helpers');
  const { getTranslations } = await import('next-intl/server');

  const t = await getTranslations('products');

  type ProductCarouselSlide =
    import('@/components/composed/ProductCarousel').ProductCarouselSlide;
  type ProductGalleryImage =
    import('@/components/blocks/SpecProductGallery').ProductGalleryImage;
  type AttributeItem =
    import('@/components/composed/AttributeGrid').AttributeItem;
  type SpecsRow = import('@/components/composed/SpecsTable').SpecsRow;
  type DocumentCardItem =
    import('@/components/composed/DocumentCard').DocumentCardItem;

  const col = product.collection;

  // ── Build carousel slides (same pattern as ProdottoMosaico) ──
  const heroSlides: ProductCarouselSlide[] = [];
  if (product.imageUrl) {
    heroSlides.push({
      type: 'image',
      src: product.imageUrl,
      alt: product.title,
    });
  }
  if (product.imageSampleUrl) {
    heroSlides.push({
      type: 'image',
      src: product.imageSampleUrl,
      alt: `${product.title} – campione`,
    });
  }
  if (product.videoUrl) {
    heroSlides.push({ type: 'video', src: product.videoUrl });
  }
  heroSlides.push({
    type: 'static',
    src: '/images/usa-mosaic-quality.jpg',
    alt: 'Quality certification',
  });

  // ── Price ──
  const heroPrice = product.priceUsaSqft
    ? `$${product.priceUsaSqft}`
    : product.priceUsaSheet
      ? `$${product.priceUsaSheet}`
      : product.priceEu
        ? `€${product.priceEu}`
        : null;
  const heroPriceUnit = product.priceUsaSqft
    ? '/sqft'
    : product.priceUsaSheet
      ? '/sheet'
      : product.priceEu
        ? '/m²'
        : undefined;

  // ── Details block data (from collection) ──
  const detailAttributes: AttributeItem[] = col
    ? [
        ...(col.sheetSizeInch
          ? [{ label: 'Sheet size', value: col.sheetSizeInch }]
          : []),
        ...(col.chipSizeInch
          ? [{ label: 'Chip size', value: col.chipSizeInch }]
          : []),
        ...(col.thicknessInch
          ? [{ label: 'Thickness', value: col.thicknessInch }]
          : []),
      ]
    : [];

  // ── Specs block data (from collection) ──
  const boolLabel = (v: boolean | undefined) =>
    v === true ? t('resistant') : v === false ? t('absent') : null;
  const specsRows: SpecsRow[] = col
    ? [
        { label: t('leadContent'), value: boolLabel(col.leadContent) },
        { label: t('waterAbsorption'), value: col.waterAbsorption ?? null },
        { label: t('lightResistance'), value: boolLabel(col.lightResistance) },
        {
          label: t('chemicalResistance'),
          value: boolLabel(col.chemicalResistance),
        },
        { label: t('thermalExpansion'), value: col.thermalExpansion ?? null },
        {
          label: t('thermalShockResistance'),
          value: boolLabel(col.thermalShockResistance),
        },
        { label: t('frostResistance'), value: boolLabel(col.frostResistance) },
        { label: t('surfaceAbrasion'), value: col.surfaceAbrasion ?? null },
        { label: t('massAbrasion'), value: col.massAbrasion ?? null },
        { label: t('stainResistance'), value: boolLabel(col.stainResistance) },
        { label: t('slipResistance'), value: boolLabel(col.slipResistance) },
        {
          label: t('slipResistanceGrip'),
          value: boolLabel(col.slipResistanceGrip),
        },
      ].filter((r): r is SpecsRow => r.value !== null)
    : [];

  // ── Resources block data (from collection documents) ──
  const usesHtml = col?.usesHtml ? sanitizeHtml(col.usesHtml) : undefined;
  const maintenanceHtml = col?.maintenanceHtml
    ? sanitizeHtml(col.maintenanceHtml)
    : undefined;
  let maintenanceGuideHref: string | undefined;
  let discoverHref: string | undefined;
  const documentItems: DocumentCardItem[] = [];

  if (col) {
    for (const doc of col.documents) {
      if (doc.isGuide && doc.href) {
        maintenanceGuideHref = doc.href;
      } else if (doc.isDiscover && doc.href) {
        discoverHref = doc.href;
        documentItems.push({
          title: doc.title,
          imageSrc: doc.imageSrc,
          href: doc.href,
        });
      } else {
        documentItems.push({
          title: doc.title,
          imageSrc: doc.imageSrc,
          href: doc.href,
        });
      }
    }
  }

  // ── Gallery block data ──
  const galleryImages: ProductGalleryImage[] = product.gallery.map(
    (url, i) => ({
      src: url,
      alt: `${product.title} gallery ${i + 1}`,
    }),
  );

  return (
    <article className="flex flex-col gap-(--spacing-section) pt-(--spacing-navbar) pb-(--spacing-section)">
      {/* ── Hero Block ── */}
      <SpecProductHero
        title={product.title}
        collection={col?.name}
        description={product.body ? sanitizeHtml(product.body) : undefined}
        slides={heroSlides}
        hasSample={product.hasSample}
        price={product.priceOnDemand ? undefined : heroPrice}
        priceUnit={product.priceOnDemand ? undefined : heroPriceUnit}
        inStock={!product.noUsaStock}
        shippingWarehouse={
          !product.noUsaStock ? 'North America Warehouse' : undefined
        }
        shippingTime={!product.noUsaStock ? '2-3 weeks' : undefined}
        discoverUrl={discoverHref}
      />

      {/* ── Details Block ── */}
      {detailAttributes.length > 0 && (
        <SpecProductDetails attributes={detailAttributes} />
      )}

      {/* ── Specs Block ── */}
      {specsRows.length > 0 && (
        <SpecProductSpecs
          specs={specsRows}
          assemblyValue={
            col?.meshType ? formatRetinatura(col.meshType) : undefined
          }
          assemblyImageSrc={
            col?.meshType
              ? '/images/Retinatura-mosaico-rete.jpg.webp'
              : undefined
          }
          groutingValue={
            product.grouts.length > 0 ? product.grouts[0].name : undefined
          }
          groutingImageSrc={
            product.grouts.length > 0 ? product.grouts[0].imageSrc : undefined
          }
          groutConsumption={
            col?.groutConsumptionM2 != null
              ? `${col.groutConsumptionM2} kg/m²`
              : undefined
          }
          maintenanceHtml={maintenanceHtml}
          maintenanceLabel="Maintenance and installation"
          maintenanceGuideHref={maintenanceGuideHref ?? '#'}
          maintenanceGuideLabel="View guide"
        />
      )}

      {/* ── Resources Block ── */}
      {documentItems.length > 0 && (
        <SpecProductResources
          title="Get inspired through catalogs"
          documents={documentItems}
          downloadLabel="Scopri"
        />
      )}

      {/* ── Gallery Block ── */}
      {galleryImages.length > 0 && (
        <SpecProductGallery images={galleryImages} />
      )}

      {/* Debug: raw data (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mx-auto max-w-main px-[var(--spacing-page)] rounded-lg border p-4">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Debug: Raw product data (NID {product.nid})
          </summary>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(product, null, 2)}
          </pre>
        </details>
      )}
    </article>
  );
}

// ── Adapter: P2 normalized VetriteProduct → C1-like Record for legacy template ─
// The legacy ProdottoVetrite template expects raw Drupal C1 field shapes.
// This adapter reconstructs that shape from the normalized P2 endpoint data,
// so the legacy template renders without modification.

function vetriteToLegacyNode(
  product: VetriteProduct,
  locale: string,
): Record<string, unknown> {
  const col = product.collection;
  const toImageField = (url: string | null) =>
    url
      ? {
          type: 'file--file',
          uri: { url },
          meta: { alt: '', width: 0, height: 0 },
        }
      : null;

  return {
    type: 'node--prodotto_vetrite',
    langcode: locale,
    title: product.title,
    field_titolo_main: product.title,
    field_testo_main: product.body
      ? { value: product.body, processed: product.body }
      : null,
    field_immagine: toImageField(product.imageUrl),
    field_gallery: product.gallery.map((url) => toImageField(url)),
    field_dimensioni_cm: product.dimensionsCm,
    field_dimensioni_inch: product.dimensionsInch,
    field_dimensione_pattern_cm: product.patternCm,
    field_dimensione_pattern_inch: product.patternInch,
    field_prezzo_eu: product.priceEu ? { value: product.priceEu } : null,
    field_prezzo_usa: product.priceUsa ? { value: product.priceUsa } : null,
    field_prezzo_on_demand: product.priceOnDemand,
    field_no_usa_stock: product.noUsaStock,
    field_campione: product.hasSample,
    field_formato_campione: product.sampleFormat,
    field_collezione: col
      ? {
          name: col.name,
          field_testo: col.body
            ? { value: col.body, processed: col.body }
            : null,
          field_immagine: toImageField(col.imageSrc),
          field_dimensioni_cm: col.dimensionsCm,
          field_dimensioni_inch: col.dimensionsInch,
          field_dimensioni_extra_cm: col.dimensionsExtraCm,
          field_dimensioni_extra_inch: col.dimensionsExtraInch,
          field_spessore_mm: col.thicknessMm,
          field_spessore_inch: col.thicknessInch,
          field_spessore_extra_mm: col.thicknessExtraMm,
          field_spessore_extra_inch: col.thicknessExtraInch,
          field_formato_campione: col.sampleFormat,
          field_formato_extra_cm: col.formatExtraCm,
          field_formato_extra_inch: col.formatExtraInch,
          field_utilizzi: col.usesHtml
            ? { value: col.usesHtml, processed: col.usesHtml }
            : null,
          field_manutenzione: col.maintenanceHtml
            ? { value: col.maintenanceHtml, processed: col.maintenanceHtml }
            : null,
          field_trattamenti_extra: col.treatmentsExtraHtml
            ? {
                value: col.treatmentsExtraHtml,
                processed: col.treatmentsExtraHtml,
              }
            : null,
          field_lastre_speciali: col.specialSlabsHtml
            ? { value: col.specialSlabsHtml, processed: col.specialSlabsHtml }
            : null,
          field_vetri_speciali: col.specialGlassHtml
            ? { value: col.specialGlassHtml, processed: col.specialGlassHtml }
            : null,
          field_documenti: (col.documents ?? []).map((doc) => ({
            field_titolo_main: doc.title,
            field_tipologia_documento: null,
            field_collegamento_esterno: doc.href,
            field_immagine: toImageField(doc.imageSrc),
            field_allegato: null,
          })),
        }
      : null,
    // Fields not yet available from P2 — legacy template handles null gracefully
    field_colori: [],
    field_finiture: [],
    field_texture: [],
  };
}

// ── Adapter: P3 normalized TextileProduct → C1-like Record for legacy template ─

function textileToLegacyNode(
  product: TextileProduct,
  locale: string,
): Record<string, unknown> {
  const toImageField = (url: string | null) =>
    url
      ? {
          type: 'file--file',
          uri: { url },
          meta: { alt: '', width: 0, height: 0 },
        }
      : null;
  // Strip HTML tags from simple value fields (Drupal wraps them in <p>)
  const stripHtml = (val: string | null) =>
    val
      ? val
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim()
      : null;

  return {
    type: 'node--prodotto_tessuto',
    langcode: locale,
    title: product.title,
    field_titolo_main: product.title,
    field_testo_main: product.body
      ? { value: product.body, processed: product.body }
      : null,
    field_composizione: product.composition
      ? { value: product.composition, processed: product.composition }
      : null,
    field_altezza_cm: stripHtml(product.heightCm),
    field_altezza_inch: stripHtml(product.heightInch),
    field_peso: product.weight,
    field_utilizzo: product.usage,
    field_densita_annodatura: product.knottingDensity,
    field_dimensioni_cm: product.dimensionsCm,
    field_dimensioni_inch: product.dimensionsInch,
    field_spessore: product.thickness,
    field_prezzo_eu: product.priceEu,
    field_prezzo_usa: product.priceUsa,
    field_immagine_anteprima:
      product.galleryIntro.length > 0
        ? toImageField(product.galleryIntro[0])
        : null,
    field_gallery: product.gallery.map((url) => toImageField(url)),
    field_gallery_intro: product.galleryIntro.map((url) => toImageField(url)),
    field_categoria: product.category
      ? {
          field_titolo_main: product.category.title,
          title: product.category.title,
          path: { alias: null },
        }
      : null,
    field_colori: [],
    // Flatten hierarchical finiture (parent → children) into the flat array
    // the legacy template expects. Each child becomes a finitura item with
    // name like "Elios - Almond", field_codice_colore, field_immagine, etc.
    field_finiture_tessuto: (() => {
      const flat = product.finiture.flatMap((f) =>
        f.children.length > 0
          ? f.children.map((c) => ({
              tid: c.tid,
              name: c.name,
              field_codice_colore: c.colorCode,
              field_etichetta: c.label,
              field_immagine: toImageField(c.imageSrc),
              field_testo: c.text,
            }))
          : [
              {
                tid: f.tid,
                name: f.name,
                field_codice_colore: null,
                field_etichetta: null,
                field_immagine: null,
                field_testo: null,
              },
            ],
      );
      // Legacy template handles single cardinality (object) vs array
      return flat.length === 1 ? flat[0] : flat;
    })(),
    field_tipologia_tessuto:
      product.typologies.length > 0
        ? product.typologies.length === 1
          ? { tid: product.typologies[0].tid, name: product.typologies[0].name }
          : product.typologies.map((t) => ({ tid: t.tid, name: t.name }))
        : [],
    field_indicazioni_manutenzione: product.maintenance.map((m) => ({
      tid: m.tid,
      name: m.name,
      field_immagine: toImageField(m.imageSrc),
    })),
    field_documenti: product.documents.map((doc) => ({
      field_titolo_main: doc.title,
      title: doc.title,
      field_tipologia_documento: null,
      field_collegamento_esterno: doc.href,
      field_immagine: toImageField(doc.imageSrc),
      field_allegato: null,
    })),
  };
}

// ── Adapter: P4 normalized PixallProduct → C1-like Record for legacy template ─

function pixallToLegacyNode(
  product: PixallProduct,
  locale: string,
): Record<string, unknown> {
  const toImageField = (url: string | null) =>
    url
      ? {
          type: 'file--file',
          uri: { url },
          meta: { alt: '', width: 0, height: 0 },
        }
      : null;

  return {
    type: 'node--prodotto_pixall',
    langcode: locale,
    title: product.title,
    field_titolo_main: product.title,
    field_testo_main: product.body
      ? { value: product.body, processed: product.body }
      : null,
    field_composizione: product.composition
      ? { value: product.composition, processed: product.composition }
      : null,
    field_utilizzi: product.usesHtml
      ? { value: product.usesHtml, processed: product.usesHtml }
      : null,
    field_manutenzione: product.maintenanceHtml
      ? { value: product.maintenanceHtml, processed: product.maintenanceHtml }
      : null,
    field_retinatura: product.meshType,
    field_immagine: toImageField(product.imageUrl),
    field_immagine_moduli: toImageField(product.imageModulesUrl),
    field_gallery: product.gallery.map((url) => toImageField(url)),
    field_gallery_intro: product.galleryIntro.map((url) => toImageField(url)),
    field_dimensione_foglio_mm: product.sheetSizeMm,
    field_dimensione_foglio_inch: product.sheetSizeInch,
    field_dimensione_tessera_mm: product.chipSizeMm,
    field_dimensione_tessera_inch: product.chipSizeInch,
    field_numero_moduli: product.modulesCount,
    field_dimensione_moduli: product.modulesSize,
    field_consumo_stucco_m2: product.groutConsumptionM2,
    field_consumo_stucco_sqft: product.groutConsumptionSqft,
    field_stucco: product.grouts.map((g) => ({
      name: g.name,
      field_immagine: toImageField(g.imageSrc),
    })),
    field_documenti: product.documents.map((doc) => ({
      field_titolo_main: doc.title,
      title: doc.title,
      field_tipologia_documento: null,
      field_collegamento_esterno: doc.href,
      field_immagine: toImageField(doc.imageSrc),
      field_allegato: null,
    })),
    // Fields not yet available from P4
    field_colori: [],
    field_forma: [],
  };
}
