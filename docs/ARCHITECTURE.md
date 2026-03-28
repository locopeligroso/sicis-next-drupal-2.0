# Architecture

> Extracted from CLAUDE.md. See CLAUDE.md for project overview, commands, and conventions.

## Architecture

### Data Layer

All Drupal data comes exclusively from the REST endpoints below. No other data source is used.
One exception: `ProdottoArredo` and `ProdottoIlluminazione` templates use a JSON:API fallback to fetch English tessuti taxonomy terms when current locale data is missing — this is the only JSON:API usage in the project.

**REST API client (`src/lib/api/`):**

- `client.ts` — `apiGet` (base fetcher), `stripDomain`, `stripLocalePrefix`, `emptyToNull` (normalizers)
- `types.ts` — Response interfaces for all endpoints (source of truth for REST response shapes)
- `entity.ts` — `fetchEntity` (entity ⚠️ LEGACY)
- `products.ts` — `fetchProducts` (products ⚠️ LEGACY), `fetchFilterCounts` (product-counts ⚠️ LEGACY), `getCategoriaProductType`
- `filters.ts` — `fetchFilterOptions` (taxonomy ⚠️ LEGACY), `fetchCategoryOptions` (category-options ⚠️ LEGACY), `fetchAllFilterOptions`
- `listings.ts` — `fetchBlogPosts` (blog ⚠️ LEGACY), `fetchProjects` (projects ⚠️ LEGACY), `fetchEnvironments` (environments ⚠️ LEGACY), `fetchShowrooms` (showrooms ⚠️ LEGACY), `fetchDocuments` (documents ⚠️ LEGACY)
- `categories.ts` — `fetchSubcategories` (subcategories ⚠️ LEGACY), `fetchPagesByCategory` (pages-by-category ⚠️ LEGACY)
- `translate-path.ts` — `getTranslatedPath` (translate-path ⚠️ LEGACY — Drupal view to be rewritten)
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

**Drupal utilities (`src/lib/drupal/`):**

- `config.ts` — DRUPAL_BASE_URL (single source of truth)
- `menu.ts` — `fetchMenu` (menu ⚠️ LEGACY), `transformMenuToNavItems` — uses `fetch()` directly (NOT `apiGet`), different URL pattern (`/api/menu/` without `v1`)
- `image.ts` — `getDrupalImageUrl` (extracts `uri.url` from entity endpoint image shape)
- `index.ts` — barrel re-export

#### Drupal REST Endpoint Reference

All data from Drupal flows through these endpoints. This is the **sole source of truth** for Drupal data.

**Conventions:**

- Custom endpoints go through `apiGet()` which inserts `/api/v1/` after locale: `/{locale}/api/v1/{endpoint}`
- Paginated responses (products, blog, projects, environments, showrooms, documents, subcategories, pages-by-category) wrap items: `{ items: T[], total: number, page: number, pageSize: number }`
- Pagination param: `items_per_page` (Drupal Views native) + `page` (0-based)
- Paths in Views responses contain the full Drupal domain URL — normalize with `stripDomain()` + `stripLocalePrefix()`
- Image URLs: empty string `""` when no image (not `null`) — normalize with `emptyToNull()`

**Endpoint status overview:**

The project is migrating from generic Drupal Views endpoints to dedicated type-specific endpoints. **NEW endpoints are definitive.** Old endpoints use generic Views with string-based query params and server-side pagination; new endpoints use NID/TID path params, return flat arrays, and have no pagination. Old Drupal views are being rewritten — the frontend still references them but they will be replaced by new dedicated endpoints following the same pattern as the product endpoints.

**✅ NEW — Definitive endpoints (type-specific, NID/TID-based, no pagination):**

