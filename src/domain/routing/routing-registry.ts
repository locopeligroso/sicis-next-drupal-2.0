/**
 * domain/routing/routing-registry.ts
 *
 * Menu-derived routing registry — Phase 1 (SHADOW MODE).
 *
 * Fetches the Drupal menu API for all 6 locales, uses stable menu item UUIDs
 * for cross-locale matching, and builds a RoutingRegistry data structure.
 *
 * In this phase the registry is READ-ONLY: it builds the data and can log
 * discrepancies with the existing hardcoded config, but does NOT change any
 * routing or filtering behaviour. Zero functional changes.
 */

import { cache } from 'react';
import { DRUPAL_BASE_URL } from '@/lib/drupal';
import { locales, defaultLocale } from '@/i18n/config';
import type { Locale } from '@/i18n/config';

// ── Types ─────────────────────────────────────────────────────────────────

export interface RoutingRegistry {
  /** Set of all slugs that are product listing pages (replaces LISTING_SLUG_OVERRIDES) */
  listingSlugs: Set<string>;

  /** Map slug → productType for any locale (replaces *_SLUGS + *_PREFIXES) */
  slugToProductType: Map<string, string>;

  /** Map productType → Record<locale, basePath> (replaces basePaths in FILTER_REGISTRY) */
  productTypeBasePaths: Map<string, Record<string, string>>;

  /**
   * Map slug → { productType, filterField, filterValue } for subcategory pages
   * (replaces TESSUTO_CATEGORIA_SLUGS and similar)
   */
  subcategoryMap: Map<
    string,
    { productType: string; filterField: string; filterValue: string }
  >;

  /** Map slug → term name for collection/category children in menu */
  slugToTermName: Map<string, string>;
}

/** Raw menu item shape returned by the Drupal menu API */
interface MenuApiItem {
  id: string; // stable UUID: "menu_link_content:39312e91-..."
  title: string;
  url: string;
  weight: number;
  children: MenuApiItem[];
}

interface MenuApiResponse {
  id: string;
  items: MenuApiItem[];
}

// ── Irriducible hardcoded config ──────────────────────────────────────────
// 5 IT slug → productType anchors. This is the ONLY mapping that can't come
// from Drupal because Drupal doesn't know Next.js content type names.

const PRODUCT_TYPE_ANCHORS: Record<string, string> = {
  mosaico: 'prodotto_mosaico',
  'lastre-vetro-vetrite': 'prodotto_vetrite',
  arredo: 'prodotto_arredo',
  'prodotti-tessili': 'prodotto_tessuto',
  pixall: 'prodotto_pixall',
};

// ── URL normalisation ─────────────────────────────────────────────────────

/** Drupal base path to strip from menu URLs (e.g. "/www.sicis.com_aiweb/httpdocs") */
const DRUPAL_BASE_PATH = (() => {
  try {
    return new URL(DRUPAL_BASE_URL).pathname.replace(/\/$/, '');
  } catch {
    return '';
  }
})();

/** Locale pattern for stripping locale prefix from paths */
const LOCALE_PATTERN = new RegExp(`^/(${locales.join('|')})(/|$)`);

/**
 * Normalises a raw Drupal menu URL to a clean path segment.
 *
 * 1. Strips Drupal base path prefix
 * 2. Strips locale prefix
 * 3. URL-decodes the result
 * 4. Returns clean path without leading slash
 *
 * @example
 * normalizeMenuUrl("/www.sicis.com_aiweb/httpdocs/it/mosaico/murano-smalto", "it")
 * // → "mosaico/murano-smalto"
 */
function normalizeMenuUrl(rawUrl: string, locale: string): string {
  if (!rawUrl || rawUrl === '<nolink>') return '';

  // External URLs — leave as-is (shouldn't happen for product listings)
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return '';
  }

  let url = rawUrl;

  // 1. Strip Drupal base path prefix
  if (DRUPAL_BASE_PATH && url.startsWith(DRUPAL_BASE_PATH)) {
    url = url.slice(DRUPAL_BASE_PATH.length) || '/';
  }

  // 2. Strip locale prefix (e.g. /it/, /en/)
  url = url.replace(LOCALE_PATTERN, '/');

  // 3. Remove leading slash
  if (url.startsWith('/')) url = url.slice(1);

  // 4. Remove trailing slash
  if (url.endsWith('/')) url = url.slice(0, -1);

  // 5. URL-decode (e.g. mosa%C3%AFque → mosaïque)
  try {
    url = decodeURIComponent(url);
  } catch {
    // If decode fails, use as-is
  }

  return url;
}

