/**
 * Drupal entity types — single source of truth.
 *
 * Combines entity type names, base shapes, and product-specific interfaces.
 * All interfaces extend Record<string, unknown> for safe optional access.
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

// ─── Shared field shapes ──────────────────────────────────────────────────

export interface DrupalTextField {
  value?: string;
  processed?: string;
}

export interface DrupalPath {
  alias?: string;
  pid?: number;
  langcode?: string;
}

export interface DrupalLinkField {
  uri?: string;
  title?: string;
}

export interface DrupalEntity extends Record<string, unknown> {
  id: string;
  type: string;
  langcode?: string;
  status?: boolean;
  title?: string;
  path?: DrupalPath;
}

// ─── Document ─────────────────────────────────────────────────────────────

export interface DocumentItem {
  id?: string;
  title?: unknown;
  field_titolo_main?: unknown;
  field_tipologia_documento?: unknown;
  field_collegamento_esterno?: string | DrupalLinkField | null;
  field_immagine?: unknown;
  field_allegato?: { entity?: { uri?: { value?: string } } } | null;
}

// ─── node--categoria ──────────────────────────────────────────────────────

export interface NodeCategoria extends DrupalEntity {
  field_titolo_main?: unknown;
  field_testo_main?: DrupalTextField | null;
  field_immagine?: unknown;
  field_categoria?: NodeCategoria;
}

// ─── taxonomy_term--mosaico_collezioni ────────────────────────────────────

export interface TermMosaicoCollezione extends DrupalEntity {
  name?: string;
  field_immagine?: unknown;
  field_testo?: DrupalTextField | null;
  field_dimensione_tessera_mm?: string | null;
  field_dimensione_tessera_inch?: string | null;
  field_dimensione_foglio_mm?: string | null;
  field_dimensione_foglio_inch?: string | null;
  field_spessore_mm?: string | null;
  field_spessore_inch?: string | null;
  field_retinatura?: string | null;
  field_consumo_stucco_m2?: number | null;
  field_consumo_stucco_sqft?: number | null;
  field_resistenza_gelo?: boolean;
  field_resistenza_chimica?: boolean;
  field_resistenza_luce?: boolean;
  field_resistenza_macchie?: boolean;
  field_resistenza_sbalzi_termici?: boolean;
  field_resistenza_scivolosita?: boolean;
  field_resistenza_scivol_perc?: boolean;
  field_resistenza_abr_massa?: string | null;
  field_resistenza_abr_superficie?: string | null;
  field_assorbimento_acqua?: string | null;
  field_espansione_termica?: string | null;
  field_contenuto_piombo?: boolean;
  field_utilizzi?: DrupalTextField | null;
  field_manutenzione?: DrupalTextField | null;
  field_documenti?: DocumentItem[];
}

// ─── taxonomy_term--vetrite_collezioni ────────────────────────────────────

export interface TermVetriteCollezione extends DrupalEntity {
  name?: string;
  field_immagine?: unknown;
  field_testo?: DrupalTextField | null;
  field_dimensioni_cm?: string | null;
  field_dimensioni_inch?: string | null;
  field_dimensioni_extra_cm?: string | null;
  field_dimensioni_extra_inch?: string | null;
  field_spessore_mm?: string | null;
  field_spessore_inch?: string | null;
  field_spessore_extra_mm?: string | null;
  field_spessore_extra_inch?: string | null;
  field_formato_campione?: string | null;
  field_trattamenti_extra?: DrupalTextField | null;
  field_lastre_speciali?: DrupalTextField | null;
  field_vetri_speciali?: DrupalTextField | null;
  field_utilizzi?: DrupalTextField | null;
  field_manutenzione?: DrupalTextField | null;
  field_documenti?: DocumentItem[];
}

// ─── Product types ────────────────────────────────────────────────────────

export interface ProdottoMosaico extends DrupalEntity {
  type: 'node--prodotto_mosaico';
  field_titolo_main?: unknown;
  field_testo_main?: DrupalTextField | null;
  field_composizione?: unknown;
  field_prezzo_eu?: string | null;
  field_prezzo_usa?: string | null;
  field_prezzo_on_demand?: boolean;
  field_no_usa_stock?: boolean;
  field_campione?: boolean;
  field_prezzo_usa_sheet?: string | null;
  field_prezzo_usa_sqft?: string | null;
  field_immagine?: unknown;
  field_immagine_campione?: unknown;
  field_video?: unknown;
  field_collezione?: TermMosaicoCollezione | null;
  field_categoria?: NodeCategoria | null;
  field_forma?: Array<{ name?: string }>;
  field_finitura?: Array<{ name?: string }>;
  field_colori?: Array<{ name?: string }>;
  field_stucco?: Array<{ name?: string }>;
  field_gallery?: unknown[];
}

interface FinituraArredoItem extends Record<string, unknown> {
  id?: string;
  name?: string;
  field_etichetta?: unknown;
  field_testo?: unknown;
  field_immagine?: unknown;
}

export interface ProdottoArredo extends DrupalEntity {
  type: 'node--prodotto_arredo';
  field_titolo_main?: unknown;
  field_testo_main?: DrupalTextField | null;
  field_materiali?: DrupalTextField | null;
  field_specifiche_tecniche?: DrupalTextField | null;
  field_prezzo_eu?: { value?: string } | null;
  field_prezzo_usa?: { value?: string } | null;
  field_collegamento_esterno?: string | DrupalLinkField | null;
  field_path_file_ftp?: string[] | string;
  field_immagine?: unknown;
  field_immagine_anteprima?: unknown;
  field_categoria?: NodeCategoria | null;
  field_finiture?: FinituraArredoItem[];
  field_gallery?: unknown[];
  field_gallery_intro?: unknown[];
  field_documenti?: DocumentItem[];
  field_scheda_tecnica?: unknown[];
  field_tessuti?: unknown[];
}

export interface ProdottoVetrite extends DrupalEntity {
  type: 'node--prodotto_vetrite';
  field_titolo_main?: unknown;
  field_testo_main?: DrupalTextField | null;
  field_prezzo_eu?: { value?: string } | null;
  field_prezzo_usa?: { value?: string } | null;
  field_prezzo_on_demand?: boolean;
  field_no_usa_stock?: boolean;
  field_immagine?: unknown;
  field_immagine_anteprima?: unknown;
  field_collezione?: TermVetriteCollezione | null;
  field_colori?: Array<{ name?: string }>;
  field_finiture?: Array<{ name?: string }>;
  field_texture?: Array<{ name?: string }>;
  field_dimensioni_cm?: string | null;
  field_dimensioni_inch?: string | null;
  field_dimensione_pattern_cm?: string | null;
  field_dimensione_pattern_inch?: string | null;
  field_formato_campione?: string | null;
  field_gallery?: unknown[];
}

interface FinituraTessutoItem extends Record<string, unknown> {
  id?: string;
  name?: string;
  field_codice_colore?: unknown;
  field_etichetta?: unknown;
  field_testo?: unknown;
}

export interface ProdottoTessuto extends DrupalEntity {
  type: 'node--prodotto_tessuto';
  field_titolo_main?: unknown;
  field_testo_main?: DrupalTextField | null;
  field_composizione?: unknown;
  field_altezza_cm?: unknown;
  field_altezza_inch?: unknown;
  field_peso?: unknown;
  field_utilizzo?: string | null;
  field_immagine_anteprima?: unknown;
  field_categoria?: NodeCategoria | null;
  field_colori?: Array<{ name?: string }>;
  field_finiture_tessuto?: FinituraTessutoItem | FinituraTessutoItem[];
  field_tipologia_tessuto?: { name?: string } | Array<{ name?: string }>;
  field_indicazioni_manutenzione?: Array<{ name?: string }>;
  field_gallery?: unknown[];
  field_gallery_intro?: unknown[];
  field_documenti?: DocumentItem[];
}

export interface ProdottoPixall extends DrupalEntity {
  type: 'node--prodotto_pixall';
  field_titolo_main?: unknown;
  field_testo_main?: DrupalTextField | null;
  field_composizione?: DrupalTextField | null;
  field_manutenzione?: DrupalTextField | null;
  field_dimensione_tessera_mm?: string | null;
  field_dimensione_tessera_inch?: string | null;
  field_dimensione_foglio_mm?: string | null;
  field_dimensione_foglio_inch?: string | null;
  field_dimensione_moduli?: string | null;
  field_consumo_stucco_m2?: number | null;
  field_consumo_stucco_sqft?: number | null;
  field_retinatura?: unknown;
  field_utilizzi?: DrupalTextField | null;
  field_numero_moduli?: unknown;
  field_immagine?: unknown;
  field_immagine_anteprima?: unknown;
  field_immagine_moduli?: unknown;
  field_colori?: Array<{ name?: string }>;
  field_forma?: Array<{ name?: string }>;
  field_stucco?: Array<{ name?: string }>;
  field_gallery?: unknown[];
  field_gallery_intro?: unknown[];
  field_documenti?: DocumentItem[];
}
