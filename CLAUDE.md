# CLAUDE.md — Sicis Next.js Frontend

> **Source of truth:** The code is always the source of truth. This document may be outdated — when in doubt, read the code. For Drupal data (fields, entities, menus, paragraphs), the only real source is what Drupal returns via REST endpoints — never assume field presence or structure from this doc alone, always verify against the actual API response.

## Project Overview
Decoupled Next.js 16 frontend for Sicis (luxury mosaic brand) backed by headless Drupal 10.
6 languages: IT (default), EN, FR, DE, ES, RU.

## Commands
- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build
- `npm run storybook` — Storybook dev (localhost:6006)
- `npx tsc --noEmit` — TypeScript check
- `npx vitest run` — Run tests

## Tech Stack

Next 16.1.7 | React 19.2.4 | Tailwind 4.2.2 | Storybook 10.3.1 | next-intl | nuqs | embla-carousel

## Architecture

### Data Layer

All Drupal data comes exclusively from the REST endpoints below. No other data source is used.
One exception: `ProdottoArredo` and `ProdottoIlluminazione` templates use a JSON:API fallback to fetch English tessuti taxonomy terms when current locale data is missing — this is the only JSON:API usage in the project.

**REST API client (`src/lib/api/`):**
- `client.ts` — `apiGet` (base fetcher), `stripDomain`, `stripLocalePrefix`, `emptyToNull` (normalizers)
- `types.ts` — Response interfaces for all endpoints (source of truth for REST response shapes)
- `entity.ts` — `fetchEntity` (C1)
- `products.ts` — `fetchProducts` (V1), `fetchFilterCounts` (V2), `getCategoriaProductType`
- `filters.ts` — `fetchFilterOptions` (V3), `fetchCategoryOptions` (V4), `fetchAllFilterOptions`
- `listings.ts` — `fetchBlogPosts` (V5), `fetchProjects` (V6), `fetchEnvironments` (V7), `fetchShowrooms` (V8), `fetchDocuments` (V9)
- `categories.ts` — `fetchSubcategories` (V10), `fetchPagesByCategory` (V11)
- `translate-path.ts` — `getTranslatedPath` (C2)
- `image-fallback.ts` — `enrichWithFallbackImages` (extracts images from C1 entity for items missing imageUrl)
- `resolve-path.ts` — `resolvePath` (R1) — resolves URL alias → `{ nid, bundle, locale, aliases }`. Foundation for all new REST routing.
- `mosaic-product.ts` — `fetchMosaicProduct` (P1) — single mosaic product by NID, normalized with collection + grouts + documents
- `vetrite-product.ts` — `fetchVetriteProduct` (P2) — single vetrite product by NID, normalized with collection + documents
- `textile-product.ts` — `fetchTextileProduct` (P3) — single textile product by NID, normalized with finiture + maintenance + documents

**Drupal utilities (`src/lib/drupal/`):**
- `config.ts` — DRUPAL_BASE_URL (single source of truth)
- `menu.ts` — `fetchMenu` (M1), `transformMenuToNavItems` — uses `fetch()` directly (NOT `apiGet`), different URL pattern (`/api/menu/` without `v1`)
- `image.ts` — `getDrupalImageUrl` (extracts `uri.url` from C1 image shape)
- `index.ts` — barrel re-export

#### Drupal REST Endpoint Reference

All data from Drupal flows through these endpoints. This is the **sole source of truth** for Drupal data.

**Conventions:**
- Custom endpoints go through `apiGet()` which inserts `/api/v1/` after locale: `/{locale}/api/v1/{endpoint}`
- Paginated responses (V1, V5–V11) wrap items: `{ items: T[], total: number, page: number, pageSize: number }`
- Pagination param: `items_per_page` (Drupal Views native) + `page` (0-based)
- Paths in Views responses contain the full Drupal domain URL — normalize with `stripDomain()` + `stripLocalePrefix()`
- Image URLs: empty string `""` when no image (not `null`) — normalize with `emptyToNull()`

**R1 — Resolve Path (URL alias → entity metadata + multilingual aliases)**
- URL: `/{locale}/api/v1/resolve-path?path={pathWithoutLocale}`
- Function: `resolvePath(path, locale)` in `resolve-path.ts`
- Response: `{ nid, type, bundle, locale, aliases: { it: "/mosaico/...", en: "/mosaic/...", ... } }`
- Foundation for all new REST routing — replaces C1's path resolution role
- Also used as fallback for language switching when C2 is unavailable
- Revalidate: 3600s

**P1 — Mosaic Product (single product by NID)**
- URL: `/{locale}/api/v1/mosaic-product/{nid}`
- Function: `fetchMosaicProduct(nid, locale)` in `mosaic-product.ts`
- Response: array with single item, unwrapped by fetcher. Includes collection with specs, documents, grouts.
- Rendered via `MosaicProductPreview` (DS Spec* blocks)
- Revalidate: 60s

**P2 — Vetrite Product (single product by NID)**
- URL: `/{locale}/api/v1/vetrite-product/{nid}`
- Function: `fetchVetriteProduct(nid, locale)` in `vetrite-product.ts`
- Response: array with single item. Includes collection with dimensions, thickness, treatments, documents.
- Rendered via legacy `ProdottoVetrite` template with `vetriteToLegacyNode` adapter
- Revalidate: 60s

