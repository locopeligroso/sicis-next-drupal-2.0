# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### 2026-03-30

#### New endpoint integration + legacy cleanup — 9 new fetchers, dead V1-V9 calls removed

All legacy Drupal Views endpoints (V1-V9, C1, C2) are confirmed dead (404). Integrated 9 new REST endpoints and removed all dead legacy calls from the routing.

**New fetcher files (9):**

- `src/lib/api/vetrite-hub.ts` — `vetrite-colors` + `vetrite-collections` (hub page)
- `src/lib/api/arredo-product-listing.ts` — `arredo-products/{categoryNid}` (product grid)
- `src/lib/api/illuminazione-product-listing.ts` — `illuminazione-products/{categoryNid}` (product grid)
- `src/lib/api/category-hub.ts` — `categories/{nid}` (replaces dead V4 category-options, with NID deduplication)
- `src/lib/api/illuminazione-product.ts` — `illuminazione-product/{nid}` (single product detail)
- `src/lib/api/content.ts` — `content/{nid}` (basic entity fields, replaces dead C1 entity)
- `src/lib/api/blocks.ts` — `blocks/{nid}` (paragraph blocks, replaces C1 field_blocchi)

**Routing overhaul (`page.tsx`):**

- `getPageData()` refactored: uses `resolvePath` → `content/{nid}` + `blocks/{nid}` as primary, C1 as fallback
- `generateMetadata()` uses same content+blocks fallback for page titles
- Hub State 1: ALL hub types (mosaico, vetrite, arredo, illuminazione, tessuto) now fetch internally — dead V3/V4/V2 calls removed entirely
- Stage 1.5 categoria matching checks basePaths of ALL locales (fixes cross-locale URLs like `/it/lighting/table-lamps`)
- Subcategory resolution replaced: `fetchCategoryOptions` (V4, dead) → `fetchHubCategories` (new `categories/{nid}`)
- Arredo/illuminazione product grid uses new listing endpoints via `useNewListingEndpoint`
- Illuminazione single product routed via resolve-path Stage 1.5
- Homepage (`[locale]/page.tsx`): uses `content/1` + `blocks/1` with C1 fallback

**Removed dead legacy imports:**

- `fetchFilterOptions` — V3 taxonomy endpoint (dead)
- `fetchCategoryOptions` — V4 category-options endpoint (dead)
- Hub State 1 filter/count fetch block — all 50+ lines of dead V3/V4/V2 calls

**Still present (no replacement available — awaiting Freddi):**

- `fetchProducts` (V1) — State 2 fallback when useNewListingEndpoint is false
- `fetchFilterCounts` (V2) — sidebar filter counts in State 2
- `fetchAllFilterOptions` — sidebar filter options in State 2 (returns empty for dead endpoints)
- `fetchProjects/Environments/BlogPosts/Showrooms/Documents` (V5-V9) — content listings via field_page_id

**Component changes:**

- `SpecHubMosaico` — generic: accepts `productType`, dispatches mosaic vs vetrite endpoints
- `SpecHubArredo` — fetches categories internally via `fetchHubCategories`, `slugifyName()` for accented/Cyrillic hrefs
- `ProductListingTemplate` — passes `productType` + `hubParentNid` to hub components
- `ParagraphResolver` — gallery caption: removed filename fallback (blocks/{nid} has no alt text)
- `blocks.ts` — recursive `normalizeImageFields`: converts nested `field_immagine` strings (in field_slide, field_elementi, field_documenti) to C1 shape with 4:3 default dimensions

**Bug fixes:**

- Vetrite hub showed mosaic data → dispatches by productType
- Illuminazione hub broken for FR/DE/ES/RU → 4 missing slugs added to LISTING_SLUG_OVERRIDES
- Language switcher wrong-locale URLs → `translateBasePath` as third fallback in getTranslatedPath
- Tessili hub duplicates → NID-based deduplication in category-hub.ts
- US locale missing i18n hub keys → added to messages/us.json
- Page titles showing "Sicis" → generateMetadata uses content/{nid} fallback

### 2026-03-28

#### Endpoint nomenclature overhaul — descriptive names replace opaque codes

Replaced all shorthand endpoint codes (P1, V3, R1, C1, etc.) with self-describing names throughout documentation and source comments. Convention: **singular = detail** (`mosaic-product`), **plural = listing** (`mosaic-products`). The name matches the Drupal endpoint path.

**Endpoint status classification:**

