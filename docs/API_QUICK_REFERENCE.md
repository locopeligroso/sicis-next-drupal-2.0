# Drupal REST API — Quick Reference

> Updated: 2026-03-30 | Source of truth: `src/lib/api/`

## Base URL Pattern

```
{DRUPAL_BASE_URL}/{locale}/api/v1/{endpoint}     # All REST endpoints (via apiGet)
{DRUPAL_BASE_URL}/{locale}/api/menu/{menuName}    # Menu API (via fetch directly)
```

## Active Endpoints

| Endpoint                   | URL                                                    | Function                                           | TTL   |
| -------------------------- | ------------------------------------------------------ | -------------------------------------------------- | ----- |
| **resolve-path**           | `GET /{locale}/api/v1/resolve-path?path={alias}`       | `resolvePath(path, locale)`                        | 3600s |
| **content**                | `GET /{locale}/api/v1/content/{nid}`                   | `fetchContent(nid, locale)`                        | 300s  |
| **blocks**                 | `GET /{locale}/api/v1/blocks/{nid}`                    | `fetchBlocks(nid, locale)`                         | 300s  |
| **categories**             | `GET /{locale}/api/v1/categories/{parentNid}`          | `fetchHubCategories(parentNid, locale)`            | 3600s |
| **mosaic-product**         | `GET /{locale}/api/v1/mosaic-product/{nid}`            | `fetchMosaicProduct(nid, locale)`                  | 60s   |
| **vetrite-product**        | `GET /{locale}/api/v1/vetrite-product/{nid}`           | `fetchVetriteProduct(nid, locale)`                 | 60s   |
| **textile-product**        | `GET /{locale}/api/v1/textile-product/{nid}`           | `fetchTextileProduct(nid, locale)`                 | 60s   |
| **illuminazione-product**  | `GET /{locale}/api/v1/illuminazione-product/{nid}`     | `fetchIlluminazioneProduct(nid, locale)`           | 60s   |
| **arredo-products**        | `GET /{locale}/api/v1/arredo-products/{categoryNid}`   | `fetchArredoProductListing(locale, catNid)`        | 60s   |
| **illuminazione-products** | `GET /{locale}/api/v1/illuminazione-products/{catNid}` | `fetchIlluminazioneProductListing(locale, catNid)` | 60s   |
| **vetrite-colors**         | `GET /{locale}/api/v1/vetrite-colors`                  | `fetchVetriteColors(locale)`                       | 3600s |
| **vetrite-collections**    | `GET /{locale}/api/v1/vetrite-collections`             | `fetchVetriteCollections(locale)`                  | 3600s |
| **menu**                   | `GET /{locale}/api/menu/{menuName}`                    | `fetchMenu(name, locale)`                          | 600s  |

## Dead Endpoints — All return 404

| Endpoint                 | Was                                                    | Old Function                               |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------ |
| ❌ **entity**            | `GET /{locale}/api/v1/entity?path={path}`              | `fetchEntity(path, locale)`                |
| ❌ **translate-path**    | `GET /{locale}/api/v1/translate-path?path=&from=&to=`  | `getTranslatedPath(path, from, to)`        |
| ❌ **products**          | `GET /{locale}/api/v1/products/{productType}`          | `fetchProducts(options)`                   |
| ❌ **product-counts**    | `GET /{locale}/api/v1/products/{type}/counts/{filter}` | `fetchFilterCounts(...)`                   |
| ❌ **taxonomy**          | `GET /{locale}/api/v1/taxonomy/{vocabulary}`           | `fetchFilterOptions(taxType, locale)`      |
| ❌ **category-options**  | `GET /{locale}/api/v1/category-options/{productType}`  | `fetchCategoryOptions(type, locale)`       |
| ❌ **blog**              | `GET /{locale}/api/v1/blog`                            | `fetchBlogPosts(locale, limit, offset)`    |
| ❌ **projects**          | `GET /{locale}/api/v1/projects`                        | `fetchProjects(locale, limit, offset)`     |
| ❌ **environments**      | `GET /{locale}/api/v1/environments`                    | `fetchEnvironments(locale, limit, offset)` |
| ❌ **showrooms**         | `GET /{locale}/api/v1/showrooms`                       | `fetchShowrooms(locale)`                   |
| ❌ **documents**         | `GET /{locale}/api/v1/documents`                       | `fetchDocuments(locale, limit, offset)`    |
| ❌ **subcategories**     | `GET /{locale}/api/v1/subcategories/{parentNid}`       | `fetchSubcategories(nid, locale)`          |
| ❌ **pages-by-category** | `GET /{locale}/api/v1/pages-by-category/{parentNid}`   | `fetchPagesByCategory(nid, locale)`        |

## Response Shapes — New Endpoints

### content/{nid}

```typescript
// Array[1] unwrapped by fetcher → ContentEntity
{ nid: string; type: string; [key: string]: unknown }
```

Raw fields returned as-is — normalization deferred until field shape is finalised.

### blocks/{nid}

```typescript
// Array of BlockItem (normalized)
{ type: string; pid: number; [key: string]: unknown }
```

Normalizations applied: `type` gains `paragraph--` prefix; `field_immagine*` plain URL strings are converted to C1 file object shape `{ type: "file--file", uri: { url }, meta: { alt, width, height } }`.

