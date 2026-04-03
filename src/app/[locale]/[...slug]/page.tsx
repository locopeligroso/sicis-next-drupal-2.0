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
import { resolveHubParentNid } from './_helpers';
import { PageBreadcrumb } from '@/components/composed/PageBreadcrumb';
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
import { SpecProjectListing } from '@/components/blocks/SpecProjectListing';
import { SpecInspirationListing } from '@/components/blocks/SpecInspirationListing';
import { SpecNewsListing } from '@/components/blocks/SpecNewsListing';
import { SpecTutorialListing } from '@/components/blocks/SpecTutorialListing';
import EnvironmentListing from '@/components_legacy/EnvironmentListing';
import ShowroomListing from '@/components_legacy/ShowroomListing';
import DocumentListing from '@/components_legacy/DocumentListing';
import {
  fetchEnvironments,
  fetchShowrooms,
  fetchProjects,
  fetchProjectCategories,
  fetchArticles,
  fetchBlogCategories,
  fetchNewsItems,
  fetchTutorialsByCategory,
  fetchTutorialTipologie,
  fetchDocuments,
} from '@/lib/api/listings';

// Node components
import Page from '@/templates/nodes/Page';
import Contatti from '@/templates/nodes/Contatti';
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

// listing slug detection eliminated — all product listing slugs now come from
// the CMS-driven routing registry (built from Drupal menu API).
// LEGACY_SEO_ALIASES (furniture, mobilier, moebel, leuchten, iluminación, мозаика)
// removed: Freddi fixed URL collisions in Drupal + registry covers via UUID cross-ref.
// Fallback: PRODUCT_LISTING_SLUGS from section-config used only when registry is null.

// Products master page slugs — one per locale.
// Must be checked BEFORE listing slug detection because "prodotti" is a
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
  // Newsroom
  newsroom: 'newsroom',
  // Tutorial vetrite
  'tutorial-vetrite': 'tutorial_vetrite',
  // Tutorial mosaico
  'tutorial-mosaico': 'tutorial_mosaico',
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

/** Locale variants of the Contacts page slug — routes to dedicated Contatti template */
const CONTATTI_SLUGS = new Set([
  'contatti', // IT
  'contacts', // EN / FR
  'kontakte', // DE
  'contactos', // ES
  '\u043a\u043e\u043d\u0442\u0430\u043a\u0442\u044b', // RU (контакты)
]);

/** Category-based product types that use subcategory listing intercept */
const CATEGORY_LISTING_TYPES = new Set([
  'prodotto_arredo',
  'prodotto_illuminazione',
  'prodotto_tessuto',
]);

/** Taxonomy term bundles that map to a product listing via renderProductListing */
const TAXONOMY_LISTING_MAP: Record<
  string,
  { productType: string; tidKey: 'resolvedTid' | 'resolvedColorTid' }
