/**
 * Tests for products.ts — normalizeProduct, filtersToQueryParams, getCategoriaProductType
 *
 * Tests:
 *  - normalizeProduct: type prefix (node-- added when missing, not doubled)
 *  - normalizeProduct: priceOnDemand casting ("0"→false, "1"→true, boolean passthrough)
 *  - normalizeProduct: emptyToNull for imageUrl
 *  - normalizeProduct: path stripping via stripDomain + stripLocalePrefix
 *  - filtersToQueryParams: maps known FilterDefinition fields to REST param keys
 *  - filtersToQueryParams: multi-value arrays joined with commas
 *  - filtersToQueryParams: unknown field logs a warning and is skipped
 *  - getCategoriaProductType: all 6 product types, all locales
 *  - getCategoriaProductType: unknown title returns null
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (hoisted before imports) ────────────────────────────────────────────

vi.mock('@/lib/drupal/config', () => ({
  DRUPAL_BASE_URL: 'https://drupal.example.com',
}));

vi.mock('@/i18n/config', () => ({
  toDrupalLocale: (locale: string) => locale,
}));

vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/client')>();
  return {
    ...actual,
    apiGet: vi.fn(),
  };
});

// ── Imports after mocks ───────────────────────────────────────────────────────

// normalizeProduct and filtersToQueryParams are not exported; we test them
// indirectly via fetchProducts (which calls both internally) and through the
// exported getCategoriaProductType.
// For white-box coverage we use fetchProducts with a mocked apiGet response.

import { fetchProducts, getCategoriaProductType } from '../products';
import { apiGet } from '@/lib/api/client';
import type { FilterDefinition } from '@/domain/filters/search-params';
import type {
  PaginatedResponse,
  ProductCard as RestProductCard,
} from '../types';

const mockApiGet = vi.mocked(apiGet);

// ── Factories ─────────────────────────────────────────────────────────────────

/** Minimal REST ProductCard (from types.ts) as returned by the products endpoint */
function makeRestCard(
  overrides: Partial<RestProductCard> = {},
): RestProductCard {
  return {
    id: '10',
    type: 'prodotto_mosaico', // no node-- prefix — normalizer adds it
    title: 'Test Mosaic',
    subtitle: null,
    imageUrl: 'https://drupal.example.com/preview.jpg',
    price: '€ 100.00',
    priceOnDemand: '0', // string form from REST
    path: 'https://drupal.example.com/it/mosaico/test',
    ...overrides,
  };
}

