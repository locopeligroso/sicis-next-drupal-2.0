import { cache } from 'react';
import { apiGet, emptyToNull } from './client';

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

// ── Fetcher ───────────────────────────────────────────────────────────────

export const fetchHubCategories = cache(
  async (parentNid: number, locale: string): Promise<CategoryHubItem[]> => {
    const data = await apiGet<CategoryHubRawItem[]>(
      `/${locale}/categories/${parentNid}`,
      {},
      3600,
    );
    return data ? normalize(data) : [];
  },
);
