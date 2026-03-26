# Drupal REST API — Quick Reference

> Generated: 2026-03-25 | Source of truth: `src/lib/api/`

## Base URL Pattern

```
{DRUPAL_BASE_URL}/{locale}/api/v1/{endpoint}     # All REST endpoints (via apiGet)
{DRUPAL_BASE_URL}/{locale}/api/menu/{menuName}    # Menu API (via fetch directly)
```

## Endpoint Cheat Sheet

| Code    | Endpoint                                                                         | Function                                   | TTL   |
| ------- | -------------------------------------------------------------------------------- | ------------------------------------------ | ----- |
| **R1**  | `GET /{locale}/api/v1/resolve-path?path={alias}`                                 | `resolvePath(path, locale)`                | 3600s |
| **P1**  | `GET /{locale}/api/v1/mosaic-product/{nid}`                                      | `fetchMosaicProduct(nid, locale)`          | 60s   |
| **P2**  | `GET /{locale}/api/v1/vetrite-product/{nid}`                                     | `fetchVetriteProduct(nid, locale)`         | 60s   |
| **P3**  | `GET /{locale}/api/v1/textile-product/{nid}`                                     | `fetchTextileProduct(nid, locale)`         | 60s   |
| **C1**  | `GET /{locale}/api/v1/entity?path={path}` _(legacy, disabled locally)_           | `fetchEntity(path, locale)`                | 60s   |
| **C2**  | `GET /{locale}/api/v1/translate-path?path=&from=&to=` _(legacy, fallback to R1)_ | `getTranslatedPath(path, from, to)`        | 3600s |
| **V1**  | `GET /{locale}/api/v1/products/{productType}`                                    | `fetchProducts(options)`                   | 60s   |
| **V2**  | `GET /{locale}/api/v1/products/{type}/counts/{filter}`                           | `fetchFilterCounts(...)`                   | 60s   |
| **V3**  | `GET /{locale}/api/v1/taxonomy/{vocabulary}`                                     | `fetchFilterOptions(taxType, locale)`      | 3600s |
| **V4**  | `GET /{locale}/api/v1/category-options/{productType}`                            | `fetchCategoryOptions(type, locale)`       | 3600s |
| **V5**  | `GET /{locale}/api/v1/blog`                                                      | `fetchBlogPosts(locale, limit, offset)`    | 300s  |
| **V6**  | `GET /{locale}/api/v1/projects`                                                  | `fetchProjects(locale, limit, offset)`     | 300s  |
| **V7**  | `GET /{locale}/api/v1/environments`                                              | `fetchEnvironments(locale, limit, offset)` | 300s  |
| **V8**  | `GET /{locale}/api/v1/showrooms`                                                 | `fetchShowrooms(locale)`                   | 300s  |
| **V9**  | `GET /{locale}/api/v1/documents`                                                 | `fetchDocuments(locale, limit, offset)`    | 300s  |
| **V10** | `GET /{locale}/api/v1/subcategories/{parentNid}`                                 | `fetchSubcategories(nid, locale)`          | 300s  |
| **V11** | `GET /{locale}/api/v1/pages-by-category/{parentNid}`                             | `fetchPagesByCategory(nid, locale)`        | 300s  |
| **M1**  | `GET /{locale}/api/menu/{menuName}`                                              | `fetchMenu(name, locale)`                  | 600s  |

## Product Types

| Product Type             | Base Path (IT)      | P0 Filters        | P1 Filters    | Card Ratio |
| ------------------------ | ------------------- | ----------------- | ------------- | ---------- |
| `prodotto_mosaico`       | `/mosaico`          | collection, color | shape, finish | 1/1        |
| `prodotto_vetrite`       | `/vetrite`          | collection, color | —             | 1/2        |
| `prodotto_arredo`        | `/arredo`           | subcategory       | —             | 4/3        |
| `prodotto_tessuto`       | `/prodotti-tessili` | category          | type          | 4/3        |
| `prodotto_pixall`        | `/mosaico/pixall`   | —                 | color, shape  | 1/1        |
| `prodotto_illuminazione` | `/illuminazione`    | subcategory       | —             | 4/3        |

## V1 Filter Query Params

