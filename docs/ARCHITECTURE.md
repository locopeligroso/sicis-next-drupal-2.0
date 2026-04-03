# Architecture

> Extracted from CLAUDE.md. See CLAUDE.md for project overview, commands, and conventions.

## Architecture

### Locale Configuration

6 locales are active: `it` (default), `en`, `fr`, `de`, `es`, `ru`. A 7th locale, `us`, is present in the array but **does not exist in Drupal** — it maps to the `en` Drupal locale for all API calls.

- `src/i18n/config.ts` — `locales` array (includes `us`), `defaultLocale = 'it'`, `toDrupalLocale(locale)` helper
- `toDrupalLocale('us')` returns `'en'`. All other locales pass through unchanged.
- Every function that calls `apiGet()` or `resolvePath()` must pass `toDrupalLocale(locale)` — raw locale values from the URL must never be forwarded to Drupal.

### Data Layer

All Drupal data comes exclusively from the REST endpoints below. No other data source is used.

**REST API client (`src/lib/api/`):**

- `client.ts` — `apiGet` (base fetcher), `stripDomain`, `stripLocalePrefix`, `emptyToNull` (normalizers), `resolveImageUrl` (unified image URL resolver — handles 4 patterns: direct string, `{ uri: { url } }`, `{ url }`, null), `resolveImage` (returns `ResolvedImage { url, width, height }` — handles both legacy string and new `{ url, width, height }` object format from Drupal), `resolveImageArray` (maps an array of raw image fields through `resolveImage`, filters nulls)
- `types.ts` — Response interfaces for all endpoints (source of truth for REST response shapes)
- `entity.ts` — `fetchEntity` (entity ❌ DEAD — do not call at runtime)
- `products.ts` — `fetchProducts` (products ❌ DEAD), `fetchFilterCounts` (product-counts ❌ DEAD), `getCategoriaProductType`
- `filters.ts` — `fetchFilterOptions` (taxonomy ❌ DEAD), `fetchCategoryOptions` (category-options ❌ DEAD), `fetchAllFilterOptions`
- `listings.ts` — `fetchBlogPosts` (aggregate of articles+news+tutorials, newest-first sort), `fetchArticles` (articles, optional `categoryNid` filter, client-side pagination), `fetchNewsItems` (news, client-side pagination), `fetchTutorials` (all tutorials — aggregate), `fetchTutorialsByCategory` (tutorials filtered by `'vetrite'` | `'mosaico'`, optional `tipologiaTid` filter — field pending from CMS), `fetchTutorialTipologie` (tutorial typology terms from `tutorial-tipologie` endpoint), `fetchProjects` (projects, optional `categoryTid` filter, client-side pagination), `fetchProjectCategories` (project taxonomy from `project-categories` endpoint), `fetchBlogCategories` (blog categories from `categories-blog` endpoint), `fetchBlogTags` (tags — tries `tags` endpoint, falls back to hardcoded NID list via `content/{nid}`), `fetchEnvironments` (environments, client-side pagination), `fetchShowrooms` (showrooms, client-side pagination), `fetchDocuments` (documents — confirmed dead 404, kept for forward compat)
- `categories.ts` — `fetchSubcategories` (subcategories ❌ DEAD), `fetchPagesByCategory` (pages-by-category ❌ DEAD)
- `translate-path.ts` — `getTranslatedPath` (translate-path ❌ DEAD)
- `image-fallback.ts` — `enrichWithFallbackImages` (extracts images from entity endpoint for items missing imageUrl)
- `resolve-path.ts` — `resolvePath` (resolve-path) — resolves URL alias → `{ nid, bundle, locale, aliases }`. Foundation for all new REST routing.
- `mosaic-product.ts` — `fetchMosaicProduct` (mosaic-product) — single mosaic product by NID, normalized with collection + grouts + documents
- `vetrite-product.ts` — `fetchVetriteProduct` (vetrite-product) — single vetrite product by NID, normalized with collection + documents
- `textile-product.ts` — `fetchTextileProduct` (textile-product) — single textile product by NID, normalized with finiture + maintenance + documents
- `pixall-product.ts` — `fetchPixallProduct` (pixall-product) — single pixall product by NID
- `arredo-product.ts` — `fetchArredoProduct` (arredo-product/{nid}) — single arredo product by NID
- `product-listing-factory.ts` — `fetchProductListing(productType, locale, params)` — consolidated listing fetcher for all 6 product types (+ next_art). Uses `React.cache()` per type. Supports `DualTidParams` (mosaic, vetrite: `tid1`, `tid2`, `shapeTid`, `finishTid`), `SingleNidParams` (arredo, illuminazione, tessuto: `nid`, `tipologiaTid`), and no-params (pixall). Replaces 5 separate listing files. Exports `MOSAIC_COLLECTION_GROUPS` and `resolveCollectionTidGroup` for sub-collection TID expansion (NeoColibrì: 72+74+75+76, Neoglass: 67+77+78+79).
- `mosaic-hub.ts` — `fetchMosaicColors`, `fetchMosaicCollections` (mosaic-colors, mosaic-collections), `fetchMosaicShapes` (mosaic-shapes), `fetchMosaicFinishes` (mosaic-finishes), `fetchMosaicProductCounts` (mosaic-product-counts — faceted counts for cross-filtering with P0+P1 active filters)
- `vetrite-hub.ts` — `fetchVetriteColors`, `fetchVetriteCollections` (vetrite-colors, vetrite-collections), `fetchVetriteFinishes` (vetrite-finishes), `fetchVetriteProductCounts` (vetrite-product-counts — faceted counts for cross-filtering)
- `illuminazione-product.ts` — `fetchIlluminazioneProduct` (illuminazione-product/{nid}) — single illuminazione product by NID, normalized with documents
- `category-hub.ts` — `fetchHubCategories` (categories/{parentNid}) — child node--categoria items by parent NID; deduplicates by NID. `fetchTessutoTipologie` (tessuto-tipologie) — all tessuto typology terms. `fetchTessutoProductCounts` (tessuto-product-counts — faceted counts for tipologia cross-filtering). Replaces dead category-options (V4)
- `filter-options.ts` — `fetchListingFilterOptions(productType, locale)` — orchestrates hub endpoint calls to produce `Record<string, FilterOption[]>` for the sidebar. Mosaic: P0 (collections, colors) + P1 (shapes, finishes) populated. Vetrite: P0 + P1 finishes populated. Tessuto: tipologie populated. Category types (arredo, illuminazione): subcategories populated. Pixall: empty (no taxonomy endpoints).
- `content.ts` — `fetchContent` (content/{nid}) — single content entity by NID, raw fields. Replaces dead entity endpoint (C1) for basic field access. Revalidate: 300s
- `blocks.ts` — `fetchBlocks` (blocks/{nid}) — paragraph blocks for a node by NID; normalizes `type` with `paragraph--` prefix and converts `field_immagine*` strings to C1 file-object shape. Replaces dead entity endpoint (C1) for `field_blocchi`. Revalidate: 300s