function makePaginatedResponse(
  items: RestProductCard[],
  total = items.length,
): PaginatedResponse<RestProductCard> {
  return { items, total, page: 0, pageSize: 24 };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── normalizeProduct: type prefix ─────────────────────────────────────────────

describe('normalizeProduct — type prefix', () => {
  it('adds node-- prefix when REST type has none', async () => {
    mockApiGet.mockResolvedValue(
      makePaginatedResponse([makeRestCard({ type: 'prodotto_mosaico' })]),
    );
    const { products } = await fetchProducts({
      productType: 'prodotto_mosaico',
    });
    expect(products[0].type).toBe('node--prodotto_mosaico');
  });

  it('does not double-prefix when type already starts with node--', async () => {
    mockApiGet.mockResolvedValue(
      makePaginatedResponse([makeRestCard({ type: 'node--prodotto_vetrite' })]),
    );
    const { products } = await fetchProducts({
      productType: 'prodotto_mosaico',
    });
    expect(products[0].type).toBe('node--prodotto_vetrite');
  });
});

// ── normalizeProduct: priceOnDemand casting ───────────────────────────────────

describe('normalizeProduct — priceOnDemand casting', () => {
  it('casts string "0" to false', async () => {
    mockApiGet.mockResolvedValue(
      makePaginatedResponse([makeRestCard({ priceOnDemand: '0' })]),
    );
    const { products } = await fetchProducts({
      productType: 'prodotto_mosaico',
    });
    expect(products[0].priceOnDemand).toBe(false);
  });

  it('casts string "1" to true', async () => {
    mockApiGet.mockResolvedValue(
      makePaginatedResponse([makeRestCard({ priceOnDemand: '1' })]),
    );
    const { products } = await fetchProducts({
      productType: 'prodotto_mosaico',
    });
    expect(products[0].priceOnDemand).toBe(true);
  });

  it('passes boolean true through', async () => {
    mockApiGet.mockResolvedValue(
      makePaginatedResponse([
        makeRestCard({ priceOnDemand: true as unknown as string }),
      ]),
    );
    const { products } = await fetchProducts({
      productType: 'prodotto_mosaico',
    });
    expect(products[0].priceOnDemand).toBe(true);
  });

  it('passes boolean false through', async () => {
    mockApiGet.mockResolvedValue(
      makePaginatedResponse([
        makeRestCard({ priceOnDemand: false as unknown as string }),
      ]),
    );
    const { products } = await fetchProducts({
      productType: 'prodotto_mosaico',
    });
    expect(products[0].priceOnDemand).toBe(false);
  });

  it('casts null priceOnDemand to false', async () => {
    mockApiGet.mockResolvedValue(
      makePaginatedResponse([
        makeRestCard({ priceOnDemand: null as unknown as string }),
      ]),
    );
    const { products } = await fetchProducts({
      productType: 'prodotto_mosaico',
    });
    expect(products[0].priceOnDemand).toBe(false);
  });
});

// ── normalizeProduct: emptyToNull for imageUrl ────────────────────────────────

describe('normalizeProduct — emptyToNull for imageUrl', () => {
  it('maps empty string imageUrl to null', async () => {
    mockApiGet.mockResolvedValue(
      makePaginatedResponse([makeRestCard({ imageUrl: '' })]),
    );
    const { products } = await fetchProducts({
      productType: 'prodotto_mosaico',
    });
    expect(products[0].imageUrl).toBeNull();
  });

  it('uses imageUrl when non-empty', async () => {
    const previewUrl = 'https://drupal.example.com/preview.jpg';
    mockApiGet.mockResolvedValue(
      makePaginatedResponse([makeRestCard({ imageUrl: previewUrl })]),
    );
    const { products } = await fetchProducts({
      productType: 'prodotto_mosaico',
    });
    expect(products[0].imageUrl).toBe(previewUrl);
  });
});

// ── normalizeProduct: path stripping ─────────────────────────────────────────

describe('normalizeProduct — path stripping', () => {
  it('strips domain from path URL', async () => {
    mockApiGet.mockResolvedValue(
      makePaginatedResponse([
        makeRestCard({ path: 'https://drupal.example.com/it/mosaico/product' }),
      ]),
    );
    const { products } = await fetchProducts({
      productType: 'prodotto_mosaico',
    });
    expect(products[0].path).toBe('/mosaico/product');
  });

  it('strips locale prefix from path', async () => {
    mockApiGet.mockResolvedValue(
      makePaginatedResponse([
        makeRestCard({ path: 'https://drupal.example.com/fr/mosaico/product' }),
      ]),
    );
    const { products } = await fetchProducts({
      productType: 'prodotto_mosaico',
      locale: 'fr',
    });
    expect(products[0].path).toBe('/mosaico/product');
  });

  it('keeps path that has no locale prefix (already stripped)', async () => {
    mockApiGet.mockResolvedValue(
      makePaginatedResponse([makeRestCard({ path: '/mosaico/product' })]),
    );
    const { products } = await fetchProducts({
      productType: 'prodotto_mosaico',
    });
    expect(products[0].path).toBe('/mosaico/product');
  });
});

// ── fetchProducts: apiGet returns null ────────────────────────────────────────

describe('fetchProducts — null response', () => {
  it('returns empty products and total 0 when apiGet returns null', async () => {
    mockApiGet.mockResolvedValue(null);
    const result = await fetchProducts({ productType: 'prodotto_mosaico' });
    expect(result).toEqual({ products: [], total: 0 });
  });
});

// ── fetchProducts: URL and params construction ────────────────────────────────

describe('fetchProducts — URL construction', () => {
  it('builds correct URL with locale and productType', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    await fetchProducts({ productType: 'prodotto_mosaico', locale: 'en' });
    expect(mockApiGet).toHaveBeenCalledWith(
      '/en/products/prodotto_mosaico',
      expect.objectContaining({ items_per_page: 24, page: 0 }),
      600,
    );
  });

  it('defaults to locale "it" when not specified', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    await fetchProducts({ productType: 'prodotto_mosaico' });
    expect(mockApiGet).toHaveBeenCalledWith(
      '/it/products/prodotto_mosaico',
      expect.any(Object),
      600,
    );
  });

  it('passes sort param when provided', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    await fetchProducts({ productType: 'prodotto_mosaico', sort: '-title' });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.sort).toBe('-title');
  });
});

// ── filtersToQueryParams (via fetchProducts) ──────────────────────────────────

