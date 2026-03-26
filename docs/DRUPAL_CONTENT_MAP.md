# Drupal Content Map — Entity Types, Taxonomy, and Paragraphs

> **Date:** 2026-03-25
> **Source of truth:** The code is always authoritative. When this document conflicts with the codebase, trust `src/types/drupal/entities.ts`, `src/lib/api/types.ts`, and the actual template files.

---

## Section 1: Content Types Overview

All 18 node bundles handled by the Next.js frontend, grouped by domain.

### Products (6 bundles)

| Bundle | Template | Status | Uses ParagraphResolver | Key Fields |
|---|---|---|---|---|
| `prodotto_mosaico` | `ProdottoMosaico.tsx` | DS complete | No | `field_titolo_main`, `field_testo_main`, `field_composizione`, `field_prezzo_eu` (string), `field_prezzo_usa` (string), `field_prezzo_usa_sheet`, `field_prezzo_usa_sqft`, `field_prezzo_on_demand` (boolean), `field_no_usa_stock` (boolean), `field_campione` (boolean), `field_immagine`, `field_immagine_campione`, `field_video`, `field_collezione` (→ `mosaico_collezioni` term, fully resolved), `field_categoria` (→ `node--categoria`), `field_forma` (array of `{ name }`), `field_finitura` (array of `{ name }`), `field_colori` (array of `{ name }`), `field_stucco` (array of `{ name }`), `field_gallery` |
| `prodotto_vetrite` | `ProdottoVetrite.tsx` | Legacy | No | `field_titolo_main`, `field_testo_main`, `field_prezzo_eu` (`{ value: string }`), `field_prezzo_usa` (`{ value: string }`), `field_prezzo_on_demand` (boolean), `field_no_usa_stock` (boolean), `field_campione` (boolean), `field_immagine`, `field_immagine_anteprima`, `field_collezione` (→ `vetrite_collezioni` term with nested docs), `field_colori` (array of `{ name, field_immagine }`), `field_finiture` (array of `{ name }` — no images), `field_texture` (array of `{ name }` — no images), `field_dimensioni_cm`, `field_dimensioni_inch`, `field_dimensione_pattern_cm`, `field_dimensione_pattern_inch`, `field_formato_campione`, `field_gallery` |
| `prodotto_arredo` | `ProdottoArredo.tsx` | Legacy | Yes | `field_titolo_main`, `field_testo_main`, `field_materiali` (`DrupalTextField`), `field_specifiche_tecniche` (`DrupalTextField`), `field_prezzo_eu` (`{ value: string }`), `field_prezzo_usa` (`{ value: string }`), `field_collegamento_esterno`, `field_path_file_ftp`, `field_path_file_ftp_img_hd`, `field_componibile` (boolean), `field_more_varianti` (boolean), `field_next_art`, `field_no_form_scheda_tecnica` (boolean), `field_immagine`, `field_immagine_anteprima`, `field_categoria` (→ `node--categoria`), `field_finiture` (array of `{ field_etichetta, field_testo, field_immagine }`), `field_gallery`, `field_gallery_intro`, `field_documenti`, `field_scheda_tecnica`, `field_tessuti` (taxonomy refs — may require JSON:API fallback for non-IT locales) |
| `prodotto_tessuto` | `ProdottoTessuto.tsx` | Legacy | No | `field_titolo_main`, `field_testo_main`, `field_composizione`, `field_altezza_cm`, `field_altezza_inch`, `field_peso`, `field_utilizzo` (string), `field_prezzo_eu` (string), `field_prezzo_usa` (string), `field_densita_annodatura`, `field_dimensioni_cm`, `field_dimensioni_inch`, `field_spessore`, `field_immagine_anteprima`, `field_categoria` (→ `node--categoria`), `field_colori` (array of `{ name }`), `field_finiture_tessuto` (single or array of `{ name, field_codice_colore, field_etichetta, field_testo }`), `field_tipologia_tessuto` (single or array of `{ name }`), `field_indicazioni_manutenzione` (array of `{ name }`), `field_gallery`, `field_gallery_intro`, `field_documenti` |
| `prodotto_pixall` | `ProdottoPixall.tsx` | Legacy | No | `field_titolo_main`, `field_testo_main`, `field_composizione` (`DrupalTextField`), `field_manutenzione` (`DrupalTextField`), `field_dimensione_tessera_mm`, `field_dimensione_tessera_inch`, `field_dimensione_foglio_mm`, `field_dimensione_foglio_inch`, `field_dimensione_moduli`, `field_consumo_stucco_m2` (number), `field_consumo_stucco_sqft` (number), `field_retinatura`, `field_utilizzi` (`DrupalTextField`), `field_numero_moduli`, `field_immagine`, `field_immagine_anteprima`, `field_immagine_moduli`, `field_colori` (array of `{ name }`), `field_forma` (array of `{ name }`), `field_stucco` (array of `{ name }`), `field_gallery`, `field_gallery_intro`, `field_documenti` |
| `prodotto_illuminazione` | `ProdottoIlluminazione.tsx` | Legacy | No | Same structure as `prodotto_arredo`: `field_materiali`, `field_specifiche_tecniche`, `field_prezzo_eu` (`{ value: string }`), `field_prezzo_usa` (`{ value: string }`), `field_collegamento_esterno`, `field_path_file_ftp`, `field_path_file_ftp_img_hd`, `field_componibile`, `field_more_varianti`, `field_next_art`, `field_no_form_scheda_tecnica`, `field_immagine`, `field_immagine_anteprima`, `field_categoria` (→ `node--categoria`), `field_finiture`, `field_gallery`, `field_gallery_intro`, `field_documenti`, `field_scheda_tecnica`, `field_tessuti` (with JSON:API fallback) |

