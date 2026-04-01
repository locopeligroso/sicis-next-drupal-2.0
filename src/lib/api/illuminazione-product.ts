import { cache } from 'react';
import { apiGet, emptyToNull } from './client';

// ── Raw REST response shape ──────────────────────────────────────────────────

interface IlluminazioneDocumentRest {
  nid: string | number;
  field_titolo_main: string;
  field_immagine: string;
  field_allegato: string;
  field_collegamento_esterno: string;
  field_id_video: string;
}

interface IlluminazioneProductRest {
  nid: string | number;
  field_titolo_main: string;
  field_testo_main: string;
  field_immagine: string;
  field_gallery_intro: string[];
  field_materiali: string;
  field_specifiche_tecniche: string;
  field_no_form_scheda_tecnica: '0' | '1';
  field_scheda_tecnica: string[];
  field_path_file_ftp_img_hd: string;
  field_documenti: IlluminazioneDocumentRest[];
}

// ── Normalized domain model ──────────────────────────────────────────────────

export interface IlluminazioneProductDocument {
  nid: number;
  title: string;
  imageSrc: string | null;
  href: string | null;
  videoId: string | null;
}

export interface IlluminazioneProduct {
  nid: number;
  title: string;
  body: string | null;
  imageUrl: string | null;
  galleryIntro: string[];
  materialsHtml: string | null;
  techSpecsHtml: string | null;
  noTechSheet: boolean;
  techSheetUrls: string[];
  hdImagePath: string | null;
  documents: IlluminazioneProductDocument[];
}

// ── Normalizer ───────────────────────────────────────────────────────────────

function normalizeIlluminazioneProduct(
  raw: IlluminazioneProductRest,
): IlluminazioneProduct {
  return {
    nid: Number(raw.nid),
    title: raw.field_titolo_main || '',
    body: emptyToNull(raw.field_testo_main),
    imageUrl: emptyToNull(raw.field_immagine),
    galleryIntro: raw.field_gallery_intro ?? [],
    materialsHtml: emptyToNull(raw.field_materiali),
    techSpecsHtml: emptyToNull(raw.field_specifiche_tecniche),
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
 * Fetches a single illuminazione product by NID.
 *
 * P5 endpoint: `/{locale}/api/v1/illuminazione-product/{nid}`
 */
export const fetchIlluminazioneProduct = cache(
  async (nid: number, locale: string): Promise<IlluminazioneProduct | null> => {
    const result = await apiGet<IlluminazioneProductRest[]>(
      `/${locale}/illuminazione-product/${nid}`,
      {},
      600,
    );
    if (!result || result.length === 0) return null;
    return normalizeIlluminazioneProduct(result[0]);
  },
);
