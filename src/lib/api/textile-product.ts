import { cache } from 'react';
import { apiGet, emptyToNull } from './client';
import type {
  TextileProductRest,
  TextileProductDocumentRest,
  TextileProductFinituraRest,
  TextileProductMaintenanceRest,
  TextileProductTypologyRest,
} from './types';

// ── Normalized domain models ────────────────────────────────────────────────

export interface TextileProductDocument {
  title: string;
  imageSrc: string | null;
  href: string | null;
}

export interface TextileProductFinituraChild {
  tid: number;
  name: string;
  colorCode: string | null;
  label: string | null;
  imageSrc: string | null;
  text: string | null;
  colorName: string | null;
}

export interface TextileProductFinitura {
  tid: number;
  name: string;
  children: TextileProductFinituraChild[];
}

export interface TextileProductMaintenance {
  tid: number;
  name: string;
  imageSrc: string | null;
}

export interface TextileProductTypology {
  tid: number;
  name: string;
}

export interface TextileProduct {
  nid: number;
  title: string;
  body: string | null;
  composition: string | null;
  knottingDensity: string | null;
  heightCm: string | null;
  heightInch: string | null;
  dimensionsCm: string | null;
  dimensionsInch: string | null;
  thickness: string | null;
  weight: string | null;
  priceEu: string | null;
  priceUsa: string | null;
  usage: string | null;
  gallery: string[];
  galleryIntro: string[];
  category: { nid: number; title: string } | null;
  documents: TextileProductDocument[];
  finiture: TextileProductFinitura[];
  maintenance: TextileProductMaintenance[];
  typologies: TextileProductTypology[];
}

// ── Normalizers ─────────────────────────────────────────────────────────────

function toArray<T>(val: T | T[] | undefined | null): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function normalizeTextileProduct(raw: TextileProductRest): TextileProduct {
  return {
    nid: Number(raw.nid),
    title: raw.field_titolo_main || '',
    body: emptyToNull(raw.field_testo_main),
    composition: emptyToNull(raw.field_composizione),
    knottingDensity: emptyToNull(raw.field_densita_annodatura),
    heightCm: emptyToNull(raw.field_altezza_cm),
    heightInch: emptyToNull(raw.field_altezza_inch),
    dimensionsCm: emptyToNull(raw.field_dimensioni_cm),
    dimensionsInch: emptyToNull(raw.field_dimensioni_inch),
    thickness: emptyToNull(raw.field_spessore),
    weight: emptyToNull(raw.field_peso),
    priceEu: emptyToNull(raw.field_prezzo_eu),
    priceUsa: emptyToNull(raw.field_prezzo_usa),
    usage: emptyToNull(raw.field_utilizzo),
    gallery: raw.field_gallery ?? [],
    galleryIntro: raw.field_gallery_intro ?? [],
    category: raw.field_categoria
      ? {
          nid: raw.field_categoria.nid,
          title: raw.field_categoria.field_titolo_main,
        }
      : null,
    documents: (raw.field_documenti ?? []).map((doc) => ({
      title: doc.field_titolo_main || '',
      imageSrc: emptyToNull(doc.field_immagine),
      href: doc.field_collegamento_esterno || doc.field_allegato || null,
    })),
    finiture: toArray(raw.field_finiture_tessuto).map((f) => ({
      tid: f.tid,
      name: f.name,
      children: (f.children ?? []).map((c) => ({
        tid: c.tid,
        name: c.name,
        colorCode: c.field_codice_colore,
        label: c.field_etichetta,
        imageSrc: emptyToNull(c.field_immagine),
        text: c.field_testo,
        colorName:
          typeof c.field_colore === 'object' && c.field_colore
            ? c.field_colore.name
            : null,
      })),
    })),
    maintenance: (raw.field_indicazioni_manutenzione ?? []).map((m) => ({
      tid: m.tid,
      name: m.name,
      imageSrc: emptyToNull(m.field_immagine),
    })),
    typologies: toArray(raw.field_tipologia_tessuto).map((t) => ({
      tid: t.tid,
      name: t.name,
    })),
  };
}

// ── Fetcher ─────────────────────────────────────────────────────────────────

/**
 * Fetches a single textile product by NID.
 *
 * P3 endpoint: `/{locale}/api/v1/textile-product/{nid}`
 */
export const fetchTextileProduct = cache(
  async (nid: number, locale: string): Promise<TextileProduct | null> => {
    const result = await apiGet<TextileProductRest[]>(
      `/${locale}/textile-product/${nid}`,
      {},
      60,
    );
    if (!result || result.length === 0) return null;
    return normalizeTextileProduct(result[0]);
  },
);