**Price field inconsistency across products:**

| Product type | `field_prezzo_eu` shape | `field_prezzo_usa` shape |
|---|---|---|
| `prodotto_mosaico` | `string \| null` | `string \| null` |
| `prodotto_tessuto` | `string \| null` | `string \| null` |
| `prodotto_vetrite` | `{ value?: string } \| null` | `{ value?: string } \| null` |
| `prodotto_arredo` | `{ value?: string } \| null` | `{ value?: string } \| null` |
| `prodotto_illuminazione` | `{ value?: string } \| null` | `{ value?: string } \| null` |

---

### Content (8 bundles)

| Bundle | Template | Status | Uses ParagraphResolver | Notes |
|---|---|---|---|---|
| `page` | `Page.tsx` | Minimal DS | Yes | `title` + `body` + `field_blocchi`. `field_page_id` triggers listing interception in `node-resolver.ts` for hub pages (tessile, progetti, environments, blog, showroom, download_catalogues). |
| `landing_page` | `LandingPage.tsx` | Minimal DS | Yes | `field_blocchi` only — no title, no body field rendered. |
| `articolo` | `Articolo.tsx` | Legacy+Para | Yes | `title` + `field_immagine` + `body` + `field_blocchi`. Also has `field_immagine_anteprima` (for card previews), `field_categoria_blog` (→ `node--categoria_blog`), `field_tags` (→ `node--tag`). |
| `news` | `News.tsx` | Legacy+Para | Yes | Same structure as `articolo`. Has `field_news_correlate` (→ array of `node--news`) not currently rendered. |
| `tutorial` | `Tutorial.tsx` | Legacy+Para | Yes | Same structure as `articolo` with additional `maxWidth` wrapper styling. |
| `progetto` | `Progetto.tsx` | Legacy+Para | Yes | `title` + `field_immagine` + `body` + `field_blocchi` + `field_categoria_progetto` (taxonomy term ref with `name` and `path.alias`). |
| `ambiente` | `Ambiente.tsx` | Legacy+Para | Yes | Same structure as `articolo`. Has `field_categoria_ambiente` (taxonomy ref) not currently used for filtering. |
| `showroom` | `Showroom.tsx` | Legacy | No | **No `field_blocchi`** — Drupal returns 400 if included. Key fields: `field_indirizzo`, `field_citta`, `field_area`, `field_telefono`, `field_indirizzo_email`, `field_collegamento_gmaps`, `field_collegamento_esterno`, `field_gallery`. V8 endpoint normalizes `gmapsUrl` → `mapsUrl`. |

