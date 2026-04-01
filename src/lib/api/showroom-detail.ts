import { cache } from 'react';
import { apiGet, emptyToNull } from './client';

// ── Raw REST response shape from showroom/{nid} View ────────────────────────

interface RawShowroomDetail {
  nid: string;
  type: string;
  field_titolo_main: string;
  field_citta: string;
  field_area: string;
  field_indirizzo: string;
  field_telefono: string;
  field_fax: string;
  field_indirizzo_email: string;
  field_collegamento_esterno: string;
  field_collegamento_gmaps: string;
  field_latitudine: string;
  field_longitudine: string;
  field_gallery: string[];
}

// ── Fetcher ─────────────────────────────────────────────────────────────────
// Endpoint: /{locale}/api/v1/showroom/{nid}
// Returns array with single element — unwrapped here.

export const fetchShowroomDetail = cache(
  async (
    nid: number,
    locale: string,
  ): Promise<Record<string, unknown> | null> => {
    const items = await apiGet<RawShowroomDetail[]>(
      `/${locale}/showroom/${nid}`,
      {},
      1800,
    );

    if (!items || !Array.isArray(items) || items.length === 0) return null;

    const item = items[0];

    // Return as Record<string, unknown> matching what the Showroom template expects
    // (field_titolo_main, field_citta, field_indirizzo, etc.)
    return {
      type: 'node--showroom',
      nid: item.nid,
      field_titolo_main: item.field_titolo_main,
      title: item.field_titolo_main,
      field_citta: item.field_citta,
      field_area: emptyToNull(item.field_area),
      field_indirizzo: emptyToNull(item.field_indirizzo),
      field_telefono: emptyToNull(item.field_telefono),
      field_fax: emptyToNull(item.field_fax),
      field_indirizzo_email: emptyToNull(item.field_indirizzo_email),
      field_collegamento_esterno: emptyToNull(item.field_collegamento_esterno),
      field_collegamento_gmaps: emptyToNull(item.field_collegamento_gmaps),
      field_latitudine: emptyToNull(item.field_latitudine),
      field_longitudine: emptyToNull(item.field_longitudine),
      // Only pass the first gallery image as preview/hero.
      // The Showroom template uses gallery[0] as hero image.
      field_gallery: item.field_gallery?.[0]
        ? [{ uri: { url: item.field_gallery[0] } }]
        : [],
      langcode: locale,
    };
  },
);
