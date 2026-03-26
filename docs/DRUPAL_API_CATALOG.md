# Drupal REST API Catalog — Complete Reference

**Date:** 2026-03-25
**Note:** Generated from codebase analysis. Source of truth: the code in `src/lib/api/`

---

## Table of Contents

1. [Overview](#1-overview)
2. [Entity Endpoints — C1, C2](#2-entity-endpoints--c1-c2)
3. [Views Endpoints — Product Listings — V1, V2](#3-views-endpoints--product-listings--v1-v2)
4. [Views Endpoints — Taxonomy & Categories — V3, V4](#4-views-endpoints--taxonomy--categories--v3-v4)
5. [Views Endpoints — Content Listings — V5–V9](#5-views-endpoints--content-listings--v5v9)
6. [Views Endpoints — Categories & Pages — V10, V11](#6-views-endpoints--categories--pages--v10-v11)
7. [Menu API — M1](#7-menu-api--m1)
8. [Normalizer Functions](#8-normalizer-functions)
9. [Revalidation Summary](#9-revalidation-summary)
10. [Error Handling](#10-error-handling)

---

## 1. Overview

### Architecture

All Drupal data for the Sicis Next.js frontend flows exclusively through custom REST endpoints implemented via Drupal Views and a custom entity resolver. There is no JSON:API usage in the active data layer.

**Endpoint categories:**

| Category | Codes | Purpose |
|---|---|---|
| Entity endpoints | C1, C2 | Single-entity resolution and cross-locale path translation |
| Views — Products | V1, V2 | Paginated product listing and aggregated filter counts |
| Views — Taxonomy/Categories | V3, V4 | Taxonomy vocabulary terms and node--categoria options |
| Views — Content | V5–V9 | Blog, projects, environments, showrooms, documents |
| Views — Relations | V10, V11 | Subcategories and pages filtered by parent categoria |
| Menu | M1 | Drupal native menu API (different URL pattern) |

### Base URL Pattern

```
/{locale}/api/v1/{endpoint}
```

The `apiGet()` function inserts `/api/v1` automatically. Callers pass paths as `/{locale}/{endpoint}`.

**Example transformation:**
```
Input:  /it/products/prodotto_mosaico
Output: https://drupal.example.com/it/api/v1/products/prodotto_mosaico
```

**Menu exception** — uses a different pattern, NOT through `apiGet()`:
```
/{locale}/api/menu/{menuName}
```

### Base Fetcher

**`apiGet<T>(path, params, revalidate)`** in `src/lib/api/client.ts`

- Inserts `/api/v1` after the two-letter locale prefix
- Attaches query params via `URLSearchParams`
- Returns `T | null` — never throws
- All fetchers that use `apiGet` are additionally wrapped with React `cache()` for per-render deduplication

### Paginated Response Wrapper

All Views endpoints that support pagination return:

```typescript
{
  items: T[];
  total: number;
  page: number;       // 0-based
  pageSize: number;
}
```

Pagination params: `items_per_page` (Drupal Views native) + `page` (0-based).

---

## 2. Entity Endpoints — C1, C2

### C1 — Entity (Single Entity by Path)

**Function:** `fetchEntity(path, locale)` in `src/lib/api/entity.ts`
**URL:** `/{locale}/api/v1/entity?path={pathWithoutLocale}`
**Revalidate:** 60s

Resolves any Drupal path alias to its fully pre-resolved entity. All relationships and paragraph blocks are returned inline — no secondary fetches are required.

**Query Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| path | string | yes | Drupal path alias without locale prefix (e.g. `/mosaico/pluma/01-bora`) |

**Response:**

```typescript
{
  meta: {
    type: string;       // "node" | "taxonomy_term"
    bundle: string;     // e.g. "prodotto_mosaico", "articolo"
    id: number;         // Drupal NID (integer)
    uuid: string;
    locale: string;
    path: string;
  };
  data: Record<string, unknown>; // All entity fields, fully resolved
}
```

**Image field shape inside `data`:**

```typescript
{
  type: "file--file";
  uri: { url: "https://drupal.example.com/sites/default/files/..." };
  meta: { alt: string; width: number; height: number };
}
```

**Notes:**

- This is the single-call replacement for the old two-step `translatePath` + `fetchJsonApiResource` pattern.
- The integer NID is available as `meta.id` — required by V10 and V11 callers.
- Returns `null` for 404 or any network/HTTP error.

---

### C2 — Translate Path

**Function:** `getTranslatedPath(path, fromLocale, toLocale)` in `src/lib/api/translate-path.ts`
**URL:** `/{locale}/api/v1/translate-path?path={path}&from={locale}&to={targetLocale}`
**Revalidate:** 3600s

Resolves a path from one locale to the equivalent path in another locale. Used by the language switcher.

**Query Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| path | string | yes | Source path (without locale prefix) |
| from | string | yes | Source locale code (e.g. `it`) |
| to | string | yes | Target locale code (e.g. `en`) |

**Response:**

```typescript
{
  translatedPath: string | null; // null when no translation exists
}
```

---

## 3. Views Endpoints — Product Listings — V1, V2

### V1 — Products (Paginated)

**Function:** `fetchProducts(options)` in `src/lib/api/products.ts`
**URL:** `/{locale}/api/v1/products/{productType}`
**Revalidate:** 60s

Returns a paginated list of products for a given content type, with optional filter and sort parameters.

**Path Parameters:**

| Name | Values |
|---|---|
| locale | `it`, `en`, `fr`, `de`, `es`, `ru` |
| productType | `prodotto_mosaico`, `prodotto_vetrite`, `prodotto_arredo`, `prodotto_tessuto`, `prodotto_pixall`, `prodotto_illuminazione` |

**Query Parameters:**

| Name | Type | Description |
|---|---|---|
| items_per_page | number | Page size (default: 24) |
| page | number | 0-based page index |
| sort | string | Field name; prefix with `-` for descending (e.g. `-title`) |
| collection | string | Filter by collection name |
| color | string | Filter by color name |
| shape | string | Filter by shape name |
| finish | string | Filter by finish name |
| grout | string | Filter by grout name |
| texture | string | Filter by texture name |
| fabric | string | Filter by fabric name |
| category | string | Filter by hub category title (single value only — see limitations) |
| type | string | Filter by typology name |

**Known Limitations:**

- `category_id` (NID-based filtering) is silently ignored by the Views endpoint. Use `category` (title-based) instead.
- `category` does NOT support multi-value (neither comma-separated nor array). Only a single value per request is accepted.

**Response item shape (after normalization):**

```typescript
{
  id: string;
  type: string;            // with "node--" prefix added by normalizer
  title: string;
  subtitle: string | null;
  imageUrl: string | null; // field_immagine_anteprima (preview); falls back to imageUrlMain
  imageUrlMain: string | null; // field_immagine (full-size)
  price: string | null;
  priceOnDemand: boolean;  // REST returns "0"/"1"; cast to boolean by normalizer
  path: string | null;     // domain and locale prefix stripped
}
```

**Raw REST item (before normalization):**

```typescript
{
  id: string;
  type: string;           // without "node--" prefix
  title: string;
  subtitle: string | null;
  imageUrl: string;       // "" when empty
  imageUrlMain: string;   // "" or relative path when empty
  price: string | null;
  priceOnDemand: "0" | "1" | null;
  path: string;           // full Drupal domain URL
}
```

**`DRUPAL_FIELD_TO_REST_PARAM` Mapping:**

| REST Param | Drupal Field | Product Types |
|---|---|---|
| `collection` | `field_collezione.name` | Mosaico, Vetrite |
| `color` | `field_colori.name` / `field_colore.name` | Mosaico, Vetrite, Tessuto |
| `shape` | `field_forma.name` | Mosaico, Pixall |
| `finish` | `field_finitura.name` / `field_finitura_tessuto.name` | Mosaico, Vetrite, Tessuto |
| `grout` | `field_stucco.name` | Mosaico, Pixall |
| `texture` | `field_texture.name` | Vetrite |
| `fabric` | `field_tessuto.name` | Arredo |
| `category` | `field_categoria.title` | All (hub categories) |
| `type` | `field_tipologia.name` / `field_tipologia_tessuto.name` | Tessuto |

---

### V2 — Filter Counts

**Function:** `fetchFilterCounts(productType, activeFilters, filterKey, drupalField, locale)` in `src/lib/api/products.ts`
**URL:** `/{locale}/api/v1/products/{productType}/counts/{filterKey}`
**Revalidate:** 60s

Returns server-side aggregated counts for each value of a given filter facet. Active filters (excluding the filter being counted) are passed as query params to produce cross-filtered counts.

**Path Parameters:**

| Name | Values |
|---|---|
| productType | Same as V1 |
| filterKey | `collection`, `color`, `shape`, `finish`, `grout`, `texture`, `fabric`, `category`, `type` |

**Function Parameters:**

| Name | Type | Description |
|---|---|---|
| productType | string | Drupal content type |
| activeFilters | FilterDefinition[] | Currently active filters (the counted one is excluded) |
| filterKey | string | Registry filter key (e.g. `subcategory`) — NOT used in URL |
| drupalField | string | Drupal field path (e.g. `field_categoria.title`) — mapped to REST param for URL |
| locale | string | Current locale |

**Response:**

```typescript
{
  counts: Record<string, number>; // e.g. { "Pluma": 42, "Blends": 88 }
}
```

---

## 4. Views Endpoints — Taxonomy & Categories — V3, V4

### V3 — Taxonomy Terms

**Function:** `fetchFilterOptions(taxonomyType, locale, options?)` in `src/lib/api/filters.ts`
**URL:** `/{locale}/api/v1/taxonomy/{vocabulary}`
**Revalidate:** 3600s

Returns all terms for a given Drupal taxonomy vocabulary. Vocabulary name is extracted from `taxonomyType` by splitting on `--` (e.g. `taxonomy_term--mosaico_collezioni` → `mosaico_collezioni`).

**All Supported Vocabularies:**

| Vocabulary | Product Type | Status |
|---|---|---|
| `mosaico_collezioni` | Mosaico | Active |
| `mosaico_colori` | Mosaico | Active |
| `vetrite_collezioni` | Vetrite | Active |
| `vetrite_colori` | Vetrite | Active |
| `vetrite_finiture` | Vetrite | Active |
| `vetrite_textures` | Vetrite | Active |
| `arredo_finiture` | Arredo | Empty (0 terms in Drupal) |
| `tessuto_colori` | Tessuto | Active |
| `tessuto_finiture` | Tessuto | Empty (0 terms in Drupal) |
| `tessuto_tipologie` | Tessuto | Active |
| `tessuto_manutenzione` | Tessuto | Active |

**Raw REST response item:**

```typescript
{
  id: string;
  name: string;
  weight: string;   // Drupal returns weight as string (e.g. "0", "10")
  imageUrl: string; // "" when no image — NOT null
}
```

**Important:** There is no `path` field on taxonomy term items. Slugs are derived from `name` via `deriveSlug()`.

**Normalized output (`FilterOption`):**

```typescript
{
  id: string;
  slug: string;        // derived from name; see deriveSlug() in Section 8
  label: string;
  imageUrl?: string;   // only included if caller passes includeImage: true
}
```

---

### V4 — Category Options

**Function:** `fetchCategoryOptions(productType, locale)` in `src/lib/api/filters.ts`
**URLs:**
- `/{locale}/api/v1/category-options/{productType}` — categories with products for this type
- `/{locale}/api/v1/category-options/categoria` — all node--categoria (includes hubs without products)

**Revalidate:** 3600s

Fetches `node--categoria` entities for product types that organize by category hierarchy rather than taxonomy. Both URLs are fetched in parallel and merged to ensure hub categories (which have no direct products) appear in the result.

**Used for product types:** `prodotto_arredo`, `prodotto_illuminazione`, `prodotto_tessuto`

**Response:** NOT paginated. No `total`, `page`, or `pageSize` fields.

```typescript
{
  items: CategoryOptionItem[];
}
```

**Raw `CategoryOptionItem`:**

```typescript
{
  id: string;
  name: string;
  imageUrl: string;          // "" when empty
  path: string;              // full Drupal domain URL
  parentId?: string | null;
  parentPath?: string | null;
}
```

**Parent resolution logic:** Items with a `parentPath` containing 1 path segment after locale stripping are root-level nodes (e.g. `/arredo`). Items with 2+ segments are children. `parentId` is resolved by matching against the merged items list.

**Normalized output (`FilterOption`):**

```typescript
{
  id: string;
  slug: string;          // derived from path last segment via deriveSlug()
  label: string;
  parentId?: string;     // only set for child categories
  imageUrl?: string;     // only set when non-empty
}
```

---

## 5. Views Endpoints — Content Listings — V5–V9

All content listing endpoints share these conventions:

- Paginated response wrapper: `{ items: T[], total, page, pageSize }`
- Pagination params: `items_per_page` + `page` (0-based)
- Normalization applied to all items: `stripDomain` + `stripLocalePrefix` on `path`, `emptyToNull` on `imageUrl`
- All revalidate at 300s
- All wrapped with React `cache()`

---

### V5 — Blog Posts

**Function:** `fetchBlogPosts(locale, limit, offset)` in `src/lib/api/listings.ts`
**URL:** `/{locale}/api/v1/blog`
**Revalidate:** 300s

**Query Parameters:** `items_per_page`, `page`

**Raw REST response item:**

```typescript
{
  id: string;
  type: "articolo" | "news" | "tutorial";
  title: string;
  imageUrl: string;
  path: string;
  created: string; // Unix timestamp e.g. "1772451555"
}
```

**Normalized output (`BlogCard`):**

```typescript
{
  id: string;
  type: "articolo" | "news" | "tutorial";
  title: string;
  imageUrl: string | null;
  path: string | null;
  created: string; // ISO 8601 — converted from Unix by unixToIso()
}
```

---

### V6 — Projects

**Function:** `fetchProjects(locale, limit, offset)` in `src/lib/api/listings.ts`
**URL:** `/{locale}/api/v1/projects`
**Revalidate:** 300s

**Query Parameters:** `items_per_page`, `page`

**Normalized output (`ProgettoCard`):**

```typescript
{
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  // Note: raw REST item includes `category`, dropped in normalization for legacy compat
}
```

---

### V7 — Environments

**Function:** `fetchEnvironments(locale, limit, offset)` in `src/lib/api/listings.ts`
**URL:** `/{locale}/api/v1/environments`
**Revalidate:** 300s

**Query Parameters:** `items_per_page`, `page`

**Normalized output (`EnvironmentCard`):**

```typescript
{
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
}
```

---

### V8 — Showrooms

**Function:** `fetchShowrooms(locale)` in `src/lib/api/listings.ts`
**URL:** `/{locale}/api/v1/showrooms`
**Revalidate:** 300s

No pagination params are used — all showrooms are returned in one response.

**Raw REST response item:**

```typescript
{
  id: string;
  title: string;
  imageUrl: string;
  path: string;
  address: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  gmapsUrl: string | null;   // renamed to mapsUrl in normalization
  externalUrl: string | null;
}
```

**Normalized output (`ShowroomCard`):**

```typescript
{
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  mapsUrl: string | null;    // renamed from gmapsUrl for legacy component compat
}
```

**Note:** `externalUrl` is present in the raw REST item but dropped during normalization for legacy component compatibility.

---

### V9 — Documents

**Function:** `fetchDocuments(locale, limit, offset)` in `src/lib/api/listings.ts`
**URL:** `/{locale}/api/v1/documents`
**Revalidate:** 300s

**Query Parameters:** `items_per_page`, `page`

**Normalized output (`DocumentCard`):**

```typescript
{
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  externalUrl: string | null;
  documentType: string | null;
  category: string | null;
  // Note: raw REST item includes `fileUrl`, dropped in normalization for legacy compat
}
```

**Known state:** Returns 0 items on staging — no `node--documento` content is currently published.

---

## 6. Views Endpoints — Categories & Pages — V10, V11

### V10 — Subcategories

**Function:** `fetchSubcategories(parentId, locale)` in `src/lib/api/categories.ts`
**URL:** `/{locale}/api/v1/subcategories/{parentNid}`
**Revalidate:** 300s

Returns child `node--categoria` entities for a given parent categoria.

**Critical requirement:** `parentNid` must be the integer NID, NOT the UUID. Callers must pass `node.meta.id` (from C1 response), not `node.meta.uuid`.

**Raw REST response item:**

```typescript
{
  id: string;
  uuid: null;     // always null in this endpoint's response
  title: string;
  imageUrl: string;
  path: string;   // full Drupal domain URL
}
```

**Normalized output (`SubcategoryCard`):**

```typescript
{
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;      // domain and locale prefix stripped
}
```

---

### V11 — Pages by Category

**Function:** `fetchPagesByCategory(parentId, locale, limit, offset)` in `src/lib/api/categories.ts`
**URL:** `/{locale}/api/v1/pages-by-category/{parentNid}`
**Revalidate:** 300s

Returns published `node--page` entities whose `field_categoria` references the given parent categoria NID.

**Critical requirement:** Same as V10 — `parentNid` must be the integer NID from `meta.id` in the C1 response.

**Query Parameters:** `items_per_page`, `page`

**Normalized output (`PageCard`):**

```typescript
{
  id: string;
  title: string;
  imageUrl: string | null;  // often "" in Drupal — normalized to null
  path: string | null;      // domain and locale prefix stripped
}
```

---

## 7. Menu API — M1

### M1 — Menu

**Function:** `fetchMenu(menuName, locale)` in `src/lib/drupal/menu.ts`
**URL:** `/{locale}/api/menu/{menuName}`
**Revalidate:** 600s

**This endpoint does NOT go through `apiGet()`.** It uses a different URL pattern (`/api/menu/` without `v1`) and calls `fetch()` directly with `DRUPAL_BASE_URL`.

**Path Parameters:**

| Name | Values |
|---|---|
| locale | `it`, `en`, `fr`, `de`, `es`, `ru` |
| menuName | `main`, `footer`, and other Drupal menu machine names |

**Raw response:**

```typescript
{
  id: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  title: string;
  url: string;       // may be full Drupal URL, relative path, or "<nolink>"
  weight: number;
  children: MenuItem[]; // recursive
}
```

**Normalization applied by `transformMenuToNavItems()`:**

- `<nolink>` URLs are converted to `#`
- Drupal base path is stripped from absolute URLs
- Locale prefix is re-injected for correct Next.js routing
- Recursive structure preserved

---

## 8. Normalizer Functions

All normalizers live in `src/lib/api/` and `src/lib/drupal/`. They are pure functions with no side effects.

| Function | Location | Purpose | Input → Output |
|---|---|---|---|
| `stripDomain` | `client.ts` | Remove Drupal domain and base path from URLs | `"https://drupal.example.com/it/path"` → `"/it/path"` |
| `stripLocalePrefix` | `client.ts` | Remove `/xx/` locale prefix from path | `"/it/path"` → `"/path"` |
| `emptyToNull` | `client.ts` | Normalize empty strings to null | `""` → `null` |
| `toAbsoluteUrl` | `products.ts` | Ensure image URL is absolute | `"/sites/default/..."` → `"https://drupal.example.com/sites/..."` |
| `unixToIso` | `listings.ts` | Convert Unix timestamp string to ISO 8601 | `"1772451555"` → `"2026-03-01T..."` |
| `deriveSlug` | `filters.ts` | Derive URL slug from path last segment or name | `"Colibrì"` → `"colibri"` (via `SLUG_OVERRIDES`) |
| `getDrupalImageUrl` | `drupal/image.ts` | Extract image URL from C1 file field shape | `{ uri: { url: "..." } }` → `"https://..."` |

**`deriveSlug` priority order:**

1. Last segment of `path` after domain stripping (when path is available)
2. Reverse lookup in `SLUG_OVERRIDES` (handles accents, slashes, capitalisation exceptions)
3. Fallback: NFC-normalized, lowercased, slugified `name`

---

## 9. Revalidation Summary

| Endpoint | Code | Function | TTL |
|---|---|---|---|
| Entity by path | C1 | `fetchEntity` | 60s |
| Translate path | C2 | `getTranslatedPath` | 3600s |
| Products listing | V1 | `fetchProducts` | 60s |
| Filter counts | V2 | `fetchFilterCounts` | 60s |
| Taxonomy terms | V3 | `fetchFilterOptions` | 3600s |
| Category options | V4 | `fetchCategoryOptions` | 3600s |
| Blog posts | V5 | `fetchBlogPosts` | 300s |
| Projects | V6 | `fetchProjects` | 300s |
| Environments | V7 | `fetchEnvironments` | 300s |
| Showrooms | V8 | `fetchShowrooms` | 300s |
| Documents | V9 | `fetchDocuments` | 300s |
| Subcategories | V10 | `fetchSubcategories` | 300s |
| Pages by category | V11 | `fetchPagesByCategory` | 300s |
| Menu | M1 | `fetchMenu` | 600s |

---

## 10. Error Handling

All fetchers follow a consistent resilient pattern — they never throw.

| Scenario | Behavior |
|---|---|
| HTTP 404 | Returns `null` immediately |
| Other HTTP error (4xx/5xx) | Logs `console.error` with status + URL, returns `null` |
| Network failure / timeout | Catches exception, logs `console.error`, returns `null` |
| Empty response body | Returns `null` |
| Missing items in paginated response | Returns `{ items/products/etc: [], total: 0 }` |

**Error log format:**

```
API error: 500 Internal Server Error for /it/api/v1/products/prodotto_mosaico
API fetch failed for /it/api/v1/entity: TypeError: fetch failed
```

All callers are expected to handle `null` returns gracefully. Templates and listing components receive empty arrays and zero totals when fetches fail, allowing pages to degrade silently rather than error.

---

## Source Files

| File | Endpoints |
|---|---|
| `src/lib/api/client.ts` | Base fetcher (`apiGet`), normalizers (`stripDomain`, `stripLocalePrefix`, `emptyToNull`) |
| `src/lib/api/types.ts` | Response interfaces (source of truth for REST response shapes) |
| `src/lib/api/entity.ts` | C1 |
| `src/lib/api/translate-path.ts` | C2 |
| `src/lib/api/products.ts` | V1, V2 |
| `src/lib/api/filters.ts` | V3, V4 |
| `src/lib/api/listings.ts` | V5, V6, V7, V8, V9 |
| `src/lib/api/categories.ts` | V10, V11 |
| `src/lib/drupal/menu.ts` | M1 |
| `src/lib/drupal/config.ts` | `DRUPAL_BASE_URL` constant |
| `src/lib/drupal/image.ts` | `getDrupalImageUrl` |
