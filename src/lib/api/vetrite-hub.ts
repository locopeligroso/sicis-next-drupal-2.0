import { cache } from 'react';
import { apiGet, stripDomain, emptyToNull } from './client';

// ── Raw response shape from Drupal views ─────────────────────────────────
// Same shape as mosaic-hub: { name, field_immagine, view_taxonomy_term }

interface VetriteViewItem {
  name: string;
  field_immagine: string | null;
  view_taxonomy_term: string;
}

// ── Public shape ─────────────────────────────────────────────────────────

export interface VetriteTermItem {
  name: string;
  imageUrl: string | null;
  href: string;
}

// ── Normalizer ───────────────────────────────────────────────────────────

function normalize(items: VetriteViewItem[]): VetriteTermItem[] {
  return items.map((item) => ({
    name: item.name,
    imageUrl: emptyToNull(item.field_immagine),
    href: stripDomain(item.view_taxonomy_term) ?? '#',
  }));
}

// ── Fetchers ─────────────────────────────────────────────────────────────

export const fetchVetriteColors = cache(
  async (locale: string): Promise<VetriteTermItem[]> => {
    const data = await apiGet<VetriteViewItem[]>(
      `/${locale}/vetrite-colors`,
      {},
      3600,
    );
    return data ? normalize(data) : [];
  },
);

export const fetchVetriteCollections = cache(
  async (locale: string): Promise<VetriteTermItem[]> => {
    const data = await apiGet<VetriteViewItem[]>(
      `/${locale}/vetrite-collections`,
      {},
      3600,
    );
    return data ? normalize(data) : [];
  },
);