> = {
  mosaico_collezioni: {
    productType: 'prodotto_mosaico',
    tidKey: 'resolvedTid',
  },
  mosaico_colori: {
    productType: 'prodotto_mosaico',
    tidKey: 'resolvedColorTid',
  },
  vetrite_collezioni: {
    productType: 'prodotto_vetrite',
    tidKey: 'resolvedTid',
  },
  vetrite_colori: {
    productType: 'prodotto_vetrite',
    tidKey: 'resolvedColorTid',
  },
};

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
  // match the literal entries in listing slug detection / PRODUCTS_MASTER_SLUGS.
  const singleSlug = singleSlugRaw
    ? decodeURIComponent(singleSlugRaw).normalize('NFC')
    : null;

  // ── Products master page interception ─────────────────────────────────────
  // /prodotti (IT), /products (EN), etc. — static page listing all product categories.
  // Must be checked BEFORE listing slug detection to avoid falling through to Drupal.
  if (singleSlug && PRODUCTS_MASTER_SLUGS.has(singleSlug)) {
    return (
      <>
        <PageBreadcrumb slug={slug} locale={locale} />
        <ProductsMasterPage locale={locale} />
      </>
    );
  }

  // ── Content listing slug interception ─────────────────────────────────────
  // Must be checked BEFORE listing slug detection — otherwise slugs like "blog",
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
        const catStr = Array.isArray(sp?.cat) ? sp.cat[0] : sp?.cat;
        const categoryTid = catStr ? parseInt(catStr, 10) : undefined;
        const [{ projects, total }, categories] = await Promise.all([
          fetchProjects(locale, PAGE_SIZE, offset, categoryTid),
          fetchProjectCategories(locale),
        ]);
        return (
          <SpecProjectListing
            title={nodeTitle}
            projects={projects}
            categories={categories}
            activeCategory={categoryTid ?? null}
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
        const catStr = Array.isArray(sp?.cat) ? sp.cat[0] : sp?.cat;
        const categoryNid = catStr ? parseInt(catStr, 10) : undefined;
        const [{ articles, total }, categories] = await Promise.all([
          fetchArticles(locale, PAGE_SIZE, offset, categoryNid),
          fetchBlogCategories(locale),
        ]);
        return (
          <SpecInspirationListing
            title={nodeTitle}
            articles={articles}
            categories={categories}
            activeCategory={categoryNid ?? null}
            total={total}
            locale={locale}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            basePath={basePath}
          />
        );
      },
      newsroom: async () => {
        const { news, total } = await fetchNewsItems(locale, PAGE_SIZE, offset);
        return (
          <SpecNewsListing
            title={nodeTitle}
            news={news}
            total={total}
            locale={locale}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            basePath={basePath}
          />
        );
      },
      tutorial_vetrite: async () => {
        const tipStr = Array.isArray(sp?.tip) ? sp.tip[0] : sp?.tip;
        const tipologiaTid = tipStr ? parseInt(tipStr, 10) : undefined;
        const [{ tutorials, total }, tipologie] = await Promise.all([
          fetchTutorialsByCategory(
            locale,
            'vetrite',
            PAGE_SIZE,
            offset,
            tipologiaTid,
          ),
          fetchTutorialTipologie(locale),
        ]);
        return (
          <SpecTutorialListing
            title={nodeTitle || 'Tutorial Vetrite'}
            tutorials={tutorials}
            tipologie={tipologie}
            activeTipologia={tipologiaTid ?? null}
            total={total}
            locale={locale}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            basePath={basePath}
          />
        );
      },
      tutorial_mosaico: async () => {
        const { tutorials, total } = await fetchTutorialsByCategory(
          locale,
          'mosaico',
          PAGE_SIZE,
          offset,
        );
        return (
          <SpecTutorialListing
            title={nodeTitle || 'Tutorial Mosaico'}
            tutorials={tutorials}
            tipologie={[]}
            activeTipologia={null}
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

  // Product listing slug detection — CMS-driven via routing registry.
  // Fallback to hardcoded PRODUCT_LISTING_SLUGS when registry is unavailable.
  const isListingSlug =
    registry?.listingSlugs.has(singleSlug!) ||
    (!registry && PRODUCT_LISTING_SLUGS.has(singleSlug!));
  if (singleSlug && isListingSlug) {
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
          return (
            <>
              <PageBreadcrumb
                slug={slug}
                locale={locale}
                lastLabel={product.title}
              />
              <MosaicProductPreview product={product} locale={locale} />
            </>
          );
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
          return (
            <>
              <PageBreadcrumb
                slug={slug}
                locale={locale}
                lastLabel={product.title}
              />
              <ProdottoVetrite node={legacyNode} />
            </>
          );
        }
      }
      if (resolved.bundle === 'prodotto_tessuto') {
        const product = await fetchTextileProduct(resolved.nid, locale);
        if (product) {
          const legacyNode = textileToLegacyNode(product, locale);
          return (
            <>
              <PageBreadcrumb
                slug={slug}
                locale={locale}
                lastLabel={product.title}
              />
              <ProdottoTessuto node={legacyNode} />
            </>
          );
        }
      }
      if (resolved.bundle === 'prodotto_pixall') {
        const product = await fetchPixallProduct(resolved.nid, locale);
        if (product) {
          const legacyNode = pixallToLegacyNode(product, locale);
          return (
            <>
              <PageBreadcrumb
                slug={slug}
                locale={locale}
                lastLabel={product.title}
              />
              <ProdottoPixall node={legacyNode} />
            </>
          );
        }
      }
      if (resolved.bundle === 'prodotto_arredo') {
        const product = await fetchArredoProduct(resolved.nid, locale);
        if (product) {
          const legacyNode = arredoToLegacyNode(product, locale);
          // Inject finiture page href so ProdottoArredo can render the "Vedi finiture" link
          legacyNode._finitureHref = `/${locale}/${slug.join('/')}/finiture`;
          return (
            <>
              <PageBreadcrumb
                slug={slug}
                locale={locale}
                lastLabel={product.title}
              />
              <ProdottoArredo node={legacyNode} slug={slug} />
            </>
          );
        }
      }
      if (resolved.bundle === 'prodotto_illuminazione') {
        const product = await fetchIlluminazioneProduct(resolved.nid, locale);
        if (product) {
          // TODO: migrate to DS template — for now use legacy with adapter
          const legacyNode = illuminazioneToLegacyNode(product, locale);
          return (
            <>
              <PageBreadcrumb
                slug={slug}
                locale={locale}
                lastLabel={product.title}
              />
              <ProdottoIlluminazione node={legacyNode} />
            </>
          );
        }
      }
      // ── Showroom detail — uses showroom/{nid} endpoint ──
      if (resolved.bundle === 'showroom') {
        const { fetchShowroomDetail } =
          await import('@/lib/api/showroom-detail');
        const showroomData = await fetchShowroomDetail(resolved.nid, locale);
        if (showroomData) {
          return (
            <>
              <PageBreadcrumb slug={slug} locale={locale} />
              <Showroom node={showroomData} />
            </>
          );
        }
      }
      // ── Taxonomy terms: mosaico_collezioni / mosaico_colori → mosaic-products endpoint ──
      // resolve-path gives us the TID directly — pass it to renderProductListing
      // so it uses the new endpoint without an extra taxonomy name→TID fetch.
      // ── Taxonomy terms → product listing (mosaico/vetrite collections & colors) ──
      const taxonomyConfig = TAXONOMY_LISTING_MAP[resolved.bundle];
      if (taxonomyConfig) {
        const sp = await getSearchParams();
        return renderProductListing({
          productType: taxonomyConfig.productType,
          title: deslugify(slug[slug.length - 1]),
          slug,
          searchParams: sp,
          locale,
          ...(taxonomyConfig.tidKey === 'resolvedTid'
            ? { resolvedTid: resolved.nid }
            : { resolvedColorTid: resolved.nid }),
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
                const hubParentNid = await resolveHubParentNid(pt, locale);

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

    // ── Pixall under Mosaic hub: /mosaico/pixall → product listing ──
    // Pixall is a separate product line but lives under the Mosaic parent in Drupal
    // (categoria NID 342). Route it to the Pixall product listing instead of Categoria.
    if (resolvedForDescCheck?.bundle === 'categoria') {
      const sc = await getSectionConfigAsync(slug, locale);
      if (sc?.productType === 'prodotto_pixall') {
        const sp = await getSearchParams();
        return renderProductListing({
          productType: 'prodotto_pixall',
          title: 'Pixall',
          slug,
          searchParams: sp,
          locale,
        });
      }
    }

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
            let mlResolvedCategoryNid: number | undefined;
            const mlHubParentNid = CATEGORY_LISTING_TYPES.has(
              sectionConfig.productType,
            )
              ? await resolveHubParentNid(sectionConfig.productType, locale)
              : undefined;
            if (CATEGORY_LISTING_TYPES.has(sectionConfig.productType)) {
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
        return (
          <>
            <PageBreadcrumb
              slug={slug}
              locale={locale}
              lastLabel={product.title}
            />
            <MosaicProductPreview product={product} locale={locale} />
          </>
        );
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
  // Swap Page → Contatti for the contacts page (all locale slug variants)
  const Component =
    resolvedName === 'Page' && singleSlug && CONTATTI_SLUGS.has(singleSlug)
      ? Contatti
      : COMPONENT_MAP[resolvedName];

  if (!Component) {
    console.warn(`[SlugPage] No component mapped for type: ${type}`);
    return (
      <>
        <PageBreadcrumb slug={slug} locale={locale} />
        <UnknownEntity node={resolvedResource} />
      </>
    );
  }

  const sp = await getSearchParams();
  const pageStr = Array.isArray(sp?.page) ? sp.page[0] : sp?.page;
  const currentPage = Math.max(1, parseInt(pageStr ?? '1', 10));

  const nodeTitle =
    (resolvedResource?.field_titolo_main as string) ??
    (resolvedResource?.title as string) ??
    undefined;

  return (
    <>
      <PageBreadcrumb slug={slug} locale={locale} lastLabel={nodeTitle} />
      <Component
        node={resolvedResource}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        basePath={path}
        searchParams={sp}
      />
    </>
  );
}

export const revalidate = 600;
export const experimental_ppr = true;

// Adapter functions extracted to src/lib/adapters/legacy-node-adapters.ts