---

### Metadata (4 bundles)

| Bundle | Template | Status | Notes |
|---|---|---|---|
| `categoria` | `Categoria.tsx` | Legacy | 3-branch dispatch based on `getCategoriaProductType()`: (1) product listing via `ProductListingTemplate` when a `filterField` is configured, (2) subcategory grid via V10 when no filter but has NID children, (3) page grid via V11. Secondary fetches: V10 (`fetchSubcategories`), V1 (`fetchProducts`), V11 (`fetchPagesByCategory`). All use `node._nid` (integer NID) as the lookup key. |
| `categoria_blog` | `CategoriaBlog.tsx` | Legacy+Para | `title` + `field_immagine` + `body` + `field_blocchi`. |
| `documento` | `Documento.tsx` | Legacy | **No `field_blocchi`** — Drupal returns 400 if included. Key field: `field_allegato` (file download, shape: `{ entity: { uri: { value: string } } }`). Currently 0 items published on staging (V9 returns empty). |
| `tag` | `Tag.tsx` | Legacy+Para | `title` + `field_immagine` + `body` + `field_blocchi`. |

---

## Section 2: Taxonomy Vocabularies

All 11 vocabularies registered in `TaxonomyTypeName` and consumed via the V3 endpoint.

| Vocabulary | Product Type | API Endpoint | Has Images | Filter Priority | Notes |
|---|---|---|---|---|---|
| `mosaico_collezioni` | Mosaico | V3 | Yes | P0 (path-based) | Terms have `field_immagine`, full collection specs (dimensions, thickness, resistance fields). Used as `field_collezione` on `prodotto_mosaico`. Template: `MosaicoCollezione.tsx`. |
| `mosaico_colori` | Mosaico | V3 | Yes (swatches) | P0 (path-based) | Swatch images. Template: `MosaicoColore.tsx`. |
| `vetrite_collezioni` | Vetrite | V3 | Yes | P0 (path-based) | Full collection specs: dimensions, thicknesses, special glass fields, documents array. Template: `VetriteCollezione.tsx`. |
| `vetrite_colori` | Vetrite | V3 | Yes | P0 (path-based) | Template: `VetriteColore.tsx`. |
| `vetrite_finiture` | Vetrite | V3 | No | P1 (sidebar) | No images. Fallback template: `TaxonomyTerm.tsx` (wireframe). |
| `vetrite_textures` | Vetrite | V3 | No | P1 (sidebar) | No images. Fallback template: `TaxonomyTerm.tsx`. |
| `arredo_finiture` | Arredo | V3 | — | P1 (sidebar) | **Empty vocabulary — 0 terms in Drupal.** V3 returns empty array. |
| `tessuto_colori` | Tessuto | V3 | No | P1 (sidebar) | Fallback template: `TaxonomyTerm.tsx`. |
| `tessuto_finiture` | Tessuto | V3 | — | P1 (sidebar) | **Empty vocabulary — 0 terms in Drupal.** V3 returns empty array. |
| `tessuto_tipologie` | Tessuto | V3 | No | P1 (sidebar) | Fallback template: `TaxonomyTerm.tsx`. |
| `tessuto_manutenzione` | Tessuto | V3 | No | Display only | Not used as a filter. Displayed on product detail pages. Fallback template: `TaxonomyTerm.tsx`. |

**V3 response item shape for all vocabularies:**

```typescript
interface TaxonomyTermItem {
  id: string;
  name: string;
  imageUrl: string;  // "" when no image (normalize with emptyToNull())
  weight: string;    // Drupal returns weight as string, not number
}
```

Note: The V3 response has **no `path` field**. Slugs are derived client-side via `deriveSlug(name)` (slugify with NFC normalization). Explicit overrides are in `SLUG_OVERRIDES` within `src/domain/filters/registry.ts`.

---

