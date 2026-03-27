import { deslugify } from '@/domain/filters/registry';
import { getRoutingRegistry } from './routing-registry';

export interface SectionConfig {
  productType: string;
  filterField?: string;
  filterValue?: string;
  filterOperator?: '=' | 'STARTS_WITH' | 'CONTAINS';
  filterField2?: string;
  filterValue2?: string;
}

// Slug singoli per categoria tessuto — path reali da Drupal per ogni locale
// IT: /arazzi, /coperte, /tappeti, /cuscini
// EN: /tapestries, /bedcover, /carpets, /cushions
// FR: /tapisseries, /couvertures, /tapis, /coussins
// DE: /wandteppiche, /decken, /teppiche, /kissen
// ES: /tapices, /mantas, /alfombras, /cojines
// RU: /гобелены, /одеяла, /ковры, /подушки
const TESSUTO_CATEGORIA_SLUGS: Record<string, string> = {
  // IT
  arazzi: 'Arazzi',
  coperte: 'Coperte',
  tappeti: 'Tappeti',
  cuscini: 'Cuscini',
  // EN
  tapestries: 'Arazzi',
  bedcover: 'Coperte',
  carpets: 'Tappeti',
  cushions: 'Cuscini',
  // FR
  tapisseries: 'Arazzi',
  couvertures: 'Coperte',
  tapis: 'Tappeti',
  coussins: 'Cuscini',
  // DE
  wandteppiche: 'Arazzi',
  decken: 'Coperte',
  teppiche: 'Tappeti',
  kissen: 'Cuscini',
  // ES
  tapices: 'Arazzi',
  mantas: 'Coperte',
  alfombras: 'Tappeti',
  cojines: 'Cuscini',
  // RU (decoded)
  гобелены: 'Arazzi',
  одеяла: 'Coperte',
  ковры: 'Tappeti',
  подушки: 'Cuscini',
};

// Slug listing tessili — path hub da Drupal per ogni locale (dopo strip prefisso)
// IT: /prodotti-tessili  EN: /textiles  FR: /produits-textiles
// DE: /textilien  ES: /textiles  RU: /текстильные-изделия
const TESSILI_SLUGS = new Set([
  'prodotti-tessili', // IT hub
  'textiles', // EN + ES hub
  'produits-textiles', // FR hub
  'textilien', // DE hub
  'текстильные-изделия', // RU hub (decoded)
  // Legacy aliases mantenuti per compatibilità
  'tessili',
  'tessuti',
  'fabrics',
  'tissus',
  'stoffe',
  'telas',
]);

// Slug listing mosaico per locale
const MOSAICO_SLUGS = new Set(['mosaico', 'mosaic', 'mosaïque', 'mosaik']);

// Slug listing vetrite per locale
const VETRITE_SLUGS = new Set([
  'lastre-vetro-vetrite',
  'vetrite-glass-slabs',
  'plaque-en-verre-vetrite',
  'glasscheibe-vetrite',
  'láminas-de-vidrio-vetrite',
  'стеклянные-листы-vetrite',
]);

// Slug listing arredo per locale
const ARREDO_SLUGS = new Set([
  'arredo',
  'furniture-and-accessories',
  'ameublement',
  'einrichtung',
  'mueble',
  'обстановка',
]);

// Slug listing illuminazione per locale
const ILLUMINAZIONE_SLUGS = new Set(['illuminazione', 'lighting']);

// Slug listing pixall per locale
const PIXALL_SLUGS = new Set(['pixall']);

// Prefissi path tessile — path con sottocategoria da Drupal per ogni locale
// IT: /prodotti-tessili/{cat}  EN: /textiles/{cat}  FR: /produits-textiles/{cat}
// DE: /textilien/{cat}  ES: /textiles/{cat}  RU: /текстильные-изделия/{cat}
const TESSILE_PREFIXES = new Set([
  'prodotti-tessili', // IT
  'textiles', // EN + ES
  'produits-textiles', // FR
  'textilien', // DE
  'текстильные-изделия', // RU (decoded)
  // Legacy aliases mantenuti per compatibilità
  'tessile',
  'textile',
]);

