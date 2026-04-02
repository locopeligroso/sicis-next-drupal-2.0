import { cache } from 'react';
import { apiGet, stripDomain, stripLocalePrefix, emptyToNull } from './client';
import type {
  PaginatedResponse,
  ProductCard as RestProductCard,
} from './types';
import type { FilterDefinition } from '@/domain/filters/search-params';

// ── Re-export ProductCard from the old interface shape ──────────────────────
// The old `ProductCard` from `src/lib/drupal/products.ts` is identical to the
// REST `ProductCard` in `types.ts` — both have: id, type, title, subtitle,
// imageUrl, price, priceOnDemand, path. Re-export for callers that imported
// from `@/lib/drupal/products` or `@/lib/drupal`.

export interface ProductCard {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null; // field_immagine_anteprima (preview for cards)
  price: string | null;
  priceOnDemand: boolean;
  noUsaStock: boolean;
  path: string | null;
}

export interface ProductsResult {
  products: ProductCard[];
  total: number;
}

export interface FetchProductsOptions {
  productType: string;
  locale?: string;
  limit?: number;
  offset?: number;
  /** @deprecated Legacy — use `filters` instead */
  filterField?: string;
  /** @deprecated Legacy — use `filters` instead */
  filterValue?: string;
  /** @deprecated Legacy — use `filters` instead */
  filterOperator?: '=' | 'STARTS_WITH' | 'CONTAINS';
  /** Structured filter array — takes precedence over filterField/filterValue */
  filters?: FilterDefinition[];
  /** Sort field, e.g. 'title' or '-title' for DESC */
  sort?: string;
}

// ── Filter key mapping ──────────────────────────────────────────────────────
// Maps Drupal JSON:API field paths (used in FilterDefinition) to REST query
// param names expected by the Views endpoint.

const DRUPAL_FIELD_TO_REST_PARAM: Record<string, string> = {
  'field_collezione.name': 'collection',
  'field_colori.name': 'color',
  'field_forma.name': 'shape',
  'field_finitura.name': 'finish',
  'field_stucco.name': 'grout',
  'field_texture.name': 'texture',
  'field_tessuto.name': 'fabric',
  'field_categoria.title': 'category',
  // 'field_categoria.id' → 'category_id' — NOT supported by products (legacy) Views endpoint (ignored silently)
  'field_tipologia.name': 'type',
  'field_tipologia_tessuto.name': 'type',
  'field_colore.name': 'color',
  'field_finitura_tessuto.name': 'finish',
};

/**
 * Convert FilterDefinition[] (JSON:API field paths) to REST query params.
 * Returns a flat Record<string, string> for use with apiGet.
 */
function filtersToQueryParams(
  filters: FilterDefinition[],
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const filter of filters) {
    const paramKey = DRUPAL_FIELD_TO_REST_PARAM[filter.field];
    if (!paramKey) {
      console.warn(
        `[filtersToQueryParams] No REST param mapping for field: ${filter.field}`,
      );
      continue;
    }
    // REST endpoint accepts comma-separated values for multi-value filters
    const value = Array.isArray(filter.value)
      ? filter.value.join(',')
      : filter.value;
    params[paramKey] = value;
  }
  return params;
}

// ── REST response normalization ─────────────────────────────────────────────

/**
 * Normalize a single product item from REST to the ProductCard shape.
 * Handles staging quirks: type prefix, path stripping, empty imageUrl.
 */
