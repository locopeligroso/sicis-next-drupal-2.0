// ── Legacy Node Adapters ──────────────────────────────────────────────────────
// Each adapter converts a normalized product type (from type-specific REST
// endpoints P1–P5) into the entity-like Record<string, unknown> shape that the
// legacy template components expect (raw Drupal field shapes).
//
// All adapters are pure data transforms — no side effects, no Next.js imports.

import type { VetriteProduct } from '@/lib/api/vetrite-product';
import type { TextileProduct } from '@/lib/api/textile-product';
import type { PixallProduct } from '@/lib/api/pixall-product';
import type { IlluminazioneProduct } from '@/lib/api/illuminazione-product';
import type { ArredoProduct } from '@/lib/api/arredo-product';

// ── Shared helper ─────────────────────────────────────────────────────────────

/** Reconstructs the Drupal file--file image field shape from a plain URL. */
export function toImageField(url: string | null) {
  return url
    ? {
        type: 'file--file',
        uri: { url },
        meta: { alt: '', width: 0, height: 0 },
      }
    : null;
}

// ── Adapter: vetrite-product normalized → entity-like Record for legacy template ─
// The legacy ProdottoVetrite template expects raw Drupal entity field shapes.
// This adapter reconstructs that shape from the normalized vetrite-product
// endpoint data so the legacy template renders without modification.

export function vetriteToLegacyNode(
  product: VetriteProduct,
  locale: string,
): Record<string, unknown> {
  const col = product.collection;

  return {
    type: 'node--prodotto_vetrite',
    langcode: locale,
    title: product.title,
    field_titolo_main: product.title,
    field_testo_main: product.body
      ? { value: product.body, processed: product.body }
      : null,
    field_immagine: toImageField(product.imageUrl),
    field_gallery: product.gallery.map((url) => toImageField(url)),
    field_dimensioni_cm: product.dimensionsCm,
    field_dimensioni_inch: product.dimensionsInch,
    field_dimensione_pattern_cm: product.patternCm,
    field_dimensione_pattern_inch: product.patternInch,
    field_prezzo_eu: product.priceEu ? { value: product.priceEu } : null,
    field_prezzo_usa: product.priceUsa ? { value: product.priceUsa } : null,
    field_prezzo_on_demand: product.priceOnDemand,
    field_no_usa_stock: product.noUsaStock,
    field_campione: product.hasSample,
    field_formato_campione: product.sampleFormat,
    field_collezione: col
      ? {
          name: col.name,
          field_testo: col.body
            ? { value: col.body, processed: col.body }
            : null,
          field_immagine: toImageField(col.imageSrc),
          field_dimensioni_cm: col.dimensionsCm,
          field_dimensioni_inch: col.dimensionsInch,
          field_dimensioni_extra_cm: col.dimensionsExtraCm,
          field_dimensioni_extra_inch: col.dimensionsExtraInch,
          field_spessore_mm: col.thicknessMm,
          field_spessore_inch: col.thicknessInch,
          field_spessore_extra_mm: col.thicknessExtraMm,
          field_spessore_extra_inch: col.thicknessExtraInch,
          field_formato_campione: col.sampleFormat,
          field_formato_extra_cm: col.formatExtraCm,
          field_formato_extra_inch: col.formatExtraInch,
          field_utilizzi: col.usesHtml
            ? { value: col.usesHtml, processed: col.usesHtml }
            : null,
          field_manutenzione: col.maintenanceHtml
            ? { value: col.maintenanceHtml, processed: col.maintenanceHtml }
            : null,
          field_trattamenti_extra: col.treatmentsExtraHtml
            ? {
                value: col.treatmentsExtraHtml,
                processed: col.treatmentsExtraHtml,
              }
            : null,
          field_lastre_speciali: col.specialSlabsHtml
            ? { value: col.specialSlabsHtml, processed: col.specialSlabsHtml }
            : null,
          field_vetri_speciali: col.specialGlassHtml
            ? { value: col.specialGlassHtml, processed: col.specialGlassHtml }
            : null,
          field_documenti: (col.documents ?? []).map((doc) => ({
            field_titolo_main: doc.title,
            field_tipologia_documento: null,
            field_collegamento_esterno: doc.href,
            field_immagine: toImageField(doc.imageSrc),
            field_allegato: null,
          })),
        }
      : null,
    // Fields not yet available from vetrite-product — legacy template handles null gracefully
    field_colori: [],
    field_finiture: [],
    field_texture: [],
  };
}