## Section 3: Taxonomy Templates

| Taxonomy Type | Template | Status | Secondary Fetches |
|---|---|---|---|
| `taxonomy_term--mosaico_collezioni` | `MosaicoCollezione.tsx` | Legacy listing | V3 (all filter options for sidebar) + V1 (products filtered by this collection) |
| `taxonomy_term--mosaico_colori` | `MosaicoColore.tsx` | Legacy listing | V3 + V1 |
| `taxonomy_term--vetrite_collezioni` | `VetriteCollezione.tsx` | Hybrid | V3 + V1 + documents extracted from the term's own `field_documenti` array (resolved inline from C1) |
| `taxonomy_term--vetrite_colori` | `VetriteColore.tsx` | Legacy listing | V3 + V1 |
| `taxonomy_term--vetrite_finiture` | `TaxonomyTerm.tsx` | Wireframe | None |
| `taxonomy_term--vetrite_textures` | `TaxonomyTerm.tsx` | Wireframe | None |
| `taxonomy_term--arredo_finiture` | `TaxonomyTerm.tsx` | Wireframe | None |
| `taxonomy_term--tessuto_colori` | `TaxonomyTerm.tsx` | Wireframe | None |
| `taxonomy_term--tessuto_finiture` | `TaxonomyTerm.tsx` | Wireframe | None |
| `taxonomy_term--tessuto_tipologie` | `TaxonomyTerm.tsx` | Wireframe | None |
| `taxonomy_term--tessuto_manutenzione` | `TaxonomyTerm.tsx` | Wireframe | None |

`TaxonomyTerm.tsx` renders only `name` + `description`. It is a fallback wireframe with no product listing logic.

---

## Section 4: Paragraph Types (15 total)

All paragraphs are dispatched through `ParagraphResolver` located at `src/components_legacy/blocks_legacy/ParagraphResolver.tsx`. The resolver is an async server component.

**Resolver dispatch order:**
1. Attempts Gen adapter functions by `paragraph.type` string match.
2. Falls back to `LEGACY_MAP[type]` for unmigrated types.
3. In development, renders a yellow dashed warning box for unknown types. In production, returns `null`.

---

### Migrated to Gen Blocks (12 paragraph types)