- **11 NEW definitive endpoints** (type-specific, NID/TID path params, no pagination): `resolve-path`, `mosaic-product`, `vetrite-product`, `textile-product`, `pixall-product`, `mosaic-products`, `vetrite-products`, `textile-products`, `pixall-products`, `mosaic-colors`, `mosaic-collections`
- **14 LEGACY endpoints** (generic Drupal Views, to be rewritten as dedicated endpoints): `entity`, `translate-path`, `products`, `product-counts`, `taxonomy`, `category-options`, `blog`, `projects`, `environments`, `showrooms`, `documents`, `subcategories`, `pages-by-category`, `menu`

**Files changed:** 24 (9 docs, 14 source comments, 1 new script). No runtime code modified — comments and documentation only.

**Verification script:** `scripts/check-endpoints.sh` — curls all 25 endpoints against Drupal and reports HTTP status. Run when local database is online to verify which LEGACY views are active vs disabled.

#### CLAUDE.md reduction — extracted 4 sections to docs/

Reduced `CLAUDE.md` from 56K to 18K chars by extracting large reference sections:

- `docs/ARCHITECTURE.md` (22K) — data layer, endpoint reference, routing pipeline, revalidation
- `docs/DESIGN_SYSTEM.md` (5K) — blocks, composed, primitives, ParagraphResolver
- `docs/TEMPLATES_MIGRATION.md` (6K) — node/taxonomy template status matrix
- `docs/DATA_LAYER_ANALYSIS.md` (8K) — uniformity analysis, 5 heterogeneous problem areas

Each extracted section replaced with 3-5 bullet summary + link in CLAUDE.md.

#### Project configuration initialized

- Created project-specific `CLAUDE.md` at `~/.claude/projects/` with stack, agent routing, critical rules, endpoint architecture overview
- Initialized project memory index at `~/.claude/projects/.../memory/MEMORY.md`

### 2026-03-27

#### R3F 3D Glass Slab Viewer — Interactive canvas on vetrite product pages

Replaced the static main product image on `ProdottoVetrite` with an interactive React Three Fiber canvas showing a 3D glass slab. Ported from the standalone `sicis-vetrite-next` proof-of-concept.

**Architecture:**

- Full TypeScript port of the material system (Solid, Chrome, OpalOff, OpalOn, Glass finishes)
- Self-contained module at `src/r3f/vetrite/` (27 files: config, materials, stores, hooks, components)
- `VetriteCanvasLoader` — client component wrapper with `next/dynamic` + `ssr: false`
- Texture proxy via `/api/texture` route (avoids CORS for WebGL texture loading from Drupal)
- Default HDRI environment (RR.hdr) at `public/assets/hdri/vetrite/`
- Product image from Drupal used as diffuse texture (10% zoom crop)

**Canvas features (identical to sicis-vetrite-next):**

- Slab geometry with mouse-tracking rotation (quaternion slerp)
- Finish Selector (Solid / Chrome / Opalescent OFF / Opalescent ON)
- Mirror toggle with smooth animation (maath/easing damp)
- Opal toggle (pill switch, disabled when Solid/Chrome active)
- Backlight presets (Neutral / Warm / Cold) for Opal ON
- Fullscreen mode with editorial sidebar ("Luxury Atelier Panel")
- Material pre-warming on mount (prevents shader jank)
- RendererSync (tone mapping, exposure, clear color from Zustand store)

**Dependencies added:** three, @react-three/fiber, @react-three/drei, zustand, maath, @types/three

**New files:** `src/r3f/vetrite/` (27 TS files), `src/app/api/texture/route.ts`, `public/assets/hdri/vetrite/RR.hdr`, `public/assets/vetrite/` (4 finish thumbnails), `docs/SICIS_VETRITE_NEXT.md`

---

#### Mosaico Hub — Colori & Collezioni listings from Drupal Views

Replaced the old SpecHubMosaico implementation (which used V3 taxonomy endpoints) with data fetched directly from two Drupal Views REST exports: `mosaic-colors` and `mosaic-collections`.

**New fetcher:** `src/lib/api/mosaic-hub.ts`

- `fetchMosaicColors(locale)` — `/{locale}/api/v1/mosaic-colors` → `MosaicTermItem[]`
- `fetchMosaicCollections(locale)` — `/{locale}/api/v1/mosaic-collections` → `MosaicTermItem[]`
- Response shape: `{ name, field_immagine, view_taxonomy_term }` → normalized to `{ name, imageUrl, href }`
- `href` derived via `stripDomain()` from `view_taxonomy_term` (full Drupal URL → relative path)
- Revalidate: 3600s

