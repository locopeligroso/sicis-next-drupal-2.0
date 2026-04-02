import { cache } from 'react';
import { apiGet, stripDomain, stripLocalePrefix, emptyToNull } from './client';
import type { ProductCard } from './products';

// ── Param shapes ──────────────────────────────────────────────────────────
// dual-tid:   mosaic, vetrite  → /{locale}/{endpoint}/{tid1}/{tid2}
// single-nid: arredo, illuminazione, textile → /{locale}/{endpoint}/{nid}
// none:       pixall → /{locale}/{endpoint}

type ParamShape = 'dual-tid' | 'single-nid' | 'none';

// ── Raw REST item shape (superset of all 6 variants) ──────────────────────
// The factory accesses only the fields named in the config — TypeScript uses
// the config's imageField/priceField keys as index signatures at runtime.
interface ProductListingItemRest {
  nid: string;
  field_titolo_main: string;
  view_node: string;
  // image variants
  field_immagine?: string;
  field_immagine_anteprima?: string;
  // price variants
  field_prezzo_eu?: string;
  // on-demand flag (mosaic + vetrite only)
  field_prezzo_on_demand?: string; // "On" | "Off"
  // stock flag (mosaic + vetrite only) — used to filter out-of-stock items on /us/
  field_no_usa_stock?: string | boolean; // "1" | "On" | true | "0" | "Off" | false | undefined
  [key: string]: string | boolean | undefined;
}

// ── Config type ───────────────────────────────────────────────────────────

export interface ProductListingConfig {
  /** Drupal View endpoint name, without leading slash. e.g. "mosaic-products" */
  endpoint: string;
  /** Product type string written into ProductCard.type */
  productType: string;
  /** Raw REST field name for the image URL */
  imageField: 'field_immagine' | 'field_immagine_anteprima';
  /** Raw REST field name for the EU price, or null when no price exists */
  priceField: 'field_prezzo_eu' | null;
  /**
   * How priceOnDemand is derived:
   * - "field" → read field_prezzo_on_demand === "On"
   * - false   → always false
   */
  priceOnDemand: 'field' | false;
  /** URL param shape: dual-tid | single-nid | none */
  paramShape: ParamShape;
}

// ── Config registry ───────────────────────────────────────────────────────

export const PRODUCT_LISTING_CONFIGS: Record<string, ProductListingConfig> = {
  prodotto_mosaico: {
    endpoint: 'mosaic-products',
    productType: 'prodotto_mosaico',
    imageField: 'field_immagine',
    priceField: 'field_prezzo_eu',
    priceOnDemand: 'field',
    paramShape: 'dual-tid',
  },
  prodotto_vetrite: {
    endpoint: 'vetrite-products',
    productType: 'prodotto_vetrite',
    imageField: 'field_immagine',
    priceField: 'field_prezzo_eu',
    priceOnDemand: 'field',
    paramShape: 'dual-tid',
  },
  prodotto_arredo: {
    endpoint: 'arredo-products',
    productType: 'prodotto_arredo',
    imageField: 'field_immagine_anteprima',
    priceField: 'field_prezzo_eu',
    priceOnDemand: false,
    paramShape: 'single-nid',
  },
  prodotto_illuminazione: {
    endpoint: 'illuminazione-products',
    productType: 'prodotto_illuminazione',
    imageField: 'field_immagine_anteprima',
    priceField: 'field_prezzo_eu',
    priceOnDemand: false,
    paramShape: 'single-nid',
  },
  prodotto_tessuto: {
    endpoint: 'textile-products',
    productType: 'prodotto_tessuto',
    imageField: 'field_immagine_anteprima',
    priceField: 'field_prezzo_eu',
    priceOnDemand: false,
    paramShape: 'single-nid',
  },
  next_art: {
    endpoint: 'next-art-products',
    productType: 'next_art',
    imageField: 'field_immagine_anteprima',
    priceField: 'field_prezzo_eu',
    priceOnDemand: false,
    paramShape: 'none',
  },
  prodotto_pixall: {
    endpoint: 'pixall-products',
    productType: 'prodotto_pixall',
    imageField: 'field_immagine_anteprima',
    priceField: null,
    priceOnDemand: false,
    paramShape: 'none',
  },
};

// ── Multi-TID collection groups ───────────────────────────────────────────
// Some Drupal mosaic collections span multiple taxonomy TIDs (parent + sub-collections).
// resolve-path returns only the primary TID; these groups include all sub-TIDs so the
// endpoint returns the full product set.
//
// Source: Drupal REST endpoint format `mosaic-products/{tid1+tid2+...}/{colorTid}`
// Provided by Freddi (2026-03-31):
//   neocolibrì  → primary TID 72, group 72+74+75+76
//   neoglass    → primary TID 67, group 67+77+78+79
export const MOSAIC_COLLECTION_GROUPS: Record<number, string> = {
  72: '72+74+75+76', // neocolibrì + barrels + domes + cubes
  67: '67+77+78+79', // neoglass + sub-collections
};

/**
 * Expands a single mosaic collection TID to its full group string when sub-collections exist.
 * Returns the original value unchanged for collections without a group (most collections).
 */
export function resolveCollectionTidGroup(tid: number | 'all'): string | 'all' {
  if (tid === 'all') return 'all';
  return MOSAIC_COLLECTION_GROUPS[tid] ?? String(tid);
}

// ── Param types per shape ─────────────────────────────────────────────────