| Drupal Type | Gen Block | Adapter Function | Required Fields (adapter returns null if missing) | Key Optional Fields | Notes |
|---|---|---|---|---|---|
| `paragraph--blocco_intro` | `GenIntro` | `adaptGenIntro` | `field_titolo_formattato` (title), `field_testo` (bodyHtml), `field_immagine` (imageSrc) | `field_sopratitolo_approfondiment` (overline/subtitle), `field_collegamento_esterno`, `field_collegamento_interno`, `field_label_collegamento` | Hero intro with overline above title. `pageTitle` prop passed from caller overrides `field_sopratitolo_approfondiment`. |
| `paragraph--blocco_quote` | `GenQuote` | `adaptGenQuote` | `field_testo` (text) | `field_collegamento_esterno`, `field_collegamento_interno`, `field_label_collegamento` | Left-border blockquote. |
| `paragraph--blocco_video` | `GenVideo` | `adaptGenVideo` | `field_codice_video` (Vimeo ID) | `field_immagine` (poster) | Vimeo player with poster image overlay. Native controls disabled. |
| `paragraph--blocco_testo_immagine` | `GenTestoImmagine` | `adaptGenTestoImmagine` | `field_testo` (bodyHtml), `field_immagine` (imageSrc) | `field_titolo_formattato` (title), `field_layout_blocco_testo_img` (`text_dx` \| `text_sx` \| `text_up`), `field_collegamento_esterno`, `field_collegamento_interno`, `field_label_collegamento` | Default layout: `text_dx`. |
| `paragraph--blocco_testo_immagine_big` | `GenTestoImmagineBig` | `adaptGenTestoImmagineBig` | `field_immagine` (imageSrc) | `field_titolo_formattato` (title), `field_testo` (bodyHtml), `field_collegamento_esterno`, `field_collegamento_interno`, `field_label_collegamento` | 2-column layout: text left + full-bleed image right. |
| `paragraph--blocco_testo_immagine_blog` | `GenTestoImmagineBlog` | `adaptGenTestoImmagineBlog` | `field_testo` (bodyHtml) | `field_titolo_formattato` (title), `field_immagine` | Prose-width layout for editorial content. Optional image. |
| `paragraph--blocco_gallery` | `GenGallery` | `adaptGenGallery` | At least 1 valid slide in `field_slide` | `field_titolo_formattato` (title) | Each slide uses `field_immagine`. Captions derived from image `alt` or filename. Requires secondary fetch if nested slides not pre-resolved. |
| `paragraph--blocco_gallery_intro` | `GenGalleryIntro` | `adaptGenGalleryIntro` | `field_titolo_formattato` (title), `field_testo` (bodyHtml), at least 1 valid slide in `field_slide` | `field_sopratitolo_approfondiment` (overline — currently hardcoded fallback as field is never populated in Drupal) | Carousel with header panel. |
| `paragraph--blocco_documenti` | `GenDocumenti` | `adaptGenDocumenti` | At least 1 document node in `field_documenti` with a `title` | `field_titolo_formattato` (section title) | Each document: `title`, `field_tipologia_documento`, `field_immagine`, `field_collegamento_esterno`. |
| `paragraph--blocco_a` | `GenA` | `adaptGenA` | At least one of: `field_immagine`, `field_video`, `field_immagine_small`, `field_video_small` | `field_ratio` (`3_2` \| `2_3` \| `1_1`), `field_caption`, `field_ratio_small`, `field_caption_small`, `field_layout_blocco_a` (`img_big_sx` \| `img_big_dx`) | Big (3/5) + small (2/5) dual media layout. Default layout: `img_big_sx`. |
| `paragraph--blocco_b` | `GenB` | `adaptGenB` | At least 1 item in `field_3_immagini` | `field_3_video` (parallel array of Vimeo codes) | 3-column equal grid of images or videos. |
| `paragraph--blocco_c` | `GenC` | `adaptGenC` | At least one of: `field_immagine`, `field_video`, `field_testo` | `field_titolo_formattato` (title), `field_caption`, `field_collegamento_esterno`, `field_collegamento_interno`, `field_label_collegamento`, `field_layout_blocco_c` (`text_sx` \| `text_dx`) | 70/30 text + media layout. Default layout: `text_sx`. |

---

### Remaining in Legacy Map (6 paragraph types)

| Drupal Type | Legacy Component | Status | Notes |
|---|---|---|---|
| `paragraph--blocco_slider_home` | `BloccoSliderHome` | Legacy | Full-height hero slider with autoplay. Contains nested `field_elementi` array — each element has `field_immagine`, `field_testo`, `field_collegamento`. Requires secondary `fetchParagraph()` call to hydrate nested slides. |
| `paragraph--blocco_correlati` | `BloccoCorrelati` | Legacy | 3-column related items grid. Contains nested `field_elementi` array — each element has `field_immagine`, `field_titolo`, `field_collegamento`. |
| `paragraph--blocco_newsletter` | `BloccoNewsletter` | Legacy | Non-functional form placeholder. |
| `paragraph--blocco_form_blog` | `BloccoFormBlog` | Legacy | Non-functional form placeholder. |
| `paragraph--blocco_anni` | `BloccoAnni` | Legacy | Timeline with year range. Nested `field_anni` array — each element has `field_anno` (year) and `field_testo`. Uses inline styles. |
| `paragraph--blocco_tutorial` | `BloccoTutorial` | Legacy | Simple title + body display. |

**Paragraphs requiring secondary fetch** (handled by `needsSecondaryFetch()` in `ParagraphResolver`): `blocco_slider_home`, `blocco_gallery`, `blocco_gallery_intro`, `blocco_correlati`. These use `fetchParagraph()` to hydrate nested child entities.

---

## Section 5: Common Drupal Field Shapes

