import { cache, Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { ListingContent } from './_ListingContent';
import { ProductListingSkeleton } from '@/components/composed/ProductListingSkeleton';
import { notFound } from 'next/navigation';
// fetchEntity (C1 legacy) removed — replaced by content/{nid} + blocks/{nid}
import { resolvePath } from '@/lib/api/resolve-path';
import {
  fetchDescriptiveCategoryNids,
  fetchDescriptiveCategorySlugToNid,
  ARREDO_INDOOR_PARENT_NID,
} from '@/lib/api/category-hub';
import { fetchContent } from '@/lib/api/content';
import { fetchBlocks } from '@/lib/api/blocks';
import { fetchMosaicProduct } from '@/lib/api/mosaic-product';
import { fetchVetriteProduct } from '@/lib/api/vetrite-product';
import type { VetriteProduct } from '@/lib/api/vetrite-product';
import { fetchTextileProduct } from '@/lib/api/textile-product';
import type { TextileProduct } from '@/lib/api/textile-product';
import { fetchPixallProduct } from '@/lib/api/pixall-product';
import type { PixallProduct } from '@/lib/api/pixall-product';
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
import {
  getSectionConfigAsync,
  PRODUCT_LISTING_SLUGS,
} from '@/domain/routing/section-config';
import { getRoutingRegistry } from '@/domain/routing/routing-registry';
import { parseFiltersFromUrl } from '@/domain/filters/search-params';
// fetchAllFilterOptions removed — all V3/V4 legacy endpoints are dead
// fetchProducts (V1 legacy) removed — all product types use type-specific listing endpoints
import { FILTER_REGISTRY, deslugify } from '@/domain/filters/registry';
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
import ProdottoArredoFiniture from '@/templates/nodes/ProdottoArredoFiniture';
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
import TaxonomyTerm from '@/templates/taxonomy/TaxonomyTerm';
import { renderProductListing } from '@/lib/render-product-listing';

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
    const blocks = (blocksData ?? []).map((block: Record<string, unknown>) => ({
      ...block,
      // blocks/{nid} returns type as "blocco_intro", but ParagraphResolver
      // expects "paragraph--blocco_intro". Add prefix if missing.
      type:
        typeof block.type === 'string' && !block.type.startsWith('paragraph--')
          ? `paragraph--${block.type}`
          : block.type,
    }));

    if (contentData) {
      return {
        ...contentData,
        type: `${resolved.type}--${resolved.bundle}`,
        id: String(resolved.nid),
        _nid: resolved.nid,
        field_blocchi: blocks,
      } as Record<string, unknown>;
    }

    // content/{nid} returned empty but resolvePath succeeded.
    // Create a minimal entity so COMPONENT_MAP can dispatch to the right template.
    // This covers bundles not yet supported by content/{nid} (e.g. showroom, progetto).
    return {
      type: `${resolved.type}--${resolved.bundle}`,
      id: String(resolved.nid),
      _nid: resolved.nid,
      langcode: locale,
      field_blocchi: blocks,
    } as Record<string, unknown>;
  }

  return null;
});

// Legacy SEO aliases NOT covered by PRODUCT_LISTING_SLUGS in section-config.
// These exist purely for backward-compat/SEO — do NOT remove without verifying
// there are no inbound links or Drupal routes that still use these paths.
//
// мозаика    — RU mosaico (MOSAICO_SLUGS omits the Cyrillic variant)
// furniture  — legacy EN arredo (in ARREDO_PREFIXES only, not ARREDO_SLUGS)
// mobilier   — legacy FR arredo (in ARREDO_PREFIXES only)
// moebel     — legacy DE arredo (in ARREDO_PREFIXES only)
// leuchten   — old DE illuminazione slug (section-config now uses 'beleuchtung')
// iluminación — ES illuminazione with accent (section-config uses 'iluminacion')
const LEGACY_SEO_ALIASES = new Set([
  'мозаика', // RU mosaico
  'furniture', // legacy EN arredo
  'mobilier', // legacy FR arredo
  'moebel', // legacy DE arredo
  'leuchten', // old DE illuminazione
  'iluminación', // ES illuminazione with accent variant
]);

