// ════════════════════════════════════════════════════════════════════════════
// §8  Product listing functions
// ════════════════════════════════════════════════════════════════════════════

import { cache } from 'react';
import { DRUPAL_BASE_URL, DRUPAL_ORIGIN } from './config';
import {
  buildJsonApiFilters,
  type FilterDefinition,
} from '@/domain/filters/search-params';

export interface ProductCard {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  price: string | null;
  priceOnDemand: boolean;
  path: string | null;
}

/** Maps categoria title to Drupal product type */
export function getCategoriaProductType(categoriaTitle: string): string | null {
  const map: Record<string, string> = {
    // Mosaico
    Mosaico: 'prodotto_mosaico',
    Mosaic: 'prodotto_mosaico',
    // Vetrite
    Vetrite: 'prodotto_vetrite',
    'Vetrite glass slabs': 'prodotto_vetrite',
    'Lastre vetro Vetrite': 'prodotto_vetrite',
    // Arredo
    Arredo: 'prodotto_arredo',
    Furniture: 'prodotto_arredo',
    'Furniture and Accessories': 'prodotto_arredo',
    // Tessuto
    Tessuto: 'prodotto_tessuto',
    Tessile: 'prodotto_tessuto',
    Fabrics: 'prodotto_tessuto',
    // Pixall
    Pixall: 'prodotto_pixall',
    // Illuminazione
    Illuminazione: 'prodotto_illuminazione',
    Lighting: 'prodotto_illuminazione',
    Beleuchtung: 'prodotto_illuminazione',
  };
  return map[categoriaTitle] ?? null;
}

export interface FetchProductsOptions {
  productType: string;
  locale?: string;
  limit?: number;
  offset?: number;
  /** JSON:API relationship field to filter on, e.g. 'field_collezione.name' */
  filterField?: string;
  /** Value to match — URL slug (e.g. 'diamond') or exact term name */
  filterValue?: string;
  /** Operator for filterField/filterValue. Defaults to '=' */
  filterOperator?: '=' | 'STARTS_WITH' | 'CONTAINS';
  /** Structured filter array — takes precedence over filterField/filterValue */
  filters?: FilterDefinition[];
  /** JSON:API sort field, e.g. 'title' or '-title' for DESC */
  sort?: string;
}

export interface ProductsResult {
  products: ProductCard[];
  total: number;
}

/**
 * Exact slug → taxonomy term name overrides for special characters.
 * Used when the term name cannot be reconstructed from the slug alone.
 */
export const SLUG_TO_TERM: Record<string, string> = {
  // ── Mosaico Collezioni (caratteri accentati) ──
  colibri: 'Colibrì',
  colibrì: 'Colibrì',
  neocolibri: 'NeoColibrì',
  neocolibrì: 'NeoColibrì',
  'neocolibri-barrels': 'NeoColibrì - Barrels',
  'neocolibrì-barrels': 'NeoColibrì - Barrels',
  'neocolibri-cubes': 'NeoColibrì - Cubes',
  'neocolibrì-cubes': 'NeoColibrì - Cubes',
  'neocolibri-domes': 'NeoColibrì - Domes',
  'neocolibrì-domes': 'NeoColibrì - Domes',
  'petites-fleurs': 'Petites fleurs',
  'murano-smalto': 'Murano Smalto',
  // ── Mosaico Colori (slug EN usato anche per IT) ──
  light: 'Light',
  grey: 'Grey',
  shadow: 'Shadow',
  brown: 'Brown',
  plum: 'Plum',
  blush: 'Blush',
  'red-orange': 'Red / Orange',
  'yellow-orange': 'Yellow / Orange',
  'yellow-green': 'Yellow / Green',
  'deep-green': 'Deep green',
  'light-green-aquamarine': 'Light green / Aquamarine',
  turquoise: 'Turquoise',
  navy: 'Navy',
  'deep-blue': 'Deep Blue',
  golden: 'Golden',
  beige: 'Beige',
  multicoloured: 'Multicoloured',
  // ── Vetrite Colori (alias IT distinti) ──
  blu: 'Blue',
  grigio: 'Grey',
  azzurro: 'Turquoise',
  viola: 'Plum',
  rosa: 'Blush',
  verde: 'Green',
  'giallo-arancio': 'Yellow / Orange',
  rosso: 'Red',
  nero: 'Shadow',
  marrone: 'Brown',
  oro: 'Golden',
  bianco: 'Light',
  // ── Legacy (mantenuti per compatibilità) ──
  'verdi-chiari-acquamarina': 'Verdi chiari / Acquamarina',
  'gialli-verdi': 'Gialli / Verdi',
  'gialli-arancioni': 'Gialli / Arancioni',
  'rossi-aranciati': 'Rossi-aranciati',
  'navy-blu': 'Navy blu',
  'blu-scuro': 'Blu scuro',
};