**Drupal utilities (`src/lib/drupal/`):**

- `config.ts` — DRUPAL_BASE_URL (single source of truth)
- `menu.ts` — `fetchMenu` (menu — ✅ still active), `mapMenuToNavbar` — uses `fetch()` directly (NOT `apiGet`), different URL pattern (`/api/menu/` without `v1`). Produces a `NavbarMenu` with typed `NavSection[]`. Zero title-matching: variant (`'product'` | `'list'`) inferred structurally from whether children have sub-children. `sectionTitles` and `sectionDescriptions` come from Drupal menu item title/description fields — no hardcoded strings.
- `image.ts` — `getDrupalImageUrl` (extracts `uri.url` from entity endpoint image shape)
- `index.ts` — barrel re-export

**Navbar types (`src/lib/navbar/`):**

- `types.ts` — `NavbarMenu`, `NavSection { title, description, url, variant, items }`, `NavSectionItem { item, secondaryLinks, crossLinks }`, `SecondaryLink`. `variant` is `'product'` (children have sub-children, renders `MegaMenuSection` product layout) or `'list'` (flat links, renders simple list layout).
- `menu-mapper.ts` — `mapMenuToNavbar(menuItems)` — fully CMS-driven mapper. Skips top-level items without children (e.g. "Home"). Cross-links extracted from sub-children whose title is `"cross-link"` with grandchildren; all other leaf sub-children become `secondaryLinks`.
- `hub-links.ts` — static hub image links (product category thumbnails injected into mega-menu cards)

#### Drupal REST Endpoint Reference

All data from Drupal flows through these endpoints. This is the **sole source of truth** for Drupal data.

**Conventions:**

- Custom endpoints go through `apiGet()` which inserts `/api/v1/` after locale: `/{locale}/api/v1/{endpoint}`
- New endpoints return flat arrays (no pagination wrapper). All legacy paginated endpoints are confirmed dead — their pagination conventions are preserved here for historical reference only.
- Former paginated response shape (dead endpoints): `{ items: T[], total: number, page: number, pageSize: number }`
- Former pagination params (dead endpoints): `items_per_page` (Drupal Views native) + `page` (0-based)
- Paths in Views responses contain the full Drupal domain URL — normalize with `stripDomain()` + `stripLocalePrefix()`
- Image URLs: empty string `""` when no image (not `null`) — normalize with `emptyToNull()`

