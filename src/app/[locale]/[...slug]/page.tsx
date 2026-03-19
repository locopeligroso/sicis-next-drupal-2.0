import { cache, Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  translatePath,
  fetchJsonApiResource,
} from '@/lib/get-resource-by-path';
import { getComponentName, getIncludeFields, getRevalidateTime } from '@/lib/node-resolver';
import UnknownEntity from '@/components_legacy/UnknownEntity';
import { getSectionConfigAsync, fetchProducts } from '@/lib/fetch-products';
import { getRoutingRegistry } from '@/domain/routing/routing-registry';
import ProductListing from '@/components_legacy/ProductListing';
import { parseFiltersFromUrl } from '@/domain/filters/search-params';
import { fetchAllFilterOptions } from '@/lib/fetch-filter-options';
import FilterSidebar from '@/components_legacy/FilterSidebar';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import { ProductListingSkeleton } from '@/components_legacy/ProductListingSkeleton';
import { FilterSidebarSkeleton } from '@/components_legacy/FilterSidebarSkeleton';

// Node components
import Page from '@/templates/nodes/Page';
import LandingPage from '@/templates/nodes/LandingPage';
import ProdottoMosaico from '@/templates/nodes/ProdottoMosaico';
import ProdottoArredo from '@/templates/nodes/ProdottoArredo';
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
 */
const getPageData = cache(async (locale: string, drupalPath: string) => {
  const translated = await translatePath(drupalPath, locale);
  if (!translated) return null;

  const bundle = translated.entity.bundle;
  const entityType = `${translated.entity.type}--${bundle}` as `${string}--${string}`;
  const include = getIncludeFields(bundle);
  const revalidate = getRevalidateTime(entityType);

  const resource = await fetchJsonApiResource(translated.jsonapi.individual, {
    include,
    revalidate,
  });

  return resource;
});