These shapes recur across multiple content types. All come from the C1 entity endpoint (`fetchEntity`), which returns fully pre-resolved entities with all relationships inline.

### Text field

```typescript
// Formatted text (rich text / HTML)
interface DrupalTextField {
  value?: string;     // raw value
  processed?: string; // HTML-processed (use this for rendering)
}

// Usage:
// Plain string fields: use getTextValue(field) from src/lib/field-helpers.ts
// Formatted fields:    use getProcessedText(field) — returns processed HTML or plain string
```

Both `getTextValue()` and `getProcessedText()` are utility functions in `src/lib/field-helpers.ts` that handle the polymorphic nature of Drupal text fields (sometimes a plain string, sometimes a `DrupalTextField` object).

### Image field (C1 entity response)

```typescript
// Shape inside C1 entity data:
{
  type: "file--file",
  uri: { url: "https://www.sicis-stage.com/sites/default/files/..." },
  meta: {
    alt: "Alt text",
    width: 1920,
    height: 1080
  }
}

// Usage: getDrupalImageUrl(field) from src/lib/drupal/image.ts
// Extracts uri.url, returns null if missing
```

### Link field

```typescript
// Polymorphic — check with typeof before accessing properties:
type DrupalLinkField = string | { uri?: string; title?: string };

// In adapters:
const href = getTextValue(p.field_collegamento_esterno)  // handles string case
  ?? (p.field_collegamento_interno as Record<string, unknown>)?.path as string
  ?? null;
```

### Price field

```typescript
// Inconsistent across product types — do NOT assume shape:
// prodotto_mosaico, prodotto_tessuto:
field_prezzo_eu: string | null

// prodotto_vetrite, prodotto_arredo, prodotto_illuminazione:
field_prezzo_eu: { value?: string } | null
```

### Path field

```typescript
// On entity references:
{ alias: string; pid?: number; langcode?: string }

// On DrupalEntity base:
interface DrupalPath {
  alias?: string;
  pid?: number;
  langcode?: string;
}
```

### Entity reference (resolved inline in C1)

```typescript
// C1 returns fully resolved relationships — no secondary fetch needed.
// Example: field_collezione on prodotto_mosaico contains the full term object:
field_collezione: TermMosaicoCollezione | null
// (not a stub { target_id: 42 })
```

### Paragraph reference

```typescript
// field_blocchi is an array of fully resolved paragraph objects:
field_blocchi: Array<Record<string, unknown>>
// Each object has a `type` property: "paragraph--blocco_intro", etc.
// ParagraphResolver dispatches on paragraph.type
```

### Taxonomy term reference (product fields)

```typescript
// Simple taxonomy terms on product fields (colors, shapes, etc.):
field_colori: Array<{ name?: string }>
field_forma: Array<{ name?: string }>

// Terms with images (collection-level):
field_colori: Array<{ name?: string; field_immagine?: unknown }>  // vetrite only

// Complex term objects (prodotto_arredo finiture):
field_finiture: Array<{
  id?: string;
  name?: string;
  field_etichetta?: unknown;
  field_testo?: unknown;
  field_immagine?: unknown;
}>

// Note: field_tessuti on arredo/illuminazione may return stubs in non-IT locales,
// requiring a JSON:API fallback fetch.
```

### Date field (V5 blog endpoint)

```typescript
// V5 returns Unix timestamp as string:
created: "1772451555"

// Normalized to ISO 8601 via unixToIso() before rendering.
```

### Boolean fields

```typescript
// Drupal REST returns actual boolean values for these:
field_prezzo_on_demand: boolean
field_no_usa_stock: boolean
field_campione: boolean
field_componibile: boolean
field_more_varianti: boolean
field_no_form_scheda_tecnica: boolean

// Exception — V1 product listing endpoint returns priceOnDemand as string:
priceOnDemand: "0" | "1" | null  // NOT boolean
```

---

## Section 6: Data Normalization Rules

All normalization functions live in `src/lib/api/client.ts` or `src/lib/drupal/image.ts`.