// Fallback: used when registry is null (Drupal menu unavailable).
// Slug che devono bypassare translatePath perché Drupal ha nodi (categoria_blog,
// documento, page) con lo stesso alias che verrebbero renderizzati al posto del
// listing prodotti corretto. getSectionConfig gestisce il productType.
// Derived programmatically from section-config slug Sets (PRODUCT_LISTING_SLUGS)
// plus the small LEGACY_SEO_ALIASES above — 58 entries reduced to 6 kept manually.
const LISTING_SLUG_OVERRIDES: ReadonlySet<string> = new Set([
  ...PRODUCT_LISTING_SLUGS,
  ...LEGACY_SEO_ALIASES,
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

// Content listing slugs — all locales for blog, projects, environments, showroom,
// and download catalogues. Checked BEFORE getPageData() so these routes work
// even when Drupal is offline or returns a different entity type.
const CONTENT_LISTING_SLUGS: Record<string, string> = {
  // Blog (articoli + news + tutorial)
  blog: 'blog',
  'il-blog': 'blog',
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
  TaxonomyTerm,
};

const PAGE_SIZE = 48;

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
  setRequestLocale(locale);

  // searchParams is resolved lazily — only awaited in branches that need it.
  // Entity detail pages (prodotto_*, showroom) return before calling getSearchParams(),
  // keeping those render paths structurally closer to static for future PPR (Phase 2).
  const getSearchParams = (): Promise<
    Record<string, string | string[]> | undefined
  > => searchParams ?? Promise.resolve(undefined);

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

  // ── Content listing slug interception ─────────────────────────────────────
  // Must be checked BEFORE LISTING_SLUG_OVERRIDES — otherwise slugs like "blog",
  // "showroom", "environments" that exist in the Drupal routing registry would be
  // caught by the product listing check, getSectionConfigAsync returns null, → 404.
  if (singleSlug && CONTENT_LISTING_SLUGS[singleSlug]) {
    const sp = await getSearchParams();
    const pageStr = Array.isArray(sp?.page) ? sp.page[0] : sp?.page;
    const currentPage = Math.max(1, parseInt(pageStr ?? '1', 10));
    const offset = (currentPage - 1) * PAGE_SIZE;
    const listingType = CONTENT_LISTING_SLUGS[singleSlug];
    const basePath = `/${locale}/${slug.join('/')}`;
    // Try to get the CMS title; fall back to deslugify when Drupal is offline.
    let nodeTitle = deslugify(singleSlug);
    try {
      const resolved = await resolvePath(drupalPath, locale);
      if (resolved) {
        const content = await fetchContent(resolved.nid, locale);
        if (content) {
          nodeTitle =
            (content.field_titolo_main as string | undefined) ??
            (content.title as string | undefined) ??
            nodeTitle;
        }
      }
    } catch {
      // Drupal offline — keep deslugify fallback title
    }

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
    };

    const renderer = CONTENT_LISTING_RENDERERS[listingType];
    if (renderer) {
      return renderer();
    }
  }

  // Bypass translatePath per slug che devono essere listing prodotti ma hanno nodi Drupal
  // con lo stesso alias (categoria_blog, documento, page) che verrebbero renderizzati al posto.
  // Exception: if resolve-path says this slug is a regular "page" bundle, skip listing
  // intercept and render as content page (handles info-tecniche-* children of product menus).
  const isListingSlug =
    registry?.listingSlugs.has(singleSlug!) ||
    LISTING_SLUG_OVERRIDES.has(singleSlug!);
  if (singleSlug && isListingSlug) {
    const resolvedListing = await resolvePath(drupalPath, locale);
    // Skip listing only if resolve-path says it's a page AND the slug is NOT
    // in the hardcoded LISTING_SLUG_OVERRIDES (which are known product listings
    // that happen to share aliases with Drupal page nodes, e.g. "prodotti-tessili").
    // Only menu-derived slugs (registry-only) can be overridden by page bundle.
    if (
      resolvedListing?.bundle === 'page' &&
      !LISTING_SLUG_OVERRIDES.has(singleSlug!)
    ) {
      // Not a listing — fall through to entity rendering below
    } else {
      if (
        process.env.NODE_ENV !== 'production' &&
        LISTING_SLUG_OVERRIDES.has(singleSlug!) &&
        !registry?.listingSlugs.has(singleSlug!)
      ) {
        console.debug('[routing] LISTING_SLUG_OVERRIDES hit:', {
          slug: singleSlug,
          locale,
        });
      }
      return (
        <Suspense fallback={<ProductListingSkeleton />}>
          <ListingContent
            singleSlug={singleSlug}
            slug={slug}
            locale={locale}
            searchParams={searchParams}
            drupalPath={drupalPath}
          />
        </Suspense>
      );
    }
  }

  // ── Arredo descriptive categories — slug-based detection ────────────────
  // Pages like /arredo/bar-e-ristoranti have no Drupal path alias, so resolvePath
  // returns null and all NID-based guards are ineffective. Detect by matching the
  // second slug against slugified names from the NID 3522 children, then fetch
  // content+blocks directly by NID and render via Categoria template.
  // Must run BEFORE the product-detail and multi-slug listing interceptors.
  if (slug.length >= 2) {
    const firstSlug = decodeURIComponent(slug[0]).normalize('NFC');
    const arredoConfig = FILTER_REGISTRY['prodotto_arredo'];
    const isArredoPrefix =
      arredoConfig !== undefined &&
      Object.values(arredoConfig.basePaths).some(
        (bp) => firstSlug === bp.split('/')[0],
      );
    if (isArredoPrefix) {
      const secondSlug = decodeURIComponent(slug[1]).normalize('NFC');

      // ── Exception: /arredo/outdoor — no Drupal alias, hardcoded NID 348 ──
      // Render as a category product listing WITHOUT sidebar and WITHOUT P0 filter
      // selector — exactly like /next-art. hubParentNid is intentionally omitted so
      // ProductListingTemplate renders no SpecFilterSidebar and no "Cambia" button.
      // "outdoor" is locale-invariant. This is an isolated exception — no other page
      // is affected.
      // Guard: slug.length === 2 only. A third segment means a product detail page
      // (e.g. /arredo/outdoor/filicudi-outdoor-coffee-table) — let it fall through
      // to the product-detail interception block below (resolvePath → prodotto_arredo).
      if (secondSlug === 'outdoor' && slug.length === 2) {
        const outdoorTitle =
          ((await fetchContent(348, locale).catch(() => null))
            ?.field_titolo_main as string | undefined) ?? 'Outdoor';
        const sp = await getSearchParams();
        return renderProductListing({
          productType: 'prodotto_arredo',
          title: outdoorTitle,
          slug,
          searchParams: sp,
          locale,
          resolvedCategoryNid: 348,
          // hubParentNid deliberately omitted → no sidebar, no Cambia filter
        });
      }

      // Guard: descriptive category pages are always exactly 2 segments.
      // A third segment (slug.length >= 3) means a product detail page that
      // happens to share the second slug with a descriptive category name.
      // Let those fall through to the product-detail interception block.
      const descriptiveSlugToNid =
        slug.length === 2
          ? await fetchDescriptiveCategorySlugToNid(locale)
          : new Map<string, number>();
      const descriptiveNid = descriptiveSlugToNid.get(secondSlug);
      if (descriptiveNid != null) {
        const [contentData, blocksData] = await Promise.all([
          fetchContent(descriptiveNid, locale),
          fetchBlocks(descriptiveNid, locale),
        ]);
        const descriptiveBlocks = (blocksData ?? []).map(
          (block: Record<string, unknown>) => ({
            ...block,
            type:
              typeof block.type === 'string' &&
              !block.type.startsWith('paragraph--')
                ? `paragraph--${block.type}`
                : block.type,
          }),
        );
        const descriptiveResource: Record<string, unknown> = {
          ...(contentData ?? {}),
          type: 'node--categoria',
          id: String(descriptiveNid),
          _nid: descriptiveNid,
          langcode: locale,
          field_blocchi: descriptiveBlocks,
        };
        const DescComponent = COMPONENT_MAP['Categoria'];
        if (DescComponent) {
          const sp = await getSearchParams();
          return (
            <DescComponent
              node={descriptiveResource}
              basePath={`/${locale}/${slug.join('/')}`}
              searchParams={sp}
            />
          );
        }
      }
    }
  }

  // ── Arredo finiture dedicated page (/arredo/…/product/finiture) ──────────
  // Must run BEFORE product-detail interception. When last segment is 'finiture'
  // and the preceding path resolves to a prodotto_arredo, render the finiture page.
  if (slug.length > 2 && slug[slug.length - 1] === 'finiture') {
    const productSlug = slug.slice(0, -1);
    const productDrupalPath = decodeURIComponent(`/${productSlug.join('/')}`);
    const resolvedFiniture = await resolvePath(productDrupalPath, locale);
    if (resolvedFiniture?.bundle === 'prodotto_arredo') {
      const product = await fetchArredoProduct(resolvedFiniture.nid, locale);
      if (product) {
        return (
          <ProdottoArredoFiniture
            product={product}
            locale={locale}
            slug={slug}
          />
        );
      }
    }
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
          // US locale: hide out-of-stock products entirely
          if (locale === 'us' && product.noUsaStock) {
            notFound();
          }
          return <MosaicProductPreview product={product} locale={locale} />;
        }
      }
      if (resolved.bundle === 'prodotto_vetrite') {
        const product = await fetchVetriteProduct(resolved.nid, locale);
        if (product) {
          // US locale: hide out-of-stock products entirely
          if (locale === 'us' && product.noUsaStock) {
            notFound();
          }
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
          // Inject finiture page href so ProdottoArredo can render the "Vedi finiture" link
          legacyNode._finitureHref = `/${locale}/${slug.join('/')}/finiture`;
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
      // ── Showroom detail — uses showroom/{nid} endpoint ──
      if (resolved.bundle === 'showroom') {
        const { fetchShowroomDetail } =
          await import('@/lib/api/showroom-detail');
        const showroomData = await fetchShowroomDetail(resolved.nid, locale);
        if (showroomData) {
          return <Showroom node={showroomData} />;
        }
      }
      // ── Taxonomy terms: mosaico_collezioni / mosaico_colori → mosaic-products endpoint ──
      // resolve-path gives us the TID directly — pass it to renderProductListing
      // so it uses the new endpoint without an extra taxonomy name→TID fetch.
      if (resolved.bundle === 'mosaico_collezioni') {
        const sp = await getSearchParams();
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
        const sp = await getSearchParams();
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
        const sp = await getSearchParams();
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
        const sp = await getSearchParams();
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
      // Arredo descriptive categories (children of NID 3522) are excluded — they render
      // content blocks, not product listings.
      if (resolved.bundle === 'categoria') {
        const descriptiveNids = await fetchDescriptiveCategoryNids(locale);
        if (descriptiveNids.has(resolved.nid)) {
          // Descriptive category: fall through to entity rendering (renders blocks)
        } else {
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
                // Arredo indoor: hardcoded NID 4261 so sidebar shows indoor subcategories.
                // Other types (illuminazione, tessuto): resolve hub page NID from Drupal.
                let hubParentNid: number | undefined;
                if (pt === 'prodotto_arredo') {
                  hubParentNid = ARREDO_INDOOR_PARENT_NID;
                } else {
                  const basePathSegment = (
                    ptConfig.basePaths[locale] ?? ptConfig.basePaths['it']
                  ).split('/')[0];
                  const baseResolved = await resolvePath(
                    `/${basePathSegment}`,
                    locale,
                  );
                  hubParentNid = baseResolved?.nid;
                }

                const sp = await getSearchParams();
                return renderProductListing({
                  productType: pt,
                  title: deslugify(slug[slug.length - 1]),
                  slug,
                  searchParams: sp,
                  locale,
                  resolvedCategoryNid: resolved.nid,
                  hubParentNid,
                });
              }
            }
          }
        } // end else (non-descriptive categoria)
      }
    }
  }

  // ── Multi-slug listing interception ──────────────────────────────────────
  // When the URL has 2+ segments (e.g. /mosaico/murano-smalto, /mosaico/colori/rosso),
  // check if it's a product listing with an active P0 filter. If so, render
  // with the new ProductListingTemplate instead of falling through to Drupal
  // node resolution (which would render old taxonomy templates).
  // Arredo descriptive categories (NID 3522 children) are excluded — they render blocks.
  if (slug.length > 1) {
    const resolvedForDescCheck = await resolvePath(drupalPath, locale);
    const isDescriptiveSlug =
      resolvedForDescCheck?.bundle === 'categoria' &&
      (await fetchDescriptiveCategoryNids(locale)).has(
        resolvedForDescCheck.nid,
      );

    // Skip listing intercept for page bundles only. Categoria bundles must pass
    // through — arredo/illuminazione/tessuto subcategories need the mlHubParentNid
    // resolution here. Mosaico/vetrite categoria nodes (e.g. /mosaic/marble) are
    // handled at the subcategory intercept (line ~940) via CATEGORY_LISTING_TYPES guard.
    const isContentPage = resolvedForDescCheck?.bundle === 'page';

    if (!isDescriptiveSlug && !isContentPage) {
      const sectionConfig = await getSectionConfigAsync(slug, locale);
      if (sectionConfig) {
        // Check if this is a product detail page (3+ segments after base for some types)
        // by verifying getSectionConfig returns a productType (it returns null for detail pages)
        const sp = await getSearchParams();
        const parsed = parseFiltersFromUrl(
          slug,
          (sp as Record<string, string>) ?? {},
          locale,
        );
        // Category-based product types that use this intercept for listing
        const CATEGORY_LISTING_TYPES = new Set([
          'prodotto_arredo',
          'prodotto_illuminazione',
          'prodotto_tessuto',
        ]);

        if (parsed.activeFilters.length > 0) {
          // Skip for categoria nodes of non-category-based types (mosaico/vetrite).
          // e.g. /mosaic/marble is a categoria NID 319 that should render via Categoria
          // template, not as a filtered product listing. These are Explore landing pages.
          if (
            resolvedForDescCheck?.bundle === 'categoria' &&
            !CATEGORY_LISTING_TYPES.has(sectionConfig.productType)
          ) {
            // Fall through to getPageData → Categoria template
          } else {
            // Title = the active P0 filter's label (e.g. "Murano Smalto", "Rosso", "Seats")
            // Falls back to deslugify of the filter value or last slug segment
            const activeP0 = parsed.activeFilters.find(
              (f) => f.type === 'path',
            );
            const listingTitle =
              activeP0?.label ?? deslugify(slug[slug.length - 1]);
            let mlHubParentNid: number | undefined;
            let mlResolvedCategoryNid: number | undefined;
            if (CATEGORY_LISTING_TYPES.has(sectionConfig.productType)) {
              const ptConfig = FILTER_REGISTRY[sectionConfig.productType];
              if (sectionConfig.productType === 'prodotto_arredo') {
                mlHubParentNid = ARREDO_INDOOR_PARENT_NID;
              } else if (ptConfig) {
                const basePathSegment = (
                  ptConfig.basePaths[locale] ?? ptConfig.basePaths['it']
                ).split('/')[0];
                const baseResolved = await resolvePath(
                  `/${basePathSegment}`,
                  locale,
                );
                mlHubParentNid = baseResolved?.nid;
              }
              // Use parent NID as resolvedCategoryNid so render-product-listing
              // fetches sibling subcategories for the sidebar
              if (mlHubParentNid) {
                mlResolvedCategoryNid = mlHubParentNid;
              }
            }

            return renderProductListing({
              productType: sectionConfig.productType,
              title: listingTitle,
              slug,
              searchParams: sp,
              locale,
              hubParentNid: mlHubParentNid,
              resolvedCategoryNid: mlResolvedCategoryNid,
            });
          } // end else (non-categoria or category-listing type)
        }
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

    // If resolved to a content node (page/categoria), build a minimal entity
    // and render via COMPONENT_MAP — don't hijack as product listing.
    // Handles /mosaic/marble (categoria NID 319) and similar Explore children.
    if (
      resolved &&
      (resolved.bundle === 'page' || resolved.bundle === 'categoria')
    ) {
      const [contentData, blocksData] = await Promise.all([
        fetchContent(resolved.nid, locale),
        fetchBlocks(resolved.nid, locale),
      ]);
      const blocks = (blocksData ?? []).map(
        (block: Record<string, unknown>) => ({
          ...block,
          type:
            typeof block.type === 'string' &&
            !block.type.startsWith('paragraph--')
              ? `paragraph--${block.type}`
              : block.type,
        }),
      );
      resource = {
        ...(contentData ?? {}),
        type: `${resolved.type}--${resolved.bundle}`,
        id: String(resolved.nid),
        _nid: resolved.nid,
        langcode: locale,
        field_blocchi: blocks,
      } as Record<string, unknown>;
    } else {
      // Last resort: try as a section listing page
      const sectionConfig = await getSectionConfigAsync(slug, locale);
      if (sectionConfig) {
        const sp = await getSearchParams();
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
    // Check if this is a descriptive category (falls through to block rendering)
    const catResolved = await resolvePath(drupalPath, locale);
    const catNid = catResolved?.nid;
    const descriptiveNids = catNid
      ? await fetchDescriptiveCategoryNids(locale)
      : new Set<number>();
    const isDescriptive = catNid ? descriptiveNids.has(catNid) : false;

    // Only intercept as listing for category-based product types (arredo, illuminazione, tessuto).
    // Mosaico/vetrite "categoria" nodes (e.g. /mosaic/marble NID 319) are Explore landing pages
    // that should render via the Categoria template, not as filtered product listings.
    const CATEGORY_LISTING_TYPES = new Set([
      'prodotto_arredo',
      'prodotto_illuminazione',
      'prodotto_tessuto',
    ]);
    if (!isDescriptive) {
      const sectionConfig = await getSectionConfigAsync(slug, locale);
      if (
        sectionConfig &&
        sectionConfig.filterField &&
        CATEGORY_LISTING_TYPES.has(sectionConfig.productType)
      ) {
        // Use the CMS node title for the page heading (preserves SEO data from Drupal)
        const nodeTitle =
          (resolvedResource.field_titolo_main as { value?: string } | undefined)
            ?.value ??
          (resolvedResource.title as string | undefined) ??
          slug[slug.length - 1];
        // Arredo indoor: hardcoded NID 4261 for sidebar filter options.
        const nodeHubParentNid =
          sectionConfig.productType === 'prodotto_arredo'
            ? ARREDO_INDOOR_PARENT_NID
            : undefined;
        const sp = await getSearchParams();
        return renderProductListing({
          productType: sectionConfig.productType,
          title: nodeTitle,
          slug,
          searchParams: sp,
          locale,
          hubParentNid: nodeHubParentNid,
        });
      }
    }
    // Descriptive categories (or unmatched): fall through to COMPONENT_MAP dispatch
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

  const sp = await getSearchParams();
  const pageStr = Array.isArray(sp?.page) ? sp.page[0] : sp?.page;
  const currentPage = Math.max(1, parseInt(pageStr ?? '1', 10));

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

export const revalidate = 600;
export const experimental_ppr = true;

// Adapter functions extracted to src/lib/adapters/legacy-node-adapters.ts