**P3 — Textile Product (single product by NID)**
- URL: `/{locale}/api/v1/textile-product/{nid}`
- Function: `fetchTextileProduct(nid, locale)` in `textile-product.ts`
- Response: array with single item. Includes category, finiture, maintenance instructions (with icons), typology, documents.
- Rendered via legacy `ProdottoTessuto` template with `textileToLegacyNode` adapter
- Revalidate: 60s

**C1 — Entity (single entity by path) — LEGACY, disabled locally**
- URL: `/{locale}/api/v1/entity?path={pathWithoutLocale}`
- Function: `fetchEntity(path, locale)` in `entity.ts`
- Response: `{ meta: { type, bundle, id (NID), uuid, locale, path }, data: { ...allFields } }`
- Returns the fully pre-resolved entity with all relationships and paragraphs inline. No secondary fetches needed.
- Image shape inside `data`: `{ type: "file--file", uri: { url: "https://..." }, meta: { alt, width, height } }`
- Revalidate: 60s

**C2 — Translate Path (cross-locale path resolution)**
- URL: `/{locale}/api/v1/translate-path?path={path}&from={locale}&to={targetLocale}`
- Function: `getTranslatedPath(path, fromLocale, toLocale)` in `translate-path.ts`
- Response: `{ translatedPath: "/en/mosaic" | null }`
- Revalidate: 3600s

**V1 — Products (paginated product listing)**
- URL: `/{locale}/api/v1/products/{productType}?items_per_page=N&page=N&sort=...&{filterParams}`
- Function: `fetchProducts(options)` in `products.ts`
- productType: `prodotto_mosaico` | `prodotto_vetrite` | `prodotto_arredo` | `prodotto_tessuto` | `prodotto_pixall` | `prodotto_illuminazione`
- Filter query params (mapped from Drupal fields via `DRUPAL_FIELD_TO_REST_PARAM`): `collection`, `color`, `shape`, `finish`, `grout`, `texture`, `fabric`, `category`, `type`
- `category_id` (NID-based filtering) is NOT supported — the V1 endpoint silently ignores it. Use `category` (title-based) instead.
- `category` does NOT support multi-value (comma-separated or array) — only single value per request
- Response item: `{ id, type, title, subtitle, imageUrl, imageUrlMain, price, priceOnDemand ("0"|"1"|null), path }`
- `imageUrlMain` is the full-size image (field_immagine), `imageUrl` is the preview (field_immagine_anteprima)
- `type` comes without `node--` prefix (e.g. `"prodotto_arredo"`)
- `path` contains full Drupal domain URL
- Revalidate: 60s

**V2 — Filter Counts (aggregated counts per filter value)**
- URL: `/{locale}/api/v1/products/{productType}/counts/{filterKey}?{activeFilterParams}`
- Function: `fetchFilterCounts(productType, activeFilters, filterKey, drupalField, locale)` in `products.ts`
- filterKey: `collection` | `color` | `shape` | `finish` | `grout` | `texture` | `fabric` | `category` | `type`
- Response: `{ counts: { "Pluma": 42, "Blends": 88, ... } }`
- Active filters (excluding the one being counted) are passed as query params to get cross-filtered counts
- Revalidate: 60s

**V3 — Taxonomy Terms (vocabulary listing)**
- URL: `/{locale}/api/v1/taxonomy/{vocabulary}`
- Function: `fetchFilterOptions(taxonomyType, locale)` in `filters.ts`
- vocabulary: extracted from `taxonomyType` by splitting on `--` (e.g. `taxonomy_term--mosaico_collezioni` → `mosaico_collezioni`)
- All vocabularies: `mosaico_collezioni`, `mosaico_colori`, `vetrite_collezioni`, `vetrite_colori`, `vetrite_finiture`, `vetrite_textures`, `arredo_finiture`, `tessuto_colori`, `tessuto_finiture`, `tessuto_tipologie`, `tessuto_manutenzione`
- Response item: `{ id, name, weight (string), imageUrl (string, "" if empty) }` — **no `path` field**
- Slug is derived from `name` via `deriveSlug()` (slugify fallback)
- Empty vocabularies (0 terms in Drupal): `arredo_finiture`, `tessuto_finiture`
- Revalidate: 3600s

**V4 — Category Options (node--categoria listing for a product type)**
- URL: `/{locale}/api/v1/category-options/{productType}`
- Function: `fetchCategoryOptions(productType, locale)` in `filters.ts`
- Used for product types that organize by `node--categoria` instead of taxonomy: `prodotto_arredo`, `prodotto_illuminazione`, `prodotto_tessuto`
- Response: `{ items: [...] }` — **no `total`, `page`, `pageSize`** (not paginated)
- Response item: `{ id, name, imageUrl, path, parentId, parentPath }`
- `parentId`/`parentPath` present when the categoria has a parent (hub) categoria
- Revalidate: 3600s

**V5 — Blog Posts**
- URL: `/{locale}/api/v1/blog?items_per_page=N&page=N`
- Function: `fetchBlogPosts(locale, limit, offset)` in `listings.ts`
- Response item: `{ id, type ("articolo"|"news"|"tutorial"), title, imageUrl, path, created (Unix timestamp string) }`
- `created` is a Unix timestamp (e.g. `"1772451555"`) — converted to ISO 8601 by `unixToIso()`
- Revalidate: 300s

**V6 — Projects**
- URL: `/{locale}/api/v1/projects?items_per_page=N&page=N`
- Function: `fetchProjects(locale, limit, offset)` in `listings.ts`
- Response item: `{ id, title, imageUrl, path, category }`
- Revalidate: 300s