describe('filtersToQueryParams — field mapping', () => {
  it('maps field_collezione.name → collection', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    const filters: FilterDefinition[] = [
      { field: 'field_collezione.name', value: 'Murano', operator: '=' },
    ];
    await fetchProducts({ productType: 'prodotto_mosaico', filters });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.collection).toBe('Murano');
  });

  it('maps field_colori.name → color', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    const filters: FilterDefinition[] = [
      { field: 'field_colori.name', value: 'Grigio', operator: '=' },
    ];
    await fetchProducts({ productType: 'prodotto_mosaico', filters });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.color).toBe('Grigio');
  });

  it('maps field_forma.name → shape', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    const filters: FilterDefinition[] = [
      { field: 'field_forma.name', value: 'Hexagon', operator: '=' },
    ];
    await fetchProducts({ productType: 'prodotto_mosaico', filters });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.shape).toBe('Hexagon');
  });

  it('maps field_finitura.name → finish', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    const filters: FilterDefinition[] = [
      { field: 'field_finitura.name', value: 'Polished', operator: '=' },
    ];
    await fetchProducts({ productType: 'prodotto_mosaico', filters });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.finish).toBe('Polished');
  });

  it('maps field_stucco.name → grout', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    const filters: FilterDefinition[] = [
      { field: 'field_stucco.name', value: 'Bianco', operator: '=' },
    ];
    await fetchProducts({ productType: 'prodotto_mosaico', filters });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.grout).toBe('Bianco');
  });

  it('maps field_texture.name → texture', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    const filters: FilterDefinition[] = [
      { field: 'field_texture.name', value: 'Matte', operator: '=' },
    ];
    await fetchProducts({ productType: 'prodotto_vetrite', filters });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.texture).toBe('Matte');
  });

  it('maps field_tessuto.name → fabric', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    const filters: FilterDefinition[] = [
      { field: 'field_tessuto.name', value: 'Velvet', operator: '=' },
    ];
    await fetchProducts({ productType: 'prodotto_arredo', filters });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.fabric).toBe('Velvet');
  });

  it('maps field_categoria.title → category', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    const filters: FilterDefinition[] = [
      { field: 'field_categoria.title', value: 'Sedute', operator: '=' },
    ];
    await fetchProducts({ productType: 'prodotto_arredo', filters });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.category).toBe('Sedute');
  });

  it('maps field_tipologia.name → type', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    const filters: FilterDefinition[] = [
      { field: 'field_tipologia.name', value: 'Runner', operator: '=' },
    ];
    await fetchProducts({ productType: 'prodotto_tessuto', filters });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.type).toBe('Runner');
  });

  it('maps field_colore.name → color', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    const filters: FilterDefinition[] = [
      { field: 'field_colore.name', value: 'Rosso', operator: '=' },
    ];
    await fetchProducts({ productType: 'prodotto_tessuto', filters });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.color).toBe('Rosso');
  });

  it('joins multi-value array with commas', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    const filters: FilterDefinition[] = [
      {
        field: 'field_forma.name',
        value: ['Hexagon', 'Square', 'Round'],
        operator: 'IN',
      },
    ];
    await fetchProducts({ productType: 'prodotto_mosaico', filters });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.shape).toBe('Hexagon,Square,Round');
  });

  it('combines multiple filters in one call', async () => {
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    const filters: FilterDefinition[] = [
      { field: 'field_collezione.name', value: 'Murano', operator: '=' },
      { field: 'field_colori.name', value: 'Grigio', operator: '=' },
    ];
    await fetchProducts({ productType: 'prodotto_mosaico', filters });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs.collection).toBe('Murano');
    expect(callArgs.color).toBe('Grigio');
  });

  it('logs a warning and skips unknown filter fields', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockApiGet.mockResolvedValue(makePaginatedResponse([]));
    const filters: FilterDefinition[] = [
      { field: 'field_unknown_field.name', value: 'SomeValue', operator: '=' },
    ];
    await fetchProducts({ productType: 'prodotto_mosaico', filters });
    const callArgs = mockApiGet.mock.calls[0][1] as Record<string, unknown>;
    // Unknown field must not appear in params
    expect(callArgs).not.toHaveProperty('field_unknown_field.name');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('field_unknown_field.name'),
    );
    warnSpy.mockRestore();
  });
});

// ── getCategoriaProductType ───────────────────────────────────────────────────