// Prefissi path mosaico per locale
const MOSAICO_PREFIXES = new Set(['mosaico', 'mosaic', 'mosaïque', 'mosaik']);

// Prefissi path vetrite per locale
const VETRITE_PREFIXES = new Set([
  'lastre-vetro-vetrite',
  'vetrite-glass-slabs',
  'plaque-en-verre-vetrite',
  'glasscheibe-vetrite',
  'láminas-de-vidrio-vetrite',
  'стеклянные-листы-vetrite', // RU
]);

// Prefissi path arredo per locale
const ARREDO_PREFIXES = new Set([
  'arredo',
  'furniture-and-accessories',
  'ameublement',
  'einrichtung',
  'mueble',
  'furniture',
  'mobilier',
  'moebel',
  'mobiliario',
  'мебель',
  'обстановка',
]);

/**
 * Resolves a URL slug array to a product section configuration.
 *
 * Determines which product type and optional filter values apply to a given
 * URL path. Returns `null` for single-product detail pages (3+ segments) or
 * unrecognised paths. Extracted from `fetch-products.ts:getSectionConfig()` —
 * now lives in the domain layer for testability.
 *
 * @param slugs - URL path segments after the locale prefix
 *                (e.g. `['mosaico', 'murano-smalto']` for `/it/mosaico/murano-smalto`)
 * @param locale - Active locale code (e.g. `'it'`, `'en'`) — currently unused
 *                 but kept for future locale-aware routing
 * @returns `SectionConfig` with `productType` and optional filter fields,
 *          or `null` if the path is a product detail page or unrecognised
 * @example
 * getSectionConfig(['mosaico'], 'it')
 * // → { productType: 'prodotto_mosaico' }
 *
 * getSectionConfig(['mosaico', 'murano-smalto'], 'it')
 * // → { productType: 'prodotto_mosaico', filterField: 'field_collezione.name', filterValue: 'Murano Smalto' }
 *
 * getSectionConfig(['mosaico', 'murano-smalto', 'sun-3'], 'it')
 * // → null  (single product detail page)
 */