**V7 — Environments**
- URL: `/{locale}/api/v1/environments?items_per_page=N&page=N`
- Function: `fetchEnvironments(locale, limit, offset)` in `listings.ts`
- Response item: `{ id, title, imageUrl, path }`
- Revalidate: 300s

**V8 — Showrooms**
- URL: `/{locale}/api/v1/showrooms`
- Function: `fetchShowrooms(locale)` in `listings.ts`
- Response item: `{ id, title, imageUrl, path, address, city, area, phone, email, gmapsUrl, externalUrl }`
- No pagination params used (returns all)
- Revalidate: 300s

**V9 — Documents**
- URL: `/{locale}/api/v1/documents?items_per_page=N&page=N`
- Function: `fetchDocuments(locale, limit, offset)` in `listings.ts`
- Response item: `{ id, title, imageUrl, path, fileUrl, externalUrl, documentType, category }`
- Currently returns 0 items on staging (no `node--documento` content published)
- Revalidate: 300s

**V10 — Subcategories (child node--categoria entities)**
- URL: `/{locale}/api/v1/subcategories/{parentNid}`
- Function: `fetchSubcategories(parentId, locale)` in `categories.ts`
- **parentNid must be the integer NID**, not UUID. Callers pass `node._nid` from C1 response.
- Response item: `{ id, uuid (always null), title, imageUrl, path }`
- `path` contains full Drupal domain URL
- Revalidate: 300s

**V11 — Pages by Category (node--page filtered by field_categoria)**
- URL: `/{locale}/api/v1/pages-by-category/{parentNid}?items_per_page=N&page=N`
- Function: `fetchPagesByCategory(parentId, locale, limit, offset)` in `categories.ts`
- **parentNid must be the integer NID**, not UUID. Callers pass `node._nid` from C1 response.
- Response item: `{ id, title, imageUrl (often ""), path }`
- `path` contains full Drupal domain URL
- Revalidate: 300s

**M1 — Menu (native Drupal menu API — NOT through `apiGet()`)**
- URL: `/{locale}/api/menu/{menuName}`
- Function: `fetchMenu(menuName, locale)` in `drupal/menu.ts`
- Uses `fetch()` directly (different URL pattern: `/api/menu/` without `v1`)
- Response: `{ id, items: [{ id, title, url, weight, children: [...recursive] }] }`
- `url` may contain Drupal base path or `<nolink>` — normalized by `transformMenuToNavItems()`
- Revalidate: 600s

### Domain Layer
- `src/domain/filters/` — `registry.ts` (FILTER_REGISTRY, SLUG_OVERRIDES), `search-params.ts` (nuqs integration)
- `src/domain/routing/` — `routing-registry.ts` (shadow mode), `section-config.ts`

### Routing

Entry point: `src/app/[locale]/[...slug]/page.tsx`

**Stage 1 — LISTING_SLUG_OVERRIDES**
Set of hardcoded product slugs (mosaico, mosaic, arredo, furniture-and-accessories, pixall, illuminazione, vetrite variants, tessile variants, etc.) that bypass `translatePath`. These slugs have Drupal nodes (categoria_blog, documento, page) with the same alias that would be rendered instead of the correct product listing. `getSectionConfigAsync` resolves the `productType` → `renderProductListing()`.

**Stage 1.5 — Product detail via resolve-path (NEW)**
URLs with 2+ segments. `resolvePath()` is called BEFORE the listing interception. If the path resolves to a product bundle (`prodotto_mosaico`, `prodotto_vetrite`, `prodotto_tessuto`), the type-specific fetcher is called and the product page rendered. Mosaico uses DS Spec* blocks; vetrite and tessuto use legacy templates with adapter functions (`vetriteToLegacyNode`, `textileToLegacyNode`).

**Stage 2 — Multi-slug interception**
URLs with 2+ segments (e.g. `/mosaico/murano-smalto`). `getSectionConfigAsync` runs first; if a config is found and `parseFiltersFromUrl` detects at least one active filter → `renderProductListing()` with filter active.

**Stage 3 — Drupal entity resolution**
`fetchEntity` (C1 endpoint) resolves path to a fully pre-resolved entity in one call. All relationships and paragraphs are inline — no secondary fetches needed. Rendered via `COMPONENT_MAP[getComponentName(entityType)]`.

**Interception: node--categoria**
If `translatePath` resolves to `node--categoria` AND `getSectionConfigAsync` returns a config with `filterField` set → the node is a subcategory listing, not a hub category. Renders via `renderProductListing()` using the Drupal node title for the heading.

**Interception: node--page with field_page_id**
Drupal uses `node--page` nodes as hub pages for listing sections. `field_page_id` maps to a content type:
- `tessile` → `prodotto_tessuto` → `renderProductListing()`
- `progetti`, `environments`, `blog`, `showroom`, `download_catalogues` → fetcher + legacy listing component

#### Revalidation Strategy

| Entity Type | TTL | Source |
|---|---|---|
| Products (all 6 types) | 60 s | `node-resolver.ts` |
| Editorial (articolo, news, tutorial) | 300 s | `node-resolver.ts` |
| Static pages (page, landing_page) | 600 s | `node-resolver.ts` |
| Taxonomy terms | 3600 s | `node-resolver.ts` |
| Menus | 600 s | `menu.ts` |
| Entity (C1 fetchEntity) | 60 s | `entity.ts` |