/**
 * Normalise a URL slug to a taxonomy term name.
 * e.g. 'verdi-scuri' → 'Verdi scuri', 'bianchi' → 'Bianchi'
 * Uses SLUG_TO_TERM overrides for special characters.
 */
export function slugToTermName(slug: string): string {
  if (SLUG_TO_TERM[slug]) return SLUG_TO_TERM[slug];
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const fetchProducts = cache(
  async (options: FetchProductsOptions): Promise<ProductsResult> => {
    const {
      productType,
      locale = 'it',
      limit = 24,
      offset = 0,
      filterField,
      filterValue,
    } = options;

    const localePrefix = locale ? `/${locale}` : '';
    const url = new URL(
      `${DRUPAL_BASE_URL}${localePrefix}/jsonapi/node/${productType}`,
    );

    url.searchParams.set('page[limit]', String(limit));
    url.searchParams.set('page[offset]', String(offset));

    // Campo immagine varia per content type:
    //   prodotto_tessuto → field_immagine_anteprima (field_immagine non esiste)
    //   tutti gli altri  → field_immagine
    const imageField =
      productType === 'prodotto_tessuto'
        ? 'field_immagine_anteprima'
        : 'field_immagine';

    // Subtitle relationship field per product type:
    //   mosaico/vetrite → field_collezione (taxonomy term → name)
    //   arredo/tessuto/illuminazione → field_categoria (node → title)
    //   pixall → none
    const SUBTITLE_FIELD_MAP: Record<string, string> = {
      prodotto_mosaico: 'field_collezione',
      prodotto_vetrite: 'field_collezione',
      prodotto_arredo: 'field_categoria',
      prodotto_tessuto: 'field_categoria',
      prodotto_illuminazione: 'field_categoria',
    };
    const subtitleField = SUBTITLE_FIELD_MAP[productType] ?? null;

    const fields = [
      'title',
      'field_titolo_main',
      imageField,
      'field_prezzo_eu',
      'field_prezzo_on_demand',
      'path',
      ...(subtitleField ? [subtitleField] : []),
    ];
    url.searchParams.set(
      `fields[node--${productType}]`,
      fields.join(','),
    );

    const includes = [imageField, ...(subtitleField ? [subtitleField] : [])];
    url.searchParams.set('include', includes.join(','));

    // Nuovi filtri strutturati (hanno precedenza su filterField/filterValue legacy)
    if (options.filters && options.filters.length > 0) {
      buildJsonApiFilters(options.filters, url.searchParams);
    } else if (filterField && filterValue) {
      const termName = slugToTermName(filterValue);
      const operator = options.filterOperator ?? '=';
      if (operator === '=') {
        // Legacy shorthand: filter[field]=value
        url.searchParams.set(`filter[${filterField}]`, termName);
      } else {
        // Structured filter for STARTS_WITH / CONTAINS
        url.searchParams.set('filter[f0][condition][path]', filterField);
        url.searchParams.set('filter[f0][condition][operator]', operator);
        url.searchParams.set('filter[f0][condition][value]', termName);
      }
    }

    // Sort
    if (options.sort) {
      url.searchParams.set('sort', options.sort);
    }

    // Build a lightweight count URL (only IDs, max page size, no includes)
    const countUrl = new URL(url.toString());
    countUrl.searchParams.set('page[limit]', '50');
    countUrl.searchParams.delete('page[offset]');
    countUrl.searchParams.set(`fields[node--${productType}]`, 'id');
    countUrl.searchParams.delete('include');

    try {
      // Fetch products and count in parallel
      const [res, countRes] = await Promise.all([
        fetch(url.toString(), {
          headers: { Accept: 'application/vnd.api+json' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          next: { revalidate: 60 },
        } as any),
        fetch(countUrl.toString(), {
          headers: { Accept: 'application/vnd.api+json' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          next: { revalidate: 3600 },
        } as any),
      ]);

      if (!res.ok) {
        console.error(`[fetchProducts] HTTP ${res.status} for ${productType}`, {
          locale,
          limit,
          offset,
          filterField,
          filterValue,
          url: url.toString(),
        });
        return { products: [], total: 0 };
      }

      const [json, countJson] = await Promise.all([
        res.json(),
        countRes.ok ? countRes.json() : null,
      ]);

      // Count total by paginating through all IDs (max 50 per page, lightweight)
      let total = (json.meta?.count as number) ?? 0;
      if (!total && countJson) {
        total = countJson.data?.length ?? 0;
        // If there's a next link, keep fetching to count all
        let nextHref: string | null = countJson.links?.next?.href ?? null;
        while (nextHref) {
          try {
            const nextRes = await fetch(nextHref, {
              headers: { Accept: 'application/vnd.api+json' },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              next: { revalidate: 3600 },
            } as any);
            if (!nextRes.ok) break;
            const nextJson = await nextRes.json();
            total += nextJson.data?.length ?? 0;
            nextHref = nextJson.links?.next?.href ?? null;
          } catch {
            break;
          }
        }
      }

      // Build included maps: file uuid → image URL, entity uuid → label
      const fileMap = new Map<string, string>();
      const includedMap = new Map<string, Record<string, unknown>>();
      for (const item of json.included ?? []) {
        if (item.type === 'file--file') {
          const uriUrl = item.attributes?.uri?.url;
          if (uriUrl) {
            fileMap.set(item.id, `${DRUPAL_ORIGIN}${uriUrl}`);
          }
        }
        // Store all included entities for subtitle lookup
        includedMap.set(item.id, item);
      }

      // Determine which attribute holds the subtitle label:
      //   taxonomy terms use 'name', nodes use 'title'
      const subtitleUsesName =
        productType === 'prodotto_mosaico' ||
        productType === 'prodotto_vetrite';

      const products: ProductCard[] = (json.data ?? []).map(
        (item: Record<string, unknown>) => {
          const attrs = item.attributes as Record<string, unknown>;
          const rels = item.relationships as Record<string, unknown>;
          // Campo immagine varia per content type (vedi imageField sopra)
          const imgFieldName =
            productType === 'prodotto_tessuto'
              ? 'field_immagine_anteprima'
              : 'field_immagine';
          const imgRel = (rels?.[imgFieldName] as Record<string, unknown>)
            ?.data as { id: string } | null;
          const imageUrl = imgRel ? (fileMap.get(imgRel.id) ?? null) : null;
          const pathObj = attrs?.path as { alias?: string } | null;

          // Extract subtitle from included relationship
          let subtitle: string | null = null;
          if (subtitleField) {
            const subtitleRel = (
              rels?.[subtitleField] as Record<string, unknown>
            )?.data as { id: string } | null;
            if (subtitleRel) {
              const included = includedMap.get(subtitleRel.id);
              if (included) {
                const inclAttrs = included.attributes as Record<string, unknown>;
                subtitle = subtitleUsesName
                  ? ((inclAttrs?.name as string) ?? null)
                  : ((inclAttrs?.title as string) ?? null);
              }
            }
          }

          return {
            id: item.id as string,
            type: item.type as string,
            title:
              (attrs?.field_titolo_main as string) ||
              (attrs?.title as string) ||
              '',
            subtitle,
            imageUrl,
            price: (attrs?.field_prezzo_eu as string) ?? null,
            priceOnDemand: (attrs?.field_prezzo_on_demand as boolean) ?? false,
            path: pathObj?.alias ?? null,
          };
        },
      );

      return {
        products,
        total: total || products.length,
      };
    } catch (err) {
      console.error(`[fetchProducts] Network error for ${productType}`, {
        locale,
        limit,
        offset,
        filterField,
        filterValue,
        error: err instanceof Error ? err.message : err,
      });
      return { products: [], total: 0 };
    }
  },
);

// Re-export getSectionConfig, getSectionConfigAsync and SectionConfig from domain layer
export {
  getSectionConfig,
  getSectionConfigAsync,
} from '@/domain/routing/section-config';
export type { SectionConfig } from '@/domain/routing/section-config';
