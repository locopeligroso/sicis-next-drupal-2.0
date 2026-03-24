/**
 * domain/filters/registry.ts
 *
 * Single source of truth for ALL filter configuration.
 * Replaces:
 *   - src/lib/filter-registry.ts (FILTER_REGISTRY)
 *   - src/lib/build-filters.ts (OVERRIDES — 13 entries)
 *   - src/lib/fetch-products.ts (SLUG_TO_TERM — 53 entries)
 *
 * Zero React/Next.js dependencies — 100% unit-testable.
 */

// ── Types ─────────────────────────────────────────────────────────────────

export type FilterType = 'path' | 'query';
export type DisplayAs = 'buttons' | 'checkboxes' | 'dropdown';
export type Priority = 'P0' | 'P1' | 'P2';

export interface FilterOption {
  slug: string;
  label: string;
  id?: string;
  count?: number;
  /** Count with only P0 filter active — used to distinguish "not in collection" (0) from "filtered out by P1" (0 count but baseCount > 0) */
  baseCount?: number;
  imageUrl?: string;    // preview image for category cards
  cssColor?: string;    // fallback CSS color for swatches
}

export interface ActiveFilter {
  key: string;
  value: string;
  label: string;
  type: FilterType;
}

export interface FilterGroupConfig {
  key: string;
  drupalField: string;
  type: FilterType;
  queryKey?: string;
  pathPrefix?: Record<string, string>;
  taxonomyType?: string;
  nodeType?: string;
  displayAs: DisplayAs;
  multiSelect: boolean;
  priority: Priority;
}

export interface ListingConfig {
  categoryCardRatio: string;
  productCardRatio: string;   // e.g. "1/1", "1/2"
  categoryGroups: CategoryGroupDef[];
  sortOptions: SortOptionDef[];
  pageSize: number;
}

export interface CategoryGroupDef {
  filterKey: string;
  labelKey: string;
  hasImage: boolean;
  hasColorSwatch: boolean;
}

