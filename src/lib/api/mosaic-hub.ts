import { cache } from 'react';
import { apiGet, stripDomain, emptyToNull } from './client';

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

function normalize(items: MosaicViewItem[]): MosaicTermItem[] {
  return items.map((item) => ({
    name: item.name,
    imageUrl: emptyToNull(item.field_immagine),
    href: stripDomain(item.view_taxonomy_term) ?? '#',
  }));
}

// ── Fetchers ─────────────────────────────────────────────────────────────

export const fetchMosaicColors = cache(
  async (locale: string): Promise<MosaicTermItem[]> => {
    const data = await apiGet<MosaicViewItem[]>(
      `/${locale}/mosaic-colors`,
      {},
      86400,
    );
    return data ? normalize(data) : [];
  },
);

export const fetchMosaicCollections = cache(
  async (locale: string): Promise<MosaicTermItem[]> => {
    const data = await apiGet<MosaicViewItem[]>(
      `/${locale}/mosaic-collections`,
      {},
      86400,
    );
    return data ? normalize(data) : [];
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
    return data.map((item) => ({
      name: item.name,
      imageUrl: null,
      href: stripDomain(item.view_taxonomy_term) ?? '#',
      tid: String(item.tid),
    }));
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
    return data.map((item) => ({
      name: item.name,
      imageUrl: null,
      href: stripDomain(item.view_taxonomy_term) ?? '#',
      tid: String(item.tid),
    }));
  },
);
