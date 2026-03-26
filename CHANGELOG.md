# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### 2026-03-26

#### New REST Endpoint Integration: `resolve-path` + Product Endpoints

Replaced the disabled C1 entity endpoint with a new two-step routing pattern: `resolve-path` resolves URL aliases to entity metadata (NID, bundle, locale, multilingual aliases), then type-specific product endpoints fetch the data.

**New fetchers created:**

| Fetcher | Endpoint | File |
|---------|----------|------|
| `resolvePath` (R1) | `/{locale}/api/v1/resolve-path?path={alias}` | `src/lib/api/resolve-path.ts` |
| `fetchMosaicProduct` (P1) | `/{locale}/api/v1/mosaic-product/{nid}` | `src/lib/api/mosaic-product.ts` |
| `fetchVetriteProduct` (P2) | `/{locale}/api/v1/vetrite-product/{nid}` | `src/lib/api/vetrite-product.ts` |
| `fetchTextileProduct` (P3) | `/{locale}/api/v1/textile-product/{nid}` | `src/lib/api/textile-product.ts` |

**Routing changes (`src/app/[locale]/[...slug]/page.tsx`):**
- Product detail pages (2+ URL segments) now try `resolve-path` before the multi-slug listing interception
- `prodotto_mosaico` → renders via `MosaicProductPreview` using DS Spec* blocks (SpecProductHero, SpecProductDetails, SpecProductSpecs, SpecProductResources, SpecProductGallery)
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

#### Textile Product: Maintenance Icons + HTML Fixes

- Added maintenance instruction icons in `ProdottoTessuto` legacy template — `getDrupalImageUrl()` extracts icon URL from `field_immagine` on each maintenance term, rendered as 20x20px inline icon next to term name
- Fixed HTML tag leakage in textile adapter — `field_altezza_cm` and `field_altezza_inch` values stripped of `<p>` tags via `stripHtml()` in `textileToLegacyNode`

**Files changed:**
- `src/templates/nodes/ProdottoTessuto.tsx` — added `getDrupalImageUrl` import + icon rendering in maintenance list
- `src/app/[locale]/[...slug]/page.tsx` — `stripHtml()` applied to height fields in textile adapter

---

#### Refactoring Roadmap

Created `docs/REFACTORING_ROADMAP.md` — 23 refactoring items organized by trigger condition (CMS endpoint completion, locale support, DS migration, etc.) with tracking table for endpoint status.

---

#### Image Optimization: `next/image` Migration (Phase 1 — Composed Components)

Migrated all content-image rendering in design-system composed components from native `<img>` to `next/image` `<Image>` for automatic srcset, WebP/AVIF format negotiation, and lazy loading.

**Migrated to `next/image` (fill mode):**

| Component | `sizes` | Notes |
|-----------|---------|-------|
| `ProductCard` | `(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw` | Product grid cards |
| `CategoryCard` | `(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw` | Category hub cards; swatch variant uses `width={64} height={64}` |
| `PixallHubCard` | `(max-width: 768px) 100vw, 50vw` | Pixall product hub card |
| `GalleryCarousel` | `(max-width: 768px) 100vw, 50vw` | Gallery slides |
| `ProductCarousel` | `56px` (thumbnails) | Main slides delegate to `ResponsiveImage`; thumbnails use `fill` with fixed size |
| `MediaElement` | `(max-width: 768px) 100vw, 50vw` | Content images in Gen* paragraph blocks |
| `ResponsiveImage` | Configurable via `sizes` prop (default `100vw`) | New `sizes` prop added to interface |
| `DocumentCard` | `(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw` | Document cover images |

**Intentionally kept as `<img>` (with documentation comments):**

| Component | Reason |
|-----------|--------|
| `CollectionPopoverContent` | `size-7` (28px) thumbnail — below 80px threshold |
| `ContextBar` | `size-16` (64px) thumbnail — below 80px threshold |
| `SwatchList` | `size-6` (24px) decorative swatch — below 80px threshold |
| `VimeoPlayer` | Poster frame — transient, replaced by iframe on play |
| `NavbarDesktop` / `NavbarMobile` | Logo — static tiny PNG |
| `SpecProductSpecs` | Assembly/grouting images — 80x80px decorative |
| Color swatch `backgroundImage` | CSS pattern-fill, not an `<img>` element |

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