**Endpoint status overview:**

The project has fully migrated away from generic Drupal Views endpoints to dedicated type-specific endpoints. **NEW endpoints are definitive.** New endpoints use NID/TID path params, return flat arrays, and have no pagination. All old generic Views endpoints are **confirmed dead (404)** on the current Drupal backend — only the menu endpoint (M1) remains active. Dead endpoint fetchers are kept in the codebase for reference but must not be called at runtime.

**✅ NEW — Definitive endpoints (type-specific, NID/TID-based, no pagination):**

| Endpoint               | Purpose                                   | URL pattern                                               |
| ---------------------- | ----------------------------------------- | --------------------------------------------------------- |
| resolve-path           | URL alias → entity metadata               | `resolve-path?path=...`                                   |
| mosaic-product         | Single mosaic by NID                      | `mosaic-product/{nid}`                                    |
| vetrite-product        | Single vetrite by NID                     | `vetrite-product/{nid}`                                   |
| textile-product        | Single textile by NID                     | `textile-product/{nid}`                                   |
| pixall-product         | Single pixall by NID                      | `pixall-product/{nid}`                                    |
| illuminazione-product  | Single illuminazione by NID               | `illuminazione-product/{nid}`                             |
| mosaic-products        | Mosaic listing by TID                     | `mosaic-products/{collectionTid}/{colorTid}`              |
| vetrite-products       | Vetrite listing by TID                    | `vetrite-products/{collectionTid}/{colorTid}`             |
| textile-products       | Textile listing by NID                    | `textile-products/{categoryNid}`                          |
| pixall-products        | All pixall products                       | `pixall-products`                                         |
| arredo-products        | Arredo listing by category NID            | `arredo-products/{categoryNid}`                           |
| illuminazione-products | Illuminazione listing by category NID     | `illuminazione-products/{categoryNid}`                    |
| mosaic-colors          | Hub mosaic colors                         | `mosaic-colors`                                           |
| mosaic-collections     | Hub mosaic collections                    | `mosaic-collections`                                      |
| mosaic-shapes          | Mosaic P1 shape filter options            | `mosaic-shapes`                                           |
| mosaic-finishes        | Mosaic P1 finish filter options           | `mosaic-finishes`                                         |
| mosaic-product-counts  | Faceted counts (cross-filtering)          | `mosaic-product-counts?collection=&color=&shape=&finish=` |
| vetrite-colors         | Hub vetrite colors                        | `vetrite-colors`                                          |
| vetrite-collections    | Hub vetrite collections                   | `vetrite-collections`                                     |
| vetrite-finishes       | Vetrite P1 finish filter options          | `vetrite-finishes`                                        |
| vetrite-product-counts | Vetrite faceted counts (cross-filtering)  | `vetrite-product-counts?collection=&color=&finish=`       |
| tessuto-tipologie      | Tessuto typology filter options           | `tessuto-tipologie`                                       |
| tessuto-product-counts | Tessuto faceted counts (cross-filtering)  | `tessuto-product-counts?tipologia=`                       |
| categories/{parentNid} | Child node--categoria by parent NID       | `categories/{parentNid}`                                  |
| articles               | Articles listing (replaces blog)          | `articles`                                                |
| news                   | News listing                              | `news`                                                    |
| tutorials              | Tutorials listing                         | `tutorials`                                               |
| tutorial-tipologie     | Tutorial typology filter options          | `tutorial-tipologie`                                      |
| projects               | Projects listing                          | `projects`                                                |
| project-categories     | Project taxonomy filter options           | `project-categories`                                      |
| categories-blog        | Blog category filter options              | `categories-blog`                                         |
| tags                   | Blog/article tag nodes                    | `tags`                                                    |
| environments           | Environments listing                      | `environments`                                            |
| showrooms              | Showrooms listing                         | `showrooms`                                               |
| content/{nid}          | Basic content fields by NID (replaces C1) | `content/{nid}`                                           |
| blocks/{nid}           | Paragraph blocks for a node (replaces C1) | `blocks/{nid}`                                            |

**❌ DEAD — Old generic Views (confirmed 404 on current Drupal backend):**

