import { cache } from 'react';
import { apiGet, stripDomain, stripLocalePrefix, emptyToNull } from './client';

// ── Raw response shape from Drupal views ─────────────────────────────────
// Same shape as mosaic-hub: { name, field_immagine, view_taxonomy_term }

interface VetriteViewItem {
  name: string;
  field_immagine: string | null;
  view_taxonomy_term: string;
}

// Shape returned by vetrite-finishes endpoint:
// { tid, name, view_taxonomy_term } — no field_immagine
interface VetriteTaxonomyItem {
  tid: string | number;
  name: string;
  view_taxonomy_term: string;
}

// ── Public shape ─────────────────────────────────────────────────────────

export interface VetriteTermItem {
  name: string;
  imageUrl: string | null;
  href: string;
  /** Taxonomy term ID — available for finishes, undefined for colors/collections */
  tid?: string;
}

// ── Normalizer ───────────────────────────────────────────────────────────

function normalize(
  items: VetriteViewItem[],
  locale: string,
): VetriteTermItem[] {
  return items.map((item) => {
    const rawPath = stripDomain(item.view_taxonomy_term);
    const pathWithoutLocale = rawPath ? stripLocalePrefix(rawPath) : null;
    return {
      name: item.name,
      imageUrl: emptyToNull(item.field_immagine),
      href: pathWithoutLocale ? `/${locale}${pathWithoutLocale}` : '#',
    };
  });
}

// ── Fetchers ─────────────────────────────────────────────────────────────

export const fetchVetriteColors = cache(
  async (locale: string): Promise<VetriteTermItem[]> => {
    const data = await apiGet<VetriteViewItem[]>(
      `/${locale}/vetrite-colors`,
      {},
      86400,
    );
    return data ? normalize(data, locale) : [];
  },
);

export const fetchVetriteCollections = cache(
  async (locale: string): Promise<VetriteTermItem[]> => {
    const data = await apiGet<VetriteViewItem[]>(
      `/${locale}/vetrite-collections`,
      {},
      86400,
    );
    return data ? normalize(data, locale) : [];
  },
);

export const fetchVetriteFinishes = cache(
  async (locale: string): Promise<VetriteTermItem[]> => {
    const data = await apiGet<VetriteTaxonomyItem[]>(
      `/${locale}/vetrite-finishes`,
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

interface VetriteCountItem {
  tid: number;
  name: string;
  count: number;
}

interface VetriteProductCountsRest {
  collezioni?: VetriteCountItem[];
  colori?: VetriteCountItem[];
  finiture?: VetriteCountItem[];
}

export interface VetriteProductCounts {
  collections: VetriteCountItem[];
  colors: VetriteCountItem[];
  finishes: VetriteCountItem[];
}

/**
 * Fetches faceted counts for all 3 filter dimensions, optionally filtered
 * by any combination of active TIDs.
 *
 * Endpoint: `/{locale}/vetrite-product-counts?collection={tid}&color={tid}&finish={tid}`
 *
 * Each dimension's counts exclude its own filter (faceted pattern):
 * - collections[].count = products matching color + finish (ignores collection)
 * - colors[].count     = products matching collection + finish (ignores color)
 * - finishes[].count   = products matching collection + color (ignores finish)
 */
export const fetchVetriteProductCounts = cache(
  async (
    locale: string,
    collectionTid?: number | string,
    colorTid?: number,
    finishTid?: number,
  ): Promise<VetriteProductCounts> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (collectionTid && collectionTid !== 'all')
      params.collection = collectionTid;
    if (colorTid) params.color = colorTid;
    if (finishTid) params.finish = finishTid;
    if (locale === 'us') params.exclude_no_usa_stock = 1;

    const data = await apiGet<VetriteProductCountsRest>(
      `/${locale}/vetrite-product-counts`,
      params,
      600, // shorter TTL — counts change with active filters
    );

    return {
      collections: data?.collezioni ?? [],
      colors: data?.colori ?? [],
      finishes: data?.finiture ?? [],
    };
  },
);
