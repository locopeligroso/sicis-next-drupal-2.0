# Architecture

> Extracted from CLAUDE.md. See CLAUDE.md for project overview, commands, and conventions.

## Architecture

### Data Layer

All Drupal data comes exclusively from the REST endpoints below. No other data source is used.
One exception: `ProdottoArredo` and `ProdottoIlluminazione` templates use a JSON:API fallback to fetch English tessuti taxonomy terms when current locale data is missing — this is the only JSON:API usage in the project.

**REST API client (`src/lib/api/`):**

- `client.ts` — `apiGet` (base fetcher), `stripDomain`, `stripLocalePrefix`, `emptyToNull` (normalizers)
- `types.ts` — Response interfaces for all endpoints (source of truth for REST response shapes)
- `entity.ts` — `fetchEntity` (entity ❌ DEAD — do not call at runtime)
- `products.ts` — `fetchProducts` (products ❌ DEAD), `fetchFilterCounts` (product-counts ❌ DEAD), `getCategoriaProductType`
- `filters.ts` — `fetchFilterOptions` (taxonomy ❌ DEAD), `fetchCategoryOptions` (category-options ❌ DEAD), `fetchAllFilterOptions`
- `listings.ts` — `fetchBlogPosts` (blog ❌ DEAD), `fetchProjects` (projects ❌ DEAD), `fetchEnvironments` (environments ❌ DEAD), `fetchShowrooms` (showrooms ❌ DEAD), `fetchDocuments` (documents ❌ DEAD)
- `categories.ts` — `fetchSubcategories` (subcategories ❌ DEAD), `fetchPagesByCategory` (pages-by-category ❌ DEAD)
- `translate-path.ts` — `getTranslatedPath` (translate-path ❌ DEAD)
- `image-fallback.ts` — `enrichWithFallbackImages` (extracts images from entity endpoint for items missing imageUrl)
- `resolve-path.ts` — `resolvePath` (resolve-path) — resolves URL alias → `{ nid, bundle, locale, aliases }`. Foundation for all new REST routing.
- `mosaic-product.ts` — `fetchMosaicProduct` (mosaic-product) — single mosaic product by NID, normalized with collection + grouts + documents
- `vetrite-product.ts` — `fetchVetriteProduct` (vetrite-product) — single vetrite product by NID, normalized with collection + documents
- `textile-product.ts` — `fetchTextileProduct` (textile-product) — single textile product by NID, normalized with finiture + maintenance + documents
- `pixall-product.ts` — `fetchPixallProduct` (pixall-product) — single pixall product by NID
- `mosaic-product-listing.ts` — `fetchMosaicProductListing` (mosaic-products) — TID-based listing, no pagination
- `vetrite-product-listing.ts` — `fetchVetriteProductListing` (vetrite-products) — TID-based listing, no pagination
- `textile-product-listing.ts` — `fetchTextileProductListing` (textile-products) — NID-based listing
- `pixall-product-listing.ts` — `fetchPixallProductListing` (pixall-products) — listing, no filters
- `vetrite-hub.ts` — `fetchVetriteColors`, `fetchVetriteCollections` (vetrite-colors, vetrite-collections) — hub term listings, no pagination
- `arredo-product-listing.ts` — `fetchArredoProductListing` (arredo-products/{categoryNid}) — NID-based listing, accepts `"all"` for unfiltered
- `illuminazione-product-listing.ts` — `fetchIlluminazioneProductListing` (illuminazione-products/{categoryNid}) — NID-based listing, accepts `"all"` for unfiltered
- `illuminazione-product.ts` — `fetchIlluminazioneProduct` (illuminazione-product/{nid}) — single illuminazione product by NID, normalized with documents
- `category-hub.ts` — `fetchHubCategories` (categories/{parentNid}) — child node--categoria items by parent NID; deduplicates by NID. Replaces dead category-options (V4)
- `content.ts` — `fetchContent` (content/{nid}) — single content entity by NID, raw fields. Replaces dead entity endpoint (C1) for basic field access. Revalidate: 300s
- `blocks.ts` — `fetchBlocks` (blocks/{nid}) — paragraph blocks for a node by NID; normalizes `type` with `paragraph--` prefix and converts `field_immagine*` strings to C1 file-object shape. Replaces dead entity endpoint (C1) for `field_blocchi`. Revalidate: 300s

**Drupal utilities (`src/lib/drupal/`):**

- `config.ts` — DRUPAL_BASE_URL (single source of truth)
- `menu.ts` — `fetchMenu` (menu — ✅ still active), `transformMenuToNavItems` — uses `fetch()` directly (NOT `apiGet`), different URL pattern (`/api/menu/` without `v1`)
- `image.ts` — `getDrupalImageUrl` (extracts `uri.url` from entity endpoint image shape)
- `index.ts` — barrel re-export

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

