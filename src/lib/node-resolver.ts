import type { EntityTypeName } from '@/types/drupal/entities';

/**
 * Returns the ISR revalidation time in seconds for a given Drupal entity type.
 *
 * Revalidation strategy:
 * - Products: 60 s (high update frequency, price/stock changes)
 * - Editorial (articolo, news, tutorial): 300 s
 * - Static pages: 600 s
 * - Taxonomy terms: 3600 s (rarely change)
 * - Unknown types: 300 s (safe default)
 *
 * @param type - Drupal entity type name (e.g. `'node--prodotto_mosaico'`)
 * @returns Revalidation time in seconds for use with `next: { revalidate }`
 * @example
 * getRevalidateTime('node--prodotto_mosaico') // → 60
 * getRevalidateTime('node--page')             // → 600
 * getRevalidateTime('taxonomy_term--colori')  // → 3600
 */
export function getRevalidateTime(type: EntityTypeName): number {
  switch (type) {
    case 'node--prodotto_mosaico':
    case 'node--prodotto_arredo':
    case 'node--prodotto_pixall':
    case 'node--prodotto_tessuto':
    case 'node--prodotto_vetrite':
      return 60;
    case 'node--articolo':
    case 'node--news':
    case 'node--tutorial':
      return 300;
    case 'node--page':
    case 'node--landing_page':
      return 600;
    default:
      if (type.startsWith('taxonomy_term--')) return 3600;
      return 300;
  }
}

/**
 * Maps a Drupal entity type name to the corresponding React component name.
 *
 * Used by the catch-all route (`[...slug]/page.tsx`) to dynamically import
 * the correct component for each content type. Returns `'UnknownEntity'` as
 * a safe fallback for unmapped types.
 *
 * @param type - Drupal entity type name (e.g. `'node--prodotto_mosaico'`)
 * @returns React component name string (e.g. `'ProdottoMosaico'`)
 * @example
 * getComponentName('node--prodotto_mosaico') // → 'ProdottoMosaico'
 * getComponentName('node--page')             // → 'Page'
 * getComponentName('node--unknown_type')     // → 'UnknownEntity'
 */
export function getComponentName(type: EntityTypeName): string {
  const map: Record<string, string> = {
    'node--page': 'Page',
    'node--landing_page': 'LandingPage',
    'node--prodotto_mosaico': 'ProdottoMosaico',
    'node--prodotto_arredo': 'ProdottoArredo',
    'node--prodotto_pixall': 'ProdottoPixall',
    'node--prodotto_tessuto': 'ProdottoTessuto',
    'node--prodotto_vetrite': 'ProdottoVetrite',
    'node--articolo': 'Articolo',
    'node--news': 'News',
    'node--tutorial': 'Tutorial',
    'node--progetto': 'Progetto',
    'node--showroom': 'Showroom',
    'node--ambiente': 'Ambiente',
    'node--categoria': 'Categoria',
    'node--categoria_blog': 'CategoriaBlog',
    'node--documento': 'Documento',
    'node--tag': 'Tag',
    'taxonomy_term--mosaico_collezioni': 'MosaicoCollezione',
    'taxonomy_term--mosaico_colori': 'MosaicoColore',
    'taxonomy_term--vetrite_collezioni': 'VetriteCollezione',
    'taxonomy_term--vetrite_colori': 'VetriteColore',
  };
  return map[type] ?? 'UnknownEntity';
}

// ── Include fields per bundle ────────────────────────────────────────────────
//
// Complete JSON:API include string for each Drupal bundle.
// field_blocchi is ONLY included for content types that have paragraph fields.
// Products do NOT have field_blocchi — they have direct entity reference fields.
//
// To add a new content type:
//   1. Check which relationship fields exist on the Drupal content type
//   2. Add the bundle key with the comma-separated include string
//   3. Include field_blocchi,field_blocchi.field_immagine ONLY if the type has paragraphs

