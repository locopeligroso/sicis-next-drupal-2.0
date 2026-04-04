import { cache } from 'react';
import { apiGet, emptyToNull, resolveImage, resolveImageArray } from './client';
import type { ResolvedImage } from './client';
import type {
  MosaicProductRest,
  MosaicProductDocumentRest,
  MosaicProductGroutRest,
} from './types';

// ── Normalized domain models ────────────────────────────────────────────────

export interface MosaicProductDocument {
  title: string;
  image: ResolvedImage | null;
  href: string | null;
  isGuide: boolean;
  isDiscover: boolean;
}

export interface MosaicProductCollection {
  tid: number;
  name: string;
  body: string | null;
  sheetSizeMm: string | null;
  sheetSizeInch: string | null;
  chipSizeMm: string | null;
  chipSizeInch: string | null;
  thicknessMm: string | null;
  thicknessInch: string | null;
  usesHtml: string | null;
  maintenanceHtml: string | null;
  meshType: string | null;
  groutConsumptionM2: string | null;
  groutConsumptionSqft: string | null;
  // Resistance / specs (boolean: "1"=true, "0"=false)
  leadContent: boolean;
  waterAbsorption: string | null;
  lightResistance: boolean;
  chemicalResistance: boolean;
  thermalExpansion: string | null;
  thermalShockResistance: boolean;
  frostResistance: boolean;
  surfaceAbrasion: string | null;
  massAbrasion: string | null;
  stainResistance: boolean;
  slipResistance: boolean;
  slipResistanceGrip: boolean;
  documents: MosaicProductDocument[];
}

export interface MosaicProductGrout {
  tid: number;
  name: string;
  image: ResolvedImage | null;
  price2_5kg: string | null;
  price5kg: string | null;
}

export interface MosaicProduct {
  nid: number;
  title: string;
  body: string | null;
  composition: string | null;
  priceEu: string | null;
  priceUsaSheet: string | null;
  priceUsaSqft: string | null;
  hasSample: boolean;
  noUsaStock: boolean;
  priceOnDemand: boolean;
  image: ResolvedImage | null;
  imageSample: ResolvedImage | null;
  gallery: ResolvedImage[];
  videoUrl: string | null;
  grouts: MosaicProductGrout[];
  collection: MosaicProductCollection | null;
}

// ── Normalizers ─────────────────────────────────────────────────────────────

/** Drupal boolean fields come in many shapes: '1', 'On', 'True', true */
function toBool(val: string | boolean | null | undefined): boolean {
  return val === '1' || val === 'On' || val === 'True' || val === true;
}

function normalizeDocument(
  raw: MosaicProductDocumentRest,
): MosaicProductDocument {
  const title = raw.field_titolo_main || '';
  const titleLower = title.toLowerCase();
  return {
    title,
    image: resolveImage(raw.field_immagine),
    href: raw.field_collegamento_esterno || raw.field_allegato || null,
    isGuide:
      titleLower.includes('install') ||
      titleLower.includes('manual') ||
      titleLower.includes('guide'),
    isDiscover:
      titleLower.includes('rende unic') || titleLower.includes('makes unique'),
  };
}

function normalizeGrout(raw: MosaicProductGroutRest): MosaicProductGrout {
  return {
    tid: raw.tid,
    name: raw.name,
    image: resolveImage(raw.field_immagine),
    price2_5kg: raw.field_prezzo_2_5kg,
    price5kg: raw.field_prezzo_5kg,
  };
}

function normalizeMosaicProduct(raw: MosaicProductRest): MosaicProduct {
  const col = raw.field_collezione;

  return {
    nid: Number(raw.nid),
    title: raw.field_titolo_main || '',
    body:
      emptyToNull(raw.field_testo_main) ||
      (col ? emptyToNull(col.field_testo) : null),
    composition: emptyToNull(raw.field_composizione),
    priceEu: raw.field_prezzo_eu,
    priceUsaSheet: raw.field_prezzo_usa_sheet,
    priceUsaSqft: raw.field_prezzo_usa_sqft,
    hasSample: toBool(raw.field_campione),
    noUsaStock: toBool(raw.field_no_usa_stock),
    priceOnDemand: toBool(raw.field_prezzo_on_demand),
    image: resolveImage(raw.field_immagine),
    imageSample: resolveImage(raw.field_immagine_campione),
    gallery: resolveImageArray(raw.field_gallery),
    videoUrl: emptyToNull(raw.field_video),
    grouts: (raw.field_stucco ?? []).map(normalizeGrout),
    collection: col
      ? {
          tid: col.tid,
          name: col.name,
          body: emptyToNull(col.field_testo),
          sheetSizeMm: col.field_dimensione_foglio_mm,
          sheetSizeInch: col.field_dimensione_foglio_inch,
          chipSizeMm: col.field_dimensione_tessera_mm,
          chipSizeInch: col.field_dimensione_tessera_inch,
          thicknessMm: col.field_spessore_mm,
          thicknessInch: col.field_spessore_inch,
          usesHtml: emptyToNull(col.field_utilizzi),
          maintenanceHtml: emptyToNull(col.field_manutenzione),
          meshType: col.field_retinatura,
          groutConsumptionM2: col.field_consumo_stucco_m2,
          groutConsumptionSqft: col.field_consumo_stucco_sqft,
          leadContent: toBool(col.field_contenuto_piombo),
          waterAbsorption: col.field_assorbimento_acqua,
          lightResistance: toBool(col.field_resistenza_luce),
          chemicalResistance: toBool(col.field_resistenza_chimica),
          thermalExpansion: col.field_espansione_termica,
          thermalShockResistance: toBool(col.field_resistenza_sbalzi_termici),
          frostResistance: toBool(col.field_resistenza_gelo),
          surfaceAbrasion: col.field_resistenza_abr_superficie,
          massAbrasion: col.field_resistenza_abr_massa,
          stainResistance: toBool(col.field_resistenza_macchie),
          slipResistance: toBool(col.field_resistenza_scivolosita),
          slipResistanceGrip: toBool(col.field_resistenza_scivol_perc),
          documents: (col.field_documenti ?? []).map(normalizeDocument),
        }
      : null,
  };
}

// ── Fetcher ─────────────────────────────────────────────────────────────────

/**
 * Fetches a single mosaic product by NID.
 *
 * P1 endpoint: `/{locale}/api/v1/mosaic-product/{nid}`
 *
 * Returns normalized product data with collection relations.
 * The endpoint returns an array with a single element — this function unwraps it.
 */
export const fetchMosaicProduct = cache(
  async (nid: number, locale: string): Promise<MosaicProduct | null> => {
    const result = await apiGet<MosaicProductRest[]>(
      `/${locale}/mosaic-product/${nid}`,
      {},
      600,
    );
    if (!result || result.length === 0) return null;
    return normalizeMosaicProduct(result[0]);
  },
);
