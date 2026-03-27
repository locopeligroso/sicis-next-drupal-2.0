import { cache } from 'react';
import { apiGet, stripDomain, stripLocalePrefix, emptyToNull } from './client';
import type { ProductCard } from './products';

// ── Raw REST response shape from mosaic-products View ─────────────────────
interface MosaicProductListingItemRest {
  nid: string;
  field_titolo_main: string;
  field_immagine: string;
  field_prezzo_eu: string;
  field_prezzo_usa_sheet: string;
  field_prezzo_usa_sqft: string;
  field_prezzo_on_demand: string; // "Off" | "On"
  view_node: string; // Full Drupal URL to product detail page
}

// ── Normalizer ────────────────────────────────────────────────────────────

function normalizeItem(item: MosaicProductListingItemRest): ProductCard {
  const rawPath = item.view_node ? stripDomain(item.view_node) : null;
  const path = rawPath ? stripLocalePrefix(rawPath) : null;

  return {
    id: item.nid,
    type: 'prodotto_mosaico',
    title: item.field_titolo_main,
    subtitle: null,
    imageUrl: emptyToNull(item.field_immagine),
    imageUrlMain: emptyToNull(item.field_immagine),
    price: emptyToNull(item.field_prezzo_eu),
    priceOnDemand: item.field_prezzo_on_demand === 'On',
    path,
  };
}

// ── Fetcher ───────────────────────────────────────────────────────────────
// URL: /{locale}/api/v1/mosaic-products/{collectionTid}/{colorTid}
// Both params required. Use "all" for no filter.
// No server-side pagination — endpoint returns all matching items.

export const fetchMosaicProductListing = cache(
  async (
    locale: string,
    collectionTid: number | 'all' = 'all',
    colorTid: number | 'all' = 'all',
  ): Promise<{ products: ProductCard[]; total: number }> => {
    const items = await apiGet<MosaicProductListingItemRest[]>(
      `/${locale}/mosaic-products/${collectionTid}/${colorTid}`,
      {},
      60,
    );

    if (!items || !Array.isArray(items)) {
      return { products: [], total: 0 };
    }

    return {
      products: items.map(normalizeItem),
      total: items.length,
    };
  },
);