export function getSectionConfig(
  slugs: string[],
  locale: string,
): SectionConfig | null {
  // Decode + NFC-normalize so encoded slugs match literal entries in slug Sets.
  const [s1Raw, s2Raw, s3Raw] = slugs;
  if (!s1Raw) return null;
  const s1 = decodeURIComponent(s1Raw).normalize('NFC');
  const s2 = s2Raw ? decodeURIComponent(s2Raw).normalize('NFC') : undefined;
  const s3 = s3Raw ? decodeURIComponent(s3Raw).normalize('NFC') : undefined;

  // ── Tessuto ──────────────────────────────────────────────────────────────
  if (TESSILI_SLUGS.has(s1) && !s2) {
    return { productType: 'prodotto_tessuto' };
  }
  if (TESSUTO_CATEGORIA_SLUGS[s1] && !s2) {
    return {
      productType: 'prodotto_tessuto',
      filterField: 'field_categoria.title',
      filterValue: TESSUTO_CATEGORIA_SLUGS[s1],
    };
  }
  if (TESSILE_PREFIXES.has(s1) && s2) {
    // /tessile/tessuti, /tessile/arazzi, /tessile/tappeti, etc.
    if (TESSUTO_CATEGORIA_SLUGS[s2] && !s3) {
      return {
        productType: 'prodotto_tessuto',
        filterField: 'field_categoria.title',
        filterValue: TESSUTO_CATEGORIA_SLUGS[s2],
      };
    }
    if (!s3) return { productType: 'prodotto_tessuto' };
    // /tessile/tappeti/agata-blue — prodotto singolo, non listing
    return null;
  }

  // ── Mosaico ──────────────────────────────────────────────────────────────
  if (MOSAICO_SLUGS.has(s1) || MOSAICO_PREFIXES.has(s1)) {
    if (!s2) return { productType: 'prodotto_mosaico' };
    // Pixall is nested under /mosaico/pixall but is a standalone product type
    if (s2 === 'pixall' && !s3) return { productType: 'prodotto_pixall' };
    if (!s3) {
      const termName = deslugify(decodeURIComponent(s2));
      // Collezioni con sottocollezioni (es. NeoColibrì → Barrels/Cubes/Domes)
      // usano STARTS_WITH per includere tutti i prodotti figli
      const hasSubCollections =
        termName.startsWith('NeoColibrì') || termName.startsWith('Neocolibrì');
      return {
        productType: 'prodotto_mosaico',
        filterField: 'field_collezione.name',
        filterValue: termName,
        filterOperator: hasSubCollections ? 'STARTS_WITH' : '=',
      };
    }
    // /mosaico/colori/{slug} — color filter listing (3 segments)
    const mosaicoColorPrefixes = ['colori', 'colors', 'couleurs', 'farben', 'colores', 'цвета'];
    if (s3 && mosaicoColorPrefixes.includes(s2)) {
      return {
        productType: 'prodotto_mosaico',
        filterField: 'field_colori.name',
        filterValue: deslugify(decodeURIComponent(s3)),
      };
    }
    // /mosaico/murano-smalto/sun-3 — prodotto singolo
    return null;
  }

  // ── Vetrite ──────────────────────────────────────────────────────────────
  if (VETRITE_SLUGS.has(s1) || VETRITE_PREFIXES.has(s1)) {
    if (!s2) return { productType: 'prodotto_vetrite' };
    if (!s3) {
      return {
        productType: 'prodotto_vetrite',
        filterField: 'field_collezione.name',
        filterValue: deslugify(decodeURIComponent(s2)),
      };
    }
    // /vetrite/colori/{slug} — color filter listing (3 segments)
    const vetriteColorPrefixes = ['colori', 'colors', 'couleurs', 'farben', 'colores', 'цвета'];
    if (s3 && vetriteColorPrefixes.includes(s2)) {
      return {
        productType: 'prodotto_vetrite',
        filterField: 'field_colori.name',
        filterValue: deslugify(decodeURIComponent(s3)),
      };
    }
    return null;
  }

  // ── Arredo ───────────────────────────────────────────────────────────────
  if (ARREDO_SLUGS.has(s1) || ARREDO_PREFIXES.has(s1)) {
    if (!s2) return { productType: 'prodotto_arredo' };
    if (!s3) {
      return {
        productType: 'prodotto_arredo',
        filterField: 'field_categoria.title',
        filterValue: deslugify(decodeURIComponent(s2)),
      };
    }
    // 3 segments: can't distinguish subcategory from product without registry
    // Fall through to Drupal entity resolution
    return null;
  }

  // ── Illuminazione ──────────────────────────────────────────────────────
  if (ILLUMINAZIONE_SLUGS.has(s1)) {
    if (!s2) return { productType: 'prodotto_illuminazione' };
    if (!s3) {
      return {
        productType: 'prodotto_illuminazione',
        filterField: 'field_categoria.title',
        filterValue: deslugify(decodeURIComponent(s2)),
      };
    }
    return null;
  }

  // ── Pixall ───────────────────────────────────────────────────────────────
  if (PIXALL_SLUGS.has(s1)) {
    if (!s2) return { productType: 'prodotto_pixall' };
    return null;
  }

  return null;
}

/**
 * Async version that uses the menu-derived routing registry.
 * Falls back to the hardcoded getSectionConfig if registry is unavailable.
 *
 * @param slugs - URL path segments after the locale prefix
 * @param locale - Active locale code
 * @returns SectionConfig or null (same contract as getSectionConfig)
 */