**SpecHubMosaico rewrite:**

- Uses DS blocks: `HubSection` (h2 + hr wrapper) + `CategoryCard` (image + title link)
- Colors rendered with `hasColorSwatch` (circular 64px swatch)
- Collections rendered with full image (`object-cover`)
- Removed: Pixall section, "Scopri anche", "Approfondimenti" — hub now shows only the two term listings

**i18n — missing hub keys added to 5 locales:**

| Key                       | EN                    | FR                      | DE                        | ES                     | RU               |
| ------------------------- | --------------------- | ----------------------- | ------------------------- | ---------------------- | ---------------- |
| `hub.exploreByColor`      | Explore by colour     | Explorer par couleur    | Nach Farbe entdecken      | Explorar por color     | По цвету         |
| `hub.exploreByCollection` | Explore by collection | Explorer par collection | Nach Kollektion entdecken | Explorar por colección | По коллекции     |
| `hub.exploreByTypology`   | Explore by typology   | Explorer par typologie  | Nach Typologie entdecken  | Explorar por tipología | По типологии     |
| `hub.solidColours`        | Solid Colours         | Couleurs unies          | Unifarben                 | Colores sólidos        | Однотонные цвета |

**Encoded slug routing fix (FR `mosaïque`, RU `мозаика`):**

- `page.tsx`: `singleSlug` now decoded + NFC-normalized before `LISTING_SLUG_OVERRIDES.has()` check
- `section-config.ts`: both `getSectionConfig()` and `getSectionConfigAsync()` decode + NFC-normalize slug segments
- `registry.ts`: `deslugify()` decodes URL-encoded slugs before `SLUG_OVERRIDES` lookup

**Files changed:** 9 modified + 1 new (`src/lib/api/mosaic-hub.ts`)

---

#### US Locale (`/us/`) — Regional variant for the American market

Added `us` as a 7th locale. It mirrors `en` entirely (same Drupal endpoints, same translations) with US-specific conditional rendering on product pages.

**Core infrastructure:**

- `toDrupalLocale()` in `src/i18n/config.ts` — maps `us → en` for all Drupal API calls
- Applied in 5 API entry points: `apiGet()`, `fetchMenu()`, `fetchMenuForLocale()`, `getTranslatedPath()`, `resolvePath()`
- `resolvePath()` expands aliases post-response: `aliases.us = aliases.en`
- `messages/us.json` — copy of `en.json`
- Filter registry: `basePaths.us` + `pathPrefix.us` for all 6 product types

**Conditional rendering (mosaico + vetrite):**

| Element                                  | `/us/`                           | Other locales |
| ---------------------------------------- | -------------------------------- | ------------- |
| Price                                    | `$` (USD) or `$-----` if not set | Hidden        |
| PricingCard (stock, warehouse, shipping) | Visible                          | Hidden        |
| Request Sample button                    | Visible                          | Hidden        |
| Get a Quote button                       | Visible                          | Visible       |
| Sample image (field_immagine_campione)   | Visible                          | Hidden        |
| Measurements                             | Inch only                        | mm only       |
| Grout consumption                        | kg/sqft                          | kg/m²         |

**Components modified:**

- `SpecProductHero` — `isUs` prop gates PricingCard + Request Sample
- `ProductCta` — `showRequestSample` prop
- `ProductPricingCard` — unchanged (gated by parent)
- `MosaicProductPreview` (page.tsx) — locale-aware price cascade, mm/inch branching, sample image gating
- `ProdottoMosaico` — `getLocale()` for route locale, same conditional logic
- `ProdottoVetrite` — price section US-only, inch/cm dimension gating

**Files changed:** 14 modified + 3 new (messages/us.json, e2e/us-locale.spec.ts, playwright.config.ts)

---

#### New REST View Integration: `mosaic-products` Listing Endpoint

Integrated the new Drupal REST View `mosaic-products/{collectionTid}/{colorTid}` for mosaic product listings, replacing the broken V1 `products/prodotto_mosaico` endpoint for collection pages.

**New fetcher:**

| Fetcher                     | Endpoint                                       | File                                    |
| --------------------------- | ---------------------------------------------- | --------------------------------------- |
| `fetchMosaicProductListing` | `/{locale}/api/v1/mosaic-products/{tid}/{tid}` | `src/lib/api/mosaic-product-listing.ts` |