| Endpoint          | Former purpose           | Replaced by                                                                    |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------ |
| entity            | Full entity by path      | `content/{nid}` + `blocks/{nid}` + type-specific fetchers                      |
| translate-path    | Cross-locale path        | `resolve-path` (aliases map included in response)                              |
| products          | Generic product listing  | Type-specific `*-products` endpoints                                           |
| product-counts    | Filter value counts      | No replacement yet                                                             |
| taxonomy          | Taxonomy terms           | `mosaic-colors`, `mosaic-collections`, `vetrite-colors`, `vetrite-collections` |
| category-options  | Category nodes           | `categories/{parentNid}`                                                       |
| blog              | Blog posts               | `articles` + `news` + `tutorials` (aggregate via `fetchBlogPosts`)             |
| projects          | Projects (paginated)     | `projects` (flat array, client-side pagination in `fetchProjects`)             |
| environments      | Environments (paginated) | `environments` (flat array, client-side pagination in `fetchEnvironments`)     |
| showrooms         | Showrooms (paginated)    | `showrooms` (flat array, client-side pagination in `fetchShowrooms`)           |
| documents         | Documents                | No replacement yet                                                             |
| subcategories     | Child categories         | `categories/{parentNid}`                                                       |
| pages-by-category | Pages by category        | No replacement yet                                                             |

**✅ ALIVE (legacy URL pattern, still active):**

| Endpoint | Purpose         | URL pattern                                  |
| -------- | --------------- | -------------------------------------------- |
| menu     | Navigation menu | `/api/menu/{name}` (no `v1`, uses `fetch()`) |

**resolve-path — Resolve Path (URL alias → entity metadata + multilingual aliases)**

- URL: `/{locale}/api/v1/resolve-path?path={pathWithoutLocale}`
- Function: `resolvePath(path, locale)` in `resolve-path.ts`
- Response: `{ nid, type, bundle, locale, aliases: { it: "/mosaico/...", en: "/mosaic/...", ... } }`
- Foundation for all new REST routing — replaces entity endpoint's path resolution role
- Also used for language switching (replaces translate-path)
- Revalidate: 3600s

**mosaic-product — Mosaic Product (single product by NID)**

- URL: `/{locale}/api/v1/mosaic-product/{nid}`
- Function: `fetchMosaicProduct(nid, locale)` in `mosaic-product.ts`
- Response: array with single item, unwrapped by fetcher. Includes collection with specs, documents, grouts.
- Rendered via `MosaicProductPreview` (DS Spec\* blocks)
- Revalidate: 60s

**vetrite-product — Vetrite Product (single product by NID)**

- URL: `/{locale}/api/v1/vetrite-product/{nid}`
- Function: `fetchVetriteProduct(nid, locale)` in `vetrite-product.ts`
- Response: array with single item. Includes collection with dimensions, thickness, treatments, documents.
- Rendered via legacy `ProdottoVetrite` template with `vetriteToLegacyNode` adapter
- Revalidate: 60s

**textile-product — Textile Product (single product by NID)**

- URL: `/{locale}/api/v1/textile-product/{nid}`
- Function: `fetchTextileProduct(nid, locale)` in `textile-product.ts`
- Response: array with single item. Includes category, finiture, maintenance instructions (with icons), typology, documents.
- Rendered via legacy `ProdottoTessuto` template with `textileToLegacyNode` adapter
- Revalidate: 60s

**pixall-product — Pixall Product (single product by NID)**

- URL: `/{locale}/api/v1/pixall-product/{nid}`
- Function: `fetchPixallProduct(nid, locale)` in `pixall-product.ts`
- Response: array with single item.
- Revalidate: 60s

**entity — Entity (single entity by path) — ❌ DEAD (confirmed 404). Replaced by `content/{nid}` + `blocks/{nid}` + type-specific fetchers.**

- URL: `/{locale}/api/v1/entity?path={pathWithoutLocale}`
- Function: `fetchEntity(path, locale)` in `entity.ts` (kept for reference — do not call at runtime)
- Former response: `{ meta: { type, bundle, id (NID), uuid, locale, path }, data: { ...allFields } }`
- Image shape that adapters still expect: `{ type: "file--file", uri: { url: "https://..." }, meta: { alt, width, height } }` — `blocks.ts` normalizes to this shape

**translate-path — Translate Path (cross-locale path resolution) — ❌ DEAD (confirmed 404). Replaced by `resolve-path` aliases map.**

- URL: `/{locale}/api/v1/translate-path?path={path}&from={locale}&to={targetLocale}`
- Function: `getTranslatedPath(path, fromLocale, toLocale)` in `translate-path.ts` (kept for reference — do not call at runtime)
- Former response: `{ translatedPath: "/en/mosaic" | null }`

