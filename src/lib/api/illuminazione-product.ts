import { cache } from 'react';
import { apiGet, emptyToNull, resolveImage, resolveImageArray } from './client';
import type { ResolvedImage } from './client';

// ── Raw REST response shape ──────────────────────────────────────────────────
// Mirrors arredo-product endpoint minus field_finiture_arredo (Freddi's
// enrichment is currently arredo-only). Verified on live endpoint 2026-04-05:
// 16 fields returned across 98/99 products sampled.

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
  field_gallery_intro: unknown[];
  field_gallery: unknown[];
  field_materiali: string;
  field_specifiche_tecniche: string;
  field_prezzo_eu: string;
  field_prezzo_usa: string;
  field_no_form_scheda_tecnica: '0' | '1';
  field_scheda_tecnica: string[];
  field_path_file_ftp: string[];
  field_path_file_ftp_img_hd: string;
  field_collegamento_esterno: string;
  field_documenti: IlluminazioneDocumentRest[];
  [key: string]: unknown;
}

// ── Normalized domain model ──────────────────────────────────────────────────

export interface IlluminazioneProductDocument {
  nid: number;
  title: string;
  image: ResolvedImage | null;
  href: string | null;
  videoId: string | null;
}

export interface IlluminazioneProduct {
  nid: number;
  title: string;
  body: string | null;
  image: ResolvedImage | null;
  galleryIntro: ResolvedImage[];
  gallery: ResolvedImage[];
  materialsHtml: string | null;
  techSpecsHtml: string | null;
  priceEu: string | null;
  priceUsa: string | null;
  noTechSheet: boolean;
  techSheetUrls: string[];
  file3dPaths: string[];
  externalUrl: string | null;
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
    image: resolveImage(raw.field_immagine),
    galleryIntro: resolveImageArray(raw.field_gallery_intro),
    gallery: resolveImageArray(raw.field_gallery),
    materialsHtml: emptyToNull(raw.field_materiali),
    techSpecsHtml: emptyToNull(raw.field_specifiche_tecniche),
    priceEu: emptyToNull(raw.field_prezzo_eu),
    priceUsa: emptyToNull(raw.field_prezzo_usa),
    noTechSheet: raw.field_no_form_scheda_tecnica === '1',
    techSheetUrls: raw.field_scheda_tecnica ?? [],
    file3dPaths: (raw.field_path_file_ftp ?? []).filter((p: string) => !!p),
    externalUrl: emptyToNull(raw.field_collegamento_esterno),
    hdImagePath: emptyToNull(raw.field_path_file_ftp_img_hd),
    documents: (raw.field_documenti ?? []).map((d) => ({
      nid: Number(d.nid),
      title: d.field_titolo_main || '',
      image: resolveImage(d.field_immagine),
      href: d.field_collegamento_esterno || d.field_allegato || null,
      videoId: emptyToNull(d.field_id_video),
    })),
  };
}

// ── Fetcher ──────────────────────────────────────────────────────────────────

/**
 * Fetches a single illuminazione product by NID.
 *
 * Endpoint: `/{locale}/api/v1/illuminazione-product/{nid}`
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