- Uses `"all"` as wildcard for either filter (e.g. `mosaic-products/58/all` = all products in collection 58)
- Normalizes `view_node` (full Drupal URL) to relative path via `stripDomain()` + `stripLocalePrefix()`
- `field_prezzo_on_demand` mapped from `"Off"`/`"On"` to boolean
- No server-side pagination — endpoint returns all matching items

**Hybrid routing approach (resolve-path TID + renderProductListing UX):**

- `resolvePath()` returns the collection TID directly (e.g. 58 for Murano Smalto) — no extra V3 taxonomy fetch needed
- New `resolvedTid` parameter on `renderProductListing()` — when set with `prodotto_mosaico`, uses `fetchMosaicProductListing` instead of V1
- Full `ProductListingTemplate` UX preserved: filter sidebar, context bar, collection popover
- Single fetch chain: resolve-path (cached 3600s) → mosaic-products/{tid}/all (60s) + filter options (parallel)

**Endpoint shape (`mosaic-products`):**

```
Response: MosaicProductListingItemRest[]
Item: { nid, field_titolo_main, field_immagine, field_prezzo_eu, field_prezzo_usa_sheet, field_prezzo_usa_sqft, field_prezzo_on_demand, view_node }
```

**Files changed:**

- `src/lib/api/mosaic-product-listing.ts` — new fetcher + normalizer
- `src/app/[locale]/[...slug]/page.tsx` — `mosaico_collezioni` handler in resolve-path intercept, `resolvedTid` param on `renderProductListing`, conditional mosaic endpoint in State 2

---

#### Bug Fix: URL-encoded Slug Segments Breaking FR and RU Locales

French (`/fr/mosaïque/murano-smalto`) and Russian (`/ru/мозаика/murano-smalto`) collection pages rendered in hub mode (category cards only, 0 products) instead of product grid mode.

**Root cause:** Next.js passes `slug[]` params URL-encoded (`mosa%C3%AFque`, `%D0%BC%D0%BE%D0%B7%D0%B0%D0%B8%D0%BA%D0%B0`), not decoded. The `===` comparison against decoded NFC strings in `FILTER_REGISTRY.basePaths` failed silently → `parseFiltersFromUrl` returned no active P0 filter → hub mode.

**Fix:** `decodeURIComponent(s).normalize('NFC')` applied in two places:

- `src/domain/filters/search-params.ts` — slug segments normalized before matching against registry basePaths
- `src/app/[locale]/[...slug]/page.tsx` — `renderProductListing` basePath matchCount calculation

**Impact:** All 6 locales now render collection pages correctly. This was a latent bug affecting any locale with non-ASCII characters in the URL path (FR `ï`, RU Cyrillic, ES `á`).

**Files changed:**

- `src/domain/filters/search-params.ts`
- `src/app/[locale]/[...slug]/page.tsx`

---

### 2026-03-26

#### New REST Endpoint Integration: `resolve-path` + Product Endpoints

Replaced the disabled C1 entity endpoint with a new two-step routing pattern: `resolve-path` resolves URL aliases to entity metadata (NID, bundle, locale, multilingual aliases), then type-specific product endpoints fetch the data.

**New fetchers created:**

| Fetcher                    | Endpoint                                     | File                             |
| -------------------------- | -------------------------------------------- | -------------------------------- |
| `resolvePath` (R1)         | `/{locale}/api/v1/resolve-path?path={alias}` | `src/lib/api/resolve-path.ts`    |
| `fetchMosaicProduct` (P1)  | `/{locale}/api/v1/mosaic-product/{nid}`      | `src/lib/api/mosaic-product.ts`  |
| `fetchVetriteProduct` (P2) | `/{locale}/api/v1/vetrite-product/{nid}`     | `src/lib/api/vetrite-product.ts` |
| `fetchTextileProduct` (P3) | `/{locale}/api/v1/textile-product/{nid}`     | `src/lib/api/textile-product.ts` |

**Routing changes (`src/app/[locale]/[...slug]/page.tsx`):**