function normalizeProduct(item: RestProductCard): ProductCard {
  return {
    id: item.id,
    // REST returns type without `node--` prefix — add it
    type: item.type.startsWith('node--') ? item.type : `node--${item.type}`,
    title: item.title,
    subtitle: item.subtitle ?? null,
    imageUrl: emptyToNull(item.imageUrl),
    price: item.price ?? null,
    // REST returns priceOnDemand as string "0"/"1" — cast to boolean
    priceOnDemand:
      typeof item.priceOnDemand === 'string'
        ? item.priceOnDemand === '1'
        : Boolean(item.priceOnDemand),
    noUsaStock:
      item.noUsaStock === '1' ||
      item.noUsaStock === 'On' ||
      item.noUsaStock === 'True' ||
      item.noUsaStock === 'true',
    path: stripLocalePrefix(stripDomain(item.path)),
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetches products from the products endpoint ⚠️ LEGACY.
 * Drop-in replacement for the old JSON:API-based `fetchProducts`.
 *
 * Endpoint: `/{locale}/products/{productType}`
 *
 * @returns `{ products: ProductCard[], total: number }` — same shape as before
 */
export const fetchProducts = cache(
  async (options: FetchProductsOptions): Promise<ProductsResult> => {
    const {
      productType,
      locale = 'it',
      limit = 24,
      offset = 0,
      sort,
    } = options;

    // Build query params
    const params: Record<string, string | number | boolean | undefined> = {
      items_per_page: limit,
      page: Math.floor(offset / limit),
    };

    // Sort
    if (sort) {
      params.sort = sort;
    }

    // Structured filters (new path) take precedence
    if (options.filters && options.filters.length > 0) {
      const filterParams = filtersToQueryParams(options.filters);
      Object.assign(params, filterParams);
    } else if (options.filterField && options.filterValue) {
      // Legacy single-filter path: map field to REST param
      const paramKey = DRUPAL_FIELD_TO_REST_PARAM[options.filterField];
      if (paramKey) {
        params[paramKey] = options.filterValue;
      }
    }

    const result = await apiGet<PaginatedResponse<RestProductCard>>(
      `/${locale}/products/${productType}`,
      params,
      600, // 600s revalidation matching new TTL strategy
    );

    if (!result) return { products: [], total: 0 };

    let products = result.items.map(normalizeProduct);

    // US locale: hide out-of-stock products from listings.
    // Drupal REST view now includes field_no_usa_stock (added by Freddi).
    if (locale === 'us') {
      products = products.filter((p) => !p.noUsaStock);
    }

    return {
      products,
      total: locale === 'us' ? products.length : result.total,
    };
  },
);

/**
 * Fetches product counts per filter value from the product-counts endpoint.
 * The server does aggregation — no more client-side pagination loops.
 *
 * Endpoint: `/{locale}/products/{productType}/counts/{restParam}`
 *
 * @param productType   - Drupal content type (e.g. 'prodotto_mosaico')
 * @param activeFilters - Currently active filter definitions (excluded: the filter being counted)
 * @param filterKey     - Registry filter key (e.g. 'subcategory') — NOT used in URL
 * @param drupalField   - Drupal field path (e.g. 'field_categoria.title') — mapped to REST param for URL
 * @param locale        - Current locale
 * @returns Record mapping filter value labels to product counts
 */
export async function fetchFilterCounts(
  productType: string,
  activeFilters: FilterDefinition[],
  filterKey: string,
  drupalField: string,
  locale: string,
): Promise<Record<string, number>> {
  // product-counts URL uses the REST param name (e.g. "category"), not the registry key (e.g. "subcategory")
  const restParam = DRUPAL_FIELD_TO_REST_PARAM[drupalField];
  if (!restParam) {
    console.warn(
      `[fetchFilterCounts] No REST param for field: ${drupalField} (key: ${filterKey})`,
    );
    return {};
  }

  // Exclude the filter we're counting from active filters
  const otherFilters = activeFilters.filter((f) => f.field !== drupalField);

  // Convert remaining active filters to REST query params
  const filterParams =
    otherFilters.length > 0 ? filtersToQueryParams(otherFilters) : {};

  const result = await apiGet<{ counts: Record<string, number> }>(
    `/${locale}/products/${productType}/counts/${restParam}`,
    filterParams,
    600,
  );

  return result?.counts ?? {};
}

// ── Pure utility (migrated from src/lib/drupal/products.ts) ─────────────────

/** Maps categoria title (all 6 locales) to Drupal product type.
 *  Titles verified against entity endpoint 2026-03-24. */
export function getCategoriaProductType(categoriaTitle: string): string | null {
  const map: Record<string, string> = {
    // Mosaico — IT+ES share "Mosaico"
    Mosaico: 'prodotto_mosaico', // IT + ES
    Mosaic: 'prodotto_mosaico', // EN
    Mosaïque: 'prodotto_mosaico', // FR
    Mosaik: 'prodotto_mosaico', // DE
    Мозаика: 'prodotto_mosaico', // RU
    // Vetrite
    'Lastre vetro Vetrite': 'prodotto_vetrite', // IT
    'Vetrite glass slabs': 'prodotto_vetrite', // EN
    'Plaque en verre Vetrite': 'prodotto_vetrite', // FR
    'Glasscheibe Vetrite': 'prodotto_vetrite', // DE
    'Láminas de vidrio Vetrite': 'prodotto_vetrite', // ES
    'Cтеклянные листы Vetrite': 'prodotto_vetrite', // RU
    Vetrite: 'prodotto_vetrite', // short form fallback
    // Arredo
    Arredo: 'prodotto_arredo', // IT
    'Furniture and Accessories': 'prodotto_arredo', // EN
    Ameublement: 'prodotto_arredo', // FR
    Einrichtung: 'prodotto_arredo', // DE
    Mueble: 'prodotto_arredo', // ES
    Обстановка: 'prodotto_arredo', // RU
    Furniture: 'prodotto_arredo', // short form fallback
    // Tessuto
    'Prodotti Tessili': 'prodotto_tessuto', // IT
    Textiles: 'prodotto_tessuto', // EN + ES
    'Produits textiles': 'prodotto_tessuto', // FR
    Textilien: 'prodotto_tessuto', // DE
    'текстильные изделия': 'prodotto_tessuto', // RU
    Tessuto: 'prodotto_tessuto', // legacy
    Tessile: 'prodotto_tessuto', // legacy
    Fabrics: 'prodotto_tessuto', // legacy
    // Pixall
    Pixall: 'prodotto_pixall',
    // Illuminazione
    Illuminazione: 'prodotto_illuminazione', // IT
    Lighting: 'prodotto_illuminazione', // EN
    Éclairage: 'prodotto_illuminazione', // FR
    Beleuchtung: 'prodotto_illuminazione', // DE
    Iluminación: 'prodotto_illuminazione', // ES
    Освещение: 'prodotto_illuminazione', // RU
  };
  return map[categoriaTitle] ?? null;
}
