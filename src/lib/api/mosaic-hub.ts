import { cache } from 'react';
import { apiGet, stripDomain, emptyToNull } from './client';

// ── Raw response shape from Drupal views ─────────────────────────────────

interface MosaicViewItem {
  name: string;
  field_immagine: string | null;
  view_taxonomy_term: string;
}

// ── Public shape ─────────────────────────────────────────────────────────

export interface MosaicTermItem {
  name: string;
  imageUrl: string | null;
  href: string;
}

// ── Normalizer ───────────────────────────────────────────────────────────

function normalize(items: MosaicViewItem[]): MosaicTermItem[] {
  return items.map((item) => ({
    name: item.name,
    imageUrl: emptyToNull(item.field_immagine),
    href: stripDomain(item.view_taxonomy_term) ?? '#',
  }));
}

// ── Fetchers ─────────────────────────────────────────────────────────────

export const fetchMosaicColors = cache(
  async (locale: string): Promise<MosaicTermItem[]> => {
    const data = await apiGet<MosaicViewItem[]>(
      `/${locale}/mosaic-colors`,
      {},
      3600,
    );
    return data ? normalize(data) : [];
  },
);

export const fetchMosaicCollections = cache(
  async (locale: string): Promise<MosaicTermItem[]> => {
    const data = await apiGet<MosaicViewItem[]>(
      `/${locale}/mosaic-collections`,
      {},
      3600,
    );
    return data ? normalize(data) : [];
  },
);