#### Server Actions

- `src/lib/actions/load-more-products.ts` — `loadMoreProducts` (product pagination via "Load More" button)
- `src/lib/get-translated-path.ts` — `getTranslatedPath` (`'use server'` wrapper for cross-locale path resolution in client components)

### Dev Preview Routes
- `src/app/dev/layout.tsx` — Dev-only layout with fonts + tokens + theme, no Header/Footer/i18n. Guarded by `NODE_ENV !== 'development'`.
- Convention: draft pages go in `src/app/dev/preview/[name]/page.tsx` (e.g. `gen-intro/page.tsx`). Each page has its own `NODE_ENV` guard.
- Used by /ds workflow Get-a-Draft. Delete the preview page after extracting the component.
- URL: `localhost:3000/dev/preview/[name]`

## Components — Design System (`/ds` skill)

### Composed (`src/components/composed/`)

Scan with: `node /Users/nicolagasco/.claude/skills/ds/scripts/inventory.js composed`

**Non-obvious components:**

- **VimeoPlayer** — Client component wrapping `@vimeo/player` SDK. Poster image overlay; on play, Vimeo iframe with custom controls. Native controls disabled (`controls=0`).
- **GalleryCarousel** — Horizontal scroll carousel with snap alignment, prev/next arrows, optional `header` slot. Used by `GenGallery` and `GenGalleryIntro`.
- **DocumentCard** — Auto-detects label+icon from href URL pattern (PDF/video/catalog/fallback). Supports `vertical` and `horizontal` layout variants.
- **MobileFilterTrigger** — Fixed FAB (below `md`) opening Sheet drawer with filter tree. Shows active filter count + result count.
- **GenTestoImmagineBody** — Shared text column used inside `GenTestoImmagine` and `GenTestoImmagineBig`.

---

### Blocks (`src/components/blocks/`)

**Naming convention:**
- `Spec*` — Product and listing page blocks, tightly coupled to specific data shapes (product fields, filter registries). Used directly in templates.
- `Gen*` — General-purpose paragraph blocks driven by Drupal `paragraph--blocco_*` data. Wired through `ParagraphResolver` and reusable across all content types.

Scan with: `node /Users/nicolagasco/.claude/skills/ds/scripts/inventory.js blocks`

**Gen blocks built (12) — `blocco_*` → `Gen*` mapping:**

| Drupal paragraph type | Gen block |
|-----------------------|-----------|
| `paragraph--blocco_intro` | `GenIntro` |
| `paragraph--blocco_quote` | `GenQuote` |
| `paragraph--blocco_video` | `GenVideo` |
| `paragraph--blocco_testo_immagine` | `GenTestoImmagine` |
| `paragraph--blocco_testo_immagine_big` | `GenTestoImmagineBig` |
| `paragraph--blocco_testo_immagine_blog` | `GenTestoImmagineBlog` |
| `paragraph--blocco_gallery` | `GenGallery` |
| `paragraph--blocco_gallery_intro` | `GenGalleryIntro` |
| `paragraph--blocco_documenti` | `GenDocumenti` |
| `paragraph--blocco_a` | `GenA` |
| `paragraph--blocco_b` | `GenB` |
| `paragraph--blocco_c` | `GenC` |

**Gen blocks remaining to build** (still using legacy `Blocco*` in LEGACY_MAP):

`GenCorrelati`, `GenNewsletter`, `GenFormBlog`, `GenSliderHome`, `GenAnni`, `GenTutorial`

**Deleted legacy Blocco\* files** (replaced by Gen* equivalents): BloccoIntro, BloccoQuote, BloccoVideo, BloccoGallery, BloccoTestoImmagine, BloccoTestoImmagineBig, BloccoTestoImmagineBlog, BloccoGalleryIntro, BloccoDocumenti

---

#### ParagraphResolver

**Location:** `src/components_legacy/blocks_legacy/ParagraphResolver.tsx`

Async server component. Maps incoming `paragraph--{type}` data to either a DS `Gen*` block or a legacy `Blocco*` fallback component.

**Dispatch flow:**
1. Checks if the paragraph type requires a secondary Drupal fetch via `needsSecondaryFetch(type)` (used for paragraphs with nested children, e.g. gallery slides).
2. If yes, calls `fetchParagraph()` to hydrate nested data before rendering.
3. Attempts Gen adapter functions (`adaptGenIntro`, `adaptGenVideo`, etc.) in order of type match.
4. Falls back to `LEGACY_MAP[type]` for types not yet migrated.
5. In development, renders a yellow dashed warning box for unknown paragraph types; in production, returns `null`.

**Templates using ParagraphResolver:**
Page, LandingPage, Articolo, News, Tutorial, Ambiente, Progetto, CategoriaBlog, Tag, ProdottoArredo, Categoria

**Current wiring status:** Gen adapters active for all 12 built Gen blocks; BloccoSliderHome, BloccoCorrelati, BloccoNewsletter, BloccoFormBlog, BloccoAnni, BloccoTutorial remain in `LEGACY_MAP`.

---

### Primitives (`src/components/ui/`)

shadcn/ui primitives (base-vega preset, base-ui). NEVER modify directly.

---

### Layout (`src/components/layout/`)

| Component | Purpose |
|-----------|---------|
| `Navbar` | Client wrapper — manages `openMenu` state and scroll-direction visibility, renders `NavbarDesktop` and `NavbarMobile` |
| `NavbarDesktop` | Full desktop navigation bar with mega-menu panels |
| `NavbarMobile` | Mobile hamburger navigation with sheet drawer |

