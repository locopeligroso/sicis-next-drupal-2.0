import { cache } from 'react';
import { notFound } from 'next/navigation';
import { fetchEntity } from '@/lib/api/entity';
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
  'prodotti',    // IT
  'products',    // EN
  'produits',    // FR
  'produkte',    // DE
  'productos',   // ES
  'продукция',   // RU
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
}: {
  productType: string;
  title: string;
  description?: string | null;
  slug: string[];
  searchParams: Record<string, string | string[]> | undefined;
  locale: string;
}) {
  const config = FILTER_REGISTRY[productType];
  if (!config) return null;

  const { listing, filters } = config;
  // Build basePath from the actual URL slug by matching leading segments against
  // the registry basePath. Only include slug segments that match the registry base —
  // filter segments (e.g. /textiles/bedcover) must not be included in basePath.
  const registryBaseSegments = (config.basePaths[locale] ?? config.basePaths['it']).split('/');
  let matchCount = 0;
  for (let i = 0; i < registryBaseSegments.length && i < slug.length; i++) {
    if (slug[i] === registryBaseSegments[i]) {
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
  const hasActiveP0 = parsed.activeFilters.some((f) =>
    p0Keys.includes(f.key),
  );

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
    const p0FilterKey = Object.values(filters).find((f) => f.priority === 'P0')?.key;
    if (p0FilterKey) {
      // Pre-fetch category options to find children of active parent
      const categoryOptions = await fetchCategoryOptions(productType, locale);
      const activeP0 = parsed.activeFilters.find((f) => f.type === 'path');
      if (activeP0) {
        const activeOption = categoryOptions.find((o) => o.slug === activeP0.value);
        if (activeOption?.id) {
          const children = categoryOptions.filter((o) => o.parentId === activeOption.id);
          if (children.length > 0) {
            subcategories = children.map((child) => ({
              slug: child.slug,
              label: child.label,
            }));

            // If ?sub=slug is active, override the category filter to the subcategory
            const subParam = Array.isArray(sp?.sub) ? sp.sub[0] : sp?.sub;
            if (subParam && subcategories.some((sc) => sc.slug === subParam)) {
              const subLabel = subcategories.find((sc) => sc.slug === subParam)!.label;
              const catFieldIndex = parsed.filterDefinitions.findIndex(
                (fd) => fd.field === 'field_categoria.title',
              );
              if (catFieldIndex >= 0) {
                parsed.filterDefinitions[catFieldIndex] = {
                  ...parsed.filterDefinitions[catFieldIndex],
                  value: subLabel,
                };
              }
              parsed.activeFilters.push({ key: 'sub', value: subParam, type: 'query', label: subLabel });
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
      optionPromises.map(async ([key, promise]) => [key, await promise] as [string, FilterOption[]]),
    );
    filterOptions = Object.fromEntries(resolved);

    // Fetch counts for each P0 group (no active filters = total products per option)
    const countPromises = listing.categoryGroups.map(async (group) => {
      const filterConfig = filters[group.filterKey];
      if (!filterConfig) return [group.filterKey, {} as Record<string, number>] as const;
      const counts = await fetchFilterCounts(
        productType,
        [],  // no active filters in state 1
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

    const [productResult, allFilterOptions] = await Promise.all([
      fetchProducts({
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

    const { CollectionPopoverContent } = await import(
      '@/components/composed/CollectionPopoverContent'
    );
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
  const drupalPath = `/${slug.join('/')}`;

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
      const parsed = parseFiltersFromUrl(slug, sp as Record<string, string> ?? {}, locale);
      if (parsed.activeFilters.length > 0) {
        // Title = the active P0 filter's label (e.g. "Murano Smalto", "Rosso", "Seats")
        // Falls back to deslugify of the filter value or last slug segment
        const activeP0 = parsed.activeFilters.find((f) => f.type === 'path');
        const listingTitle = activeP0?.label ?? deslugify(slug[slug.length - 1]);
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

  // Fallback: if no Drupal node found, try as a section listing page
  if (!resource) {
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
