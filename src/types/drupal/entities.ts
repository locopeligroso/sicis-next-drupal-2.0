/**
 * Legacy entity types migrated from src/lib/types.ts.
 * These are DrupalNode/DrupalTaxonomyTerm-based interfaces used by node components.
 * Will be replaced by Zod schemas in Chunk 2.
 */

// ─── Entity type names ────────────────────────────────────────────────────

export type NodeTypeName =
  | 'node--page'
  | 'node--landing_page'
  | 'node--prodotto_mosaico'
  | 'node--prodotto_arredo'
  | 'node--prodotto_pixall'
  | 'node--prodotto_tessuto'
  | 'node--prodotto_vetrite'
  | 'node--articolo'
  | 'node--news'
  | 'node--tutorial'
  | 'node--progetto'
  | 'node--showroom'
  | 'node--ambiente'
  | 'node--categoria'
  | 'node--categoria_blog'
  | 'node--documento'
  | 'node--tag';

export type TaxonomyTypeName =
  | 'taxonomy_term--mosaico_collezioni'
  | 'taxonomy_term--mosaico_colori'
  | 'taxonomy_term--vetrite_collezioni'
  | 'taxonomy_term--vetrite_colori'
  | 'taxonomy_term--vetrite_finiture'
  | 'taxonomy_term--vetrite_textures'
  | 'taxonomy_term--arredo_finiture'
  | 'taxonomy_term--tessuto_colori'
  | 'taxonomy_term--tessuto_finiture'
  | 'taxonomy_term--tessuto_tipologie'
  | 'taxonomy_term--tessuto_manutenzione';

export type EntityTypeName = NodeTypeName | TaxonomyTypeName | (string & Record<never, never>);

// ─── Base shapes ──────────────────────────────────────────────────────────

export interface TextField {
  value: string;
  processed?: string;
}

export interface ImageField {
  entity: {
    uri: { value: string };
    filename?: string;
  };
}

export interface FileField {
  entity: {
    uri: { value: string };
    filename?: string;
  };
}

/** Minimal base for Drupal entity (replaces DrupalNode from next-drupal) */
export interface DrupalEntity {
  id: string;
  type: string;
  langcode?: string;
  status?: boolean;
  title?: string;
  path?: { alias?: string; pid?: number; langcode?: string };
  [key: string]: unknown;
}

// ─── node--categoria ──────────────────────────────────────────────────────

/** node--categoria — product category node */
export interface NodeCategoria extends DrupalEntity {
  field_titolo_main?: TextField;
  field_testo_main?: TextField;
  field_immagine?: ImageField;
  /** Parent category (self-referential) */
  field_categoria?: NodeCategoria;
}

// ─── taxonomy_term--mosaico_collezioni ────────────────────────────────────

export interface NodeDocumento extends DrupalEntity {
  field_titolo_main?: TextField;
  field_immagine?: ImageField;
  field_allegato?: FileField;
  field_collegamento_esterno?: { uri: string; title?: string } | string | null;
  field_tipologia_documento?: string;
}

export interface TermMosaicoCollezione extends DrupalEntity {
  name?: string;
  description?: string;
  field_testo?: TextField;
  field_testo_anteprima?: TextField | null;
  field_utilizzi?: TextField;
  field_manutenzione?: TextField;
  field_dimensione_tessera_mm?: string;
  field_dimensione_tessera_inch?: string;
  field_dimensione_foglio_mm?: string;
  field_dimensione_foglio_inch?: string;
  field_spessore_mm?: string;
  field_spessore_inch?: string;
  field_retinatura?: 'on_fiber_mesh' | 'on_paper_to_remove' | string;
  field_consumo_stucco_m2?: number | null;
  field_consumo_stucco_sqft?: number | null;
  field_assorbimento_acqua?: string | null;
  field_espansione_termica?: string | null;
  field_resistenza_abr_massa?: string | null;
  field_resistenza_abr_superficie?: string | null;
  field_resistenza_chimica?: boolean;
  field_resistenza_gelo?: boolean;
  field_resistenza_luce?: boolean;
  field_resistenza_macchie?: boolean;
  field_resistenza_sbalzi_termici?: boolean;
  field_resistenza_scivolosita?: boolean;
  field_resistenza_scivol_perc?: boolean;
  field_contenuto_piombo?: boolean;
  field_immagine?: ImageField | null;
  field_documenti?: NodeDocumento[];
}

// ─── taxonomy_term--vetrite_collezioni ────────────────────────────────────

export interface TermVetriteCollezione extends DrupalEntity {
  name?: string;
  description?: string;
  field_testo?: TextField;
  field_utilizzi?: TextField;
  field_manutenzione?: TextField;
  field_lastre_speciali?: TextField;
  field_trattamenti_extra?: TextField;
  field_vetri_speciali?: TextField;
  field_dimensioni_cm?: string;
  field_dimensioni_inch?: string;
  field_dimensioni_extra_cm?: string;
  field_dimensioni_extra_inch?: string;
  field_spessore_mm?: string;
  field_spessore_inch?: string;
  field_spessore_extra_mm?: string;
  field_spessore_extra_inch?: string;
  field_formato_campione?: string;
  field_formato_extra_cm?: string;
  field_formato_extra_inch?: string;
  field_immagine?: ImageField | null;
  field_documenti?: NodeDocumento[];
}
