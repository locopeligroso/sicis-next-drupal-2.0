// Response wrapper for paginated listings
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// === V1: Products ===
export interface ProductCard {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null; // field_immagine_anteprima (preview for cards)
  imageUrlMain: string | null; // field_immagine (full-size for detail page)
  price: string | null;
  priceOnDemand: string | null; // Drupal returns "0", "1", or null
  path: string | null;
}

// === V2: Filter Counts ===
export interface CountsResponse {
  counts: Record<string, number>;
}

// === V3: Taxonomy Terms ===
// Actual REST response shape — no `path` or `slug` field
export interface TaxonomyTermItem {
  id: string;
  name: string;
  imageUrl: string; // empty string when no image
  weight: string; // Drupal returns weight as string
}

// === V5: Blog ===
export interface BlogCard {
  id: string;
  type: 'articolo' | 'news' | 'tutorial';
  title: string;
  imageUrl: string | null;
  path: string | null;
  created: string;
}

// === V6: Projects ===
export interface ProjectCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  category: string | null;
}

// === V7: Environments ===
export interface EnvironmentCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
}

// === V8: Showrooms ===
export interface ShowroomCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  gmapsUrl: string | null;
  externalUrl: string | null;
}

// === V9: Documents ===
export interface DocumentCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  fileUrl: string | null;
  externalUrl: string | null;
  documentType: string | null;
  category: string | null;
}

// === V10: Subcategories ===
export interface CategoryCard {
  id: string;
  uuid: string | null; // Drupal returns null for this field
  title: string;
  imageUrl: string | null;
  path: string | null;
}

// === V11: Pages by Category ===
export interface PageCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
}

// === C1: Entity ===
export interface EntityResponse {
  meta: {
    type: 'node' | 'taxonomy_term';
    bundle: string;
    id: number;
    uuid: string;
    locale: string;
    path: string;
  };
  data: Record<string, unknown>;
}

// === R1: Resolve Path ===
export interface ResolvePathResponse {
  nid: number;
  type: 'node' | 'taxonomy_term';
  bundle: string;
  locale: string;
  aliases?: Record<string, string>;
}

// === P1: Mosaic Product (single product by NID) ===
export interface MosaicProductDocumentRest {
  nid: number;
  field_titolo_main: string;
  field_immagine: string | null;
  field_allegato: string | null;
  field_collegamento_esterno: string | null;
  field_id_video: string | null;
}

export interface MosaicProductCollectionRest {
  tid: number;
  name: string;
  field_testo: string;
  field_dimensione_foglio_mm: string | null;
  field_dimensione_foglio_inch: string | null;
  field_dimensione_tessera_mm: string | null;
  field_dimensione_tessera_inch: string | null;
  field_spessore_mm: string | null;
  field_spessore_inch: string | null;
  field_utilizzi: string | null;
  field_manutenzione: string | null;
  field_retinatura: string | null;
  field_consumo_stucco_m2: string | null;
  field_consumo_stucco_sqft: string | null;
  field_contenuto_piombo: string;
  field_assorbimento_acqua: string | null;
  field_resistenza_luce: string;
  field_resistenza_chimica: string;
  field_espansione_termica: string | null;
  field_resistenza_sbalzi_termici: string;
  field_resistenza_gelo: string;
  field_resistenza_abr_superficie: string | null;
  field_resistenza_abr_massa: string | null;
  field_resistenza_macchie: string;
  field_resistenza_scivolosita: string;
  field_resistenza_scivol_perc: string;
  field_documenti: MosaicProductDocumentRest[];
}

export interface MosaicProductGroutRest {
  tid: number;
  name: string;
  field_immagine: string | null;
  field_prezzo_2_5kg: string | null;
  field_prezzo_5kg: string | null;
}

export interface MosaicProductRest {
  nid: string;
  field_titolo_main: string;
  field_testo_main: string;
  field_composizione: string;
  field_prezzo_eu: string | null;
  field_prezzo_usa_sheet: string | null;
  field_prezzo_usa_sqft: string | null;
  field_campione: string;
  field_no_usa_stock: string;
  field_prezzo_on_demand: string;
  field_immagine: string | null;
  field_immagine_campione: string | null;
  field_gallery: string[];
  field_video: string | null;
  field_stucco?: MosaicProductGroutRest[];
  field_collezione?: MosaicProductCollectionRest;
}

// === P2: Vetrite Product (single product by NID) ===
export interface VetriteProductDocumentRest {
  nid: number;
  field_titolo_main: string;
  field_immagine: string | null;
  field_allegato: string | null;
  field_collegamento_esterno: string | null;
  field_id_video: string | null;
}