**products — Products (paginated product listing) — ❌ DEAD (confirmed 404). Replaced by type-specific `*-products` endpoints.**

- URL: `/{locale}/api/v1/products/{productType}?items_per_page=N&page=N&sort=...&{filterParams}`
- Function: `fetchProducts(options)` in `products.ts` (kept for reference — do not call at runtime)
- Former productType values: `prodotto_mosaico` | `prodotto_vetrite` | `prodotto_arredo` | `prodotto_tessuto` | `prodotto_pixall` | `prodotto_illuminazione`

**product-counts — Filter Counts (aggregated counts per filter value) — ❌ DEAD (confirmed 404). No replacement yet.**

- URL: `/{locale}/api/v1/products/{productType}/counts/{filterKey}?{activeFilterParams}`
- Function: `fetchFilterCounts(productType, activeFilters, filterKey, drupalField, locale)` in `products.ts` (kept for reference — do not call at runtime)

**mosaic-products — Mosaic Product Listing (TID-based, all products in a collection/color)**

- URL: `/{locale}/api/v1/mosaic-products/{collectionTid}/{colorTid}`
- Function: `fetchMosaicProductListing()` in `mosaic-product-listing.ts`
- TID-based filtering (taxonomy term IDs). No pagination — returns all matching products.
- Revalidate: 60s

**vetrite-products — Vetrite Product Listing (TID-based, all products in a collection/color)**

- URL: `/{locale}/api/v1/vetrite-products/{collectionTid}/{colorTid}`
- Function: `fetchVetriteProductListing()` in `vetrite-product-listing.ts`
- TID-based filtering (taxonomy term IDs). No pagination — returns all matching products.
- Revalidate: 60s

**textile-products — Textile Product Listing (NID-based, all products in a category)**

- URL: `/{locale}/api/v1/textile-products/{categoryNid}`
- Function: `fetchTextileProductListing()` in `textile-product-listing.ts`
- NID-based filtering (category node ID). No pagination.
- Revalidate: 60s

**pixall-products — Pixall Product Listing (no filters)**

- URL: `/{locale}/api/v1/pixall-products`
- Function: `fetchPixallProductListing()` in `pixall-product-listing.ts`
- No filter parameters. Returns all pixall products.
- Revalidate: 60s

**taxonomy — Taxonomy Terms (vocabulary listing) — ❌ DEAD (confirmed 404). Replaced by `mosaic-colors`, `mosaic-collections`, `vetrite-colors`, `vetrite-collections` for hub data.**

- URL: `/{locale}/api/v1/taxonomy/{vocabulary}`
- Function: `fetchFilterOptions(taxonomyType, locale)` in `filters.ts` (kept for reference — do not call at runtime)

**category-options — Category Options (node--categoria listing for a product type) — ❌ DEAD (confirmed 404). Replaced by `categories/{parentNid}`.**

- URL: `/{locale}/api/v1/category-options/{productType}`
- Function: `fetchCategoryOptions(productType, locale)` in `filters.ts` (kept for reference — do not call at runtime)

**blog — Blog Posts — ❌ DEAD (confirmed 404). No replacement yet.**

- URL: `/{locale}/api/v1/blog?items_per_page=N&page=N`
- Function: `fetchBlogPosts(locale, limit, offset)` in `listings.ts` (kept for reference — do not call at runtime)

**projects — Projects — ❌ DEAD (confirmed 404). No replacement yet.**

- URL: `/{locale}/api/v1/projects?items_per_page=N&page=N`
- Function: `fetchProjects(locale, limit, offset)` in `listings.ts` (kept for reference — do not call at runtime)

**environments — Environments — ❌ DEAD (confirmed 404). No replacement yet.**

- URL: `/{locale}/api/v1/environments?items_per_page=N&page=N`
- Function: `fetchEnvironments(locale, limit, offset)` in `listings.ts` (kept for reference — do not call at runtime)

**showrooms — Showrooms — ❌ DEAD (confirmed 404). No replacement yet.**

- URL: `/{locale}/api/v1/showrooms`
- Function: `fetchShowrooms(locale)` in `listings.ts` (kept for reference — do not call at runtime)

**documents — Documents — ❌ DEAD (confirmed 404). No replacement yet.**

- URL: `/{locale}/api/v1/documents?items_per_page=N&page=N`
- Function: `fetchDocuments(locale, limit, offset)` in `listings.ts` (kept for reference — do not call at runtime)

**subcategories — Subcategories (child node--categoria entities) — ❌ DEAD (confirmed 404). Replaced by `categories/{parentNid}`.**