| Param        | Drupal Field                                            | Used By                                |
| ------------ | ------------------------------------------------------- | -------------------------------------- |
| `collection` | `field_collezione.name`                                 | Mosaico, Vetrite                       |
| `color`      | `field_colori.name` / `field_colore.name`               | Mosaico, Vetrite, Tessuto              |
| `shape`      | `field_forma.name`                                      | Mosaico, Pixall                        |
| `finish`     | `field_finitura.name` / `field_finitura_tessuto.name`   | Mosaico, Vetrite, Tessuto              |
| `grout`      | `field_stucco.name`                                     | Mosaico, Pixall                        |
| `texture`    | `field_texture.name`                                    | Vetrite                                |
| `fabric`     | `field_tessuto.name`                                    | Arredo                                 |
| `category`   | `field_categoria.title`                                 | All (title-based only, no multi-value) |
| `type`       | `field_tipologia.name` / `field_tipologia_tessuto.name` | Tessuto                                |

## Key Gotchas

- **V10/V11 require NID** (integer), not UUID. Pass `node._nid` from C1 response.
- **`category` filter** does NOT support multi-value or NID-based filtering.
- **Image empty = `""`** not `null`. Always use `emptyToNull()`.
- **Taxonomy terms** have NO `path` field. Slug derived from `name` via `deriveSlug()`.
- **Showroom/Documento** have NO `field_blocchi` — Drupal returns 400 if included.
- **`field_prezzo_eu`** is `{ value: string }` in Vetrite/Arredo but plain `string` in Tessuto.
- **Link fields** are polymorphic: `string` OR `{ uri, title }` — check with `typeof`.
- **Blog `created`** is Unix timestamp string — normalize with `unixToIso()`.
- **Menu API** uses `/api/menu/` pattern (no `v1`), different from entity endpoints.

## Pagination

All Views endpoints: `items_per_page=N&page=N` (0-based page index).

Response wrapper: `{ items: T[], total: number, page: number, pageSize: number }`

Exception: V4 (category-options) returns `{ items: [...] }` without total/page/pageSize.

## Normalizer Functions

| Function                   | File            | Purpose                   |
| -------------------------- | --------------- | ------------------------- |
| `stripDomain(url)`         | client.ts       | Full URL → path only      |
| `stripLocalePrefix(path)`  | client.ts       | `/it/path` → `/path`      |
| `emptyToNull(value)`       | client.ts       | `""` → `null`             |
| `toAbsoluteUrl(url)`       | products.ts     | Relative → absolute URL   |
| `unixToIso(ts)`            | listings.ts     | Unix timestamp → ISO 8601 |
| `deriveSlug(path, name)`   | filters.ts      | Name → URL-safe slug      |
| `getDrupalImageUrl(field)` | drupal/image.ts | Image field → URL string  |

## Source Files

```
src/lib/api/
  client.ts       — apiGet, stripDomain, stripLocalePrefix, emptyToNull
  types.ts        — All response interfaces
  resolve-path.ts — R1 resolvePath (URL alias → nid, bundle, aliases)
  mosaic-product.ts — P1 fetchMosaicProduct (normalized with collection, grouts, documents)
  vetrite-product.ts — P2 fetchVetriteProduct (normalized with collection, documents)
  textile-product.ts — P3 fetchTextileProduct (normalized with finiture, maintenance, documents)
  entity.ts       — C1 fetchEntity (legacy, disabled locally)
  products.ts     — V1 fetchProducts, V2 fetchFilterCounts, getCategoriaProductType
  filters.ts      — V3 fetchFilterOptions, V4 fetchCategoryOptions, fetchAllFilterOptions
  listings.ts     — V5-V9 fetchBlogPosts, fetchProjects, fetchEnvironments, fetchShowrooms, fetchDocuments
  categories.ts   — V10 fetchSubcategories, V11 fetchPagesByCategory
  translate-path.ts — C2 getTranslatedPath
  image-fallback.ts — enrichWithFallbackImages

src/lib/drupal/
  config.ts       — DRUPAL_BASE_URL
  menu.ts         — M1 fetchMenu, transformMenuToNavItems
  image.ts        — getDrupalImageUrl

src/domain/filters/
  registry.ts     — FILTER_REGISTRY, SLUG_OVERRIDES, deslugify, getFilterConfig
  search-params.ts — nuqs integration, parseFiltersFromUrl

src/domain/routing/
  routing-registry.ts — Menu-derived routing (shadow mode)
  section-config.ts   — Hardcoded slug sets, getSectionConfig(Async)
```