---

### Legacy (`src/components_legacy/`)

Being replaced progressively. Check directory contents for current state.

Notes:
- Header, MegaMenu, LanguageSwitcher superseded by `src/components/layout/` — kept for reference only
- Footer still actively used (not yet migrated)
- DrupalImage still used in all legacy product templates
- `blocks_legacy/`: `Blocco*` paragraph components + `ParagraphResolver`. Migration status tracked in ParagraphResolver's `LEGACY_MAP` — source of truth for what's still legacy

## Templates — Migration Matrix

### Node Templates (`src/templates/nodes/`)

| Template | Drupal Type | Status | Uses ParagraphResolver | Notes |
|---|---|---|---|---|
| ProdottoMosaico | node--prodotto_mosaico | DS | No | 5 blocks (Spec*), 9 composed; collection-level fallback for body/specs |
| ProductListingTemplate | (unified listing) | DS | No | Hub mode (SpecCategory) + Grid mode (SpecProductListing); accepts all 6 product types |
| Page | node--page | Minimal DS | Yes | title + body + ParagraphResolver |
| LandingPage | node--landing_page | Minimal DS | Yes | ParagraphResolver only, no title/body |
| ProdottoVetrite | node--prodotto_vetrite | Legacy | No | DrupalImage + product.module.css; inline styles throughout |
| ProdottoArredo | node--prodotto_arredo | Legacy | Yes | DrupalImage + product.module.css; async tessuti secondary fetch |
| ProdottoTessuto | node--prodotto_tessuto | Legacy | No | DrupalImage + product.module.css |
| ProdottoPixall | node--prodotto_pixall | Legacy | No | DrupalImage + product.module.css |
| ProdottoIlluminazione | node--prodotto_illuminazione | Legacy | No | DrupalImage + product.module.css; async secondary fetch |
| Articolo | node--articolo | Legacy+Para | Yes | title + DrupalImage + body + ParagraphResolver |
| News | node--news | Legacy+Para | Yes | title + DrupalImage + body + ParagraphResolver |
| Tutorial | node--tutorial | Legacy+Para | Yes | title + DrupalImage + body + ParagraphResolver |
| Ambiente | node--ambiente | Legacy+Para | Yes | title + DrupalImage + body + ParagraphResolver |
| Progetto | node--progetto | Legacy+Para | Yes | + field_categoria_progetto link |
| Showroom | node--showroom | Legacy | No | NO field_blocchi — Drupal returns 400 if included |
| Documento | node--documento | Legacy | No | NO field_blocchi — Drupal returns 400 if included |
| Categoria | node--categoria | Legacy | Yes | 3-branch: products / subcategories / pages; getCategoriaProductType() |
| CategoriaBlog | node--categoria_blog | Legacy+Para | Yes | |
| Tag | node--tag | Legacy+Para | Yes | |

**Status key:** DS = design system blocks (Spec*/Gen* composed components, Tailwind only). Legacy = DrupalImage + `product.module.css` + inline styles. Minimal DS = Tailwind layout, legacy ParagraphResolver inside. Legacy+Para = legacy render with ParagraphResolver for `field_blocchi`. Hybrid = legacy structure + Tailwind sections.

**Common rule:** All templates receive `node` as `Record<string, unknown>`, cast to a typed interface from `src/types/drupal/entities.ts`.

Only `ProdottoMosaico` and `ProductListingTemplate` use the design system (Spec* blocks, no legacy imports).

---

### Taxonomy Templates (`src/templates/taxonomy/`)

| Template | Drupal Type | Status | Notes |
|---|---|---|---|
| MosaicoCollezione | taxonomy_term--mosaico_collezioni | Legacy listing | Legacy FilterSidebar + legacy ProductListing |
| MosaicoColore | taxonomy_term--mosaico_colori | Legacy listing | Legacy FilterSidebar + legacy ProductListing |
| VetriteCollezione | taxonomy_term--vetrite_collezioni | Hybrid | Legacy listing + FilterSidebar + Tailwind documents section + getTranslations |
| VetriteColore | taxonomy_term--vetrite_colori | Legacy listing | Legacy FilterSidebar + legacy ProductListing |
| TaxonomyTerm | (generic fallback) | Wireframe | name + description only |

---

## Types

- `src/types/drupal/entities.ts` — Single source of truth for all entity shapes
- `NodeTypeName` — union of all node types (page, landing_page, prodotto_*, articolo, news, tutorial, progetto, showroom, ambiente, categoria, categoria_blog, documento, tag)
- `TaxonomyTypeName` — union of all taxonomy types (mosaico_collezioni, mosaico_colori, vetrite_collezioni, vetrite_colori, vetrite_finiture, vetrite_textures, arredo_finiture, tessuto_colori, tessuto_finiture, tessuto_tipologie, tessuto_manutenzione)
- `EntityTypeName` — `NodeTypeName | TaxonomyTypeName | (string & Record<never, never>)` (open union for unknown types)
- Shared field shapes: `DrupalTextField`, `DrupalPath`, `DrupalLinkField`, `DrupalEntity` (base for all)
- Typed product interfaces: `ProdottoMosaico`, `ProdottoVetrite`, `ProdottoArredo`, `ProdottoTessuto`, `ProdottoPixall`, `ProdottoIlluminazione`
- Taxonomy term interfaces: `TermMosaicoCollezione`, `TermVetriteCollezione`
- Node interfaces: `NodeCategoria`, `DocumentItem`
- No Zod — pure TypeScript interfaces extending `Record<string, unknown>`; optional chaining used throughout templates

