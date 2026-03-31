/**
 * Tests for product-listing-factory.ts
 *
 * Tests:
 *  - PRODUCT_LISTING_CONFIGS covers all 7 product types
 *  - buildUrl produces correct paths for each param shape
 *  - makeNormalizer-derived normalizer produces correct ProductCard fields
 *  - fetchProductListing returns empty result for unknown product types
 *  - priceOnDemand: "On"→true, "Off"→false, config false→always false
 *  - emptyToNull handling for image and price fields
 *  - path stripping via stripDomain + stripLocalePrefix
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (must be hoisted before the module under test is imported) ──────────

vi.mock('@/lib/drupal/config', () => ({
  DRUPAL_BASE_URL: 'https://drupal.example.com',
}));

vi.mock('@/i18n/config', () => ({
  toDrupalLocale: (locale: string) => locale,
}));

// We mock the client module so apiGet never makes real HTTP calls.
// stripDomain / stripLocalePrefix / emptyToNull are kept as real implementations
// because they contain the logic under test (path stripping, empty-to-null).
vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/client')>();
  return {
    ...actual,
    // Override apiGet only; keep helpers as real implementations
    apiGet: vi.fn(),
  };
});

// ── Imports after mocks ───────────────────────────────────────────────────────

import {
  PRODUCT_LISTING_CONFIGS,
  fetchProductListing,
  type DualTidParams,
  type SingleNidParams,
} from '../product-listing-factory';
import { apiGet } from '@/lib/api/client';

const mockApiGet = vi.mocked(apiGet);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Builds a minimal REST listing item that satisfies ProductListingItemRest */
function makeItem(
  overrides: Record<string, string | undefined> = {},
): Record<string, string | undefined> {
  return {
    nid: '42',
    field_titolo_main: 'Test Product',
    view_node: 'https://drupal.example.com/it/mosaico/test-product',
    field_immagine: 'https://drupal.example.com/sites/default/files/img.jpg',
    field_immagine_anteprima:
      'https://drupal.example.com/sites/default/files/preview.jpg',
    field_prezzo_eu: '€ 120.00',
    field_prezzo_on_demand: 'Off',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── PRODUCT_LISTING_CONFIGS ───────────────────────────────────────────────────

describe('PRODUCT_LISTING_CONFIGS', () => {
  const EXPECTED_TYPES = [
    'prodotto_mosaico',
    'prodotto_vetrite',
    'prodotto_arredo',
    'prodotto_illuminazione',
    'prodotto_tessuto',
    'prodotto_pixall',
    'next_art',
  ];

  it('contains all 7 product type keys', () => {
    const keys = Object.keys(PRODUCT_LISTING_CONFIGS);
    for (const type of EXPECTED_TYPES) {
      expect(keys).toContain(type);
    }
  });

  it('has exactly 7 entries', () => {
    expect(Object.keys(PRODUCT_LISTING_CONFIGS)).toHaveLength(7);
  });

  it('prodotto_mosaico config uses dual-tid param shape', () => {
    expect(PRODUCT_LISTING_CONFIGS.prodotto_mosaico.paramShape).toBe(
      'dual-tid',
    );
  });

  it('prodotto_vetrite config uses dual-tid param shape', () => {
    expect(PRODUCT_LISTING_CONFIGS.prodotto_vetrite.paramShape).toBe(
      'dual-tid',
    );
  });

  it('prodotto_arredo config uses single-nid param shape', () => {
    expect(PRODUCT_LISTING_CONFIGS.prodotto_arredo.paramShape).toBe(
      'single-nid',
    );
  });

  it('prodotto_illuminazione config uses single-nid param shape', () => {
    expect(PRODUCT_LISTING_CONFIGS.prodotto_illuminazione.paramShape).toBe(
      'single-nid',
    );
  });

  it('prodotto_tessuto config uses single-nid param shape', () => {
    expect(PRODUCT_LISTING_CONFIGS.prodotto_tessuto.paramShape).toBe(
      'single-nid',
    );
  });

  it('prodotto_pixall config uses none param shape', () => {
    expect(PRODUCT_LISTING_CONFIGS.prodotto_pixall.paramShape).toBe('none');
  });

  it('prodotto_pixall has no priceField', () => {
    expect(PRODUCT_LISTING_CONFIGS.prodotto_pixall.priceField).toBeNull();
  });

  it('prodotto_mosaico uses field_immagine (full image)', () => {
    expect(PRODUCT_LISTING_CONFIGS.prodotto_mosaico.imageField).toBe(
      'field_immagine',
    );
  });

  it('prodotto_vetrite uses field_immagine_anteprima (preview image)', () => {
    expect(PRODUCT_LISTING_CONFIGS.prodotto_vetrite.imageField).toBe(
      'field_immagine_anteprima',
    );
  });

  it('dual-tid types have priceOnDemand: "field"', () => {
    expect(PRODUCT_LISTING_CONFIGS.prodotto_mosaico.priceOnDemand).toBe(
      'field',
    );
    expect(PRODUCT_LISTING_CONFIGS.prodotto_vetrite.priceOnDemand).toBe(
      'field',
    );
  });

  it('non-dual-tid types have priceOnDemand: false', () => {
    expect(PRODUCT_LISTING_CONFIGS.prodotto_arredo.priceOnDemand).toBe(false);
    expect(PRODUCT_LISTING_CONFIGS.prodotto_tessuto.priceOnDemand).toBe(false);
    expect(PRODUCT_LISTING_CONFIGS.prodotto_illuminazione.priceOnDemand).toBe(
      false,
    );
    expect(PRODUCT_LISTING_CONFIGS.prodotto_pixall.priceOnDemand).toBe(false);
  });
});

// ── fetchProductListing: URL building (inferred via apiGet call args) ─────────

describe('fetchProductListing — buildUrl', () => {
  it('dual-tid: calls apiGet with /locale/endpoint/all/all when no params', async () => {
    mockApiGet.mockResolvedValue([]);
    await fetchProductListing('prodotto_mosaico', 'it');
    expect(mockApiGet).toHaveBeenCalledWith(
      '/it/mosaic-products/all/all',
      {},
      60,
    );
  });

  it('dual-tid: injects tid1 and tid2 when provided', async () => {
    mockApiGet.mockResolvedValue([]);
    const params: DualTidParams = { tid1: 5, tid2: 12 };
    await fetchProductListing('prodotto_vetrite', 'en', params);
    expect(mockApiGet).toHaveBeenCalledWith(
      '/en/vetrite-products/5/12',
      {},
      60,
    );
  });

  it('dual-tid: uses "all" for omitted tid1 but keeps explicit tid2', async () => {
    mockApiGet.mockResolvedValue([]);
    const params: DualTidParams = { tid2: 7 };
    await fetchProductListing('prodotto_mosaico', 'fr', params);
    expect(mockApiGet).toHaveBeenCalledWith(
      '/fr/mosaic-products/all/7',
      {},
      60,
    );
  });

  it('single-nid: calls apiGet with /locale/endpoint/all when no params', async () => {
    mockApiGet.mockResolvedValue([]);
    await fetchProductListing('prodotto_arredo', 'it');
    expect(mockApiGet).toHaveBeenCalledWith('/it/arredo-products/all', {}, 60);
  });

  it('single-nid: injects nid when provided', async () => {
    mockApiGet.mockResolvedValue([]);
    const params: SingleNidParams = { nid: 99 };
    await fetchProductListing('prodotto_illuminazione', 'de', params);
    expect(mockApiGet).toHaveBeenCalledWith(
      '/de/illuminazione-products/99',
      {},
      60,
    );
  });

  it('none: calls apiGet with just /locale/endpoint (no suffix)', async () => {
    mockApiGet.mockResolvedValue([]);
    await fetchProductListing('prodotto_pixall', 'it');
    expect(mockApiGet).toHaveBeenCalledWith('/it/pixall-products', {}, 60);
  });
});

// ── fetchProductListing: unknown product type ─────────────────────────────────

describe('fetchProductListing — unknown product type', () => {
  it('returns empty products and total 0 without calling apiGet', async () => {
    const result = await fetchProductListing('prodotto_unknown', 'it');
    expect(result).toEqual({ products: [], total: 0 });
    expect(mockApiGet).not.toHaveBeenCalled();
  });
});

// ── fetchProductListing: null / non-array apiGet response ─────────────────────

describe('fetchProductListing — apiGet returns null or non-array', () => {
  it('returns empty result when apiGet returns null', async () => {
    mockApiGet.mockResolvedValue(null);
    const result = await fetchProductListing('prodotto_arredo', 'it');
    expect(result).toEqual({ products: [], total: 0 });
  });

  it('returns empty result when apiGet returns a non-array (e.g. object)', async () => {
    mockApiGet.mockResolvedValue({ error: 'unexpected' } as unknown);
    const result = await fetchProductListing('prodotto_arredo', 'it');
    expect(result).toEqual({ products: [], total: 0 });
  });
});

// ── Normalizer: priceOnDemand field logic ─────────────────────────────────────

describe('normalizer — priceOnDemand', () => {
  it('returns true when field_prezzo_on_demand is "On" (mosaic)', async () => {
    mockApiGet.mockResolvedValue([makeItem({ field_prezzo_on_demand: 'On' })]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'it');
    expect(products[0].priceOnDemand).toBe(true);
  });

  it('returns false when field_prezzo_on_demand is "Off" (mosaic)', async () => {
    mockApiGet.mockResolvedValue([makeItem({ field_prezzo_on_demand: 'Off' })]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'it');
    expect(products[0].priceOnDemand).toBe(false);
  });

  it('returns false when field_prezzo_on_demand is "On" but config.priceOnDemand is false (arredo)', async () => {
    // arredo has priceOnDemand: false — the field value must be ignored
    mockApiGet.mockResolvedValue([makeItem({ field_prezzo_on_demand: 'On' })]);
    const { products } = await fetchProductListing('prodotto_arredo', 'it');
    expect(products[0].priceOnDemand).toBe(false);
  });

  it('returns false when field_prezzo_on_demand is missing and config uses field', async () => {
    mockApiGet.mockResolvedValue([
      makeItem({ field_prezzo_on_demand: undefined }),
    ]);
    const { products } = await fetchProductListing('prodotto_vetrite', 'it');
    expect(products[0].priceOnDemand).toBe(false);
  });

  it('pixall always returns priceOnDemand false', async () => {
    mockApiGet.mockResolvedValue([makeItem({ field_prezzo_on_demand: 'On' })]);
    const { products } = await fetchProductListing('prodotto_pixall', 'it');
    expect(products[0].priceOnDemand).toBe(false);
  });
});

// ── Normalizer: emptyToNull for image and price fields ───────────────────────

describe('normalizer — emptyToNull for image and price', () => {
  it('maps empty string image to null', async () => {
    mockApiGet.mockResolvedValue([makeItem({ field_immagine: '' })]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'it');
    expect(products[0].imageUrl).toBeNull();
    expect(products[0].imageUrlMain).toBeNull();
  });

  it('maps empty string price to null', async () => {
    mockApiGet.mockResolvedValue([makeItem({ field_prezzo_eu: '' })]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'it');
    expect(products[0].price).toBeNull();
  });

  it('pixall price is always null (no priceField)', async () => {
    mockApiGet.mockResolvedValue([makeItem({ field_prezzo_eu: '€ 50.00' })]);
    const { products } = await fetchProductListing('prodotto_pixall', 'it');
    expect(products[0].price).toBeNull();
  });

  it('keeps non-empty image URL', async () => {
    const imageUrl = 'https://drupal.example.com/sites/default/files/img.jpg';
    mockApiGet.mockResolvedValue([makeItem({ field_immagine: imageUrl })]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'it');
    expect(products[0].imageUrl).toBe(imageUrl);
  });

  it('missing image field (undefined) maps to null', async () => {
    mockApiGet.mockResolvedValue([makeItem({ field_immagine: undefined })]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'it');
    expect(products[0].imageUrl).toBeNull();
  });
});

// ── Normalizer: path stripping ────────────────────────────────────────────────

describe('normalizer — path stripping', () => {
  it('strips domain from view_node full URL', async () => {
    mockApiGet.mockResolvedValue([
      makeItem({
        view_node: 'https://drupal.example.com/it/mosaico/test-product',
      }),
    ]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'it');
    // After stripDomain: "/it/mosaico/test-product"
    // After stripLocalePrefix: "/mosaico/test-product"
    expect(products[0].path).toBe('/mosaico/test-product');
  });

  it('strips locale prefix from path', async () => {
    mockApiGet.mockResolvedValue([
      makeItem({ view_node: 'https://drupal.example.com/en/mosaico/test-en' }),
    ]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'en');
    expect(products[0].path).toBe('/mosaico/test-en');
  });

  it('returns null path when view_node is empty string', async () => {
    mockApiGet.mockResolvedValue([makeItem({ view_node: '' })]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'it');
    expect(products[0].path).toBeNull();
  });

  it('returns null path when view_node is undefined', async () => {
    mockApiGet.mockResolvedValue([makeItem({ view_node: undefined })]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'it');
    expect(products[0].path).toBeNull();
  });
});

// ── Normalizer: ProductCard shape completeness ────────────────────────────────

describe('normalizer — ProductCard shape', () => {
  it('maps nid → id', async () => {
    mockApiGet.mockResolvedValue([makeItem({ nid: '777' })]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'it');
    expect(products[0].id).toBe('777');
  });

  it('maps field_titolo_main → title', async () => {
    mockApiGet.mockResolvedValue([
      makeItem({ field_titolo_main: 'My Mosaic' }),
    ]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'it');
    expect(products[0].title).toBe('My Mosaic');
  });

  it('sets type to config.productType', async () => {
    mockApiGet.mockResolvedValue([makeItem()]);
    const { products } = await fetchProductListing('prodotto_vetrite', 'it');
    expect(products[0].type).toBe('prodotto_vetrite');
  });

  it('subtitle is always null (factory sets it)', async () => {
    mockApiGet.mockResolvedValue([makeItem()]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'it');
    expect(products[0].subtitle).toBeNull();
  });

  it('imageUrl and imageUrlMain both derive from the configured imageField', async () => {
    // prodotto_mosaico uses field_immagine
    const img = 'https://drupal.example.com/img.jpg';
    mockApiGet.mockResolvedValue([makeItem({ field_immagine: img })]);
    const { products } = await fetchProductListing('prodotto_mosaico', 'it');
    expect(products[0].imageUrl).toBe(img);
    expect(products[0].imageUrlMain).toBe(img);
  });

  it('total matches items array length', async () => {
    mockApiGet.mockResolvedValue([
      makeItem(),
      makeItem({ nid: '43' }),
      makeItem({ nid: '44' }),
    ]);
    const { total } = await fetchProductListing('prodotto_mosaico', 'it');
    expect(total).toBe(3);
  });
});

// ── Normalizer: vetrite uses field_immagine_anteprima ─────────────────────────

describe('normalizer — vetrite imageField is anteprima', () => {
  it('uses field_immagine_anteprima (not field_immagine) for vetrite', async () => {
    const mainImg = 'https://drupal.example.com/main.jpg';
    const previewImg = 'https://drupal.example.com/preview.jpg';
    mockApiGet.mockResolvedValue([
      makeItem({
        field_immagine: mainImg,
        field_immagine_anteprima: previewImg,
      }),
    ]);
    const { products } = await fetchProductListing('prodotto_vetrite', 'it');
    // Config says imageField: 'field_immagine_anteprima' for vetrite
    expect(products[0].imageUrl).toBe(previewImg);
    expect(products[0].imageUrlMain).toBe(previewImg);
  });
});