const INCLUDE_MAP: Record<string, string> = {
  // ── Products (NO field_blocchi) ──
  prodotto_mosaico:
    'field_immagine,field_immagine_campione,field_gallery,field_collezione,field_forma,field_finitura,field_colori,field_stucco,' +
    'field_categoria,field_video,' +
    'field_stucco.field_immagine,' +
    'field_colori.field_immagine,' +
    'field_forma.field_immagine,' +
    'field_categoria.field_immagine,' +
    'field_collezione.field_immagine,' +
    'field_collezione.field_documenti,' +
    'field_collezione.field_documenti.field_immagine,' +
    'field_collezione.field_documenti.field_allegato',
  prodotto_arredo:
    'field_immagine,field_gallery,field_categoria,field_finiture,' +
    'field_categoria.field_immagine,' +
    'field_documenti,' +
    'field_documenti.field_immagine,' +
    'field_documenti.field_allegato,' +
    'field_immagine_anteprima,' +
    'field_gallery_intro,' +
    'field_scheda_tecnica,field_tessuti',
  prodotto_vetrite:
    'field_immagine,field_immagine_anteprima,field_gallery,field_collezione,field_colori,field_finiture,field_texture,' +
    'field_collezione.field_immagine,' +
    'field_collezione.field_documenti,' +
    'field_collezione.field_documenti.field_immagine,' +
    'field_collezione.field_documenti.field_allegato',
  prodotto_tessuto:
    'field_immagine_anteprima,field_gallery,field_colori,field_categoria,field_finiture_tessuto,field_tipologia_tessuto,' +
    'field_categoria.field_immagine,' +
    'field_documenti,' +
    'field_documenti.field_immagine,' +
    'field_indicazioni_manutenzione,' +
    'field_indicazioni_manutenzione.field_immagine,' +
    'field_gallery_intro',
  prodotto_pixall:
    'field_immagine,field_gallery,field_colori,field_forma,field_stucco,' +
    'field_immagine_anteprima,' +
    'field_immagine_moduli,' +
    'field_documenti,' +
    'field_documenti.field_immagine,' +
    'field_documenti.field_allegato,' +
    'field_gallery_intro',

  // ── Content with paragraphs only (no direct image) ──
  page: 'field_blocchi,field_blocchi.field_immagine',
  landing_page: 'field_blocchi,field_blocchi.field_immagine',

  // ── Content with field_immagine + paragraphs ──
  articolo: 'field_immagine,field_blocchi,field_blocchi.field_immagine',
  news: 'field_immagine,field_blocchi,field_blocchi.field_immagine',
  tutorial: 'field_immagine,field_blocchi,field_blocchi.field_immagine',
  showroom: 'field_immagine,field_blocchi,field_blocchi.field_immagine',
  ambiente: 'field_immagine,field_blocchi,field_blocchi.field_immagine',
  documento: 'field_immagine,field_blocchi,field_blocchi.field_immagine',
  tag: 'field_immagine,field_blocchi,field_blocchi.field_immagine',
  categoria_blog: 'field_immagine,field_blocchi,field_blocchi.field_immagine',

  // ── Content with field_immagine + gallery + paragraphs ──
  progetto: 'field_immagine',

  // ── Taxonomy terms ──
  mosaico_collezioni: 'field_immagine',
  mosaico_colori: 'field_immagine',
  vetrite_collezioni: 'field_immagine',
  vetrite_colori: 'field_immagine',
};

/**
 * Returns the JSON:API `include` query string for a given Drupal bundle.
 *
 * Use this before calling `fetchJsonApiResource()` to ensure only valid
 * relationship fields are requested, preventing Drupal 400 errors caused
 * by including non-existent fields (e.g. `field_blocchi` on product types).
 *
 * In development, logs a warning for unmapped bundles so missing includes
 * are caught early during development.
 *
 * @param bundle - Drupal bundle machine name (e.g. `'prodotto_mosaico'`, `'page'`)
 * @returns Comma-separated JSON:API include string, or `undefined` if the bundle
 *          has no registered relationship fields (fetch attributes only)
 * @example
 * getIncludeFields('prodotto_mosaico')
 * // → 'field_immagine,field_gallery,field_collezione,...'
 *
 * getIncludeFields('unknown_bundle')
 * // → undefined  (+ dev warning logged)
 */
export function getIncludeFields(bundle: string): string | undefined {
  const include = INCLUDE_MAP[bundle];
  if (include === undefined && process.env.NODE_ENV === 'development') {
    console.warn(
      `[node-resolver] No include fields defined for bundle "${bundle}". ` +
        'Relationships will not be resolved. Add this bundle to INCLUDE_MAP in node-resolver.ts.',
    );
  }
  return include;
}