// Fallback: used when registry is null (Drupal menu unavailable).
// Slug che devono bypassare translatePath perché Drupal ha nodi (categoria_blog,
// documento, page) con lo stesso alias che verrebbero renderizzati al posto del
// listing prodotti corretto. getSectionConfig gestisce il productType.
const LISTING_SLUG_OVERRIDES = new Set([
  // Mosaico — collide con categoria_blog in IT e ES
  'mosaico',   // IT + ES
  'mosaic',    // EN
  'mosaïque',  // FR
  'mosaik',    // DE
  'мозаика',   // RU
  // Arredo
  'arredo',                    // IT
  'furniture-and-accessories', // EN
  'ameublement',               // FR
  'einrichtung',               // DE
  'mueble',                    // ES
  'обстановка',                // RU
  'furniture', 'mobilier', 'moebel', // legacy
  // Pixall — collide con documento NID 2547
  'pixall',
  // Progetti — collide con page NID 3526 in EN
  'projects', 'progetti',
  // Tessili — slug singoli categoria tessuto (path reali Drupal)
  'arazzi', 'coperte', 'tappeti', 'cuscini',           // IT
  'tapestries', 'bedcover', 'carpets', 'cushions',      // EN
  'tapisseries', 'couvertures', 'tapis', 'coussins',    // FR
  'wandteppiche', 'decken', 'teppiche', 'kissen',       // DE
  'tapices', 'mantas', 'alfombras', 'cojines',          // ES
  'гобелены', 'одеяла', 'ковры', 'подушки',            // RU
  // Legacy aliases tessili
  'tessili', 'tessuti', 'fabrics', 'tissus', 'stoffe', 'telas',
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMPONENT_MAP: Record<string, React.ComponentType<{
  node: any;
  currentPage?: number;
  pageSize?: number;
  basePath?: string;
  searchParams?: Record<string, string | string[]>;
}>> = {
  Page,
  LandingPage,
  ProdottoMosaico,
  ProdottoArredo,
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

// ── Shared options type for async sub-components ───────────────────────────
interface ListingOpts {
  sectionConfig: { productType: string; filterField?: string; filterValue?: string; filterOperator?: '=' | 'STARTS_WITH' | 'CONTAINS' };
  slug: string[];
  sp: Record<string, string | string[]> | undefined;
  locale: string;
  currentPage: number;
  offset: number;
  title?: string;
}

// ── Async Server Component: FilterSidebar with data fetching ───────────────
// Wrapped in Suspense so it streams independently from ProductListingAsync.
async function FilterSidebarAsync({ opts }: { opts: ListingOpts }) {
  const { sectionConfig, slug, sp, locale } = opts;
  const contentType = sectionConfig.productType;

  const spRecord: Record<string, string> = {};
  if (sp) {
    Object.entries(sp).forEach(([k, v]) => {
      if (k !== 'page') spRecord[k] = Array.isArray(v) ? v[0] : v;
    });
  }
  const parsedFilters = parseFiltersFromUrl(slug, spRecord, locale);
  // React.cache() deduplicates this call — ProductListingAsync calls it too
  const filterOptions = await fetchAllFilterOptions(contentType, locale);

  const registryConfig = FILTER_REGISTRY[contentType];
  const availableFilters = registryConfig
    ? Object.values(registryConfig.filters)
    : [];

  const basePath = `/${locale}/${slug.join('/')}`;

  return (
    <FilterSidebar
      availableFilters={availableFilters}
      filterOptions={filterOptions}
      activeFilters={parsedFilters.activeFilters}
      locale={locale}
      basePath={basePath}
    />
  );
}

// ── Async Server Component: ProductListing with data fetching ──────────────
// Wrapped in Suspense so it streams independently from FilterSidebarAsync.
async function ProductListingAsync({ opts }: { opts: ListingOpts }) {
  const { sectionConfig, slug, sp, locale, currentPage, offset, title } = opts;
  const contentType = sectionConfig.productType;

  const spRecord: Record<string, string> = {};
  if (sp) {
    Object.entries(sp).forEach(([k, v]) => {
      if (k !== 'page') spRecord[k] = Array.isArray(v) ? v[0] : v;
    });
  }
  const parsedFilters = parseFiltersFromUrl(slug, spRecord, locale);

  // sectionConfig.filterOperator is the authoritative source for operator overrides
  // (e.g. STARTS_WITH for NeoColibrì subcollections). Apply it to the matching
  // filterDefinition so it reaches buildJsonApiFilters regardless of detection path.
  // This bridges the routing layer (section-config) with the URL parser (search-params).
  if (
    sectionConfig.filterOperator &&
    sectionConfig.filterOperator !== '=' &&
    sectionConfig.filterField &&
    parsedFilters.filterDefinitions.length > 0
  ) {
    for (const fd of parsedFilters.filterDefinitions) {
      if (fd.field === sectionConfig.filterField) {
        fd.operator = sectionConfig.filterOperator;
      }
    }
  }

  const { products, total } = await fetchProducts({
    productType: contentType,
    locale,
    limit: PAGE_SIZE,
    offset,
    filters:
      parsedFilters.filterDefinitions.length > 0
        ? parsedFilters.filterDefinitions
        : undefined,
    filterField:
      parsedFilters.filterDefinitions.length === 0
        ? sectionConfig.filterField
        : undefined,
    filterValue:
      parsedFilters.filterDefinitions.length === 0
        ? sectionConfig.filterValue
        : undefined,
    filterOperator:
      parsedFilters.filterDefinitions.length === 0
        ? sectionConfig.filterOperator
        : undefined,
  });

  const activeQueryParams: Record<string, string | string[]> = {};
  parsedFilters.activeFilters
    .filter((f) => f.type === 'query')
    .forEach((f) => {
      activeQueryParams[f.key] = f.value;
    });

  const basePath = `/${locale}/${slug.join('/')}`;
  const displayTitle = title ?? slug[slug.length - 1] ?? slug[0] ?? 'Prodotti';

  return (
    <ProductListing
      title={displayTitle}
      products={products}
      total={total}
      locale={locale}
      currentPage={currentPage}
      pageSize={PAGE_SIZE}
      basePath={basePath}
      activeQueryParams={activeQueryParams}
    />
  );
}

// ── Helper: renderizza listing prodotti con FilterSidebar ──────────────────
// Usato in 3 punti: LISTING_SLUG_OVERRIDES, fallback getSectionConfig, e
// intercettazione node--categoria (sotto-categorie arredo).
// Suspense boundaries enable progressive streaming: sidebar and listing
// render independently — each shows a shimmer skeleton while data loads.
function renderListingLayout(opts: ListingOpts) {
  return (
    <>
      <style>{`
        .filter-page-grid { display: grid; grid-template-columns: 16.25rem 1fr; min-height: 100vh; align-items: start; }
        @media (max-width: 48rem) { .filter-page-grid { grid-template-columns: 1fr; } }
      `}</style>
      <div className="filter-page-grid">
        <Suspense fallback={<FilterSidebarSkeleton />}>
          <FilterSidebarAsync opts={opts} />
        </Suspense>
        <Suspense fallback={<ProductListingSkeleton />}>
          <ProductListingAsync opts={opts} />
        </Suspense>
      </div>
    </>
  );
}

interface SlugPageProps {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}

export async function generateMetadata({ params }: SlugPageProps) {
  const { locale, slug } = await params;
  // Drupal aliases do NOT include locale prefix
  const drupalPath = `/${slug.join('/')}`;

  try {
    // getPageData is React.cache()-wrapped — if SlugPage already called it with
    // the same args, this returns the cached result (no extra network request).
    const resource = await getPageData(locale, drupalPath);
    const title = resource?.field_titolo_main as string | undefined;
    return { title: title ?? (resource as { title?: string })?.title ?? 'Sicis' };
  } catch {
    return { title: 'Sicis' };
  }
}

export default async function SlugPage({ params, searchParams }: SlugPageProps) {
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

  // Bypass translatePath per slug che devono essere listing prodotti ma hanno nodi Drupal
  // con lo stesso alias (categoria_blog, documento, page) che verrebbero renderizzati al posto.
  const isListingSlug = registry?.listingSlugs.has(singleSlug!) ?? LISTING_SLUG_OVERRIDES.has(singleSlug!);
  if (singleSlug && isListingSlug) {
    const sectionConfig = await getSectionConfigAsync(slug, locale);
    if (sectionConfig) {
      return renderListingLayout({
        sectionConfig, slug, sp, locale, currentPage, offset,
        title: singleSlug,
      });
    }
    notFound();
  }

  let resource: Record<string, unknown> | null = null;

  try {
    // getPageData is React.cache()-wrapped — generateMetadata() already called it
    // with the same args, so this returns the cached result (no extra network request).
    resource = await getPageData(locale, drupalPath);
  } catch (error) {
    console.error(`[SlugPage] Failed to fetch resource for path: ${path}`, error);
  }

  // Fallback: if no Drupal node found, try as a section listing page
  if (!resource) {
    const sectionConfig = await getSectionConfigAsync(slug, locale);
    if (sectionConfig) {
      return renderListingLayout({ sectionConfig, slug, sp, locale, currentPage, offset });
    }
    notFound();
  }

  // TypeScript narrowing: resource is guaranteed non-null here (notFound() throws above)
  const resolvedResource = resource as Record<string, unknown>;
  const type = resolvedResource.type as string;

  // ── Subcategory listing interception (Option B2 — Apollo decision) ──────
  // When translatePath resolves a node--categoria that corresponds to a product
  // listing section (e.g. /arredo/poltrone → node--categoria "Poltrone"),
  // render the listing layout with FilterSidebar instead of the generic Categoria
  // component (which would show "Categoria non mappata").
  //
  // The guard is: type === 'node--categoria' AND getSectionConfig returns a config
  // with filterField (meaning it's a subcategory listing, not a hub category).
  if (type === 'node--categoria') {
    const sectionConfig = await getSectionConfigAsync(slug, locale);
    if (sectionConfig && sectionConfig.filterField) {
      // Use the CMS node title for the page heading (preserves SEO data from Drupal)
      const nodeTitle =
        (resolvedResource.field_titolo_main as { value?: string } | undefined)?.value
        ?? (resolvedResource.title as string | undefined)
        ?? slug[slug.length - 1];
      return renderListingLayout({
        sectionConfig, slug, sp, locale, currentPage, offset,
        title: nodeTitle,
      });
    }
  }

  // ── node--page with field_page_id → product listing interception ──────────
  // Drupal uses node--page nodes as hub pages for product sections.
  // When field_page_id maps to a product type, render the listing layout.
  // Example: /prodotti-tessili → node--page with field_page_id='tessile'
  if (type === 'node--page') {
    const pageId = resolvedResource.field_page_id as string | undefined;
    const PAGE_ID_TO_PRODUCT_TYPE: Record<string, string> = {
      'tessile': 'prodotto_tessuto',
    };
    const productType = pageId ? PAGE_ID_TO_PRODUCT_TYPE[pageId] : undefined;
    if (productType) {
      const nodeTitle =
        (resolvedResource.field_titolo_main as string | undefined)
        ?? (resolvedResource.title as string | undefined)
        ?? slug[slug.length - 1];
      return renderListingLayout({
        sectionConfig: { productType },
        slug, sp, locale, currentPage, offset,
        title: nodeTitle,
      });
    }
  }

  const componentName = getComponentName(type);
  // For unmapped taxonomy terms, use generic TaxonomyTerm instead of UnknownEntity
  const resolvedName = componentName === 'UnknownEntity' && type.startsWith('taxonomy_term--')
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
