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
  [key: string]: string | undefined;
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
    imageField: 'field_immagine_anteprima',
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

// ── Param types per shape ─────────────────────────────────────────────────

export interface DualTidParams {
  tid1?: number | 'all';
  tid2?: number | 'all';
}

export interface SingleNidParams {
  nid?: number | 'all';
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

    return {
      id: item.nid,
      type: config.productType,
      title: item.field_titolo_main,
      subtitle: null,
      imageUrl,
      imageUrlMain: imageUrl,
      price,
      priceOnDemand,
      path,
    };
  };
}

// ── URL builder ───────────────────────────────────────────────────────────

function buildUrl(
  config: ProductListingConfig,
  locale: string,
  params: ListingParams,
): string {
  const base = `/${locale}/${config.endpoint}`;

  if (config.paramShape === 'dual-tid') {
    const p = (params ?? {}) as DualTidParams;
    const tid1 = p.tid1 ?? 'all';
    const tid2 = p.tid2 ?? 'all';
    return `${base}/${tid1}/${tid2}`;
  }

  if (config.paramShape === 'single-nid') {
    const p = (params ?? {}) as SingleNidParams;
    const nid = p.nid ?? 'all';
    return `${base}/${nid}`;
  }

  // none
  return base;
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
      const url = buildUrl(config, locale, params);
      const items = await apiGet<ProductListingItemRest[]>(url, {}, 60);

      if (!items || !Array.isArray(items)) {
        return { products: [], total: 0 };
      }

      return {
        products: items.map(normalize),
        total: items.length,
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