- URL: `/{locale}/api/v1/subcategories/{parentNid}`
- Function: `fetchSubcategories(parentId, locale)` in `categories.ts` (kept for reference — do not call at runtime)

**pages-by-category — Pages by Category (node--page filtered by field_categoria) — ❌ DEAD (confirmed 404). No replacement yet.**

- URL: `/{locale}/api/v1/pages-by-category/{parentNid}?items_per_page=N&page=N`
- Function: `fetchPagesByCategory(parentId, locale, limit, offset)` in `categories.ts` (kept for reference — do not call at runtime)

**arredo-products — Arredo Product Listing (NID-based, all products in a category)**

- URL: `/{locale}/api/v1/arredo-products/{categoryNid}`
- Function: `fetchArredoProductListing(locale, categoryNid)` in `arredo-product-listing.ts`
- Pass `"all"` as `categoryNid` for unfiltered listing. Returns normalized `ProductCard[]`.
- Revalidate: 60s

**illuminazione-products — Illuminazione Product Listing (NID-based, all products in a category)**

- URL: `/{locale}/api/v1/illuminazione-products/{categoryNid}`
- Function: `fetchIlluminazioneProductListing(locale, categoryNid)` in `illuminazione-product-listing.ts`
- Pass `"all"` as `categoryNid` for unfiltered listing. Returns normalized `ProductCard[]`.
- Revalidate: 60s

**illuminazione-product — Illuminazione Product (single product by NID)**

- URL: `/{locale}/api/v1/illuminazione-product/{nid}`
- Function: `fetchIlluminazioneProduct(nid, locale)` in `illuminazione-product.ts`
- Response: array with single item, unwrapped. Normalized to `IlluminazioneProduct` — includes documents array with `href` / `videoId`.
- Revalidate: 60s

**vetrite-colors — Hub Vetrite Colors**

- URL: `/{locale}/api/v1/vetrite-colors`
- Function: `fetchVetriteColors(locale)` in `vetrite-hub.ts`
- Response: flat array of `VetriteTermItem { name, imageUrl, href }`. `href` is normalized (domain stripped).
- Revalidate: 3600s

**vetrite-collections — Hub Vetrite Collections**

- URL: `/{locale}/api/v1/vetrite-collections`
- Function: `fetchVetriteCollections(locale)` in `vetrite-hub.ts`
- Response: flat array of `VetriteTermItem { name, imageUrl, href }`.
- Revalidate: 3600s

**categories/{parentNid} — Hub Child Categories (replaces dead category-options)**

- URL: `/{locale}/api/v1/categories/{parentNid}`
- Function: `fetchHubCategories(parentNid, locale)` in `category-hub.ts`
- Response: flat array of `CategoryHubItem { nid, name, imageUrl }`. Deduplicates by NID (Drupal may return duplicates due to multi-locale joins).
- Revalidate: 3600s

**content/{nid} — Content Entity Basic Fields (replaces dead entity endpoint for non-paragraph data)**

- URL: `/{locale}/api/v1/content/{nid}`
- Function: `fetchContent(nid, locale)` in `content.ts`
- Response: array with single item, unwrapped to `ContentEntity { nid, type, ...fields }`. Field shape not yet finalized — returned as-is.
- Revalidate: 300s

**blocks/{nid} — Paragraph Blocks for a Node (replaces dead entity endpoint for field_blocchi)**

- URL: `/{locale}/api/v1/blocks/{nid}`
- Function: `fetchBlocks(nid, locale)` in `blocks.ts`
- Response: array of `BlockItem { type, pid, ...fields }`.
- Normalizations applied: `type` gains `paragraph--` prefix (e.g. `"blocco_intro"` → `"paragraph--blocco_intro"`); `field_immagine*` plain URL strings are converted to the C1 file-object shape expected by `ParagraphResolver` adapters.
- Revalidate: 300s

**menu — Menu (native Drupal menu API — NOT through `apiGet()`) — ✅ ALIVE**

- URL: `/{locale}/api/menu/{menuName}`
- Function: `fetchMenu(menuName, locale)` in `drupal/menu.ts`
- Uses `fetch()` directly (different URL pattern: `/api/menu/` without `v1`)
- Response: `{ id, items: [{ id, title, url, weight, children: [...recursive] }] }`
- `url` may contain Drupal base path or `<nolink>` — normalized by `transformMenuToNavItems()`
- Revalidate: 600s

### Domain Layer