| Endpoint           | Purpose                     | URL pattern                                   |
| ------------------ | --------------------------- | --------------------------------------------- |
| resolve-path       | URL alias → entity metadata | `resolve-path?path=...`                       |
| mosaic-product     | Single mosaic by NID        | `mosaic-product/{nid}`                        |
| vetrite-product    | Single vetrite by NID       | `vetrite-product/{nid}`                       |
| textile-product    | Single textile by NID       | `textile-product/{nid}`                       |
| pixall-product     | Single pixall by NID        | `pixall-product/{nid}`                        |
| mosaic-products    | Mosaic listing by TID       | `mosaic-products/{collectionTid}/{colorTid}`  |
| vetrite-products   | Vetrite listing by TID      | `vetrite-products/{collectionTid}/{colorTid}` |
| textile-products   | Textile listing by NID      | `textile-products/{categoryNid}`              |
| pixall-products    | All pixall products         | `pixall-products`                             |
| mosaic-colors      | Hub mosaic colors           | `mosaic-colors`                               |
| mosaic-collections | Hub mosaic collections      | `mosaic-collections`                          |

**⚠️ LEGACY — Old generic Views (to be rewritten as dedicated endpoints on Drupal):**

| Endpoint          | Purpose                 | URL pattern                                   |
| ----------------- | ----------------------- | --------------------------------------------- |
| entity            | Full entity by path     | `entity?path=...`                             |
| translate-path    | Cross-locale path       | `translate-path?path=...&from=...&to=...`     |
| products          | Generic product listing | `products/{type}?items_per_page=...&page=...` |
| product-counts    | Filter value counts     | `products/{type}/counts/{key}`                |
| taxonomy          | Taxonomy terms          | `taxonomy/{vocabulary}`                       |
| category-options  | Category nodes          | `category-options/{type}`                     |
| blog              | Blog posts              | `blog?items_per_page=...&page=...`            |
| projects          | Projects                | `projects?items_per_page=...&page=...`        |
| environments      | Environments            | `environments?items_per_page=...&page=...`    |
| showrooms         | Showrooms               | `showrooms`                                   |
| documents         | Documents               | `documents?items_per_page=...&page=...`       |
| subcategories     | Child categories        | `subcategories/{parentNid}`                   |
| pages-by-category | Pages by category       | `pages-by-category/{parentNid}`               |
| menu              | Navigation menu         | `/api/menu/{name}` (no `v1`, uses `fetch()`)  |

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

**entity — Entity (single entity by path) — ⚠️ LEGACY — Drupal view to be rewritten.**

- URL: `/{locale}/api/v1/entity?path={pathWithoutLocale}`
- Function: `fetchEntity(path, locale)` in `entity.ts`
- Response: `{ meta: { type, bundle, id (NID), uuid, locale, path }, data: { ...allFields } }`
- Returns the fully pre-resolved entity with all relationships and paragraphs inline. No secondary fetches needed.
- Image shape inside `data`: `{ type: "file--file", uri: { url: "https://..." }, meta: { alt, width, height } }`
- Revalidate: 60s

**translate-path — Translate Path (cross-locale path resolution) — ⚠️ LEGACY — Drupal view to be rewritten**

- URL: `/{locale}/api/v1/translate-path?path={path}&from={locale}&to={targetLocale}`
- Function: `getTranslatedPath(path, fromLocale, toLocale)` in `translate-path.ts`
- Response: `{ translatedPath: "/en/mosaic" | null }`
- Revalidate: 3600s

**products — Products (paginated product listing) — ⚠️ LEGACY — Drupal view to be rewritten. Being replaced by type-specific listing endpoints.**

- URL: `/{locale}/api/v1/products/{productType}?items_per_page=N&page=N&sort=...&{filterParams}`
- Function: `fetchProducts(options)` in `products.ts`
- productType: `prodotto_mosaico` | `prodotto_vetrite` | `prodotto_arredo` | `prodotto_tessuto` | `prodotto_pixall` | `prodotto_illuminazione`
- Filter query params (mapped from Drupal fields via `DRUPAL_FIELD_TO_REST_PARAM`): `collection`, `color`, `shape`, `finish`, `grout`, `texture`, `fabric`, `category`, `type`
- `category_id` (NID-based filtering) is NOT supported — the products endpoint silently ignores it. Use `category` (title-based) instead.
- `category` does NOT support multi-value (comma-separated or array) — only single value per request
- Response item: `{ id, type, title, subtitle, imageUrl, imageUrlMain, price, priceOnDemand ("0"|"1"|null), path }`
- `imageUrlMain` is the full-size image (field_immagine), `imageUrl` is the preview (field_immagine_anteprima)
- `type` comes without `node--` prefix (e.g. `"prodotto_arredo"`)
- `path` contains full Drupal domain URL
- Revalidate: 60s