| Raw Drupal Value | Normalized Value | Function | Where Applied |
|---|---|---|---|
| `"https://www.sicis-stage.com/it/mosaico/pluma"` | `"/it/mosaico/pluma"` | `stripDomain()` | All Views responses (V1–V11) `path` fields |
| `"/it/mosaico/pluma"` | `"/mosaico/pluma"` | `stripLocalePrefix()` | Path fields used by legacy components that prepend locale themselves |
| `""` (empty string image URL) | `null` | `emptyToNull()` | All image URL fields from Views endpoints |
| Relative image path `/sites/default/...` | `"https://drupal.example.com/sites/default/..."` | `toAbsoluteUrl()` | Product image URLs in Views responses |
| `"1772451555"` (Unix timestamp string) | `"2026-03-25T..."` (ISO 8601) | `unixToIso()` | V5 blog `created` field |
| `"0"` / `"1"` / `null` (string) | Compared as string or cast inline | inline cast | V1 `priceOnDemand` field |
| `{ uri: { url: "https://..." } }` (C1 image) | `"https://..."` (absolute URL string) | `getDrupalImageUrl()` | All C1 entity image fields in templates and adapters |
| `field_collegamento_gmaps` | `mapsUrl` | field rename in V8 fetcher | Showroom cards |
| `weight: "3"` (string) | Not cast — kept as string | none | V3 taxonomy term weight |

### `apiGet()` URL construction

The base fetcher inserts `/api/v1/` after the locale prefix automatically:

```
Input path:  "/it/entity"
Output URL:  "https://drupal.example.com/it/api/v1/entity"

Input path:  "/en/products/prodotto_mosaico"
Output URL:  "https://drupal.example.com/en/api/v1/products/prodotto_mosaico"
```

Exception: The M1 menu endpoint uses a different URL pattern (`/api/menu/` without `v1`) and calls `fetch()` directly — it does not go through `apiGet()`.

### Slug derivation for taxonomy terms

V3 taxonomy terms have no `path` or `slug` field. Slug is derived client-side:

1. Check `SLUG_OVERRIDES` in `src/domain/filters/registry.ts` for explicit mappings (handles accented characters, slashes, capitalisation exceptions).
2. If no override, run `deriveSlug(name)` — slugify with Unicode NFC normalization.

---

## Section 7: REST Endpoint Quick Reference

| ID | Path Pattern | Function | Response Type | Revalidate |
|---|---|---|---|---|
| C1 | `/{locale}/api/v1/entity?path={path}` | `fetchEntity()` | `EntityResponse` | 60 s |
| C2 | `/{locale}/api/v1/translate-path?path={path}&from={locale}&to={targetLocale}` | `getTranslatedPath()` | `TranslatePathResponse` | 3600 s |
| V1 | `/{locale}/api/v1/products/{productType}` | `fetchProducts()` | `PaginatedResponse<ProductCard>` | 60 s |
| V2 | `/{locale}/api/v1/products/{productType}/counts/{filterKey}` | `fetchFilterCounts()` | `CountsResponse` | 60 s |
| V3 | `/{locale}/api/v1/taxonomy/{vocabulary}` | `fetchFilterOptions()` | `TaxonomyTermItem[]` | 3600 s |
| V4 | `/{locale}/api/v1/category-options/{productType}` | `fetchCategoryOptions()` | `{ items: CategoryOptionItem[] }` (no pagination) | 3600 s |
| V5 | `/{locale}/api/v1/blog` | `fetchBlogPosts()` | `PaginatedResponse<BlogCard>` | 300 s |
| V6 | `/{locale}/api/v1/projects` | `fetchProjects()` | `PaginatedResponse<ProjectCard>` | 300 s |
| V7 | `/{locale}/api/v1/environments` | `fetchEnvironments()` | `PaginatedResponse<EnvironmentCard>` | 300 s |
| V8 | `/{locale}/api/v1/showrooms` | `fetchShowrooms()` | `ShowroomCard[]` (no pagination) | 300 s |
| V9 | `/{locale}/api/v1/documents` | `fetchDocuments()` | `PaginatedResponse<DocumentCard>` | 300 s |
| V10 | `/{locale}/api/v1/subcategories/{parentNid}` | `fetchSubcategories()` | `CategoryCard[]` | 300 s |
| V11 | `/{locale}/api/v1/pages-by-category/{parentNid}` | `fetchPagesByCategory()` | `PaginatedResponse<PageCard>` | 300 s |
| M1 | `/{locale}/api/menu/{menuName}` | `fetchMenu()` | Menu tree | 600 s |