- `src/domain/filters/` — `registry.ts` (FILTER_REGISTRY, SLUG_OVERRIDES), `search-params.ts` (nuqs integration). `FilterOption` carries optional `baseCount` field — see Cross-filtering below.
- `src/domain/routing/` — `routing-registry.ts` (shadow mode), `section-config.ts`

### Routing

Entry point: `src/app/[locale]/[...slug]/page.tsx` (~1008 lines)

Module-scope constants in `page.tsx`:

- `PRODUCTS_MASTER_SLUGS` — one slug per locale for the all-products hub page
- `CONTENT_LISTING_SLUGS` — all locales for blog, projects, environments, showroom, download_catalogues
- `LISTING_SLUG_OVERRIDES` — product listing slugs that must bypass Drupal resolution (derived from `PRODUCT_LISTING_SLUGS` + `LEGACY_SEO_ALIASES`)
- `CATEGORY_LISTING_TYPES` — product types that use category-NID-based listing: `prodotto_arredo`, `prodotto_illuminazione`, `prodotto_tessuto`
- `TAXONOMY_LISTING_MAP` — maps taxonomy bundles (`mosaico_collezioni`, `mosaico_colori`, `vetrite_collezioni`, `vetrite_colori`) to their product type and TID key

Co-located helpers: `src/app/[locale]/[...slug]/_helpers.ts`

- `resolveHubParentNid(productType, locale)` — returns hub parent NID for a product type. Arredo uses hardcoded `ARREDO_INDOOR_PARENT_NID` (4261); all other types resolve the base listing path from `FILTER_REGISTRY` via `resolvePath`.

**Stage 0 — PRODUCTS_MASTER_SLUGS**
Single-segment slugs that render `ProductsMasterPage` (all-products hub). Checked before all other stages.

**Stage 0.5 — CONTENT_LISTING_SLUGS**
Single-segment slugs for content listings (blog, projects, environments, showroom, download_catalogues). Checked before listing slug overrides to prevent misrouting through `getSectionConfigAsync`.

**Stage 1 — LISTING_SLUG_OVERRIDES**
Single-segment product listing slugs that bypass Drupal resolution. These slugs have Drupal nodes (categoria_blog, documento, page) with the same alias that would be rendered instead of the correct product listing. If `resolvePath` returns `bundle === 'page'` for a registry-only slug, falls through to entity rendering (handles info-tecniche-\* CMS pages). Delegates to `ListingContent` (Suspense boundary with `ProductListingSkeleton`).

**Stage 2 — Arredo descriptive categories (slug-based)**
2-segment URLs under arredo prefix. Matches the second slug against NID 3522 children (slugified). If matched, fetches content+blocks by NID and renders via `Categoria` template. Exceptions: `/arredo/outdoor` (hardcoded NID 348, no sidebar) is handled inline; `slug.length >= 3` falls through to product-detail interception.

**Stage 3 — Arredo finiture page**
When the last segment is `'finiture'` and the preceding path resolves to `prodotto_arredo`, renders `ProdottoArredoFiniture`.

**Stage 4 — Product detail via resolve-path**
2+ segment URLs. `resolvePath()` runs first. Handles all 6 product bundles plus `showroom` detail:

- `prodotto_mosaico` → `fetchMosaicProduct` → `MosaicProductPreview` (DS blocks) + `PageBreadcrumb`
- `prodotto_vetrite` → `fetchVetriteProduct` → `ProdottoVetrite` (legacy + `vetriteToLegacyNode`) + `PageBreadcrumb`
- `prodotto_tessuto` → `fetchTextileProduct` → `ProdottoTessuto` (legacy + `textileToLegacyNode`) + `PageBreadcrumb`
- `prodotto_pixall` → `fetchPixallProduct` → `ProdottoPixall` (legacy + `pixallToLegacyNode`) + `PageBreadcrumb`
- `prodotto_arredo` → `fetchArredoProduct` → `ProdottoArredo` (legacy + `arredoToLegacyNode`) + `PageBreadcrumb`. Injects `_finitureHref` into legacy node.
- `prodotto_illuminazione` → `fetchIlluminazioneProduct` → `ProdottoIlluminazione` (legacy + `illuminazioneToLegacyNode`) + `PageBreadcrumb`
- `showroom` → `fetchShowroomDetail` (lazy import) → `Showroom` + `PageBreadcrumb`
- Taxonomy bundles in `TAXONOMY_LISTING_MAP` → `renderProductListing()` passing resolved TID directly (no extra taxonomy fetch)
- `categoria` bundle (non-descriptive) → matched against `CATEGORY_LISTING_TYPES` basePaths across all locales → `renderProductListing()` with `resolvedCategoryNid`

