import { cache } from 'react';
import { apiGet, emptyToNull } from './client';

// ── Raw REST response shape ──────────────────────────────────────────────────
// Expected to mirror illuminazione-product shape (same Drupal template family).
// Will be verified once Freddi enables the endpoint.

interface ArredoDocumentRest {
  nid: string | number;
  field_titolo_main: string;
  field_immagine: string;
  field_allegato: string;
  field_collegamento_esterno: string;
  field_id_video: string;
}

interface ArredoProductRest {
  nid: string | number;
  field_titolo_main: string;
  field_testo_main: string;
  field_immagine: string;
  field_gallery_intro: string[];
  field_gallery: string[];
  field_materiali: string;
  field_specifiche_tecniche: string;
  field_prezzo_eu: string;
  field_prezzo_usa: string;
  field_no_form_scheda_tecnica: '0' | '1';
  field_scheda_tecnica: string[];
  field_path_file_ftp_img_hd: string;
  field_documenti: ArredoDocumentRest[];
  [key: string]: unknown;
}

// ── Normalized domain model ──────────────────────────────────────────────────

export interface ArredoProductDocument {
  nid: number;
  title: string;
  imageSrc: string | null;
  href: string | null;
  videoId: string | null;
}

export interface ArredoProduct {
  nid: number;
  title: string;
  body: string | null;
  imageUrl: string | null;
  galleryIntro: string[];
  gallery: string[];
  materialsHtml: string | null;
  techSpecsHtml: string | null;
  priceEu: string | null;
  priceUsa: string | null;
  noTechSheet: boolean;
  techSheetUrls: string[];
  hdImagePath: string | null;
  documents: ArredoProductDocument[];
}

// ── Normalizer ───────────────────────────────────────────────────────────────

function normalizeArredoProduct(raw: ArredoProductRest): ArredoProduct {
  return {
    nid: Number(raw.nid),
    title: raw.field_titolo_main || '',
    body: emptyToNull(raw.field_testo_main),
    imageUrl: emptyToNull(raw.field_immagine),
    galleryIntro: raw.field_gallery_intro ?? [],
    gallery: raw.field_gallery ?? [],
    materialsHtml: emptyToNull(raw.field_materiali),
    techSpecsHtml: emptyToNull(raw.field_specifiche_tecniche),
    priceEu: emptyToNull(raw.field_prezzo_eu),
    priceUsa: emptyToNull(raw.field_prezzo_usa),
    noTechSheet: raw.field_no_form_scheda_tecnica === '1',
    techSheetUrls: raw.field_scheda_tecnica ?? [],
    hdImagePath: emptyToNull(raw.field_path_file_ftp_img_hd),
    documents: (raw.field_documenti ?? []).map((d) => ({
      nid: Number(d.nid),
      title: d.field_titolo_main || '',
      imageSrc: emptyToNull(d.field_immagine),
      href: d.field_collegamento_esterno || d.field_allegato || null,
      videoId: emptyToNull(d.field_id_video),
    })),
  };
}

// ── Fetcher ──────────────────────────────────────────────────────────────────

/**
 * Fetches a single arredo product by NID.
 *
 * Endpoint: `/{locale}/api/v1/arredo-product/{nid}`
 */
export const fetchArredoProduct = cache(
  async (nid: number, locale: string): Promise<ArredoProduct | null> => {
    const result = await apiGet<ArredoProductRest[]>(
      `/${locale}/arredo-product/${nid}`,
      {},
      60,
    );
    if (!result || result.length === 0) return null;
    return normalizeArredoProduct(result[0]);
  },
);