// ── Menu fetching ─────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 8_000;
const MENU_REVALIDATE_S = 600;

/**
 * Fetches the main menu for a single locale with timeout + ISR caching.
 */
async function fetchMenuForLocale(
  locale: string,
): Promise<MenuApiResponse | null> {
  const url = `${DRUPAL_BASE_URL}/${locale}/api/menu/main`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: MENU_REVALIDATE_S },
    });

    if (!res.ok) {
      console.error(
        `[RoutingRegistry] Menu fetch failed: ${res.status} for ${url}`,
      );
      return null;
    }

    return (await res.json()) as MenuApiResponse;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.error(`[RoutingRegistry] Menu fetch timed out for ${url}`);
    } else {
      console.error(`[RoutingRegistry] Menu fetch error for ${url}:`, error);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Menu traversal helpers ────────────────────────────────────────────────

/**
 * Recursively searches menu items for the "Filter and Find" section.
 * Matches by title containing "filter" (case-insensitive).
 */
function findFilterAndFindSection(items: MenuApiItem[]): MenuApiItem | null {
  for (const item of items) {
    if (item.title.toLowerCase().includes('filter')) {
      return item;
    }
    const found = findFilterAndFindSection(item.children);
    if (found) return found;
  }
  return null;
}

/**
 * Builds a lookup map from menu item UUID → menu item for a given
 * "Filter and Find" section and all its descendants.
 */
function buildUuidMap(section: MenuApiItem): Map<string, MenuApiItem> {
  const map = new Map<string, MenuApiItem>();

  function walk(item: MenuApiItem) {
    map.set(item.id, item);
    for (const child of item.children) {
      walk(child);
    }
  }

  for (const child of section.children) {
    walk(child);
  }
  return map;
}

// ── Registry builder ──────────────────────────────────────────────────────

/**
 * Fetches all locale menus in parallel, cross-references by UUID, and
 * builds the RoutingRegistry data structure.
 */
export async function buildRoutingRegistry(): Promise<RoutingRegistry> {
  // 1. Fetch all locale menus in parallel
  const results = await Promise.allSettled(
    locales.map((locale) => fetchMenuForLocale(locale)),
  );

  const menuByLocale: Partial<Record<Locale, MenuApiResponse>> = {};
  for (let i = 0; i < locales.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled' && result.value) {
      menuByLocale[locales[i]] = result.value;
    } else {
      console.warn(`[RoutingRegistry] No menu data for locale "${locales[i]}"`);
    }
  }

  // 2. Find "Filter and Find" section in the default (IT) menu
  const itMenu = menuByLocale[defaultLocale];
  if (!itMenu) {
    throw new Error(
      `[RoutingRegistry] No menu data for default locale "${defaultLocale}"`,
    );
  }

  const filterSection = findFilterAndFindSection(itMenu.items);
  if (!filterSection) {
    throw new Error(
      '[RoutingRegistry] "Filter and Find" section not found in IT menu',
    );
  }

  // 3. Build UUID lookup maps for all locales
  const uuidMaps: Partial<Record<Locale, Map<string, MenuApiItem>>> = {};

  // We also need the filter section from each locale (found by matching
  // the section's UUID)
  const filterSectionByLocale: Partial<Record<Locale, MenuApiItem>> = {};
  filterSectionByLocale[defaultLocale] = filterSection;

  for (const locale of locales) {
    const menu = menuByLocale[locale];
    if (!menu) continue;

    if (locale !== defaultLocale) {
      // Find the same section by UUID in this locale's menu
      const localeSection = findItemByUuid(menu.items, filterSection.id);
      if (localeSection) {
        filterSectionByLocale[locale] = localeSection;
      } else {
        console.warn(
          `[RoutingRegistry] "Filter and Find" section not found by UUID in "${locale}" menu`,
        );
        continue;
      }
    }

    const section = filterSectionByLocale[locale]!;
    uuidMaps[locale] = buildUuidMap(section);
  }

  // 4. Initialise registry maps
  const listingSlugs = new Set<string>();
  const slugToProductType = new Map<string, string>();
  const productTypeBasePaths = new Map<string, Record<string, string>>();
  const subcategoryMap = new Map<
    string,
    { productType: string; filterField: string; filterValue: string }
  >();
  const slugToTermName = new Map<string, string>();

  // 5. Process IT menu children of "Filter and Find"
  for (const hubItem of filterSection.children) {
    const itSlug = normalizeMenuUrl(hubItem.url, defaultLocale);
    if (!itSlug) continue;

    // Extract first path segment for PRODUCT_TYPE_ANCHORS lookup
    const firstSegment = itSlug.split('/')[0];
    const productType = PRODUCT_TYPE_ANCHORS[firstSegment];

    if (!productType) {
      // This hub doesn't map to a product type (e.g. could be a non-product
      // menu item under "Filter and Find"). Skip.
      continue;
    }

    // Sub-paths under a product hub (e.g. arredo/illuminazione) are subcategory
    // listings, not separate product types. Register the last segment in
    // slugToTermName for cross-locale resolution, then skip hub registration.
    if (itSlug !== firstSegment && productType) {
      const subSegments = itSlug.split('/');
      const lastSegment = subSegments[subSegments.length - 1];
      slugToTermName.set(lastSegment, hubItem.title);

      // Cross-reference for other locales
      for (const locale of locales) {
        if (locale === defaultLocale) continue;
        const localeItem = uuidMaps[locale]?.get(hubItem.id);
        if (!localeItem) continue;
        const localeSlug = normalizeMenuUrl(localeItem.url, locale);
        if (!localeSlug) continue;
        const localeSegments = localeSlug.split('/');
        const localeLastSegment = localeSegments[localeSegments.length - 1];
        slugToTermName.set(localeLastSegment, hubItem.title);
      }
      continue;
    }

    // Register this hub slug for IT
    listingSlugs.add(itSlug);
    slugToProductType.set(itSlug, productType);

    // Initialise basePaths for this productType
    const basePaths: Record<string, string> = { [defaultLocale]: itSlug };

    // 5a. Cross-reference by UUID to get locale-specific slugs
    for (const locale of locales) {
      if (locale === defaultLocale) continue;

      const localeUuidMap = uuidMaps[locale];
      if (!localeUuidMap) continue;

      const localeItem = localeUuidMap.get(hubItem.id);
      if (!localeItem) continue;

      const localeSlug = normalizeMenuUrl(localeItem.url, locale);
      if (!localeSlug) continue;

      listingSlugs.add(localeSlug);
      slugToProductType.set(localeSlug, productType);
      basePaths[locale] = localeSlug;
    }

    productTypeBasePaths.set(productType, basePaths);

    // 5b. Process children (collections / subcategories)
    processHubChildren(
      hubItem,
      productType,
      itSlug,
      uuidMaps,
      listingSlugs,
      slugToProductType,
      subcategoryMap,
      slugToTermName,
      basePaths,
    );
  }

  return {
    listingSlugs,
    slugToProductType,
    productTypeBasePaths,
    subcategoryMap,
    slugToTermName,
  };
}