- Product detail pages (2+ URL segments) now try `resolve-path` before the multi-slug listing interception
- `prodotto_mosaico` → renders via `MosaicProductPreview` using DS Spec\* blocks (SpecProductHero, SpecProductDetails, SpecProductSpecs, SpecProductResources, SpecProductGallery)
- `prodotto_vetrite` → renders via legacy `ProdottoVetrite` template with `vetriteToLegacyNode` adapter
- `prodotto_tessuto` → renders via legacy `ProdottoTessuto` template with `textileToLegacyNode` adapter
- Added `decodeURIComponent` on `drupalPath` for non-Latin scripts (Cyrillic, accented characters)

**Language switcher fix (`src/components/composed/NavLanguageSwitcher.tsx`):**

- Replaced `router.push()` (soft navigation) with `window.location.href` (hard navigation) to force full re-render on locale change — fixes stale RSC layout cache keeping old locale's messages
- Added `decodeURIComponent` in `getTranslatedPath` server action for encoded paths (Cyrillic, French accented)
- `getTranslatedPath` now falls back to `resolve-path` aliases when C2 `translate-path` endpoint is unavailable

**CSP update (`next.config.mjs`):**

- Added `http://192.168.86.201` to `media-src` for local Drupal video playback

**Types added (`src/lib/api/types.ts`):**

- `ResolvePathResponse` (R1) — includes `aliases?: Record<string, string>` for multilingual paths
- `MosaicProductRest`, `MosaicProductCollectionRest`, `MosaicProductDocumentRest`, `MosaicProductGroutRest` (P1)
- `VetriteProductRest`, `VetriteProductCollectionRest`, `VetriteProductDocumentRest` (P2)
- `TextileProductRest`, `TextileProductCategoryRest`, `TextileProductDocumentRest`, `TextileProductFinituraRest`, `TextileProductMaintenanceRest`, `TextileProductTypologyRest` (P3)

**Normalizer pattern established:**
Each product fetcher includes a normalizer that transforms raw Drupal REST shapes into clean typed domain models (boolean coercion, `emptyToNull`, HTML stripping for simple value fields). Legacy template adapters (`vetriteToLegacyNode`, `textileToLegacyNode`) reconstruct C1-like shapes from normalized data.

---

#### Documentation Overhaul: Drupal Data Layer Analysis

15-agent swarm analysis (5 Hermes codebase mapping + 5 Athena best practices research + Apollo strategic analysis + 4 Clio report writers) produced comprehensive documentation replacing all outdated files.

**New/rewritten reports:**

- `docs/API_QUICK_REFERENCE.md` — Endpoint cheat sheet (14 endpoints)
- `docs/DRUPAL_API_CATALOG.md` — Full endpoint reference with response shapes
- `docs/DRUPAL_CONTENT_MAP.md` — Entity types, taxonomy, paragraphs, migration status
- `docs/DRUPAL_FIELD_INVENTORY.md` — Per-template field access map (19 templates)
- `docs/STRATEGIC_IMPROVEMENTS.md` — 15 recommendations in 5 phases with priority matrix
- `docs/DRUPAL_BACKEND_BRIEF_resolve-path.md` — Brief for Drupal team (resolve-path endpoint spec)

**CLAUDE.md updates:**

- Added 3 Gen blocks (GenA, GenB, GenC) — total now 12
- Fixed card ratios (arredo 4/3, not 3/2)
- Added `imageUrlMain` to V1 response documentation
- New section "Data Layer Architecture — Uniformity Analysis" with 5 uniform + 5 heterogeneous dimensions
- Removed obsolete INCLUDE_MAP reference

**Deleted obsolete files:**

- `AGENTS.md` (25KB — JSON:API era docs)
- `TAXONOMY_CATALOG.md` (14KB — replaced by DRUPAL_CONTENT_MAP)
- `docs/superpowers/` (7 completed migration plans/specs)
- 4 root-level dev screenshots (7.7MB)
- `test-results/` (empty directory)

**Restore point:** Tag `pre-rest-views-rebuild` created before REST Views rebuild work.

---

#### Textile Product: Hierarchical Finiture, Maintenance Icons, HTML Fixes

- **Hierarchical finiture support** — `field_finiture_tessuto` now arrives with `children[]` array containing color variants (tid, name, field_codice_colore hex, field_immagine swatch, field_testo composition, field_colore term). Updated `TextileProductFinituraRest` type, normalizer, and legacy adapter to flatten parent→children into the flat array the legacy template expects.
- Added maintenance instruction icons in `ProdottoTessuto` legacy template — `getDrupalImageUrl()` extracts icon URL from `field_immagine` on each maintenance term, rendered as 20x20px inline icon next to term name
- Fixed HTML tag leakage in textile adapter — `field_altezza_cm` and `field_altezza_inch` values stripped of `<p>` tags via `stripHtml()` in `textileToLegacyNode`