---

## Translations

- `messages/{locale}.json` — 6 locales (IT, EN, FR, DE, ES, RU)
- Sections: common, nav, projects, products, filters, sort, listing, errors, pagination

**Missing translations:** `resistant` and `absent` (under `products`) exist only in IT and EN — missing from DE, FR, ES, RU.

**Hardcoded labels to migrate** (not yet in messages/\*.json):
- `"Maintenance and installation"` — ProdottoMosaico `SpecProductSpecs`
- `"Get inspired through catalogs"` — ProdottoMosaico `SpecProductResources`
- `"Scopri"` / `"catalogo"` — ProdottoMosaico download label
- Attribute labels in detail blocks (Sheet size, Chip size, Thickness, Shape, Finishing)

---

## Filter Registry

Path: `src/domain/filters/registry.ts`

Zero React/Next.js dependencies — 100% unit-testable.

### 6 product types — filter priority levels

| Product Type | P0 (Hub cards, path-based) | P1 (Sidebar, query-param) | P2 (Advanced) | Category card ratio | Product card ratio |
|---|---|---|---|---|
| prodotto_mosaico | collection, color | shape, finish | grout | 1/1 | 1/1 |
| prodotto_vetrite | collection, color | finish, texture | — | 1/1 | 1/2 |
| prodotto_arredo | subcategory | finish, fabric | — | 4/3 | 1/1 |
| prodotto_tessuto | category | type, color, finish | — | 4/3 | 1/1 |
| prodotto_pixall | — | color, shape | grout | 1/1 | 1/1 |
| prodotto_illuminazione | subcategory | — | — | 4/3 | 1/1 |

**Priority semantics:**
- **P0** — hub category cards; single-select; path-based routing (e.g. `/mosaico/murano-smalto`)
- **P1** — sidebar checkboxes or dropdowns; multi-select; query-param (e.g. `?shape=hexagon&finish=polished`)
- **P2** — advanced panel; collapsed by default

**Key exports:**
- `FILTER_REGISTRY` — `Record<string, ProductTypeConfig>` — full config per product type
- `SLUG_OVERRIDES` — `Record<string, string>` — explicit slug-to-term-name mappings for accented characters, slashes, and capitalisation exceptions
- `deslugify(slug)` — converts URL slug to Drupal term name; NFC-normalised; falls back to title-case
- `getFilterConfig(contentType)` — returns `ProductTypeConfig | null`
- `translateBasePath(path, targetLocale)` — translates listing base path across locales
- `ListingConfig` — `categoryCardRatio`, `productCardRatio`, `categoryGroups`, `sortOptions`, `pageSize`

**nuqs integration:** `src/domain/filters/search-params.ts` — `parseAsString`, `parseAsArrayOf`; `FilterDefinition` type used by `ProductListingTemplate` for active filter state.

---

## Storybook

**Status: not actively maintained.** Decision pending on whether to dismiss or resume.

Framework: `@storybook/nextjs-vite`. Stories in `.storybook/stories/` organized by layer (primitives, composed, blocks, design-tokens).

---

## Design Tokens

Source: `src/styles/globals.css`

**Color space:** OkLch throughout.

| Token group | Tokens | Notes |
|---|---|---|
| Primary scale | `--color-primary-100` through `--color-primary-500` + `--color-primary` (base) | Used for brand accents |
| Primary text | `--color-primary-text` | Optimised for text on primary color; differs from primary base in dark mode |
| Surfaces | `--color-surface-1` through `--color-surface-5` | Chromatic elevation (replaces opacity hacks) |
| Container | `--container-main: var(--container-7xl)` | All blocks use `max-w-main` instead of `max-w-7xl` |
| Spacing — semantic | `--spacing-page`, `--spacing-section`, `--spacing-section-lg`, `--spacing-content`, `--spacing-element` | Responsive: 3 breakpoints (base / md 768px / lg 1024px) |
| Typography | `--underline-offset` | Consistent link underlines across components |
| Fonts | `--font-body` (Outfit), `--font-heading` (Geist), `--font-mono` (Geist Mono) | |

**Theme:** Light default; dark mode via `next-themes` (toggle in Header).

**Breakpoints:** base (mobile-first), `md` 768px, `lg` 1024px.

## Key Decisions