export interface VetriteProductCollectionRest {
  tid: number;
  name: string;
  field_testo: string;
  field_immagine: string | null;
  field_dimensioni_cm: string | null;
  field_dimensioni_inch: string | null;
  field_dimensioni_extra_cm: string | null;
  field_dimensioni_extra_inch: string | null;
  field_spessore_mm: string | null;
  field_spessore_inch: string | null;
  field_spessore_extra_mm: string | null;
  field_spessore_extra_inch: string | null;
  field_formato_campione: string | null;
  field_formato_extra_cm: string | null;
  field_formato_extra_inch: string | null;
  field_utilizzi: string | null;
  field_manutenzione: string | null;
  field_trattamenti_extra: string | null;
  field_lastre_speciali: string | null;
  field_vetri_speciali: string | null;
  field_documenti: VetriteProductDocumentRest[];
}

export interface VetriteProductRest {
  nid: string;
  field_titolo_main: string;
  field_testo_main: string;
  field_immagine: string | null;
  field_gallery: string[];
  field_dimensioni_cm: string;
  field_dimensioni_inch: string;
  field_dimensione_pattern_cm: string;
  field_dimensione_pattern_inch: string;
  field_prezzo_eu: string | null;
  field_prezzo_usa: string | null;
  field_campione: string;
  field_no_usa_stock: string;
  field_prezzo_on_demand: string;
  field_formato_campione: string | null;
  field_collezione?: VetriteProductCollectionRest;
}

// === P3: Textile Product (single product by NID) ===
export interface TextileProductCategoryRest {
  nid: number;
  field_titolo_main: string;
}

export interface TextileProductDocumentRest {
  nid: number;
  field_titolo_main: string;
  field_immagine: string | null;
  field_allegato: string | null;
  field_collegamento_esterno: string | null;
  field_id_video: string | null;
}

export interface TextileProductFinituraChildRest {
  tid: number;
  name: string;
  field_codice_colore: string | null;
  field_etichetta: string | null;
  field_immagine: string | null;
  field_testo: string | null;
  field_colore: { tid: number; name: string } | null;
}

export interface TextileProductFinituraRest {
  tid: number;
  name: string;
  children?: TextileProductFinituraChildRest[];
  // Flat fields (for backward compat if endpoint returns flat structure)
  field_codice_colore?: string | null;
  field_etichetta?: string | null;
  field_immagine?: string | null;
  field_testo?: string | null;
  field_colore?: { tid: number; name: string } | string | null;
}

export interface TextileProductMaintenanceRest {
  tid: number;
  name: string;
  field_immagine: string | null;
}

export interface TextileProductTypologyRest {
  tid: number;
  name: string;
}

export interface TextileProductRest {
  nid: string;
  field_titolo_main: string;
  field_testo_main: string;
  field_composizione: string;
  field_densita_annodatura: string;
  field_altezza_cm: string;
  field_altezza_inch: string;
  field_dimensioni_cm: string;
  field_dimensioni_inch: string;
  field_spessore: string;
  field_peso: string;
  field_prezzo_eu: string;
  field_prezzo_usa: string;
  field_utilizzo: string;
  field_gallery: string[];
  field_gallery_intro: string[];
  field_categoria?: TextileProductCategoryRest;
  field_documenti?: TextileProductDocumentRest[];
  field_finiture_tessuto?:
    | TextileProductFinituraRest
    | TextileProductFinituraRest[];
  field_indicazioni_manutenzione?: TextileProductMaintenanceRest[];
  field_tipologia_tessuto?:
    | TextileProductTypologyRest
    | TextileProductTypologyRest[];
}

// === P4: Pixall Product (single product by NID) ===
export interface PixallProductGroutRest {
  tid: number;
  name: string;
  field_immagine: string | null;
  field_prezzo_2_5kg: string | null;
  field_prezzo_5kg: string | null;
}

export interface PixallProductDocumentRest {
  nid: number;
  field_titolo_main: string;
  field_immagine: string | null;
  field_allegato: string | null;
  field_collegamento_esterno: string | null;
  field_id_video: string | null;
}

export interface PixallProductRest {
  nid: string;
  field_titolo_main: string;
  field_testo_main: string;
  field_composizione: string;
  field_utilizzi: string;
  field_manutenzione: string;
  field_retinatura: string;
  field_immagine: string | null;
  field_immagine_moduli: string;
  field_gallery: string[];
  field_gallery_intro: string[];
  field_dimensione_foglio_mm: string;
  field_dimensione_foglio_inch: string;
  field_dimensione_tessera_mm: string;
  field_dimensione_tessera_inch: string;
  field_numero_moduli: string;
  field_dimensione_moduli: string;
  field_consumo_stucco_m2: string;
  field_consumo_stucco_sqft: string;
  field_stucco?: PixallProductGroutRest[];
  field_documenti?: PixallProductDocumentRest[];
}

// === C2: Translate Path ===
export interface TranslatePathResponse {
  translatedPath: string | null;
}