**Files changed:**

- `src/lib/api/types.ts` — added `TextileProductFinituraChildRest` with `children[]` + `field_colore` as object
- `src/lib/api/textile-product.ts` — `TextileProductFinituraChild` + `TextileProductFinitura` with hierarchical normalizer
- `src/app/[locale]/[...slug]/page.tsx` — `textileToLegacyNode` flattens children into legacy format
- `src/templates/nodes/ProdottoTessuto.tsx` — added `getDrupalImageUrl` import + icon rendering in maintenance list

---

#### Refactoring Roadmap

Created `docs/REFACTORING_ROADMAP.md` — 23 refactoring items organized by trigger condition (CMS endpoint completion, locale support, DS migration, etc.) with tracking table for endpoint status.

---

#### Image Optimization: `next/image` Migration (Phase 1 — Composed Components)

Migrated all content-image rendering in design-system composed components from native `<img>` to `next/image` `<Image>` for automatic srcset, WebP/AVIF format negotiation, and lazy loading.

**Migrated to `next/image` (fill mode):**

| Component         | `sizes`                                                    | Notes                                                                            |
| ----------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `ProductCard`     | `(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw`  | Product grid cards                                                               |
| `CategoryCard`    | `(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw`  | Category hub cards; swatch variant uses `width={64} height={64}`                 |
| `PixallHubCard`   | `(max-width: 768px) 100vw, 50vw`                           | Pixall product hub card                                                          |
| `GalleryCarousel` | `(max-width: 768px) 100vw, 50vw`                           | Gallery slides                                                                   |
| `ProductCarousel` | `56px` (thumbnails)                                        | Main slides delegate to `ResponsiveImage`; thumbnails use `fill` with fixed size |
| `MediaElement`    | `(max-width: 768px) 100vw, 50vw`                           | Content images in Gen\* paragraph blocks                                         |
| `ResponsiveImage` | Configurable via `sizes` prop (default `100vw`)            | New `sizes` prop added to interface                                              |
| `DocumentCard`    | `(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw` | Document cover images                                                            |

**Intentionally kept as `<img>` (with documentation comments):**

| Component                        | Reason                                                   |
| -------------------------------- | -------------------------------------------------------- |
| `CollectionPopoverContent`       | `size-7` (28px) thumbnail — below 80px threshold         |
| `ContextBar`                     | `size-16` (64px) thumbnail — below 80px threshold        |
| `SwatchList`                     | `size-6` (24px) decorative swatch — below 80px threshold |
| `VimeoPlayer`                    | Poster frame — transient, replaced by iframe on play     |
| `NavbarDesktop` / `NavbarMobile` | Logo — static tiny PNG                                   |
| `SpecProductSpecs`               | Assembly/grouting images — 80x80px decorative            |
| Color swatch `backgroundImage`   | CSS pattern-fill, not an `<img>` element                 |

**Files changed:**

- `src/components/composed/ProductCard.tsx`
- `src/components/composed/CategoryCard.tsx`
- `src/components/composed/PixallHubCard.tsx`
- `src/components/composed/GalleryCarousel.tsx`
- `src/components/composed/ProductCarousel.tsx`
- `src/components/composed/MediaElement.tsx`
- `src/components/composed/ResponsiveImage.tsx`
- `src/components/composed/DocumentCard.tsx`
- `src/components/composed/CollectionPopoverContent.tsx` (skip comment added)
- `src/components/composed/ContextBar.tsx` (skip comment added)
- `src/components/composed/SwatchList.tsx` (skip comment added)

**Policy established:**

> Every `<img>` rendering Drupal content > 100px must use `next/image`. Exceptions: logos, CSS swatches, decorative thumbnails < 80px, video posters, and legacy templates pending DS migration.

**Sentinel quality-gate fixes (post-migration):**

- `CategoryCard.tsx` — Added `sizes="64px"` to fixed-dimension swatch `<Image>` + inline comment
- `VimeoPlayer.tsx` — Added skip comment on poster `<img>` for consistency
- `next.config.mjs` — Added `www.sicis.com` to `remotePatterns` (was missing; CSP already allowed it)

**Verification:** TypeScript check passed (`npx tsc --noEmit`), zero errors. Sentinel quality gate: PASS after fixes.