export interface SortOptionDef {
  labelKey: string;
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface ProductTypeConfig {
  contentType: string;
  basePaths: Record<string, string>;
  includes: string[];
  filters: Record<string, FilterGroupConfig>;
  listing: ListingConfig;
}

// ── Unified slug → term name map ──────────────────────────────────────────
// Merges OVERRIDES (build-filters.ts:13) + SLUG_TO_TERM (fetch-products.ts:53)
// into a single authoritative map. No more divergence risk.

export const SLUG_OVERRIDES: Record<string, string> = {
  // Special characters (both slug and URL-decoded variants)
  colibri: 'Colibrì',
  colibrì: 'Colibrì',
  neocolibri: 'NeoColibrì',
  neocolibrì: 'NeoColibrì',
  // Removed: neocolibri-barrels, neocolibri-cubes, neocolibri-domes
  // These are no longer separate collection slugs — Barrels/Cubes/Domes will become
  // "Tipo" sub-filter values under the unified NeoColibrì collection.
  // See TODO in prodotto_mosaico config below.
  'petites-fleurs': 'Petites fleurs',
  // Slash in name
  'red-orange': 'Red / Orange',
  'yellow-orange': 'Yellow / Orange',
  'yellow-green': 'Yellow / Green',
  'light-green-aquamarine': 'Light green / Aquamarine',
  // Capitalisation exceptions
  'murano-smalto': 'Murano Smalto',
  'deep-green': 'Deep green',
  'deep-blue': 'Deep Blue',
  // Mosaico collections
  'opus-vermiculatum': 'Opus Vermiculatum',
  'opus-regulatum': 'Opus Regulatum',
  'opus-palladianum': 'Opus Palladianum',
  'opus-incertum': 'Opus Incertum',
  'opus-sectile': 'Opus Sectile',
  'opus-spicatum': 'Opus Spicatum',
  'opus-tessellatum': 'Opus Tessellatum',
  'opus-reticulatum': 'Opus Reticulatum',
  'opus-alexandrinum': 'Opus Alexandrinum',
  'opus-classicum': 'Opus Classicum',
  'opus-mixtum': 'Opus Mixtum',
  'opus-barbaricum': 'Opus Barbaricum',
  // Vetrite collections
  'electric-marble': 'Electric Marble',
  'electric-travertine': 'Electric Travertine',
  'electric-onyx': 'Electric Onyx',
  'electric-wood': 'Electric Wood',
  'electric-concrete': 'Electric Concrete',
  'electric-metal': 'Electric Metal',
  'electric-fabric': 'Electric Fabric',
  'electric-leather': 'Electric Leather',
  'electric-stone': 'Electric Stone',
  'electric-sand': 'Electric Sand',
  'electric-ice': 'Electric Ice',
  'electric-fire': 'Electric Fire',
  'electric-water': 'Electric Water',
  'electric-earth': 'Electric Earth',
  'electric-air': 'Electric Air',
  // Pixall
  'pixall-classic': 'Pixall Classic',
  'pixall-mosaic': 'Pixall Mosaic',
  // Tessuto categories
  arazzi: 'Arazzi',
  coperte: 'Coperte',
  tappeti: 'Tappeti',
  cuscini: 'Cuscini',
};

/**
 * Converts a URL slug to a human-readable Drupal taxonomy term name.
 *
 * Uses `SLUG_OVERRIDES` for special cases (accented chars, slashes, capitalisation).
 * Falls back to title-casing the slug (hyphens → spaces, each word capitalised).
 * Single source of truth — replaces deslugify() in build-filters.ts
 * and slugToTermName() in fetch-products.ts.
 *
 * @param slug - URL slug segment (e.g. `'murano-smalto'`)
 * @returns Human-readable term name (e.g. `'Murano Smalto'`)
 * @example
 * deslugify('murano-smalto')   // → 'Murano Smalto'
 * deslugify('colibri')         // → 'Colibrì'
 * deslugify('unknown-slug')    // → 'Unknown Slug'
 */
export function deslugify(slug: string): string {
  // Normalize to NFC at the boundary — macOS/Safari can produce NFD-encoded
  // strings (e.g. "neocolibrì" as i + combining grave) which would silently
  // miss SLUG_OVERRIDES keys that are stored as NFC (U+00EC precomposed).
  const normalized = slug.normalize('NFC');
  if (SLUG_OVERRIDES[normalized]) return SLUG_OVERRIDES[normalized];
  return normalized.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Filter Registry ───────────────────────────────────────────────────────

export const FILTER_REGISTRY: Record<string, ProductTypeConfig> = {
  // TODO: Neoglass and NeoColibrì have sub-categorizations (Barrels/Cubes/Domes)
  // that should appear as a "Tipo" multi-select filter when browsing these collections.
  // Requires Drupal taxonomy restructuring — currently these are separate collection entries.
  // Frontend rendering logic: when collection is Neoglass or NeoColibrì,
  // SpecFilterSidebarContent should show an additional "Tipo" filter group
  // with options: Barrels, Cubes, Domes.
  prodotto_mosaico: {
    contentType: 'prodotto_mosaico',
    basePaths: {
      it: 'mosaico',
      en: 'mosaic',
      fr: 'mosaïque',
      de: 'mosaik',
      es: 'mosaico',
      ru: 'мозаика',
    },
    includes: [
      'field_categoria',
      'field_collezione',
      'field_colori',
      'field_forma',
      'field_finitura',
      'field_immagine',
      'field_collezione.field_immagine',
    ],
    filters: {
      collection: {
        key: 'collection',
        drupalField: 'field_collezione.name',
        type: 'path',
        taxonomyType: 'taxonomy_term--mosaico_collezioni',
        displayAs: 'buttons',
        multiSelect: false,
        priority: 'P0',
      },
      color: {
        key: 'color',
        drupalField: 'field_colori.name',
        type: 'path',
        pathPrefix: {
          it: 'colori',
          en: 'colors',
          fr: 'couleurs',
          de: 'farben',
          es: 'colores',
          ru: 'цвета',
        },
        taxonomyType: 'taxonomy_term--mosaico_colori',
        displayAs: 'buttons',
        multiSelect: false,
        priority: 'P0',
      },
      shape: {
        key: 'shape',
        drupalField: 'field_forma.name',
        type: 'query',
        queryKey: 'shape',
        taxonomyType: 'taxonomy_term--mosaico_forme',
        displayAs: 'checkboxes',
        multiSelect: true,
        priority: 'P1',
      },
      finish: {
        key: 'finish',
        drupalField: 'field_finitura.name',
        type: 'query',
        queryKey: 'finish',
        taxonomyType: 'taxonomy_term--mosaico_finiture',
        displayAs: 'checkboxes',
        multiSelect: true,
        priority: 'P1',
      },
    },
    listing: {
      categoryCardRatio: '1/1',
      productCardRatio: '1/1',
      categoryGroups: [
        { filterKey: 'color', labelKey: 'filters.colors', hasImage: false, hasColorSwatch: true },
        { filterKey: 'collection', labelKey: 'filters.collections', hasImage: true, hasColorSwatch: false },
      ],
      sortOptions: [
        { labelKey: 'sort.name', field: 'title', direction: 'ASC' },
        { labelKey: 'sort.collection', field: 'field_collezione.name', direction: 'ASC' },
      ],
      pageSize: 48,
    },
  },

  prodotto_vetrite: {
    contentType: 'prodotto_vetrite',
    basePaths: {
      it: 'lastre-vetro-vetrite',
      en: 'vetrite-glass-slabs',
      fr: 'plaque-en-verre-vetrite',
      de: 'glasscheibe-vetrite',
      es: 'láminas-de-vidrio-vetrite',
      ru: 'стеклянные-листы-vetrite',
    },
    includes: [
      'field_collezione',
      'field_colori',
      'field_finiture',
      'field_texture',
      'field_immagine',
    ],
    filters: {
      collection: {
        key: 'collection',
        drupalField: 'field_collezione.name',
        type: 'path',
        taxonomyType: 'taxonomy_term--vetrite_collezioni',
        displayAs: 'buttons',
        multiSelect: false,
        priority: 'P0',
      },
      color: {
        key: 'color',
        drupalField: 'field_colori.name',
        type: 'path',
        pathPrefix: {
          it: 'colori',
          en: 'colors',
          fr: 'couleurs',
          de: 'farben',
          es: 'colores',
          ru: 'цвета',
        },
        taxonomyType: 'taxonomy_term--vetrite_colori',
        displayAs: 'buttons',
        multiSelect: false,
        priority: 'P0',
      },
    },
    listing: {
      categoryCardRatio: '1/1',
      productCardRatio: '1/2',
      categoryGroups: [
        { filterKey: 'color', labelKey: 'filters.colors', hasImage: false, hasColorSwatch: true },
        { filterKey: 'collection', labelKey: 'filters.collections', hasImage: true, hasColorSwatch: false },
      ],
      sortOptions: [
        { labelKey: 'sort.name', field: 'title', direction: 'ASC' },
        { labelKey: 'sort.collection', field: 'field_collezione.name', direction: 'ASC' },
      ],
      pageSize: 48,
    },
  },

  prodotto_arredo: {
    contentType: 'prodotto_arredo',
    basePaths: {
      it: 'arredo',
      en: 'furniture-and-accessories',
      fr: 'ameublement',
      de: 'einrichtung',
      es: 'mueble',
      ru: 'обстановка',
    },
    includes: [
      'field_categoria',
      'field_finiture',
      'field_tessuti',
      'field_immagine',
    ],
    filters: {
      subcategory: {
        key: 'subcategory',
        drupalField: 'field_categoria.title',
        type: 'path',
        nodeType: 'node--categoria',
        displayAs: 'buttons',
        multiSelect: false,
        priority: 'P0',
      },
    },
    listing: {
      categoryCardRatio: '4/3',
      productCardRatio: '3/2',
      categoryGroups: [
        { filterKey: 'subcategory', labelKey: 'filters.typologies', hasImage: true, hasColorSwatch: false },
      ],
      sortOptions: [
        { labelKey: 'sort.name', field: 'title', direction: 'ASC' },
        { labelKey: 'sort.typology', field: 'field_categoria.title', direction: 'ASC' },
      ],
      pageSize: 48,
    },
  },

  prodotto_tessuto: {
    contentType: 'prodotto_tessuto',
    // basePaths = path del listing prodotti tessuto (con sottocategoria) da Drupal
    // IT: /prodotti-tessili  EN: /textiles/fabrics  FR: /produits-textiles/tissus
    // DE: /textilien/stoffe  ES: /textiles/telas  RU: /текстильные-изделия/ткани
    basePaths: {
      it: 'prodotti-tessili',
      en: 'textiles/fabrics',
      fr: 'produits-textiles/tissus',
      de: 'textilien/stoffe',
      es: 'textiles/telas',
      ru: 'текстильные-изделия/ткани',
    },
    includes: [
      'field_categoria',
      'field_colori',
      'field_finiture_tessuto',
      'field_tipologia_tessuto',
      'field_immagine',
    ],
    filters: {
      // category filter — was MISSING in old registry, causing tessili subcategory 404s
      category: {
        key: 'category',
        drupalField: 'field_categoria.title',
        type: 'path',
        nodeType: 'node--categoria',
        displayAs: 'buttons',
        multiSelect: false,
        priority: 'P0',
      },
      type: {
        key: 'type',
        drupalField: 'field_tipologia_tessuto.name',
        type: 'query',
        queryKey: 'type',
        displayAs: 'buttons',
        multiSelect: true,
        priority: 'P1',
      },
      color: {
        key: 'color',
        drupalField: 'field_colori.name',
        type: 'query',
        queryKey: 'color',
        displayAs: 'checkboxes',
        multiSelect: true,
        priority: 'P1',
      },
      finish: {
        key: 'finish',
        drupalField: 'field_finiture_tessuto.name',
        type: 'query',
        queryKey: 'finish',
        displayAs: 'checkboxes',
        multiSelect: true,
        priority: 'P1',
      },
    },
    listing: {
      categoryCardRatio: '4/3',
      productCardRatio: '1/1',
      categoryGroups: [
        { filterKey: 'category', labelKey: 'filters.categories', hasImage: true, hasColorSwatch: false },
      ],
      sortOptions: [
        { labelKey: 'sort.name', field: 'title', direction: 'ASC' },
        { labelKey: 'sort.category', field: 'field_categoria.title', direction: 'ASC' },
      ],
      pageSize: 48,
    },
  },

  prodotto_pixall: {
    contentType: 'prodotto_pixall',
    basePaths: {
      it: 'pixall',
      en: 'pixall',
      fr: 'pixall',
      de: 'pixall',
      es: 'pixall',
      ru: 'pixall',
    },
    includes: ['field_colori', 'field_forma', 'field_stucco', 'field_immagine'],
    filters: {
      color: {
        key: 'color',
        drupalField: 'field_colori.name',
        type: 'query',
        queryKey: 'color',
        displayAs: 'checkboxes',
        multiSelect: true,
        priority: 'P1',
      },
      shape: {
        key: 'shape',
        drupalField: 'field_forma.name',
        type: 'query',
        queryKey: 'shape',
        displayAs: 'checkboxes',
        multiSelect: true,
        priority: 'P1',
      },
    },
    listing: {
      categoryCardRatio: '1/1',
      productCardRatio: '1/1',
      categoryGroups: [],
      sortOptions: [
        { labelKey: 'sort.name', field: 'title', direction: 'ASC' },
      ],
      pageSize: 48,
    },
  },

  prodotto_illuminazione: {
    contentType: 'prodotto_illuminazione',
    basePaths: {
      it: 'illuminazione',
      en: 'lighting',
      fr: 'eclairage',
      de: 'beleuchtung',
      es: 'iluminacion',
      ru: 'освещение',
    },
    includes: ['field_categoria', 'field_finiture', 'field_immagine'],
    filters: {
      subcategory: {
        key: 'subcategory',
        drupalField: 'field_categoria.title',
        type: 'path',
        nodeType: 'node--categoria',
        displayAs: 'buttons',
        multiSelect: false,
        priority: 'P0',
      },
    },
    listing: {
      categoryCardRatio: '4/3',
      productCardRatio: '1/1',
      categoryGroups: [
        { filterKey: 'subcategory', labelKey: 'filters.subcategories', hasImage: true, hasColorSwatch: false },
      ],
      sortOptions: [
        { labelKey: 'sort.name', field: 'title', direction: 'ASC' },
        { labelKey: 'sort.subcategory', field: 'field_categoria.title', direction: 'ASC' },
      ],
      pageSize: 48,
    },
  },
};

// ── Lookup helpers ────────────────────────────────────────────────────────

/**
 * Returns the filter configuration for a given Drupal content type.
 *
 * @param contentType - Drupal content type machine name (e.g. `'prodotto_mosaico'`)
 * @returns `ProductTypeConfig` with basePaths, includes, and filter definitions,
 *          or `null` if the content type is not registered.
 * @example
 * getFilterConfig('prodotto_mosaico')?.basePaths.it // → 'mosaico'
 * getFilterConfig('unknown')                        // → null
 */
export function getFilterConfig(contentType: string): ProductTypeConfig | null {
  return FILTER_REGISTRY[contentType] ?? null;
}

/**
 * Translates a product listing path from any registered locale to the target locale.
 *
 * Iterates all registered `basePaths` in `FILTER_REGISTRY` to find a matching
 * source path, then replaces the base segment with the target locale equivalent.
 * Returns the original path unchanged if no match is found.
 *
 * @param path - URL path to translate (with or without leading slash)
 * @param targetLocale - Target locale code (e.g. `'en'`, `'fr'`)
 * @returns Translated path preserving trailing segments and leading slash
 * @example
 * translateBasePath('/mosaico/murano-smalto', 'en') // → '/mosaic/murano-smalto'
 * translateBasePath('/unknown/path', 'en')           // → '/unknown/path'
 */
export function translateBasePath(path: string, targetLocale: string): string {
  const hadLeadingSlash = path.startsWith('/');
  const cleanPath = hadLeadingSlash ? path.slice(1) : path;
  if (!cleanPath) return path;

  for (const config of Object.values(FILTER_REGISTRY)) {
    for (const sourceBasePath of Object.values(config.basePaths)) {
      if (
        cleanPath === sourceBasePath ||
        cleanPath.startsWith(sourceBasePath + '/')
      ) {
        const targetBasePath = config.basePaths[targetLocale];
        if (!targetBasePath || sourceBasePath === targetBasePath) return path;
        const remainder = cleanPath.slice(sourceBasePath.length);
        const translated = targetBasePath + remainder;
        return hadLeadingSlash ? '/' + translated : translated;
      }
    }
  }
  return path;
}