export async function getSectionConfigAsync(
  slugs: string[],
  locale: string,
): Promise<SectionConfig | null> {
  const registry = await getRoutingRegistry();
  if (!registry) return getSectionConfig(slugs, locale);

  // Decode + NFC-normalize so encoded slugs (mosa%C3%AFque, Cyrillic, accented)
  // match the literal entries in registry maps and slug Sets.
  const [s1Raw, s2Raw, s3Raw] = slugs;
  if (!s1Raw) return null;
  const s1 = decodeURIComponent(s1Raw).normalize('NFC');
  const s2 = s2Raw ? decodeURIComponent(s2Raw).normalize('NFC') : undefined;
  const s3 = s3Raw ? decodeURIComponent(s3Raw).normalize('NFC') : undefined;

  // Check if first segment is a listing hub
  const productType = registry.slugToProductType.get(s1);
  if (productType) {
    if (!s2) return { productType };

    // Pixall is nested under /mosaico/pixall but is a standalone product type
    if (s2 === 'pixall' && !s3) return { productType: 'prodotto_pixall' };

    // Check subcategory map (tessuto categories)
    const subcat = registry.subcategoryMap.get(s2);
    if (subcat && !s3) {
      return {
        productType: subcat.productType,
        filterField: subcat.filterField,
        filterValue: subcat.filterValue,
      };
    }

    // Collection/category filter (e.g. /mosaico/murano-smalto)
    if (!s3) {
      const termName =
        registry.slugToTermName.get(s2) ?? deslugify(decodeURIComponent(s2));
      // Collezioni con sottocollezioni (es. NeoColibrì → Barrels/Cubes/Domes)
      const hasSubCollections =
        termName.startsWith('NeoColibrì') || termName.startsWith('Neocolibrì');
      return {
        productType,
        filterField:
          productType === 'prodotto_arredo' ||
          productType === 'prodotto_illuminazione'
            ? 'field_categoria.title'
            : 'field_collezione.name',
        filterValue: termName,
        filterOperator: hasSubCollections ? 'STARTS_WITH' : '=',
      };
    }

    // /mosaico/colori/{slug} or /vetrite/colori/{slug} — color filter listing (3 segments)
    if (s3) {
      const colorPrefixes = ['colori', 'colors', 'couleurs', 'farben', 'colores', 'цвета'];
      if (colorPrefixes.includes(s2)) {
        const termName =
          registry.slugToTermName.get(s3) ?? deslugify(decodeURIComponent(s3));
        return {
          productType,
          filterField: 'field_colori.name',
          filterValue: termName,
        };
      }

      // /arredo/sedute/sedie — subcategory filter (3 segments, category-based types)
      // Only matches if s3 is a known category slug in slugToTermName or subcategoryMap.
      // Otherwise it's a product detail page (e.g. /arredo/poltrone/alec-armchair → null).
      if (
        productType === 'prodotto_arredo' ||
        productType === 'prodotto_illuminazione'
      ) {
        if (registry.slugToTermName.has(s3) || registry.subcategoryMap.has(s3)) {
          const termName =
            registry.slugToTermName.get(s3) ?? deslugify(decodeURIComponent(s3));
          return {
            productType,
            filterField: 'field_categoria.title',
            filterValue: termName,
          };
        }
        // s3 not a known category → product detail page
        return null;
      }
    }

    // 3+ segments = single product detail page
    return null;
  }

  // Check subcategory as standalone slug (e.g. /arazzi, /coperte)
  const subcat = registry.subcategoryMap.get(s1);
  if (subcat && !s2) {
    return {
      productType: subcat.productType,
      filterField: subcat.filterField,
      filterValue: subcat.filterValue,
    };
  }

  // Not found in registry — fall back to hardcoded
  return getSectionConfig(slugs, locale);
}