**V10 and V11 require integer NID** (`node._nid` from C1 response), not UUID.

**V1 filter limitations:**
- `category` (title-based) does not support multi-value — single value only per request.
- `category_id` (NID-based) is silently ignored by the endpoint — do not use.

---

## Section 8: TypeScript Type Index

All entity interfaces are in `src/types/drupal/entities.ts`.

| Interface | Covers |
|---|---|
| `NodeTypeName` | Union of all 18 node bundle strings (e.g. `"node--page"`, `"node--prodotto_mosaico"`) |
| `TaxonomyTypeName` | Union of all 11 taxonomy bundle strings |
| `EntityTypeName` | `NodeTypeName \| TaxonomyTypeName \| (string & Record<never, never>)` — open union for unknown types |
| `DrupalTextField` | `{ value?: string; processed?: string }` |
| `DrupalPath` | `{ alias?: string; pid?: number; langcode?: string }` |
| `DrupalLinkField` | `{ uri?: string; title?: string }` |
| `DrupalEntity` | Base interface extended by all entity types. Has `id`, `type`, `langcode`, `status`, `title`, `path`. |
| `ProdottoMosaico` | Full `node--prodotto_mosaico` shape |
| `ProdottoVetrite` | Full `node--prodotto_vetrite` shape |
| `ProdottoArredo` | Full `node--prodotto_arredo` shape |
| `ProdottoTessuto` | Full `node--prodotto_tessuto` shape |
| `ProdottoPixall` | Full `node--prodotto_pixall` shape |
| `ProdottoIlluminazione` | Full `node--prodotto_illuminazione` shape |
| `TermMosaicoCollezione` | Full `taxonomy_term--mosaico_collezioni` shape including all technical specs |
| `TermVetriteCollezione` | Full `taxonomy_term--vetrite_collezioni` shape |
| `NodeCategoria` | `node--categoria` shape with self-referential `field_categoria` |
| `DocumentItem` | Shape for document nodes referenced in `field_documenti` arrays |

No Zod runtime validation. All interfaces use `extends Record<string, unknown>` for safe optional chaining in templates.

---

## Section 9: Migration Status Summary

| Category | DS Complete | Minimal DS | Hybrid | Legacy | Legacy+Para |
|---|---|---|---|---|---|
| **Product templates** | ProdottoMosaico, ProductListingTemplate | — | — | ProdottoVetrite, ProdottoArredo, ProdottoTessuto, ProdottoPixall, ProdottoIlluminazione | — |
| **Content templates** | — | Page, LandingPage | — | Showroom, Documento | Articolo, News, Tutorial, Progetto, Ambiente |
| **Metadata templates** | — | — | — | Categoria, Documento | CategoriaBlog, Tag |
| **Taxonomy templates** | — | — | VetriteCollezione | MosaicoCollezione, MosaicoColore, VetriteColore | — |
| **Paragraph blocks** | GenIntro, GenQuote, GenVideo, GenTestoImmagine, GenTestoImmagineBig, GenTestoImmagineBlog, GenGallery, GenGalleryIntro, GenDocumenti, GenA, GenB, GenC | — | — | BloccoSliderHome, BloccoCorrelati, BloccoNewsletter, BloccoFormBlog, BloccoAnni, BloccoTutorial | — |

**Gen blocks remaining to build:** `GenCorrelati`, `GenNewsletter`, `GenFormBlog`, `GenSliderHome`, `GenAnni`, `GenTutorial`

Check `LEGACY_MAP` in `src/components_legacy/blocks_legacy/ParagraphResolver.tsx` for the authoritative current state of paragraph migration.