**product-counts — Filter Counts (aggregated counts per filter value) — ⚠️ LEGACY — Drupal view to be rewritten**

- URL: `/{locale}/api/v1/products/{productType}/counts/{filterKey}?{activeFilterParams}`
- Function: `fetchFilterCounts(productType, activeFilters, filterKey, drupalField, locale)` in `products.ts`
- filterKey: `collection` | `color` | `shape` | `finish` | `grout` | `texture` | `fabric` | `category` | `type`
- Response: `{ counts: { "Pluma": 42, "Blends": 88, ... } }`
- Active filters (excluding the one being counted) are passed as query params to get cross-filtered counts
- Revalidate: 60s

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

**taxonomy — Taxonomy Terms (vocabulary listing) — ⚠️ LEGACY — Drupal view to be rewritten**

- URL: `/{locale}/api/v1/taxonomy/{vocabulary}`
- Function: `fetchFilterOptions(taxonomyType, locale)` in `filters.ts`
- vocabulary: extracted from `taxonomyType` by splitting on `--` (e.g. `taxonomy_term--mosaico_collezioni` → `mosaico_collezioni`)
- All vocabularies: `mosaico_collezioni`, `mosaico_colori`, `vetrite_collezioni`, `vetrite_colori`, `vetrite_finiture`, `vetrite_textures`, `arredo_finiture`, `tessuto_colori`, `tessuto_finiture`, `tessuto_tipologie`, `tessuto_manutenzione`
- Response item: `{ id, name, weight (string), imageUrl (string, "" if empty) }` — **no `path` field**
- Slug is derived from `name` via `deriveSlug()` (slugify fallback)
- Empty vocabularies (0 terms in Drupal): `arredo_finiture`, `tessuto_finiture`
- Revalidate: 3600s

**category-options — Category Options (node--categoria listing for a product type) — ⚠️ LEGACY — Drupal view to be rewritten**

- URL: `/{locale}/api/v1/category-options/{productType}`
- Function: `fetchCategoryOptions(productType, locale)` in `filters.ts`
- Used for product types that organize by `node--categoria` instead of taxonomy: `prodotto_arredo`, `prodotto_illuminazione`, `prodotto_tessuto`
- Response: `{ items: [...] }` — **no `total`, `page`, `pageSize`** (not paginated)
- Response item: `{ id, name, imageUrl, path, parentId, parentPath }`
- `parentId`/`parentPath` present when the categoria has a parent (hub) categoria
- Revalidate: 3600s

**blog — Blog Posts — ⚠️ LEGACY — Drupal view to be rewritten**

- URL: `/{locale}/api/v1/blog?items_per_page=N&page=N`
- Function: `fetchBlogPosts(locale, limit, offset)` in `listings.ts`
- Response item: `{ id, type ("articolo"|"news"|"tutorial"), title, imageUrl, path, created (Unix timestamp string) }`
- `created` is a Unix timestamp (e.g. `"1772451555"`) — converted to ISO 8601 by `unixToIso()`
- Revalidate: 300s

**projects — Projects — ⚠️ LEGACY — Drupal view to be rewritten**

- URL: `/{locale}/api/v1/projects?items_per_page=N&page=N`
- Function: `fetchProjects(locale, limit, offset)` in `listings.ts`
- Response item: `{ id, title, imageUrl, path, category }`
- Revalidate: 300s

**environments — Environments — ⚠️ LEGACY — Drupal view to be rewritten**

- URL: `/{locale}/api/v1/environments?items_per_page=N&page=N`
- Function: `fetchEnvironments(locale, limit, offset)` in `listings.ts`
- Response item: `{ id, title, imageUrl, path }`
- Revalidate: 300s

**showrooms — Showrooms — ⚠️ LEGACY — Drupal view to be rewritten**

