import { cache } from 'react';
import { apiGet, emptyToNull, resolveImage, resolveImageArray } from './client';
import type { ResolvedImage } from './client';

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

// ── Finiture REST shapes ─────────────────────────────────────────────────────

interface ArredoFinituraVariantRest {
  tid: number;
  name: string;
  field_immagine?: string | null;
}

interface ArredoFinituraTessutoRest {
  tid: number;
  name: string;
  field_immagine?: string | null;
  children: ArredoFinituraVariantRest[];
}

interface ArredoFinituracategoryRest {
  tid: number;
  name: string;
  children: ArredoFinituraTessutoRest[];
}

// arredo_finiture has the same 3-level shape as tessuto_finiture
type ArredoFinitureArredoRest = ArredoFinituracategoryRest;

interface ArredoFinitureGroupRest {
  nodes: unknown[];
  tessuto_finiture: ArredoFinituracategoryRest[];
  arredo_finiture: ArredoFinitureArredoRest[];
}

interface ArredoProductRest {
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
  field_documenti: ArredoDocumentRest[];
  field_finiture_arredo?: ArredoFinitureGroupRest | null;
  [key: string]: unknown;
}

// ── Normalized domain model ──────────────────────────────────────────────────

export interface ArredoProductDocument {
  nid: number;
  title: string;
  image: ResolvedImage | null;
  href: string | null;
  videoId: string | null;
}

/** Single finish variant (leaf level) */
export interface ArredoFinituraVariant {
  tid: number;
  name: string;
  image: ResolvedImage | null;
}

/** A fabric/finish family (mid level: e.g. "Ares", "Elios") */
export interface ArredoFinituraTessuto {
  tid: number;
  name: string;
  image: ResolvedImage | null;
  variants: ArredoFinituraVariant[];
}

/** Top-level category grouping (e.g. "Velvets", "Plain colour") */
export interface ArredoFinituraCategory {
  tid: number;
  name: string;
  items: ArredoFinituraTessuto[];
}

/**
 * Hard finish category (arredo_finiture — same 3-level structure as tessuto:
 * Category (Legni/Marmo) → Sub-group (Essenze lucide) → Variant with image)
 */
export type ArredoFinituraArredo = ArredoFinituraCategory;

export interface ArredoProduct {
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
  documents: ArredoProductDocument[];
  /** Tessuto finish groups (3-level: category > fabric > variant) */
  tessutoFiniture: ArredoFinituraCategory[];
  /** Hard arredo finishes (currently always empty — future use) */
  arredoFiniture: ArredoFinituraArredo[];
}

// ── Normalizer ───────────────────────────────────────────────────────────────

function normalizeArredoProduct(raw: ArredoProductRest): ArredoProduct {
  // Normalize 3-level tessuto finiture
  const finGrp = raw.field_finiture_arredo;
  /**
   * Normalize a fabric-level entry.
   * Drupal sometimes returns 3-level (category → fabric → variants) and sometimes
   * 2-level (category → fabric with own image, no children).
   * When children are absent but the fabric itself has field_immagine, we synthesize
   * a single-variant list so the swatch is rendered.
   */
  function normalizeFabric(
    fabric: ArredoFinituraTessutoRest,
  ): ArredoFinituraTessuto {
    const ownImage = resolveImage(fabric.field_immagine);
    const children = fabric.children ?? [];
    const variants: ArredoFinituraVariant[] =
      children.length > 0
        ? children.map((v) => ({
            tid: v.tid,
            name: v.name,
            image: resolveImage(v.field_immagine),
          }))
        : ownImage
          ? [{ tid: fabric.tid, name: fabric.name, image: ownImage }]
          : [];
    return { tid: fabric.tid, name: fabric.name, image: ownImage, variants };
  }

  const tessutoFiniture: ArredoFinituraCategory[] = (
    finGrp?.tessuto_finiture ?? []
  ).map((cat) => ({
    tid: cat.tid,
    name: cat.name,
    items: (cat.children ?? []).map(normalizeFabric),
  }));

  // arredo_finiture has the same 3-level structure as tessuto_finiture
  const arredoFiniture: ArredoFinituraArredo[] = (
    finGrp?.arredo_finiture ?? []
  ).map((cat) => ({
    tid: cat.tid,
    name: cat.name,
    items: (cat.children ?? []).map(normalizeFabric),
  }));

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
    tessutoFiniture,
    arredoFiniture,
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
      600,
    );
    if (!result || result.length === 0) return null;
    return normalizeArredoProduct(result[0]);
  },
);