describe('getCategoriaProductType', () => {
  // Mosaico
  it('maps "Mosaico" (IT/ES) → prodotto_mosaico', () => {
    expect(getCategoriaProductType('Mosaico')).toBe('prodotto_mosaico');
  });
  it('maps "Mosaic" (EN) → prodotto_mosaico', () => {
    expect(getCategoriaProductType('Mosaic')).toBe('prodotto_mosaico');
  });
  it('maps "Mosaïque" (FR) → prodotto_mosaico', () => {
    expect(getCategoriaProductType('Mosaïque')).toBe('prodotto_mosaico');
  });
  it('maps "Mosaik" (DE) → prodotto_mosaico', () => {
    expect(getCategoriaProductType('Mosaik')).toBe('prodotto_mosaico');
  });
  it('maps "Мозаика" (RU) → prodotto_mosaico', () => {
    expect(getCategoriaProductType('Мозаика')).toBe('prodotto_mosaico');
  });

  // Vetrite
  it('maps "Lastre vetro Vetrite" (IT) → prodotto_vetrite', () => {
    expect(getCategoriaProductType('Lastre vetro Vetrite')).toBe(
      'prodotto_vetrite',
    );
  });
  it('maps "Vetrite glass slabs" (EN) → prodotto_vetrite', () => {
    expect(getCategoriaProductType('Vetrite glass slabs')).toBe(
      'prodotto_vetrite',
    );
  });
  it('maps "Vetrite" (short fallback) → prodotto_vetrite', () => {
    expect(getCategoriaProductType('Vetrite')).toBe('prodotto_vetrite');
  });

  // Arredo
  it('maps "Arredo" (IT) → prodotto_arredo', () => {
    expect(getCategoriaProductType('Arredo')).toBe('prodotto_arredo');
  });
  it('maps "Furniture and Accessories" (EN) → prodotto_arredo', () => {
    expect(getCategoriaProductType('Furniture and Accessories')).toBe(
      'prodotto_arredo',
    );
  });
  it('maps "Ameublement" (FR) → prodotto_arredo', () => {
    expect(getCategoriaProductType('Ameublement')).toBe('prodotto_arredo');
  });
  it('maps "Einrichtung" (DE) → prodotto_arredo', () => {
    expect(getCategoriaProductType('Einrichtung')).toBe('prodotto_arredo');
  });
  it('maps "Mueble" (ES) → prodotto_arredo', () => {
    expect(getCategoriaProductType('Mueble')).toBe('prodotto_arredo');
  });
  it('maps "Обстановка" (RU) → prodotto_arredo', () => {
    expect(getCategoriaProductType('Обстановка')).toBe('prodotto_arredo');
  });

  // Tessuto
  it('maps "Prodotti Tessili" (IT) → prodotto_tessuto', () => {
    expect(getCategoriaProductType('Prodotti Tessili')).toBe(
      'prodotto_tessuto',
    );
  });
  it('maps "Textiles" (EN/ES) → prodotto_tessuto', () => {
    expect(getCategoriaProductType('Textiles')).toBe('prodotto_tessuto');
  });
  it('maps "Textilien" (DE) → prodotto_tessuto', () => {
    expect(getCategoriaProductType('Textilien')).toBe('prodotto_tessuto');
  });
  it('maps "текстильные изделия" (RU) → prodotto_tessuto', () => {
    expect(getCategoriaProductType('текстильные изделия')).toBe(
      'prodotto_tessuto',
    );
  });
  it('maps legacy "Tessuto" → prodotto_tessuto', () => {
    expect(getCategoriaProductType('Tessuto')).toBe('prodotto_tessuto');
  });

  // Pixall
  it('maps "Pixall" → prodotto_pixall', () => {
    expect(getCategoriaProductType('Pixall')).toBe('prodotto_pixall');
  });

  // Illuminazione
  it('maps "Illuminazione" (IT) → prodotto_illuminazione', () => {
    expect(getCategoriaProductType('Illuminazione')).toBe(
      'prodotto_illuminazione',
    );
  });
  it('maps "Lighting" (EN) → prodotto_illuminazione', () => {
    expect(getCategoriaProductType('Lighting')).toBe('prodotto_illuminazione');
  });
  it('maps "Éclairage" (FR) → prodotto_illuminazione', () => {
    expect(getCategoriaProductType('Éclairage')).toBe('prodotto_illuminazione');
  });
  it('maps "Beleuchtung" (DE) → prodotto_illuminazione', () => {
    expect(getCategoriaProductType('Beleuchtung')).toBe(
      'prodotto_illuminazione',
    );
  });
  it('maps "Iluminación" (ES) → prodotto_illuminazione', () => {
    expect(getCategoriaProductType('Iluminación')).toBe(
      'prodotto_illuminazione',
    );
  });
  it('maps "Освещение" (RU) → prodotto_illuminazione', () => {
    expect(getCategoriaProductType('Освещение')).toBe('prodotto_illuminazione');
  });

  // Unknown
  it('returns null for unknown title', () => {
    expect(getCategoriaProductType('Completely Unknown Category')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getCategoriaProductType('')).toBeNull();
  });

  it('is case-sensitive (lowercase fails)', () => {
    expect(getCategoriaProductType('mosaico')).toBeNull();
  });
});