- URL: `/{locale}/api/v1/showrooms`
- Function: `fetchShowrooms(locale)` in `listings.ts`
- Response item: `{ id, title, imageUrl, path, address, city, area, phone, email, gmapsUrl, externalUrl }`
- No pagination params used (returns all)
- Revalidate: 300s

**documents — Documents — ⚠️ LEGACY — Drupal view to be rewritten**

- URL: `/{locale}/api/v1/documents?items_per_page=N&page=N`
- Function: `fetchDocuments(locale, limit, offset)` in `listings.ts`
- Response item: `{ id, title, imageUrl, path, fileUrl, externalUrl, documentType, category }`
- Currently returns 0 items on staging (no `node--documento` content published)
- Revalidate: 300s

**subcategories — Subcategories (child node--categoria entities) — ⚠️ LEGACY — Drupal view to be rewritten**

- URL: `/{locale}/api/v1/subcategories/{parentNid}`
- Function: `fetchSubcategories(parentId, locale)` in `categories.ts`
- **parentNid must be the integer NID**, not UUID. Callers pass `node._nid` from entity endpoint response.
- Response item: `{ id, uuid (always null), title, imageUrl, path }`
- `path` contains full Drupal domain URL
- Revalidate: 300s

**pages-by-category — Pages by Category (node--page filtered by field_categoria) — ⚠️ LEGACY — Drupal view to be rewritten**

- URL: `/{locale}/api/v1/pages-by-category/{parentNid}?items_per_page=N&page=N`
- Function: `fetchPagesByCategory(parentId, locale, limit, offset)` in `categories.ts`
- **parentNid must be the integer NID**, not UUID. Callers pass `node._nid` from entity endpoint response.
- Response item: `{ id, title, imageUrl (often ""), path }`
- `path` contains full Drupal domain URL
- Revalidate: 300s

**menu — Menu (native Drupal menu API — NOT through `apiGet()`) — ⚠️ LEGACY — Drupal view to be rewritten**

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
`fetchEntity` (entity endpoint ⚠️ LEGACY) resolves path to a fully pre-resolved entity in one call. All relationships and paragraphs are inline — no secondary fetches needed. Rendered via `COMPONENT_MAP[getComponentName(entityType)]`.

**Interception: node--categoria**
If `translatePath` resolves to `node--categoria` AND `getSectionConfigAsync` returns a config with `filterField` set → the node is a subcategory listing, not a hub category. Renders via `renderProductListing()` using the Drupal node title for the heading.

**Interception: node--page with field_page_id**
Drupal uses `node--page` nodes as hub pages for listing sections. `field_page_id` maps to a content type:

- `tessile` → `prodotto_tessuto` → `renderProductListing()`
- `progetti`, `environments`, `blog`, `showroom`, `download_catalogues` → fetcher + legacy listing component

#### Revalidation Strategy

| Entity Type                          | TTL    | Source             |
| ------------------------------------ | ------ | ------------------ |
| Products (all 6 types)               | 60 s   | `node-resolver.ts` |
| Editorial (articolo, news, tutorial) | 300 s  | `node-resolver.ts` |
| Static pages (page, landing_page)    | 600 s  | `node-resolver.ts` |
| Taxonomy terms                       | 3600 s | `node-resolver.ts` |
| Menus                                | 600 s  | `menu.ts`          |
| Entity (entity endpoint, LEGACY)     | 60 s   | `entity.ts`        |

#### Server Actions

- `src/lib/actions/load-more-products.ts` — `loadMoreProducts` (product pagination via "Load More" button)
- `src/lib/get-translated-path.ts` — `getTranslatedPath` (`'use server'` wrapper for cross-locale path resolution in client components)

### Dev Preview Routes

- `src/app/dev/layout.tsx` — Dev-only layout with fonts + tokens + theme, no Header/Footer/i18n. Guarded by `NODE_ENV !== 'development'`.
- Convention: draft pages go in `src/app/dev/preview/[name]/page.tsx` (e.g. `gen-intro/page.tsx`). Each page has its own `NODE_ENV` guard.
- Used by /ds workflow Get-a-Draft. Delete the preview page after extracting the component.
- URL: `localhost:3000/dev/preview/[name]`