### categories/{parentNid}

```typescript
// Array of CategoryHubItem (deduplicated by NID)
{
  nid: string;
  name: string;
  imageUrl: string | null;
}
```

### arredo-products/{categoryNid} and illuminazione-products/{categoryNid}

```typescript
// { products: ProductCard[]; total: number }
// ProductCard shape (normalized from raw Drupal view):
{ id, type, title, subtitle: null, imageUrl, imageUrlMain, price, priceOnDemand: false, path }
```

Pass `"all"` as `categoryNid` for unfiltered listing. No server-side pagination — returns all matching items.

### illuminazione-product/{nid}

```typescript
// Array[1] unwrapped → IlluminazioneProduct
{
  nid: number; title: string; body: string | null;
  imageUrl: string | null; galleryIntro: string[];
  materialsHtml: string | null; techSpecsHtml: string | null;
  noTechSheet: boolean; techSheetUrls: string[];
  hdImagePath: string | null;
  documents: { nid, title, imageSrc, href, videoId }[];
}
```

### vetrite-colors and vetrite-collections

```typescript
// Array of VetriteTermItem
{
  name: string;
  imageUrl: string | null;
  href: string;
}
```

`href` is the taxonomy term path (domain-stripped).

## Key Gotchas

- **content/{nid}** returns raw Drupal field shapes — no normalization layer yet. Handle unknown fields defensively.
- **blocks/{nid}** normalizes image fields to C1 shape so ParagraphResolver adapters work without changes.
- **categories/{parentNid}** deduplicates by NID — Drupal may return duplicates due to multi-locale joins.
- **arredo-products / illuminazione-products** have no server-side pagination. Endpoint returns all items.
- **Image empty = `""`** not `null`. Always use `emptyToNull()`.
- **Menu API** uses `/api/menu/` pattern (no `v1`), different from entity endpoints.
- **`field_prezzo_eu`** in arredo/illuminazione listing responses is a plain `string` (not `{ value }`).
- **resolve-path** is the entry point for all product detail routing — resolves alias → `{ nid, bundle, locale, aliases }`.

## Normalizer Functions

| Function                   | File            | Purpose                            |
| -------------------------- | --------------- | ---------------------------------- |
| `stripDomain(url)`         | client.ts       | Full URL → path only               |
| `stripLocalePrefix(path)`  | client.ts       | `/it/path` → `/path`               |
| `emptyToNull(value)`       | client.ts       | `""` → `null`                      |
| `toAbsoluteUrl(url)`       | products.ts     | Relative → absolute URL            |
| `unixToIso(ts)`            | listings.ts     | Unix timestamp → ISO 8601          |
| `deriveSlug(path, name)`   | filters.ts      | Name → URL-safe slug               |
| `getDrupalImageUrl(field)` | drupal/image.ts | C1 image field object → URL string |

## Source Files

```
src/lib/api/
  client.ts                      — apiGet, stripDomain, stripLocalePrefix, emptyToNull
  types.ts                       — All response interfaces
  resolve-path.ts                — resolvePath (URL alias → nid, bundle, aliases)
  content.ts                     — fetchContent (basic entity fields by NID)
  blocks.ts                      — fetchBlocks (paragraph blocks for any node by NID)
  category-hub.ts                — fetchHubCategories (child categories of parent NID)
  mosaic-product.ts              — fetchMosaicProduct (normalized with collection, grouts, documents)
  vetrite-product.ts             — fetchVetriteProduct (normalized with collection, documents)
  textile-product.ts             — fetchTextileProduct (normalized with finiture, maintenance, documents)
  illuminazione-product.ts       — fetchIlluminazioneProduct (normalized with documents, gallery)
  arredo-product-listing.ts      — fetchArredoProductListing (ProductCard[], filtered by category)
  illuminazione-product-listing.ts — fetchIlluminazioneProductListing (ProductCard[], filtered by category)
  vetrite-hub.ts                 — fetchVetriteColors, fetchVetriteCollections (VetriteTermItem[])

  — DEAD (404) — kept for reference, do not call:
  entity.ts       — fetchEntity
  products.ts     — fetchProducts, fetchFilterCounts, getCategoriaProductType
  filters.ts      — fetchFilterOptions, fetchCategoryOptions, fetchAllFilterOptions
  listings.ts     — fetchBlogPosts, fetchProjects, fetchEnvironments, fetchShowrooms, fetchDocuments
  categories.ts   — fetchSubcategories, fetchPagesByCategory
  translate-path.ts — getTranslatedPath
  image-fallback.ts — enrichWithFallbackImages

src/lib/drupal/
  config.ts       — DRUPAL_BASE_URL
  menu.ts         — fetchMenu, transformMenuToNavItems
  image.ts        — getDrupalImageUrl

src/domain/filters/
  registry.ts     — FILTER_REGISTRY, SLUG_OVERRIDES, deslugify, getFilterConfig
  search-params.ts — nuqs integration, parseFiltersFromUrl

src/domain/routing/
  routing-registry.ts — Menu-derived routing (shadow mode)
  section-config.ts   — Hardcoded slug sets, getSectionConfig(Async)
```
