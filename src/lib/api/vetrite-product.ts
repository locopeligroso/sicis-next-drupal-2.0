import { cache } from 'react';
import { apiGet, emptyToNull } from './client';
import type { VetriteProductRest, VetriteProductDocumentRest } from './types';

// ── Normalized domain models ────────────────────────────────────────────────

export interface VetriteProductDocument {
  title: string;
  imageSrc: string | null;
  href: string | null;
}

export interface VetriteProductCollection {
  tid: number;
  name: string;
  body: string | null;
  imageSrc: string | null;
  dimensionsCm: string | null;
  dimensionsInch: string | null;
  dimensionsExtraCm: string | null;
  dimensionsExtraInch: string | null;
  thicknessMm: string | null;
  thicknessInch: string | null;
  thicknessExtraMm: string | null;
  thicknessExtraInch: string | null;
  sampleFormat: string | null;
  formatExtraCm: string | null;
  formatExtraInch: string | null;
  usesHtml: string | null;
  maintenanceHtml: string | null;
  treatmentsExtraHtml: string | null;
  specialSlabsHtml: string | null;
  specialGlassHtml: string | null;
  documents: VetriteProductDocument[];
}

export interface VetriteProduct {
  nid: number;
  title: string;
  body: string | null;
  imageUrl: string | null;
  gallery: string[];
  dimensionsCm: string | null;
  dimensionsInch: string | null;
  patternCm: string | null;
  patternInch: string | null;
  priceEu: string | null;
  priceUsa: string | null;
  hasSample: boolean;
  sampleFormat: string | null;
  noUsaStock: boolean;
  priceOnDemand: boolean;
  collection: VetriteProductCollection | null;
}

// ── Normalizers ─────────────────────────────────────────────────────────────

function normalizeDocument(
  raw: VetriteProductDocumentRest,
): VetriteProductDocument {
  return {
    title: raw.field_titolo_main || '',
    imageSrc: emptyToNull(raw.field_immagine),
    href: raw.field_collegamento_esterno || raw.field_allegato || null,
  };
}

function normalizeVetriteProduct(raw: VetriteProductRest): VetriteProduct {
  const col = raw.field_collezione;
  // Vetrite uses "On"/"Off" strings instead of "1"/"0"
  const toBool = (v: string | null | undefined) => v === 'On' || v === '1';

  return {
    nid: Number(raw.nid),
    title: raw.field_titolo_main || '',
    body:
      emptyToNull(raw.field_testo_main) ||
      (col ? emptyToNull(col.field_testo) : null),
    imageUrl: emptyToNull(raw.field_immagine),
    gallery: raw.field_gallery ?? [],
    dimensionsCm: emptyToNull(raw.field_dimensioni_cm),
    dimensionsInch: emptyToNull(raw.field_dimensioni_inch),
    patternCm: emptyToNull(raw.field_dimensione_pattern_cm),
    patternInch: emptyToNull(raw.field_dimensione_pattern_inch),
    priceEu: raw.field_prezzo_eu !== '0.00' ? raw.field_prezzo_eu : null,
    priceUsa: raw.field_prezzo_usa !== '0.00' ? raw.field_prezzo_usa : null,
    hasSample: toBool(raw.field_campione),
    sampleFormat: raw.field_formato_campione,
    noUsaStock: toBool(raw.field_no_usa_stock),
    priceOnDemand: toBool(raw.field_prezzo_on_demand),
    collection: col
      ? {
          tid: col.tid,
          name: col.name,
          body: emptyToNull(col.field_testo),
          imageSrc: emptyToNull(col.field_immagine),
          dimensionsCm: col.field_dimensioni_cm,
          dimensionsInch: col.field_dimensioni_inch,
          dimensionsExtraCm: col.field_dimensioni_extra_cm,
          dimensionsExtraInch: col.field_dimensioni_extra_inch,
          thicknessMm: col.field_spessore_mm,
          thicknessInch: col.field_spessore_inch,
          thicknessExtraMm: col.field_spessore_extra_mm,
          thicknessExtraInch: col.field_spessore_extra_inch,
          sampleFormat: col.field_formato_campione,
          formatExtraCm: col.field_formato_extra_cm,
          formatExtraInch: col.field_formato_extra_inch,
          usesHtml: emptyToNull(col.field_utilizzi),
          maintenanceHtml: emptyToNull(col.field_manutenzione),
          treatmentsExtraHtml: emptyToNull(col.field_trattamenti_extra),
          specialSlabsHtml: emptyToNull(col.field_lastre_speciali),
          specialGlassHtml: emptyToNull(col.field_vetri_speciali),
          documents: (col.field_documenti ?? []).map(normalizeDocument),
        }
      : null,
  };
}

// ── Fetcher ─────────────────────────────────────────────────────────────────

/**
 * Fetches a single vetrite product by NID.
 *
 * P2 endpoint: `/{locale}/api/v1/vetrite-product/{nid}`
 */
export const fetchVetriteProduct = cache(
  async (nid: number, locale: string): Promise<VetriteProduct | null> => {
    const result = await apiGet<VetriteProductRest[]>(
      `/${locale}/vetrite-product/${nid}`,
      {},
      600,
    );
    if (!result || result.length === 0) return null;
    return normalizeVetriteProduct(result[0]);
  },
);
