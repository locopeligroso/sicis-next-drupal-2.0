# resolveImage Migration — Full Migration Design

**Date:** 2026-04-04
**Scope:** Migrate all image resolution from `resolveImageUrl` (string-only) to `resolveImage` ({ url, width, height }) across fetchers, card types, components, and GalleryCarousel cleanup.

## Context

Drupal now returns `{ url, width, height }` for **every** image field across all endpoints (verified via direct API calls on 2026-04-04). The codebase still uses `resolveImageUrl` in ~35 call sites, discarding width/height. `resolveImage` (which preserves dimensions) is only used by ParagraphResolver adapters.

## Goals

1. Eliminate `resolveImageUrl` — all call sites migrate to `resolveImage`
2. Update all card type interfaces from `imageUrl: string | null` to `image: ResolvedImage | null`
3. Update all consumer components to access `image?.url` instead of `imageUrl`
4. Remove the `onLoad` dimension-detection workaround from GalleryCarousel
5. Simplify ParagraphResolver adapters (remove dead `meta?.width` fallback)
6. Zero visual regression — no rendering changes

## Design

### 1. Core: `client.ts`

- **Delete** `resolveImageUrl` function and its export
- **Keep** `ResolvedImage` with `width: number | null`, `height: number | null` (defensive for future edge cases)
- **Keep** `resolveImage` unchanged — handles 3 patterns (string, `{ uri: { url } }`, `{ url, width, height }`)
- **Keep** `resolveImageArray` unchanged — will now be used by `mosaic-product.ts` for `field_gallery`

### 2. Bridge: `drupal/image.ts`

- `getDrupalImageUrl` currently delegates to `resolveImageUrl`
- Update to: `return resolveImage(field)?.url ?? null` (preserves its `string | null` return type for any remaining consumers)

### 3. Fetcher Card Types

All card type interfaces replace their string image field with `ResolvedImage`:

| File | Type | Before | After |
|------|------|--------|-------|
| `listings.ts` | `BlogCard` | `imageUrl: string \| null` | `image: ResolvedImage \| null` |
| `listings.ts` | `ProgettoCard` | `imageUrl: string \| null` | `image: ResolvedImage \| null` |
| `listings.ts` | `NewsCard` | `imageUrl: string \| null` | `image: ResolvedImage \| null` |
| `listings.ts` | `TutorialCard` | `imageUrl: string \| null` | `image: ResolvedImage \| null` |
| `listings.ts` | `ShowroomCard` | `imageUrl: string \| null` | `image: ResolvedImage \| null` |
| `listings.ts` | `DocumentCard` (type) | `imageUrl: string \| null` | `image: ResolvedImage \| null` |
| `product-listing-factory.ts` | `ProductCard` | `imageUrl: string \| null` | `image: ResolvedImage \| null` |
| `mosaic-hub.ts` | `MosaicTermItem` | `imageUrl: string \| null` | `image: ResolvedImage \| null` |
| `vetrite-hub.ts` | `VetriteTermItem` | `imageUrl: string \| null` | `image: ResolvedImage \| null` |
| `category-hub.ts` | `CategoryHubItem` | `imageUrl: string \| null` | `image: ResolvedImage \| null` |

Product detail fetchers with multiple image fields:

| File | Before | After |
|------|--------|-------|
| `mosaic-product.ts` | `imageUrl`, `imageSampleUrl` | `image`, `imageSample` |
| `mosaic-product.ts` | `field_gallery` manual | `gallery: resolveImageArray(raw.field_gallery)` |
| `vetrite-product.ts` | `imageUrl`, `imageSrc` | `image` |
| `arredo-product.ts` | `imageUrl`, `imageSrc` (fabrics/variants) | `image` |
| `pixall-product.ts` | `imageUrl`, `imageModulesUrl`, `imageSrc` | `image`, `imageModules`, `image` (per sub-type) |
| `textile-product.ts` | `imageSrc` | `image` |
| `illuminazione-product.ts` | `imageUrl`, `imageSrc` | `image` |

### 4. Consumer Components

All components switch from `imageUrl`/`imageSrc` prop access to `image?.url`. No rendering changes (all continue using `fill` mode with CSS aspect ratios):

