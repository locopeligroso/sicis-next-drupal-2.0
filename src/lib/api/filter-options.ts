/**
 * filter-options.ts
 *
 * Fetches filter option lists for the product listing sidebar / popover
 * using the alive hub endpoints (mosaic-hub, vetrite-hub, category-hub).
 *
 * Only P0 filter options are populated — P1 taxonomy endpoints are dead (404)
 * and will be added back when Freddi creates new taxonomy endpoints.
 */

import type { FilterOption } from '@/domain/filters/registry';
import { FILTER_REGISTRY, SLUG_OVERRIDES } from '@/domain/filters/registry';
import type { MosaicTermItem } from '@/lib/api/mosaic-hub';
import type { VetriteTermItem } from '@/lib/api/vetrite-hub';
import type { CategoryHubItem } from '@/lib/api/category-hub';
import {
  fetchMosaicCollections,
  fetchMosaicColors,
} from '@/lib/api/mosaic-hub';
import {
  fetchVetriteCollections,
  fetchVetriteColors,
} from '@/lib/api/vetrite-hub';
import { fetchHubCategories } from '@/lib/api/category-hub';

// ── Reverse SLUG_OVERRIDES: term name → slug ─────────────────────────────
// Built once at module init. Used when converting hub term names back to slugs.
const NAME_TO_SLUG: Record<string, string> = {};
for (const [slug, name] of Object.entries(SLUG_OVERRIDES)) {
  // Only store the first slug for a name (prefer shorter / canonical form)
  if (!(name in NAME_TO_SLUG)) {
    NAME_TO_SLUG[name] = slug;
  }
}

// ── Slug helpers ──────────────────────────────────────────────────────────

/**
 * Extracts the last path segment from a hub term href.
 *
 * e.g. `/mosaico/murano-smalto` → `murano-smalto`
 *      `/it/mosaic/electric-marble` → `electric-marble`
 *      `#` → `#`
 */
function hrefToSlug(href: string): string {
  if (!href || href === '#') return '#';
  const cleaned = href.endsWith('/') ? href.slice(0, -1) : href;
  const last = cleaned.split('/').pop();
  return last ?? href;
}

/**
 * Derives a URL slug from a Drupal term name.
 *
 * Strategy:
 * 1. Check reverse SLUG_OVERRIDES (handles accented chars, slashes, capitalisation)
 * 2. NFC-normalise, lowercase, convert slashes/spaces to hyphens, strip non-slug chars
 */
function slugifyName(name: string): string {
  const normalized = name.normalize('NFC');
  if (NAME_TO_SLUG[normalized]) return NAME_TO_SLUG[normalized];
  return normalized
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-') // "Red / Orange" → "red-orange"
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u00C0-\u024F\u0400-\u04FF-]/g, '');
}

// ── Converters ────────────────────────────────────────────────────────────

/**
 * Converts mosaic/vetrite hub term items to FilterOption[].
 *
 * Slug is derived from href (last path segment) — this is canonical because
 * the href comes from Drupal's own URL alias, matching what the router uses.
 * Falls back to slugifyName if href is missing or '#'.
 */
function hubTermsToFilterOptions(
  terms: MosaicTermItem[] | VetriteTermItem[],
): FilterOption[] {
  return terms.map((term) => {
    const slugFromHref = hrefToSlug(term.href);
    const slug =
      slugFromHref && slugFromHref !== '#'
        ? slugFromHref
        : slugifyName(term.name);
    return {
      slug,
      label: term.name,
      imageUrl: term.imageUrl ?? undefined,
    };
  });
}

/**
 * Converts category hub items to FilterOption[].
 *
 * Category items have no href — slug is derived from the name using
 * slugifyName (reverse SLUG_OVERRIDES first, then NFC + lowercase + hyphens).
 */
function categoryItemsToFilterOptions(
  items: CategoryHubItem[],
): FilterOption[] {
  return items.map((item) => ({
    slug: slugifyName(item.name),
    label: item.name,
    id: item.nid,
    imageUrl: item.imageUrl ?? undefined,
  }));
}

// ── Main export ───────────────────────────────────────────────────────────

/**
 * Fetches P0 filter options for a product listing page.
 *
 * Returns an empty object `{}` for:
 * - prodotto_pixall (no P0 filters, taxonomy endpoints dead)
 * - unknown product types
 * - hub mode callers (they pass no hubParentNid for category-based types)
 *
 * @param productType - Drupal product type machine name
 * @param locale      - Current locale (e.g. 'it', 'en')
 * @param hubParentNid - Parent NID for category-based types (arredo/illuminazione/tessuto).
 *                       Required to fetch categories/{nid}. If omitted, returns {}.
 */
export async function fetchListingFilterOptions(
  productType: string,
  locale: string,
  hubParentNid?: number,
): Promise<Record<string, FilterOption[]>> {
  switch (productType) {
    case 'prodotto_mosaico': {
      const [collections, colors] = await Promise.all([
        fetchMosaicCollections(locale),
        fetchMosaicColors(locale),
      ]);
      return {
        collection: hubTermsToFilterOptions(collections),
        color: hubTermsToFilterOptions(colors),
      };
    }

    case 'prodotto_vetrite': {
      const [collections, colors] = await Promise.all([
        fetchVetriteCollections(locale),
        fetchVetriteColors(locale),
      ]);
      return {
        collection: hubTermsToFilterOptions(collections),
        color: hubTermsToFilterOptions(colors),
      };
    }

    case 'prodotto_arredo':
    case 'prodotto_illuminazione':
    case 'prodotto_tessuto': {
      if (hubParentNid == null) return {};

      // Find the P0 filter key for this product type
      const ptConfig = FILTER_REGISTRY[productType];
      const p0Filter = ptConfig
        ? Object.values(ptConfig.filters).find((f) => f.priority === 'P0')
        : null;
      if (!p0Filter) return {};

      const categories = await fetchHubCategories(hubParentNid, locale);
      return {
        [p0Filter.key]: categoryItemsToFilterOptions(categories),
      };
    }

    default:
      // prodotto_pixall: all filters are P1 (query-based), taxonomy endpoints dead
      // unknown types: no config
      return {};
  }
}