// ── Adapter: textile-product normalized → entity-like Record for legacy template ─

export function textileToLegacyNode(
  product: TextileProduct,
  locale: string,
): Record<string, unknown> {
  // Strip HTML tags from simple value fields (Drupal wraps them in <p>)
  const stripHtml = (val: string | null) =>
    val
      ? val
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim()
      : null;

  return {
    type: 'node--prodotto_tessuto',
    langcode: locale,
    title: product.title,
    field_titolo_main: product.title,
    field_testo_main: product.body
      ? { value: product.body, processed: product.body }
      : null,
    field_composizione: product.composition
      ? { value: product.composition, processed: product.composition }
      : null,
    field_altezza_cm: stripHtml(product.heightCm),
    field_altezza_inch: stripHtml(product.heightInch),
    field_peso: product.weight,
    field_utilizzo: product.usage,
    field_densita_annodatura: product.knottingDensity,
    field_dimensioni_cm: product.dimensionsCm,
    field_dimensioni_inch: product.dimensionsInch,
    field_spessore: product.thickness,
    field_prezzo_eu: product.priceEu,
    field_prezzo_usa: product.priceUsa,
    field_immagine_anteprima:
      product.galleryIntro.length > 0
        ? toImageField(product.galleryIntro[0])
        : null,
    field_gallery: product.gallery.map((url) => toImageField(url)),
    field_gallery_intro: product.galleryIntro.map((url) => toImageField(url)),
    field_categoria: product.category
      ? {
          field_titolo_main: product.category.title,
          title: product.category.title,
          path: { alias: null },
        }
      : null,
    field_colori: [],
    // Flatten hierarchical finiture (parent → children) into the flat array
    // the legacy template expects. Each child becomes a finitura item with
    // name like "Elios - Almond", field_codice_colore, field_immagine, etc.
    field_finiture_tessuto: (() => {
      const flat = product.finiture.flatMap((f) =>
        f.children.length > 0
          ? f.children.map((c) => ({
              tid: c.tid,
              name: c.name,
              field_codice_colore: c.colorCode,
              field_etichetta: c.label,
              field_immagine: toImageField(c.imageSrc),
              field_testo: c.text,
            }))
          : [
              {
                tid: f.tid,
                name: f.name,
                field_codice_colore: null,
                field_etichetta: null,
                field_immagine: null,
                field_testo: null,
              },
            ],
      );
      // Legacy template handles single cardinality (object) vs array
      return flat.length === 1 ? flat[0] : flat;
    })(),
    field_tipologia_tessuto:
      product.typologies.length > 0
        ? product.typologies.length === 1
          ? { tid: product.typologies[0].tid, name: product.typologies[0].name }
          : product.typologies.map((t) => ({ tid: t.tid, name: t.name }))
        : [],
    field_indicazioni_manutenzione: product.maintenance.map((m) => ({
      tid: m.tid,
      name: m.name,
      field_immagine: toImageField(m.imageSrc),
    })),
    field_documenti: product.documents.map((doc) => ({
      field_titolo_main: doc.title,
      title: doc.title,
      field_tipologia_documento: null,
      field_collegamento_esterno: doc.href,
      field_immagine: toImageField(doc.imageSrc),
      field_allegato: null,
    })),
  };
}

// ── Adapter: pixall-product normalized → entity-like Record for legacy template ─

export function pixallToLegacyNode(
  product: PixallProduct,
  locale: string,
): Record<string, unknown> {
  return {
    type: 'node--prodotto_pixall',
    langcode: locale,
    title: product.title,
    field_titolo_main: product.title,
    field_testo_main: product.body
      ? { value: product.body, processed: product.body }
      : null,
    field_composizione: product.composition
      ? { value: product.composition, processed: product.composition }
      : null,
    field_utilizzi: product.usesHtml
      ? { value: product.usesHtml, processed: product.usesHtml }
      : null,
    field_manutenzione: product.maintenanceHtml
      ? { value: product.maintenanceHtml, processed: product.maintenanceHtml }
      : null,
    field_retinatura: product.meshType,
    field_immagine: toImageField(product.imageUrl),
    field_immagine_moduli: toImageField(product.imageModulesUrl),
    field_gallery: product.gallery.map((url) => toImageField(url)),
    field_gallery_intro: product.galleryIntro.map((url) => toImageField(url)),
    field_dimensione_foglio_mm: product.sheetSizeMm,
    field_dimensione_foglio_inch: product.sheetSizeInch,
    field_dimensione_tessera_mm: product.chipSizeMm,
    field_dimensione_tessera_inch: product.chipSizeInch,
    field_numero_moduli: product.modulesCount,
    field_dimensione_moduli: product.modulesSize,
    field_consumo_stucco_m2: product.groutConsumptionM2,
    field_consumo_stucco_sqft: product.groutConsumptionSqft,
    field_stucco: product.grouts.map((g) => ({
      name: g.name,
      field_immagine: toImageField(g.imageSrc),
    })),
    field_documenti: product.documents.map((doc) => ({
      field_titolo_main: doc.title,
      title: doc.title,
      field_tipologia_documento: null,
      field_collegamento_esterno: doc.href,
      field_immagine: toImageField(doc.imageSrc),
      field_allegato: null,
    })),
    // Fields not yet available from pixall-product
    field_colori: [],
    field_forma: [],
  };
}