/**
 * Processes children of a product hub menu item.
 *
 * For tessuto (prodotto_tessuto): distinguishes between the fabric listing
 * child and subcategory children.
 *
 * For all other product types: children are collections/categories added
 * to slugToTermName.
 */
function processHubChildren(
  hubItem: MenuApiItem,
  productType: string,
  hubSlug: string,
  uuidMaps: Partial<Record<Locale, Map<string, MenuApiItem>>>,
  listingSlugs: Set<string>,
  slugToProductType: Map<string, string>,
  subcategoryMap: Map<
    string,
    { productType: string; filterField: string; filterValue: string }
  >,
  slugToTermName: Map<string, string>,
  basePaths: Record<string, string>,
): void {
  for (const child of hubItem.children) {
    const childSlug = normalizeMenuUrl(child.url, defaultLocale);
    if (!childSlug) continue;

    // Extract the last segment as the "term slug"
    const segments = childSlug.split('/');
    const lastSegment = segments[segments.length - 1];

    if (productType === 'prodotto_tessuto') {
      // Tessuto special case: distinguish fabric listing from subcategories.
      // The fabric listing child typically has children of its own (product
      // pages), while subcategory children (Arazzi, Coperte, etc.) are leaves.
      const isFabricListing = child.children.length > 0;

      if (isFabricListing) {
        // This is the fabric listing page (e.g. "Tessuti" / "Fabrics")
        // Its full normalised path becomes the basePath for this locale
        listingSlugs.add(childSlug);
        slugToProductType.set(childSlug, productType);

        // Update IT basePath to the fabric listing child's full path
        // (for tessuto, the basePath is the child "tessuti" not the hub)
        basePaths[defaultLocale] = childSlug;

        // Cross-reference for other locales
        for (const locale of locales) {
          if (locale === defaultLocale) continue;

          const localeItem = uuidMaps[locale]?.get(child.id);
          if (!localeItem) continue;

          const localeSlug = normalizeMenuUrl(localeItem.url, locale);
          if (!localeSlug) continue;

          listingSlugs.add(localeSlug);
          slugToProductType.set(localeSlug, productType);
          basePaths[locale] = localeSlug;
        }
      } else {
        // This is a subcategory (Arazzi, Coperte, Tappeti, Cuscini)
        const itTitle = child.title;

        // Add the IT slug
        slugToTermName.set(lastSegment, itTitle);
        subcategoryMap.set(lastSegment, {
          productType,
          filterField: 'field_categoria.title',
          filterValue: itTitle,
        });

        // Also add the full path as a listing slug with this product type
        listingSlugs.add(childSlug);
        slugToProductType.set(childSlug, productType);

        // Cross-reference for other locales
        for (const locale of locales) {
          if (locale === defaultLocale) continue;

          const localeItem = uuidMaps[locale]?.get(child.id);
          if (!localeItem) continue;

          const localeSlug = normalizeMenuUrl(localeItem.url, locale);
          if (!localeSlug) continue;

          const localeSegments = localeSlug.split('/');
          const localeLastSegment = localeSegments[localeSegments.length - 1];

          slugToTermName.set(localeLastSegment, itTitle);
          subcategoryMap.set(localeLastSegment, {
            productType,
            filterField: 'field_categoria.title',
            filterValue: itTitle, // Always IT title for Drupal filter
          });

          listingSlugs.add(localeSlug);
          slugToProductType.set(localeSlug, productType);
        }
      }
    } else {
      // Non-tessuto: children are collections/categories → slugToTermName
      slugToTermName.set(lastSegment, child.title);

      // Cross-reference for other locales
      for (const locale of locales) {
        if (locale === defaultLocale) continue;

        const localeItem = uuidMaps[locale]?.get(child.id);
        if (!localeItem) continue;

        const localeSlug = normalizeMenuUrl(localeItem.url, locale);
        if (!localeSlug) continue;

        const localeSegments = localeSlug.split('/');
        const localeLastSegment = localeSegments[localeSegments.length - 1];

        // For non-IT locales, store the IT title (from the IT menu item)
        // because Drupal taxonomy term names are language-independent
        // for filtering purposes.
        slugToTermName.set(localeLastSegment, child.title);
      }
    }
  }
}

/**
 * Recursively finds a menu item by UUID anywhere in the tree.
 */
function findItemByUuid(
  items: MenuApiItem[],
  uuid: string,
): MenuApiItem | null {
  for (const item of items) {
    if (item.id === uuid) return item;
    const found = findItemByUuid(item.children, uuid);
    if (found) return found;
  }
  return null;
}

// ── Cached public API ─────────────────────────────────────────────────────

/**
 * Returns the routing registry, cached per-request via React.cache().
 * The underlying menu fetches use ISR with 600s revalidation.
 *
 * Returns null on failure — callers should fall back to hardcoded config.
 */
export const getRoutingRegistry = cache(
  async (): Promise<RoutingRegistry | null> => {
    try {
      return await buildRoutingRegistry();
    } catch (error) {
      console.error('[RoutingRegistry] Failed to build:', error);
      return null;
    }
  },
);