| Component | Change |
|-----------|--------|
| `ProductCard.tsx` | `imageUrl` → `image?.url` in `<Image>` src |
| `CategoryCard.tsx` | `imageUrl` → `image?.url` in `<Image>` src |
| `DocumentCard.tsx` | `imageSrc` → `image?.url` in `<Image>` src |
| `SpecHubCrossLinks.tsx` | `resolveImageUrl()` → `resolveImage()?.url` |
| `SpecHubOtherPages.tsx` | `imageUrl` → `image?.url` |
| `SpecProjectListing.tsx` | `imageUrl` → `image?.url` |
| `SpecInspirationListing.tsx` | `imageUrl` → `image?.url` |
| `SpecNewsListing.tsx` | `imageUrl` → `image?.url` |
| `SpecTutorialListing.tsx` | `imageUrl` → `image?.url` |
| `Ambiente.tsx` | `resolveImageUrl()` → `resolveImage()`, access `.url` |

### 5. GalleryCarousel Cleanup

**Problem:** GalleryCarousel has an `onLoad` workaround that detects image dimensions at runtime via `naturalWidth`/`naturalHeight`, because dimensions were not always available from Drupal. This is now dead code.

**GalleryCarouselSlide type change:**

```ts
// Before
width?: number;   // optional
height?: number;  // optional

// After
width: number;    // required
height: number;   // required
```

**Removals from GalleryCarousel.tsx:**

| What | Description |
|------|-------------|
| `md:opacity-0` conditional (line 135-136) | Slides always visible — dimensions always known |
| Conditional inline style branch (line 138-143) | `--slide-ratio` always set, no branching needed |
| `onLoad` handler (line 153-164) | Dead code — ratio set at render time, not from DOM |

**What stays unchanged:**

| What | Why |
|------|-----|
| `ResizeObserver` | Still needed for window resize → arrow recalculation |
| `updateArrows` | Correct logic, depends only on scroll/resize |
| `scrollBySlide` | No dependency on `onLoad` |
| Responsive classes | `w-[85vw] aspect-[3/4]` mobile, `md:aspect-[var(--slide-ratio)] md:h-92` desktop |

**Behavior after cleanup:**
- Mobile/small: fixed aspect ratios via CSS (`aspect-[3/4]`, `aspect-square`)
- Desktop: fixed height (`md:h-92 lg:h-128` etc.), width adapts to `--slide-ratio` (original image ratio)

### 6. ParagraphResolver Simplification

Adapters `adaptGenGallery` and `adaptGenGalleryIntro`:

```ts
// Before — double fallback
const width = resolved.width ?? (meta?.width as number | undefined);
const height = resolved.height ?? (meta?.height as number | undefined);

// After — direct (with numeric fallback for type safety)
const width = resolved.width ?? 1200;
const height = resolved.height ?? 800;
```

The `meta?.width` fallback path is dead code — `blocks/{nid}` now returns `{ url, width, height }` directly, so `resolved.width` is always populated.

## Files Touched (~24)

| Layer | Files |
|-------|-------|
| Core | `client.ts` |
| Bridge | `drupal/image.ts` |
| Fetchers (11) | `listings.ts`, `product-listing-factory.ts`, `mosaic-product.ts`, `vetrite-product.ts`, `arredo-product.ts`, `textile-product.ts`, `pixall-product.ts`, `illuminazione-product.ts`, `mosaic-hub.ts`, `vetrite-hub.ts`, `category-hub.ts` |
| Blocks (6) | `SpecHubCrossLinks.tsx`, `SpecProjectListing.tsx`, `SpecInspirationListing.tsx`, `SpecNewsListing.tsx`, `SpecTutorialListing.tsx`, `SpecHubOtherPages.tsx` |
| Composed (4) | `ProductCard.tsx`, `CategoryCard.tsx`, `DocumentCard.tsx`, `GalleryCarousel.tsx` |
| Templates (1) | `Ambiente.tsx` |
| Adapters (1) | `ParagraphResolver.tsx` |

## Out of Scope

- No rendering changes (fill → explicit dimensions)
- No changes to GenGallery.tsx itself (type updates cascade from GalleryCarouselSlide)
- No renaming beyond image fields
- No new component functionality

## Verification

- `npx tsc --noEmit` — all types align after migration
- Visual spot-check on dev server: product listings, hub pages, gallery blocks, ambiente page
- No test changes expected (rendering output identical)
