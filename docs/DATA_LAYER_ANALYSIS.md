# Data Layer Architecture — Uniformity Analysis

> Extracted from CLAUDE.md. See CLAUDE.md for project overview.

The system has a **uniform API client core** with a **heterogeneous template layer**. The split is clear: everything inside `src/lib/api/` follows consistent patterns; everything inside `src/templates/` implements ad-hoc field extraction.

## Uniform Dimensions (working well)

| Dimension                 | Pattern                                             | Evidence                                                                                                                         |
| ------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Fetcher pattern**       | All use `apiGet()`                                  | 10/10 REST fetchers; menu is the sole exception (uses `fetch()` directly)                                                        |
| **Error handling**        | 404 → `null`, error → `console.error` + `null`      | Identical across all 14 endpoints                                                                                                |
| **Caching**               | `React.cache()` wrapper + `next: { revalidate: N }` | All fetchers; 3 tiers: 60s/300s/3600s                                                                                            |
| **Pagination**            | `items_per_page` + `page` (0-based)                 | All paginated listing endpoints (products, blog, projects, environments, showrooms, documents, subcategories, pages-by-category) |
| **Type safety (fetcher)** | `apiGet<T>()` with explicit interfaces              | All response shapes in `types.ts`                                                                                                |

## Heterogeneous Dimensions (5 problem areas)

### 1. Image URL Access — 4 patterns (3 legacy + 1 standard)

| Pattern                                  | Where                                                                                   | How                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `next/image` `<Image>` with `fill`       | DS composed components (ProductCard, CategoryCard, GalleryCarousel, MediaElement, etc.) | Standard for content images > 100px. Uses `sizes` prop for responsive srcset.              |
| `getDrupalImageUrl(field)`               | ProdottoMosaico, ParagraphResolver adapters                                             | Extracts `uri.url` from entity endpoint image shape `{ type: "file--file", uri: { url } }` |
| `DrupalImage` component                  | ProdottoVetrite, Arredo, Tessuto, Pixall, Illuminazione, Articolo, News, Tutorial       | Legacy component wrapping entire image field — to be replaced during DS migration          |
| Normalized `imageUrl` string → `<Image>` | ProductListingTemplate, all listing cards                                               | Pre-normalized by REST fetcher via `emptyToNull(item.imageUrl)`, rendered via `next/image` |

**Risk**: When Drupal image field structure changes, 3 legacy codepaths need updating. DS components use pre-normalized URLs and are immune.

### 2. Price Field Shape — Inconsistent across product types

| Product Type                   | `field_prezzo_eu` shape | `field_prezzo_usa` shape | Access pattern                        |
| ------------------------------ | ----------------------- | ------------------------ | ------------------------------------- |
| Mosaico, Tessuto, Pixall       | `string`                | `string`                 | `node.field_prezzo_eu ?? null`        |
| Vetrite, Arredo, Illuminazione | `{ value: string }`     | `{ value: string }`      | `node.field_prezzo_eu?.value ?? null` |

**Root cause**: Different Drupal field types (decimal vs formatted text). No frontend normalizer exists — each template implements its own access.

### 3. Link Field Polymorphism — 4+ access patterns

`field_collegamento_esterno` can be either `string` (plain URI) or `{ uri: string, title: string }` (link field object). Every template that uses it implements its own type check:

```typescript
// Pattern seen in ProdottoArredo, ProdottoIlluminazione, VetriteCollezione, etc.
const extLinkRaw = doc.field_collegamento_esterno;
const link =
  typeof extLinkRaw === 'string' ? extLinkRaw : (extLinkRaw?.uri ?? null);
```

No shared `normalizeLink()` function exists — the typeof check is duplicated in 6+ templates.

### 4. Secondary Fetches — Chaotic, no unified pattern

| Template                 | Secondary Fetch                            | Protocol                | Why                                              |
| ------------------------ | ------------------------------------------ | ----------------------- | ------------------------------------------------ |
| ProdottoArredo           | English tessuti terms                      | **JSON:API** (not REST) | Current locale returns stubs without name data   |
| ProdottoIlluminazione    | English tessuti terms                      | **JSON:API** (not REST) | Same as Arredo                                   |
| Categoria                | subcategories, products, pages-by-category | REST                    | 3-branch logic: products / subcategories / pages |
| MosaicoCollezione/Colore | taxonomy + products                        | REST                    | Filter options + filtered products               |
| VetriteCollezione/Colore | taxonomy + products                        | REST                    | Same as Mosaico                                  |

The Arredo/Illuminazione JSON:API fallback is the **only JSON:API usage** in the entire project — everything else is REST. Templates decide when and what to fetch secondarily with no shared abstraction.

### 5. Entity Endpoint Normalization — Delegated to templates

`fetchEntity()` returns raw `{ meta, data: Record<string, unknown> }`. Unlike Views fetchers (products–pages-by-category) which normalize before returning, the entity endpoint passes raw Drupal field shapes to templates. Each template then does its own:

- Field extraction via optional chaining
- Fallback chains (product → collection → null)
- Array normalization (single-cardinality Drupal fields arriving as objects instead of arrays)
- HTML sanitization
- Boolean-to-label translation

**Result**: 26 templates each implement ad-hoc field extraction logic instead of a shared mapper layer.

## Field Cardinality Anomalies

Some Drupal fields have cardinality=1 but are sometimes serialized as objects instead of arrays. Templates must defensively normalize:

```typescript
// ProdottoTessuto: field_finiture_tessuto / field_tipologia_tessuto
const finiture = Array.isArray(node.field_finiture_tessuto)
  ? node.field_finiture_tessuto
  : node.field_finiture_tessuto
    ? [node.field_finiture_tessuto]
    : [];
```

## Entities Without `field_blocchi`

`Showroom` and `Documento` node types do **NOT** have `field_blocchi`. Including this field in an entity endpoint request for these entities causes Drupal to return HTTP 400. Templates must never pass these through ParagraphResolver.

## Detailed Documentation

Comprehensive reports in `docs/`:

- `API_QUICK_REFERENCE.md` — Endpoint cheat sheet with gotchas
- `DRUPAL_API_CATALOG.md` — Full endpoint reference (URL, params, response shapes, normalization, TTL)
- `DRUPAL_CONTENT_MAP.md` — Entity types, taxonomy, paragraphs, field shapes, migration status
- `DRUPAL_FIELD_INVENTORY.md` — Per-template field access map with types and patterns
- `STRATEGIC_IMPROVEMENTS.md` — 15 improvement recommendations in 5 phases with priority matrix
