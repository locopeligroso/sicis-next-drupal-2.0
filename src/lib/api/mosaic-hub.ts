import { cache } from 'react';
import {
  apiGet,
  stripDomain,
  stripLocalePrefix,
  emptyToNull,
  resolveImageUrl,
} from './client';

// ── Raw response shape from Drupal views ─────────────────────────────────

interface MosaicViewItem {
  name: string;
  field_immagine: string | null;
  view_taxonomy_term: string;
}

// Shape returned by mosaic-shapes and mosaic-finishes endpoints:
// { tid, name, view_taxonomy_term } — no field_immagine
interface MosaicTaxonomyItem {
  tid: string | number;
  name: string;
  view_taxonomy_term: string;
}

// ── Public shape ─────────────────────────────────────────────────────────

export interface MosaicTermItem {
  name: string;
  imageUrl: string | null;
  href: string;
  /** Taxonomy term ID — available for shapes/finishes, undefined for colors/collections */
  tid?: string;
}

// ── Normalizer ───────────────────────────────────────────────────────────

function normalize(items: MosaicViewItem[], locale: string): MosaicTermItem[] {
  return items.map((item) => {
    const rawPath = stripDomain(item.view_taxonomy_term);
    const pathWithoutLocale = rawPath ? stripLocalePrefix(rawPath) : null;
    return {
      name: item.name,
      imageUrl: resolveImageUrl(item.field_immagine),
      href: pathWithoutLocale ? `/${locale}${pathWithoutLocale}` : '#',
    };
  });
}

// ── Fetchers ─────────────────────────────────────────────────────────────

export const fetchMosaicColors = cache(
  async (locale: string): Promise<MosaicTermItem[]> => {
    const data = await apiGet<MosaicViewItem[]>(
      `/${locale}/mosaic-colors`,
      {},
      86400,
    );
    return data ? normalize(data, locale) : [];
  },
);

export const fetchMosaicCollections = cache(
  async (locale: string): Promise<MosaicTermItem[]> => {
    const data = await apiGet<MosaicViewItem[]>(
      `/${locale}/mosaic-collections`,
      {},
      86400,
    );
    return data ? normalize(data, locale) : [];
  },
);

export const fetchMosaicShapes = cache(
  async (locale: string): Promise<MosaicTermItem[]> => {
    const data = await apiGet<MosaicTaxonomyItem[]>(
      `/${locale}/mosaic-shapes`,
      {},
      86400,
    );
    if (!data) return [];
    return data.map((item) => {
      const rawPath = stripDomain(item.view_taxonomy_term);
      const pathWithoutLocale = rawPath ? stripLocalePrefix(rawPath) : null;
      return {
        name: item.name,
        imageUrl: null,
        href: pathWithoutLocale ? `/${locale}${pathWithoutLocale}` : '#',
        tid: String(item.tid),
      };
    });
  },
);

// ── Product counts for cross-filtering ──────────────────────────────────

interface MosaicCountItem {
  tid: number;
  name: string;
  count: number;
}

interface MosaicProductCountsRest {
  forme: MosaicCountItem[];
  finiture: MosaicCountItem[];
  collezioni?: MosaicCountItem[];
  colori?: MosaicCountItem[];
}

export interface MosaicProductCounts {
  shapes: MosaicCountItem[];
  finishes: MosaicCountItem[];
  collections: MosaicCountItem[];
  colors: MosaicCountItem[];
}

/**
 * Fetches faceted counts for all 4 filter dimensions, optionally filtered
 * by any combination of active TIDs.
 *
 * Endpoint: `/{locale}/api/v1/mosaic-product-counts?collection={tid}&color={tid}&shape={tid}&finish={tid}`
 *
 * Each dimension's counts exclude its own filter (faceted pattern):
 * - shapes[].count = products matching collection + color + finish (ignores shape)
 * - collections[].count = products matching color + shape + finish (ignores collection)
 */
export const fetchMosaicProductCounts = cache(
  async (
    locale: string,
    collectionTid?: number | string,
    colorTid?: number,
    shapeTid?: number,
    finishTid?: number,
  ): Promise<MosaicProductCounts> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (collectionTid && collectionTid !== 'all')
      params.collection = collectionTid;
    if (colorTid) params.color = colorTid;
    if (shapeTid) params.shape = shapeTid;
    if (finishTid) params.finish = finishTid;
    // US locale: exclude out-of-stock products from counts
    if (locale === 'us') params.exclude_no_usa_stock = 1;

    const data = await apiGet<MosaicProductCountsRest>(
      `/${locale}/mosaic-product-counts`,
      params,
      600, // shorter TTL — counts change with active filters
    );

    return {
      shapes: data?.forme ?? [],
      finishes: data?.finiture ?? [],
      collections: data?.collezioni ?? [],
      colors: data?.colori ?? [],
    };
  },
);

export const fetchMosaicFinishes = cache(
  async (locale: string): Promise<MosaicTermItem[]> => {
    const data = await apiGet<MosaicTaxonomyItem[]>(
      `/${locale}/mosaic-finishes`,
      {},
      86400,
    );
    if (!data) return [];
    return data.map((item) => {
      const rawPath = stripDomain(item.view_taxonomy_term);
      const pathWithoutLocale = rawPath ? stripLocalePrefix(rawPath) : null;
      return {
        name: item.name,
        imageUrl: null,
        href: pathWithoutLocale ? `/${locale}${pathWithoutLocale}` : '#',
        tid: String(item.tid),
      };
    });
  },
);

// ── Mosaic category sub-pages ─────────────────────────────────────────────

/** NID mapping for the three mosaic sub-category page endpoints */
export const MOSAIC_CATEGORY_NIDS = {
  'mosaico-marmo': 319,
  'mosaico-artistico': 320,
  pixel: 321,
} as const;

/** Raw shape returned by Drupal `pages/{nid}` endpoints */
interface MosaicCategoryPageItem {
  nid: string;
  field_titolo_main: string;
  field_immagine: string;
  view_node: string;
}

/** Normalized shape for consumers */
export interface MosaicCategoryPage {
  nid: string;
  title: string;
  imageUrl: string | null;
  href: string | null;
}

export const fetchMosaicCategoryPages = cache(
  async (
    categoryNid: number,
    locale: string,
  ): Promise<MosaicCategoryPage[]> => {
    const data = await apiGet<MosaicCategoryPageItem[]>(
      `/${locale}/pages/${categoryNid}`,
      {},
      300,
    );
    if (!data) return [];
    return data.map((item) => {
      const rawHref = stripDomain(item.view_node);
      const hrefWithoutLocale = rawHref ? stripLocalePrefix(rawHref) : null;
      return {
        nid: item.nid,
        title: item.field_titolo_main,
        imageUrl: resolveImageUrl(item.field_immagine),
        href: hrefWithoutLocale ? `/${locale}${hrefWithoutLocale}` : null,
      };
    });
  },
);
