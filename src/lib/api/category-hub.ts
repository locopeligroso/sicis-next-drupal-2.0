import { cache } from 'react';
import { apiGet, emptyToNull } from './client';

// ── Tessuto types ─────────────────────────────────────────────────────────

interface TessutoTipologiaItem {
  tid: string | number;
  name: string;
}

interface TessutoCountItem {
  tid: number;
  name: string;
  count: number;
}

interface TessutoProductCountsRest {
  tipologie: TessutoCountItem[];
}

export interface TessutoProductCounts {
  tipologie: TessutoCountItem[];
}

// ── Arredo hub constants ──────────────────────────────────────────────────

/** Parent NID for Arredo Indoor subcategories (sedute, tavoli, ecc.) */
export const ARREDO_INDOOR_PARENT_NID = 4261;

/** Parent NID for Arredo Descriptive categories (render blocks, NOT product listings) */
export const ARREDO_DESCRIPTIVE_PARENT_NID = 3522;

/** Parent NID for Tessili Descriptive categories (FAUX MOSAIQUE®, etc.) */
export const TESSILI_DESCRIPTIVE_PARENT_NID = 4272;

/** Parent NID for Mosaico Descriptive categories (bagno, piscina — currently empty) */
export const MOSAICO_DESCRIPTIVE_PARENT_NID = 4274;

// ── Raw response shape from Drupal views ─────────────────────────────────

interface CategoryHubRawItem {
  nid: string;
  field_titolo_main: string;
  field_immagine: string;
}

// ── Public shape ─────────────────────────────────────────────────────────

export interface CategoryHubItem {
  nid: string;
  name: string;
  imageUrl: string | null;
}

// ── Normalizer ───────────────────────────────────────────────────────────

function normalize(items: CategoryHubRawItem[]): CategoryHubItem[] {
  // Deduplicate by NID — Drupal may return duplicates due to multi-locale joins
  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (seen.has(item.nid)) return false;
      seen.add(item.nid);
      return true;
    })
    .map((item) => ({
      nid: item.nid,
      name: item.field_titolo_main,
      imageUrl: emptyToNull(item.field_immagine),
    }));
}

// ── Fetchers ──────────────────────────────────────────────────────────────

export const fetchHubCategories = cache(
  async (parentNid: number, locale: string): Promise<CategoryHubItem[]> => {
    const data = await apiGet<CategoryHubRawItem[]>(
      `/${locale}/categories/${parentNid}`,
      {},
      86400,
    );
    return data ? normalize(data) : [];
  },
);

/**
 * Returns a Set of numeric NIDs for all Arredo descriptive categories
 * (children of ARREDO_DESCRIPTIVE_PARENT_NID = 3522).
 * Used by the routing layer to avoid intercepting these pages as product listings.
 * Cached at 86400s — same as all taxonomy/hub data.
 */
export const fetchDescriptiveCategoryNids = cache(
  async (locale: string): Promise<Set<number>> => {
    const cats = await fetchHubCategories(
      ARREDO_DESCRIPTIVE_PARENT_NID,
      locale,
    );
    return new Set(cats.map((c) => parseInt(c.nid, 10)));
  },
);

/**
 * Slugify a category name for slug-based routing detection.
 * Mirrors slugifyName in SpecHubArredo.tsx — keep in sync.
 * Preserves accented Latin (U+00C0–U+024F) and Cyrillic (U+0400–U+04FF).
 */
function slugifyDescriptiveName(name: string): string {
  return name
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u00C0-\u024F\u0400-\u04FF-]/g, '');
}

/**
 * Returns a Map<slug, nid> for descriptive categories (children of a parent NID).
 * Used by the routing layer for slug-based detection — these pages have no Drupal path
 * alias, so resolvePath returns null and NID-based guards cannot be used.
 * Cached at 86400s (same as hub data).
 */
export const fetchDescriptiveCategorySlugToNid = cache(
  async (locale: string, parentNid?: number): Promise<Map<string, number>> => {
    const nid = parentNid ?? ARREDO_DESCRIPTIVE_PARENT_NID;
    const cats = await fetchHubCategories(nid, locale);
    const map = new Map<string, number>();
    for (const cat of cats) {
      map.set(slugifyDescriptiveName(cat.name), parseInt(cat.nid, 10));
    }
    return map;
  },
);

// ── Tessuto fetchers ──────────────────────────────────────────────────────

/**
 * Fetches the list of tessuto tipologie taxonomy terms.
 *
 * Endpoint: `/{locale}/tessuto-tipologie`
 * Returns: `[{ tid, name }]` — no href, no image, just tid+name.
 * Cached at 86400s (same as taxonomy/hub data).
 */
export const fetchTessutoTipologie = cache(
  async (locale: string): Promise<{ tid: string; name: string }[]> => {
    const data = await apiGet<TessutoTipologiaItem[]>(
      `/${locale}/tessuto-tipologie`,
      {},
      86400,
    );
    if (!data) return [];
    return data.map((item) => ({ tid: String(item.tid), name: item.name }));
  },
);

/**
 * Fetches faceted counts for tessuto tipologie filter dimension.
 *
 * Endpoint: `/{locale}/tessuto-product-counts?categoria={nid}`
 * Returns: `{ tipologie: [{ tid, name, count }] }`.
 * Cached at 600s (counts change with active filters).
 */
export const fetchTessutoProductCounts = cache(
  async (
    locale: string,
    categoriaNid?: number,
  ): Promise<TessutoProductCounts> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (categoriaNid) params.categoria = categoriaNid;
    const data = await apiGet<TessutoProductCountsRest>(
      `/${locale}/tessuto-product-counts`,
      params,
      600,
    );
    return { tipologie: data?.tipologie ?? [] };
  },
);