export interface DualTidParams {
  // tid1 can be a '+'-joined multi-TID group string (e.g. "72+74+75+76") for mosaic sub-collections
  tid1?: number | string | 'all';
  tid2?: number | 'all';
  /** Shape TID for mosaic P1 filter — passed as ?shape={tid} query param */
  shapeTid?: number;
  /** Finish TID for mosaic P1 filter — passed as ?finish={tid} query param */
  finishTid?: number;
}

export interface SingleNidParams {
  nid?: number | 'all';
  /** Tipologia TID for tessuto P1 filter — passed as ?tipologia={tid} query param */
  tipologiaTid?: number;
}

export type ListingParams = DualTidParams | SingleNidParams | undefined;

// ── Normalizer factory ────────────────────────────────────────────────────

function makeNormalizer(
  config: ProductListingConfig,
): (item: ProductListingItemRest) => ProductCard {
  return function normalizeItem(item: ProductListingItemRest): ProductCard {
    const rawPath = item.view_node ? stripDomain(item.view_node) : null;
    const path = rawPath ? stripLocalePrefix(rawPath) : null;

    const imageUrl = emptyToNull(item[config.imageField] ?? '');

    const price =
      config.priceField !== null
        ? emptyToNull(item[config.priceField] ?? '')
        : null;

    const priceOnDemand =
      config.priceOnDemand === 'field'
        ? item.field_prezzo_on_demand === 'On'
        : false;

    const noUsaStock =
      item.field_no_usa_stock === '1' ||
      item.field_no_usa_stock === 'On' ||
      item.field_no_usa_stock === 'True' ||
      item.field_no_usa_stock === 'true' ||
      item.field_no_usa_stock === true;

    return {
      id: item.nid,
      type: config.productType,
      title: item.field_titolo_main,
      subtitle: null,
      imageUrl,
      price,
      priceOnDemand,
      noUsaStock,
      path,
    };
  };
}

// ── URL builder ───────────────────────────────────────────────────────────

interface BuiltUrl {
  path: string;
  queryParams: Record<string, string | number | boolean | undefined>;
}

function buildUrl(
  config: ProductListingConfig,
  locale: string,
  params: ListingParams,
): BuiltUrl {
  const base = `/${locale}/${config.endpoint}`;
  const queryParams: Record<string, string | number | boolean | undefined> = {};

  if (config.paramShape === 'dual-tid') {
    const p = (params ?? {}) as DualTidParams;
    const tid1 = p.tid1 ?? 'all';
    const tid2 = p.tid2 ?? 'all';
    if (p.shapeTid) queryParams.shape = p.shapeTid;
    if (p.finishTid) queryParams.finish = p.finishTid;
    return { path: `${base}/${tid1}/${tid2}`, queryParams };
  }

  if (config.paramShape === 'single-nid') {
    const p = (params ?? {}) as SingleNidParams;
    const nid = p.nid ?? 'all';
    if (p.tipologiaTid) queryParams.tipologia = p.tipologiaTid;
    return { path: `${base}/${nid}`, queryParams };
  }

  // none
  return { path: base, queryParams };
}

// ── Per-type cached fetchers (one cache() call per product type) ──────────
// cache() from React deduplicates within a single render tree per unique
// argument combination. We create one cached function per product type so
// the cache key space stays predictable.

type CachedFetcher = (
  locale: string,
  params?: ListingParams,
) => Promise<{ products: ProductCard[]; total: number }>;

function createCachedFetcher(config: ProductListingConfig): CachedFetcher {
  const normalize = makeNormalizer(config);

  return cache(
    async (
      locale: string,
      params?: ListingParams,
    ): Promise<{ products: ProductCard[]; total: number }> => {
      const { path, queryParams } = buildUrl(config, locale, params);
      const items = await apiGet<ProductListingItemRest[]>(
        path,
        queryParams,
        600,
      );

      if (!items || !Array.isArray(items)) {
        // Throw instead of returning empty — unstable_cache does NOT cache
        // thrown errors, so the next request retries the fetch. On ISR
        // revalidation, Next.js keeps the last valid cached page.
        throw new Error(`[product-listing] Empty response for ${path}`);
      }

      let products = items.map(normalize);

      // US locale: hide out-of-stock mosaic/vetrite products from listings.
      // Drupal REST view now includes field_no_usa_stock (added by Freddi).
      if (locale === 'us') {
        products = products.filter((p) => !p.noUsaStock);
      }

      return {
        products,
        total: products.length,
      };
    },
  );
}

// Build the registry of cached fetchers eagerly so each product type gets
// its own stable cache() identity across calls.
const FETCHER_REGISTRY: Record<string, CachedFetcher> = Object.fromEntries(
  Object.entries(PRODUCT_LISTING_CONFIGS).map(([key, config]) => [
    key,
    createCachedFetcher(config),
  ]),
);

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Fetches a product listing for any supported product type.
 *
 * @param productType - One of the 6 product type keys (e.g. "prodotto_mosaico")
 * @param locale      - Locale string (e.g. "it", "en")
 * @param params      - Filter params: DualTidParams | SingleNidParams | undefined
 *
 * @returns `{ products: ProductCard[], total: number }`
 *
 * Param shapes by type:
 * - mosaic / vetrite:              DualTidParams  { tid1?, tid2? }   (default: "all")
 * - arredo / illuminazione / tessuto: SingleNidParams { nid? }       (default: "all")
 * - pixall:                        no params needed
 */
export async function fetchProductListing(
  productType: string,
  locale: string,
  params?: ListingParams,
): Promise<{ products: ProductCard[]; total: number }> {
  const fetcher = FETCHER_REGISTRY[productType];
  if (!fetcher) {
    return { products: [], total: 0 };
  }
  return fetcher(locale, params);
}
