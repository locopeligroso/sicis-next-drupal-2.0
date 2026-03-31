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
  // Next Art — collide con page NID 3545
  'next-art',
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

  // ── Content listing slug interception ─────────────────────────────────────
  // Must be checked BEFORE LISTING_SLUG_OVERRIDES — otherwise slugs like "blog",
  // "showroom", "environments" that exist in the Drupal routing registry would be
  // caught by the product listing check, getSectionConfigAsync returns null, → 404.
  if (singleSlug && CONTENT_LISTING_SLUGS[singleSlug]) {
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
  const isListingSlug =
    registry?.listingSlugs.has(singleSlug!) ||
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
              // Resolve the hub root page NID so filter-options can fetch
              // categories/{nid} for the sidebar. resolvePath is React.cache()
              // so no extra network call when already fetched in this request.
              const basePathSegment = (
                ptConfig.basePaths[locale] ?? ptConfig.basePaths['it']
              ).split('/')[0];
              const baseResolved = await resolvePath(
                `/${basePathSegment}`,
                locale,
              );
              const hubParentNid = baseResolved?.nid;

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
