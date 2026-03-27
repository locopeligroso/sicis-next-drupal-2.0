import { cache } from 'react';
import { apiGet, stripDomain, stripLocalePrefix, emptyToNull } from './client';
import type { ProductCard } from './products';

// ── Raw REST response shape from vetrite-products View ────────────────────
interface VetriteProductListingItemRest {
  nid: string;
  field_titolo_main: string;
  field_immagine_anteprima: string;
  field_prezzo_eu: string;
  field_prezzo_usa: string;
  field_prezzo_on_demand: string; // "Off" | "On"
  view_node: string; // Full Drupal URL to product detail page
}

// ── Normalizer ────────────────────────────────────────────────────────────

function normalizeItem(item: VetriteProductListingItemRest): ProductCard {
  const rawPath = item.view_node ? stripDomain(item.view_node) : null;
  const path = rawPath ? stripLocalePrefix(rawPath) : null;

  return {
    id: item.nid,
    type: 'prodotto_vetrite',
    title: item.field_titolo_main,
    subtitle: null,
    imageUrl: emptyToNull(item.field_immagine_anteprima),
    imageUrlMain: emptyToNull(item.field_immagine_anteprima),
    price: emptyToNull(item.field_prezzo_eu),
    priceOnDemand: item.field_prezzo_on_demand === 'On',
    path,
  };
}

// ── Fetcher ───────────────────────────────────────────────────────────────
// URL: /{locale}/api/v1/vetrite-products/{collectionTid}/{colorTid}
// Both params required. Use "all" for no filter.
// No server-side pagination — endpoint returns all matching items.

export const fetchVetriteProductListing = cache(
  async (
    locale: string,
    collectionTid: number | 'all' = 'all',
    colorTid: number | 'all' = 'all',
  ): Promise<{ products: ProductCard[]; total: number }> => {
    const items = await apiGet<VetriteProductListingItemRest[]>(
      `/${locale}/vetrite-products/${collectionTid}/${colorTid}`,
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
