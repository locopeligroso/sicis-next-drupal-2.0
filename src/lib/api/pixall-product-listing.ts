import { cache } from 'react';
import { apiGet, stripDomain, stripLocalePrefix, emptyToNull } from './client';
import type { ProductCard } from './products';

// ── Raw REST response shape from pixall-products View ─────────────────────
interface PixallProductListingItemRest {
  nid: string;
  field_titolo_main: string;
  field_immagine_anteprima: string;
  view_node: string;
}

// ── Normalizer ────────────────────────────────────────────────────────────

function normalizeItem(item: PixallProductListingItemRest): ProductCard {
  const rawPath = item.view_node ? stripDomain(item.view_node) : null;
  const path = rawPath ? stripLocalePrefix(rawPath) : null;

  return {
    id: item.nid,
    type: 'prodotto_pixall',
    title: item.field_titolo_main,
    subtitle: null,
    imageUrl: emptyToNull(item.field_immagine_anteprima),
    imageUrlMain: emptyToNull(item.field_immagine_anteprima),
    price: null,
    priceOnDemand: false,
    path,
  };
}

// ── Fetcher ───────────────────────────────────────────────────────────────
// URL: /{locale}/api/v1/pixall-products
// No filters, no pagination — returns all pixall products.

export const fetchPixallProductListing = cache(
  async (
    locale: string,
  ): Promise<{ products: ProductCard[]; total: number }> => {
    const items = await apiGet<PixallProductListingItemRest[]>(
      `/${locale}/pixall-products`,
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