| Endpoint               | Purpose                                   | URL pattern                                   |
| ---------------------- | ----------------------------------------- | --------------------------------------------- |
| resolve-path           | URL alias → entity metadata               | `resolve-path?path=...`                       |
| mosaic-product         | Single mosaic by NID                      | `mosaic-product/{nid}`                        |
| vetrite-product        | Single vetrite by NID                     | `vetrite-product/{nid}`                       |
| textile-product        | Single textile by NID                     | `textile-product/{nid}`                       |
| pixall-product         | Single pixall by NID                      | `pixall-product/{nid}`                        |
| illuminazione-product  | Single illuminazione by NID               | `illuminazione-product/{nid}`                 |
| mosaic-products        | Mosaic listing by TID                     | `mosaic-products/{collectionTid}/{colorTid}`  |
| vetrite-products       | Vetrite listing by TID                    | `vetrite-products/{collectionTid}/{colorTid}` |
| textile-products       | Textile listing by NID                    | `textile-products/{categoryNid}`              |
| pixall-products        | All pixall products                       | `pixall-products`                             |
| arredo-products        | Arredo listing by category NID            | `arredo-products/{categoryNid}`               |
| illuminazione-products | Illuminazione listing by category NID     | `illuminazione-products/{categoryNid}`        |
| mosaic-colors          | Hub mosaic colors                         | `mosaic-colors`                               |
| mosaic-collections     | Hub mosaic collections                    | `mosaic-collections`                          |
| vetrite-colors         | Hub vetrite colors                        | `vetrite-colors`                              |
| vetrite-collections    | Hub vetrite collections                   | `vetrite-collections`                         |
| categories/{parentNid} | Child node--categoria by parent NID       | `categories/{parentNid}`                      |
| content/{nid}          | Basic content fields by NID (replaces C1) | `content/{nid}`                               |
| blocks/{nid}           | Paragraph blocks for a node (replaces C1) | `blocks/{nid}`                                |

**❌ DEAD — Old generic Views (confirmed 404 on current Drupal backend):**

| Endpoint          | Former purpose          | Replaced by                                                                    |
| ----------------- | ----------------------- | ------------------------------------------------------------------------------ |
| entity            | Full entity by path     | `content/{nid}` + `blocks/{nid}` + type-specific fetchers                      |
| translate-path    | Cross-locale path       | `resolve-path` (aliases map included in response)                              |
| products          | Generic product listing | Type-specific `*-products` endpoints                                           |
| product-counts    | Filter value counts     | No replacement yet                                                             |
| taxonomy          | Taxonomy terms          | `mosaic-colors`, `mosaic-collections`, `vetrite-colors`, `vetrite-collections` |
| category-options  | Category nodes          | `categories/{parentNid}`                                                       |
| blog              | Blog posts              | No replacement yet                                                             |
| projects          | Projects                | No replacement yet                                                             |
| environments      | Environments            | No replacement yet                                                             |
| showrooms         | Showrooms               | No replacement yet                                                             |
| documents         | Documents               | No replacement yet                                                             |
| subcategories     | Child categories        | `categories/{parentNid}`                                                       |
| pages-by-category | Pages by category       | No replacement yet                                                             |

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

- `src/domain/filters/` — `registry.ts` (FILTER_REGISTRY, SLUG_OVERRIDES), `search-params.ts` (nuqs integration)
- `src/domain/routing/` — `routing-registry.ts` (shadow mode), `section-config.ts`

### Routing

Entry point: `src/app/[locale]/[...slug]/page.tsx`

**Stage 1 — LISTING_SLUG_OVERRIDES**
Set of hardcoded product slugs (mosaico, mosaic, arredo, furniture-and-accessories, pixall, illuminazione, vetrite variants, tessile variants, etc.) that bypass `translatePath`. These slugs have Drupal nodes (categoria_blog, documento, page) with the same alias that would be rendered instead of the correct product listing. `getSectionConfigAsync` resolves the `productType` → `renderProductListing()`.

**Stage 1.5 — Product detail via resolve-path (NEW)**
URLs with 2+ segments. `resolvePath()` is called BEFORE the listing interception. If the path resolves to a product bundle (`prodotto_mosaico`, `prodotto_vetrite`, `prodotto_tessuto`), the type-specific fetcher is called and the product page rendered. Mosaico uses DS Spec\* blocks; vetrite and tessuto use legacy templates with adapter functions (`vetriteToLegacyNode`, `textileToLegacyNode`).

**Stage 2 — Multi-slug interception**
URLs with 2+ segments (e.g. `/mosaico/murano-smalto`). `getSectionConfigAsync` runs first; if a config is found and `parseFiltersFromUrl` detects at least one active filter → `renderProductListing()` with filter active.

**Stage 3 — Drupal entity resolution**
`resolvePath()` returns the NID and bundle; the appropriate type-specific fetcher is called. For content types not yet migrated, `fetchContent` (content/{nid}) and `fetchBlocks` (blocks/{nid}) replace the dead entity endpoint. Rendered via `COMPONENT_MAP[getComponentName(entityType)]`.

**Interception: node--categoria**
If `translatePath` resolves to `node--categoria` AND `getSectionConfigAsync` returns a config with `filterField` set → the node is a subcategory listing, not a hub category. Renders via `renderProductListing()` using the Drupal node title for the heading.

**Interception: node--page with field_page_id**
Drupal uses `node--page` nodes as hub pages for listing sections. `field_page_id` maps to a content type:

- `tessile` → `prodotto_tessuto` → `renderProductListing()`
- `progetti`, `environments`, `blog`, `showroom`, `download_catalogues` → fetcher + legacy listing component

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