1. **No CSS Modules** in new UI — only Tailwind + semantic tokens
2. **No Zod for Drupal data** — pure TS interfaces, optional chaining in templates
3. **Product-level overrides collection** — e.g. `body = product.field_testo_main || collection.field_testo`
4. **Translations for all static text** — messages/*.json, future migration planned
5. **Static images** in `public/images/` (flat structure): `usa-mosaic-quality.jpg`, `Retinatura-mosaico-rete.jpg.webp`
6. **C1 entity pre-resolves all data** — relationships, paragraphs, and image meta (alt, width, height) flow inline in a single response; no secondary fetches needed for rendering
7. **Blocks import only Composed, never Primitives** — enforced by /ds skill
8. **Block naming convention** — `Spec*` = template-specific, `Gen*` = paragraph-driven transversal. Gen names derived mechanically from Drupal machine name: `blocco_{name}` → `Gen{PascalCase(name)}`
9. **Primary-text token** for text on primary color — different from primary base, optimized per theme
10. **Surface tokens** (1-5) for elevation instead of opacity hacks
11. **Document filtering** — installation guides extracted from catalogs, linked in Maintenance card
12. **`next/image` for content images > 100px** — All DS composed components use `<Image>` from `next/image` with `fill` + `sizes` for Drupal content images. Exceptions: logos, CSS swatches, decorative thumbnails < 80px, video posters, legacy templates. See `CHANGELOG.md` for migration details.

## Changelog

Project changelog is maintained in `CHANGELOG.md` at the repo root, organized by date with per-feature detail.

## Data Layer Architecture — Uniformity Analysis

The system has a **uniform API client core** with a **heterogeneous template layer**. The split is clear: everything inside `src/lib/api/` follows consistent patterns; everything inside `src/templates/` implements ad-hoc field extraction.

### Uniform Dimensions (working well)

| Dimension | Pattern | Evidence |
|-----------|---------|----------|
| **Fetcher pattern** | All use `apiGet()` | 10/10 REST fetchers; menu is the sole exception (uses `fetch()` directly) |
| **Error handling** | 404 → `null`, error → `console.error` + `null` | Identical across all 14 endpoints |
| **Caching** | `React.cache()` wrapper + `next: { revalidate: N }` | All fetchers; 3 tiers: 60s/300s/3600s |
| **Pagination** | `items_per_page` + `page` (0-based) | All Views endpoints (V1, V5–V11) |
| **Type safety (fetcher)** | `apiGet<T>()` with explicit interfaces | All response shapes in `types.ts` |

### Heterogeneous Dimensions (5 problem areas)

#### 1. Image URL Access — 4 patterns (3 legacy + 1 standard)

| Pattern | Where | How |
|---------|-------|-----|
| `next/image` `<Image>` with `fill` | DS composed components (ProductCard, CategoryCard, GalleryCarousel, MediaElement, etc.) | Standard for content images > 100px. Uses `sizes` prop for responsive srcset. |
| `getDrupalImageUrl(field)` | ProdottoMosaico, ParagraphResolver adapters | Extracts `uri.url` from C1 image shape `{ type: "file--file", uri: { url } }` |
| `DrupalImage` component | ProdottoVetrite, Arredo, Tessuto, Pixall, Illuminazione, Articolo, News, Tutorial | Legacy component wrapping entire image field — to be replaced during DS migration |
| Normalized `imageUrl` string → `<Image>` | ProductListingTemplate, all listing cards | Pre-normalized by REST fetcher via `emptyToNull(item.imageUrl)`, rendered via `next/image` |

**Risk**: When Drupal image field structure changes, 3 legacy codepaths need updating. DS components use pre-normalized URLs and are immune.

#### 2. Price Field Shape — Inconsistent across product types

| Product Type | `field_prezzo_eu` shape | `field_prezzo_usa` shape | Access pattern |
|---|---|---|---|
| Mosaico, Tessuto, Pixall | `string` | `string` | `node.field_prezzo_eu ?? null` |
| Vetrite, Arredo, Illuminazione | `{ value: string }` | `{ value: string }` | `node.field_prezzo_eu?.value ?? null` |

**Root cause**: Different Drupal field types (decimal vs formatted text). No frontend normalizer exists — each template implements its own access.

#### 3. Link Field Polymorphism — 4+ access patterns

`field_collegamento_esterno` can be either `string` (plain URI) or `{ uri: string, title: string }` (link field object). Every template that uses it implements its own type check:

```typescript
// Pattern seen in ProdottoArredo, ProdottoIlluminazione, VetriteCollezione, etc.
const extLinkRaw = doc.field_collegamento_esterno;
const link = typeof extLinkRaw === 'string'
  ? extLinkRaw
  : extLinkRaw?.uri ?? null;
```

No shared `normalizeLink()` function exists — the typeof check is duplicated in 6+ templates.

#### 4. Secondary Fetches — Chaotic, no unified pattern

| Template | Secondary Fetch | Protocol | Why |
|----------|----------------|----------|-----|
| ProdottoArredo | English tessuti terms | **JSON:API** (not REST) | Current locale returns stubs without name data |
| ProdottoIlluminazione | English tessuti terms | **JSON:API** (not REST) | Same as Arredo |
| Categoria | V10, V1, V11 | REST | 3-branch logic: products / subcategories / pages |
| MosaicoCollezione/Colore | V3 + V1 | REST | Filter options + filtered products |
| VetriteCollezione/Colore | V3 + V1 | REST | Same as Mosaico |

The Arredo/Illuminazione JSON:API fallback is the **only JSON:API usage** in the entire project — everything else is REST. Templates decide when and what to fetch secondarily with no shared abstraction.

#### 5. C1 Entity Normalization — Delegated to templates

`fetchEntity()` returns raw `{ meta, data: Record<string, unknown> }`. Unlike Views fetchers (V1–V11) which normalize before returning, C1 passes raw Drupal field shapes to templates. Each template then does its own:
- Field extraction via optional chaining
- Fallback chains (product → collection → null)
- Array normalization (single-cardinality Drupal fields arriving as objects instead of arrays)
- HTML sanitization
- Boolean-to-label translation

**Result**: 26 templates each implement ad-hoc field extraction logic instead of a shared mapper layer.

### Field Cardinality Anomalies

Some Drupal fields have cardinality=1 but are sometimes serialized as objects instead of arrays. Templates must defensively normalize:

```typescript
// ProdottoTessuto: field_finiture_tessuto / field_tipologia_tessuto
const finiture = Array.isArray(node.field_finiture_tessuto)
  ? node.field_finiture_tessuto
  : node.field_finiture_tessuto ? [node.field_finiture_tessuto] : [];
```

### Entities Without `field_blocchi`

`Showroom` and `Documento` node types do **NOT** have `field_blocchi`. Including this field in a C1 request for these entities causes Drupal to return HTTP 400. Templates must never pass these through ParagraphResolver.

### Detailed Documentation

Comprehensive reports in `docs/`:
- `API_QUICK_REFERENCE.md` — Endpoint cheat sheet with gotchas
- `DRUPAL_API_CATALOG.md` — Full endpoint reference (URL, params, response shapes, normalization, TTL)
- `DRUPAL_CONTENT_MAP.md` — Entity types, taxonomy, paragraphs, field shapes, migration status
- `DRUPAL_FIELD_INVENTORY.md` — Per-template field access map with types and patterns
- `STRATEGIC_IMPROVEMENTS.md` — 15 improvement recommendations in 5 phases with priority matrix

## Drupal Schema Reference

### Content Types

| Category | Bundles |
|----------|---------|
| Products (6) | `prodotto_mosaico`, `prodotto_vetrite`, `prodotto_arredo`, `prodotto_tessuto`, `prodotto_pixall`, `prodotto_illuminazione` |
| Content (8) | `page`, `landing_page`, `articolo`, `news`, `tutorial`, `progetto`, `ambiente`, `showroom` |
| Metadata (4) | `categoria`, `categoria_blog`, `documento`, `tag` |

### Taxonomy Vocabularies

| Product | Vocabularies |
|---------|-------------|
| Mosaico | `mosaico_collezioni`, `mosaico_colori` |
| Vetrite | `vetrite_collezioni`, `vetrite_colori`, `vetrite_finiture`, `vetrite_textures` |
| Arredo | `arredo_finiture` |
| Tessuto | `tessuto_colori`, `tessuto_finiture`, `tessuto_tipologie`, `tessuto_manutenzione` |

### Paragraph Types

`blocco_intro`, `blocco_quote`, `blocco_video`, `blocco_testo_immagine`, `blocco_testo_immagine_big`, `blocco_testo_immagine_blog`, `blocco_gallery`, `blocco_gallery_intro`, `blocco_documenti`, `blocco_a`, `blocco_b`, `blocco_c`, `blocco_correlati`, `blocco_newsletter`, `blocco_form_blog`, `blocco_slider_home`, `blocco_anni`, `blocco_tutorial`

## Current State

### Migration Status

| Status | Templates |
|--------|-----------|
| DS complete | ProdottoMosaico (5 Spec blocks), ProductListingTemplate (filters + grid) |
| Minimal DS | Page, LandingPage (ParagraphResolver only) |
| Hybrid | VetriteCollezione (legacy listing + Tailwind documents) |
| Legacy | ProdottoVetrite, ProdottoArredo, ProdottoTessuto, ProdottoPixall, ProdottoIlluminazione, Articolo, News, Tutorial, Showroom, Documento, Ambiente, Progetto, Categoria |

### Component Coverage

- **Gen blocks built**: 12 (GenIntro, GenQuote, GenVideo, GenTestoImmagine, GenTestoImmagineBig, GenTestoImmagineBlog, GenGallery, GenGalleryIntro, GenDocumenti, GenA, GenB, GenC)
- **Gen blocks remaining to build**: GenCorrelati, GenNewsletter, GenFormBlog, GenSliderHome, GenAnni, GenTutorial
- **ParagraphResolver**: source of truth for Gen vs legacy wiring — check `LEGACY_MAP` in `src/components_legacy/blocks_legacy/ParagraphResolver.tsx`

### Layout

| Component | Status |
|-----------|--------|
| Navbar | Migrated — glassmorphism bar, 4 mega-menus, mobile overlay, scroll hide, language switcher |
| Footer | Legacy |

### Storybook

- Not actively maintained (see Storybook section above)

### Known Gaps

- 2 i18n keys missing from DE, FR, ES, RU: `resistant`, `absent`
- Several hardcoded labels not yet moved to `messages/*.json`
- Animations removed, to be reimplemented with proper approach

## Next Steps

### Immediate

1. Remaining Gen blocks (6): GenCorrelati → GenNewsletter → GenFormBlog → GenSliderHome → GenAnni → GenTutorial

### Backlog

- Product template DS migration: ProdottoVetrite → ProdottoArredo → ProdottoTessuto → ProdottoPixall → ProdottoIlluminazione
- Footer migration to design system
- Breadcrumb block (separate, above hero)
- Contact form (Dialog/Sheet for CTA actions)
- Alternative products carousel
- Regional logic (EU vs US: pricing, CTAs, stock)
- Translate hardcoded labels to `messages/*.json`
- Sync missing i18n keys (`resistant`, `absent`) to all 6 locales

## Agent Teams

This project uses `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`. Whenever ci sono task indipendenti (es. modificare più template, esplorare più directory, eseguire check paralleli), lancia agenti in background (`run_in_background: true`) in un singolo messaggio anziché lavorare sequenzialmente. Usa foreground solo quando il risultato serve prima di procedere.

## Restore Points

- Tag `pre-refactor-drupal-layer` — before data layer consolidation