**Stage 5 — Pixall under Mosaic hub**
`/mosaico/pixall` (and locale equivalents) resolves as `categoria` NID 342 but must render the Pixall product listing. Detected when `getSectionConfigAsync` returns `productType === 'prodotto_pixall'` → `renderProductListing({ productType: 'prodotto_pixall' })`.

**Stage 6 — Multi-slug listing interception**
2+ segment URLs not matched by stages 2–5. `getSectionConfigAsync` + `parseFiltersFromUrl`: if at least one active filter is present and the resolved bundle is not a non-category-type `categoria` node → `renderProductListing()`. Mosaico/vetrite `categoria` nodes (e.g. `/mosaic/marble` NID 319) fall through to `getPageData` → `Categoria` template.

**Stage 7 — Drupal entity resolution (getPageData)**
`getPageData(locale, drupalPath)` is `React.cache()`-wrapped, deduplicating between `generateMetadata` and `SlugPage`. Primary path: `resolvePath` → `content/{nid}` + `blocks/{nid}` in parallel. When `content/{nid}` returns empty, creates a minimal entity (`type + id + field_blocchi`) so `COMPONENT_MAP` can dispatch correctly. Rendered via `COMPONENT_MAP[getComponentName(entityType)]`.

**Interception: node--categoria (subcategory listing)**
After `getPageData`, if `type === 'node--categoria'` and `getSectionConfigAsync` returns a config for a `CATEGORY_LISTING_TYPES` product type → renders via `renderProductListing()`. Non-category types (mosaico/vetrite) fall through to `Categoria` template.

**Interception: node--page with field_page_id**
Drupal uses `node--page` nodes as hub pages for listing sections. `field_page_id` maps to a content type:

- `tessile` → `prodotto_tessuto` → `renderProductListing()`
- `progetti`, `environments`, `blog`, `showroom`, `download_catalogues` → fetcher + legacy listing component

#### Cross-filtering and baseCount

Mosaic and vetrite listings use `baseCount` to provide two-tier filter visibility in the sidebar. When a P0 filter (collection or color) is active, the render pipeline fetches `baseCounts` — product counts with only P0 active (no P1 shape/finish). Filter options use `baseCount` as follows:

- `baseCount === 0` — option does not exist for the active P0 filter → hidden
- `baseCount > 0` but `count === 0` — option exists but no products match the current P1 combination → dimmed
- `count > 0` — option has matches → shown normally

`baseCount` is surfaced on `FilterOption` (defined in `registry.ts`) and consumed by `CheckboxFilter`, `ColorSwatchFilter`, and `ImageListFilter`.

#### PageBreadcrumb

`src/components/composed/PageBreadcrumb.tsx` — async server component. Renders URL-based breadcrumbs on all pages. For 2+ segment paths, fetches sibling pages at the same level: resolves the parent path via `resolvePath`, fetches `categories/{parentNid}` in both current locale and EN, then resolves each sibling's alias via EN slug path. The last breadcrumb segment includes a siblings dropdown when at least 2 siblings exist. `lastLabel` prop accepts the CMS node title to override the URL-derived humanized label.

#### Revalidation Strategy

| Entity Type                        | TTL    | Source                            |
| ---------------------------------- | ------ | --------------------------------- |
| Products (all 6 types)             | 60 s   | type-specific product fetchers    |
| Content entity fields              | 300 s  | `content.ts`                      |
| Paragraph blocks                   | 300 s  | `blocks.ts`                       |
| Hub term listings (colors, colls.) | 3600 s | `mosaic-hub.ts`, `vetrite-hub.ts` |
| Hub category listings              | 3600 s | `category-hub.ts`                 |
| URL alias resolution               | 3600 s | `resolve-path.ts`                 |
| Menus                              | 600 s  | `menu.ts`                         |

#### Server Actions

- `src/lib/actions/load-more-products.ts` — `loadMoreProducts` (product pagination via "Load More" button)
- `src/lib/get-translated-path.ts` — `getTranslatedPath` (`'use server'` wrapper for cross-locale path resolution in client components)

### Dev Preview Routes

- `src/app/dev/layout.tsx` — Dev-only layout with fonts + tokens + theme, no Header/Footer/i18n. Guarded by `NODE_ENV !== 'development'`.
- Convention: draft pages go in `src/app/dev/preview/[name]/page.tsx` (e.g. `gen-intro/page.tsx`). Each page has its own `NODE_ENV` guard.
- Used by /ds workflow Get-a-Draft. Delete the preview page after extracting the component.
- URL: `localhost:3000/dev/preview/[name]`
