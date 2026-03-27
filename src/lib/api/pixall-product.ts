import { cache } from 'react';
import { apiGet, emptyToNull } from './client';
import type { PixallProductRest } from './types';

// ── Normalized domain model ─────────────────────────────────────────────────

export interface PixallProductGrout {
  tid: number;
  name: string;
  imageSrc: string | null;
  price2_5kg: string | null;
  price5kg: string | null;
}

export interface PixallProductDocument {
  title: string;
  imageSrc: string | null;
  href: string | null;
}

export interface PixallProduct {
  nid: number;
  title: string;
  body: string | null;
  composition: string | null;
  usesHtml: string | null;
  maintenanceHtml: string | null;
  meshType: string | null;
  imageUrl: string | null;
  imageModulesUrl: string | null;
  gallery: string[];
  galleryIntro: string[];
  sheetSizeMm: string | null;
  sheetSizeInch: string | null;
  chipSizeMm: string | null;
  chipSizeInch: string | null;
  modulesCount: string | null;
  modulesSize: string | null;
  groutConsumptionM2: string | null;
  groutConsumptionSqft: string | null;
  grouts: PixallProductGrout[];
  documents: PixallProductDocument[];
}

// ── Normalizer ──────────────────────────────────────────────────────────────

/** Decode HTML entities like &quot; → " */
function decodeHtmlEntities(val: string | null): string | null {
  if (!val) return null;
  return val
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'");
}

function normalizePixallProduct(raw: PixallProductRest): PixallProduct {
  return {
    nid: Number(raw.nid),
    title: raw.field_titolo_main || '',
    body: emptyToNull(raw.field_testo_main),
    composition: emptyToNull(raw.field_composizione),
    usesHtml: emptyToNull(raw.field_utilizzi),
    maintenanceHtml: emptyToNull(raw.field_manutenzione),
    meshType: emptyToNull(raw.field_retinatura),
    imageUrl: emptyToNull(raw.field_immagine),
    imageModulesUrl: emptyToNull(raw.field_immagine_moduli),
    gallery: raw.field_gallery ?? [],
    galleryIntro: raw.field_gallery_intro ?? [],
    sheetSizeMm: emptyToNull(raw.field_dimensione_foglio_mm),
    sheetSizeInch: decodeHtmlEntities(
      emptyToNull(raw.field_dimensione_foglio_inch),
    ),
    chipSizeMm: emptyToNull(raw.field_dimensione_tessera_mm),
    chipSizeInch: decodeHtmlEntities(
      emptyToNull(raw.field_dimensione_tessera_inch),
    ),
    modulesCount: emptyToNull(raw.field_numero_moduli),
    modulesSize: emptyToNull(raw.field_dimensione_moduli),
    groutConsumptionM2: emptyToNull(raw.field_consumo_stucco_m2),
    groutConsumptionSqft: emptyToNull(raw.field_consumo_stucco_sqft),
    grouts: (raw.field_stucco ?? []).map((g) => ({
      tid: g.tid,
      name: g.name,
      imageSrc: emptyToNull(g.field_immagine),
      price2_5kg: g.field_prezzo_2_5kg,
      price5kg: g.field_prezzo_5kg,
    })),
    documents: (raw.field_documenti ?? []).map((d) => ({
      title: d.field_titolo_main || '',
      imageSrc: emptyToNull(d.field_immagine),
      href: d.field_collegamento_esterno || d.field_allegato || null,
    })),
  };
}

// ── Fetcher ─────────────────────────────────────────────────────────────────

/**
 * Fetches a single pixall product by NID.
 *
 * P4 endpoint: `/{locale}/api/v1/pixall-product/{nid}`
 */
export const fetchPixallProduct = cache(
  async (nid: number, locale: string): Promise<PixallProduct | null> => {
    const result = await apiGet<PixallProductRest[]>(
      `/${locale}/pixall-product/${nid}`,
      {},
      60,
    );
    if (!result || result.length === 0) return null;
    return normalizePixallProduct(result[0]);
  },
);