// ── Adapter: illuminazione-product normalized → entity-like Record for legacy template ─

export function illuminazioneToLegacyNode(
  product: IlluminazioneProduct,
  locale: string,
): Record<string, unknown> {
  return {
    type: 'node--prodotto_illuminazione',
    langcode: locale,
    title: product.title,
    field_titolo_main: product.title,
    field_testo_main: product.body
      ? { value: product.body, processed: product.body }
      : null,
    field_materiali: product.materialsHtml
      ? { value: product.materialsHtml, processed: product.materialsHtml }
      : null,
    field_specifiche_tecniche: product.techSpecsHtml
      ? { value: product.techSpecsHtml, processed: product.techSpecsHtml }
      : null,
    field_immagine: toImageField(product.imageUrl),
    field_gallery_intro: product.galleryIntro.map((url) => toImageField(url)),
    field_scheda_tecnica: product.techSheetUrls,
    field_no_form_scheda_tecnica: product.noTechSheet ? '1' : '0',
    field_path_file_ftp: product.hdImagePath,
    field_documenti: product.documents.map((doc) => ({
      field_titolo_main: doc.title,
      title: doc.title,
      field_tipologia_documento: null,
      field_collegamento_esterno: doc.href,
      field_immagine: toImageField(doc.imageSrc),
      field_allegato: null,
    })),
    // Fields not available from illuminazione-product endpoint
    field_prezzo_eu: null,
    field_prezzo_usa: null,
    field_gallery: [],
    field_finiture: [],
    field_tessuti: [],
    field_categoria: null,
  };
}

// ── Adapter: arredo-product normalized → entity-like Record for legacy template ─

export function arredoToLegacyNode(
  product: ArredoProduct,
  locale: string,
): Record<string, unknown> {
  return {
    type: 'node--prodotto_arredo',
    langcode: locale,
    title: product.title,
    field_titolo_main: product.title,
    field_testo_main: product.body
      ? { value: product.body, processed: product.body }
      : null,
    field_materiali: product.materialsHtml
      ? { value: product.materialsHtml, processed: product.materialsHtml }
      : null,
    field_specifiche_tecniche: product.techSpecsHtml
      ? { value: product.techSpecsHtml, processed: product.techSpecsHtml }
      : null,
    field_prezzo_eu: product.priceEu ? { value: product.priceEu } : null,
    field_prezzo_usa: product.priceUsa ? { value: product.priceUsa } : null,
    field_immagine: toImageField(product.imageUrl),
    field_gallery: product.gallery.map((url) => toImageField(url)),
    field_gallery_intro: product.galleryIntro.map((url) => toImageField(url)),
    field_scheda_tecnica: product.techSheetUrls,
    field_no_form_scheda_tecnica: product.noTechSheet ? '1' : '0',
    field_path_file_ftp: product.hdImagePath,
    field_documenti: product.documents.map((doc) => ({
      field_titolo_main: doc.title,
      title: doc.title,
      field_tipologia_documento: null,
      field_collegamento_esterno: doc.href,
      field_immagine: toImageField(doc.imageSrc),
      field_allegato: null,
    })),
    // Fields not available from arredo-product endpoint
    field_finiture: [],
    field_tessuti: [],
    field_categoria: null,
    field_blocchi: [],
    // New field from arredo-product REST endpoint
    field_finiture_arredo: {
      tessutoFiniture: product.tessutoFiniture,
      arredoFiniture: product.arredoFiniture,
    },
  };
}
