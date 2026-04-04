# resolveImage Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all image resolution from `resolveImageUrl` (string-only) to `resolveImage` (`{ url, width, height }`) across the entire codebase, clean up GalleryCarousel's onLoad workaround, and simplify ParagraphResolver adapters.

**Architecture:** Bottom-up migration: core functions → shared types → fetchers → consumers → cleanup. Each task produces a compilable codebase (`tsc --noEmit` must pass after every task).

**Tech Stack:** TypeScript, Next.js 16, next/image, React 19

**Spec:** `docs/superpowers/specs/2026-04-04-resolve-image-migration-design.md`

---

## File Map

| Layer | Files | Action |
|-------|-------|--------|
| Core | `src/lib/api/client.ts` | Delete `resolveImageUrl` |
| Bridge | `src/lib/drupal/image.ts` | Update `getDrupalImageUrl` to use `resolveImage` |
| Shared types | `src/lib/api/products.ts` | `ProductCard.imageUrl` → `image: ResolvedImage \| null` |
| Factory | `src/lib/api/product-listing-factory.ts` | `resolveImageUrl` → `resolveImage` |
| Listings | `src/lib/api/listings.ts` | All card types + 9 call sites |
| Product detail (6) | `mosaic-product.ts`, `vetrite-product.ts`, `arredo-product.ts`, `pixall-product.ts`, `textile-product.ts`, `illuminazione-product.ts` | All `resolveImageUrl` → `resolveImage`, field renames |
| Hub (3) | `mosaic-hub.ts`, `vetrite-hub.ts`, `category-hub.ts` | `imageUrl` → `image` |
| Composed (3) | `ProductCard.tsx`, `CategoryCard.tsx`, `DocumentCard.tsx` | Prop access `.imageUrl` → `.image?.url` |
| Blocks (5) | `SpecHubCrossLinks.tsx`, `SpecHubOtherPages.tsx`, `SpecProjectListing.tsx`, `SpecInspirationListing.tsx`, `SpecNewsListing.tsx`, `SpecTutorialListing.tsx` | Prop access update |
| Template (1) | `Ambiente.tsx` | Import + usage update |
| Carousel | `GalleryCarousel.tsx` | Remove onLoad hack, make width/height required |
| Adapter | `ParagraphResolver.tsx` | Remove meta fallback |
| Tests (2) | `products-normalizer.test.ts`, `product-listing-factory.test.ts` | `.imageUrl` → `.image?.url` |

---

### Task 1: Delete `resolveImageUrl` from `client.ts`

**Files:**
- Modify: `src/lib/api/client.ts:102-123`

- [ ] **Step 1: Delete `resolveImageUrl` function and its JSDoc**

Remove lines 92-123 (the JSDoc comment + the function body):

```ts
// DELETE this entire block (lines 92-123):

/**
 * Unified image URL resolver — handles the 4 patterns present in the Drupal data layer:
 * ...
 */
export function resolveImageUrl(raw: unknown): string | null {
  // ... entire function body
}
```

- [ ] **Step 2: Verify `resolveImage` and `resolveImageArray` are unchanged**

These functions remain exactly as-is. No modifications needed.

- [ ] **Step 3: Run type check (expected: ~35 errors for missing `resolveImageUrl`)**

Run: `npx tsc --noEmit 2>&1 | head -50`

Expected: Multiple "Cannot find name 'resolveImageUrl'" errors across fetcher files. This is correct — we'll fix them in subsequent tasks.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/client.ts
git commit -m "refactor: delete resolveImageUrl — all callers will migrate to resolveImage"
```

---

### Task 2: Update `drupal/image.ts` bridge

**Files:**
- Modify: `src/lib/drupal/image.ts:5,17-19`

- [ ] **Step 1: Update import and function**

```ts
// Before (line 5):
import { resolveImageUrl } from '@/lib/api/client';

// After:
import { resolveImage } from '@/lib/api/client';
```

```ts
// Before (line 18):
  return resolveImageUrl(field);

// After:
  return resolveImage(field)?.url ?? null;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/drupal/image.ts
git commit -m "refactor: getDrupalImageUrl delegates to resolveImage instead of resolveImageUrl"
```

---

### Task 3: Update `ProductCard` in `products.ts`

**Files:**
- Modify: `src/lib/api/products.ts:2,15-25,100-121`

- [ ] **Step 1: Add `resolveImage` import and update `ProductCard` interface**

```ts
// Before (line 2):
import { apiGet, stripDomain, stripLocalePrefix, emptyToNull } from './client';

// After:
import { apiGet, stripDomain, stripLocalePrefix, emptyToNull, resolveImage, type ResolvedImage } from './client';
```

```ts
// Before (lines 15-25):
export interface ProductCard {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null; // field_immagine_anteprima (preview for cards)
  price: string | null;
  priceOnDemand: boolean;
  noUsaStock: boolean;
  path: string | null;
}

// After:
export interface ProductCard {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  image: ResolvedImage | null;
  price: string | null;
  priceOnDemand: boolean;
  noUsaStock: boolean;
  path: string | null;
}
```

- [ ] **Step 2: Update `normalizeProduct` function**

```ts
// Before (line 107):
    imageUrl: emptyToNull(item.imageUrl),

// After:
    image: resolveImage(item.imageUrl),
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/products.ts
git commit -m "refactor: ProductCard.imageUrl → image: ResolvedImage | null"
```

---

### Task 4: Update `product-listing-factory.ts`

**Files:**
- Modify: `src/lib/api/product-listing-factory.ts:7,171`

- [ ] **Step 1: Update import**

```ts
// Before (line 7):
  resolveImageUrl,

// After:
  resolveImage,
```

- [ ] **Step 2: Update normalizer call**

```ts
// Before (line 171):
    const imageUrl = resolveImageUrl(item[config.imageField]);

// After:
    const image = resolveImage(item[config.imageField]);
```

- [ ] **Step 3: Update the object that uses `imageUrl`**

Find where `imageUrl` is assigned in the return object (same function, a few lines below line 171) and change:

```ts
// Before:
      imageUrl,

// After:
      image,
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/product-listing-factory.ts
git commit -m "refactor: product-listing-factory uses resolveImage"
```

---

### Task 5: Update `listings.ts` — all card types and call sites

**Files:**
- Modify: `src/lib/api/listings.ts`

This is the largest single file. 5 card type interfaces + 9 `resolveImageUrl` call sites.

- [ ] **Step 1: Update import**

```ts
// Before (line 7):
  resolveImageUrl,

// After:
  resolveImage,
  type ResolvedImage,
```

- [ ] **Step 2: Update all card type interfaces**

For each interface, change `imageUrl: string | null` to `image: ResolvedImage | null`:

- `ShowroomCard` (line 91): `imageUrl: string | null;` → `image: ResolvedImage | null;`
- `BlogCard` (line 118): `imageUrl: string | null;` → `image: ResolvedImage | null;`
- `ProgettoCard` (line 138): `imageUrl: string | null;` → `image: ResolvedImage | null;`
- `DocumentCard` type (line 157): `imageUrl: string | null;` → `image: ResolvedImage | null;`
- `TutorialCard` (line 491): `imageUrl: string | null;` → `image: ResolvedImage | null;`

- [ ] **Step 3: Update all 9 `resolveImageUrl` call sites**

Replace each `imageUrl: resolveImageUrl(...)` with `image: resolveImage(...)`:

- Line 185: `imageUrl: resolveImageUrl(item.field_immagine)` → `image: resolveImage(item.field_immagine)`
- Line 241: `imageUrl: resolveImageUrl(item.field_immagine_anteprima)` → `image: resolveImage(item.field_immagine_anteprima)`
- Line 386: `imageUrl: resolveImageUrl(item.field_immagine_anteprima)` → `image: resolveImage(item.field_immagine_anteprima)`
- Line 413: `imageUrl: resolveImageUrl(item.field_immagine_anteprima)` → `image: resolveImage(item.field_immagine_anteprima)`
- Line 444: `imageUrl: resolveImageUrl(item.field_immagine_anteprima)` → `image: resolveImage(item.field_immagine_anteprima)`
- Line 472: `imageUrl: resolveImageUrl(item.field_immagine)` → `image: resolveImage(item.field_immagine)`
- Line 558: `imageUrl: resolveImageUrl(item.field_immagine)` → `image: resolveImage(item.field_immagine)`
- Line 658: `imageUrl: resolveImageUrl(item.field_immagine)` → `image: resolveImage(item.field_immagine)`
- Line 691: `imageUrl: resolveImageUrl(item.field_immagine)` → `image: resolveImage(item.field_immagine)`

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/listings.ts
git commit -m "refactor: listings.ts — all card types use image: ResolvedImage"
```

---

### Task 6: Update product detail fetchers (6 files)

**Files:**
- Modify: `src/lib/api/mosaic-product.ts`
- Modify: `src/lib/api/vetrite-product.ts`
- Modify: `src/lib/api/arredo-product.ts`
- Modify: `src/lib/api/pixall-product.ts`
- Modify: `src/lib/api/textile-product.ts`
- Modify: `src/lib/api/illuminazione-product.ts`

All 6 files follow the same pattern: update import, replace `resolveImageUrl` with `resolveImage`, rename output fields.

- [ ] **Step 1: `mosaic-product.ts`**

Import (line 2): replace `resolveImageUrl` with `resolveImage, resolveImageArray, type ResolvedImage`

Call sites:
- Line 91: `imageSrc: resolveImageUrl(raw.field_immagine)` → `image: resolveImage(raw.field_immagine)`
- Line 106: `imageSrc: resolveImageUrl(raw.field_immagine)` → `image: resolveImage(raw.field_immagine)`
- Line 128: `imageUrl: resolveImageUrl(raw.field_immagine)` → `image: resolveImage(raw.field_immagine)`
- Line 129: `imageSampleUrl: resolveImageUrl(raw.field_immagine_campione)` → `imageSample: resolveImage(raw.field_immagine_campione)`

Also update gallery field if it uses manual resolution:
- Find `field_gallery` mapping and replace with `gallery: resolveImageArray(raw.field_gallery)`

Update the return type interfaces in the same file to match the new field names.

- [ ] **Step 2: `vetrite-product.ts`**

Import (line 2): replace `resolveImageUrl` with `resolveImage, type ResolvedImage`

Call sites:
- Line 65: `imageSrc: resolveImageUrl(raw.field_immagine)` → `image: resolveImage(raw.field_immagine)`
- Line 81: `imageUrl: resolveImageUrl(raw.field_immagine)` → `image: resolveImage(raw.field_immagine)`
- Line 99: `imageSrc: resolveImageUrl(col.field_immagine)` → `image: resolveImage(col.field_immagine)`

Update return type interfaces.

- [ ] **Step 3: `arredo-product.ts`**

Import (line 2): replace `resolveImageUrl` with `resolveImage, type ResolvedImage`

Call sites:
- Line 140: `ownImage = resolveImageUrl(fabric.field_immagine)` → `ownImage = resolveImage(fabric.field_immagine)`
- Line 147: `imageUrl: resolveImageUrl(v.field_immagine)` → `image: resolveImage(v.field_immagine)`
- Line 176: `imageUrl: resolveImageUrl(raw.field_immagine)` → `image: resolveImage(raw.field_immagine)`
- Line 189: `imageSrc: resolveImageUrl(d.field_immagine)` → `image: resolveImage(d.field_immagine)`

Update return type interfaces. Note: `ownImage` variable changes type from `string | null` to `ResolvedImage | null` — update any downstream usage (likely `.url` access for comparison or assignment).

- [ ] **Step 4: `pixall-product.ts`**

Import (line 2): replace `resolveImageUrl` with `resolveImage, type ResolvedImage`

Call sites:
- Line 67: `imageUrl: resolveImageUrl(raw.field_immagine)` → `image: resolveImage(raw.field_immagine)`
- Line 68: `imageModulesUrl: resolveImageUrl(raw.field_immagine_moduli)` → `imageModules: resolveImage(raw.field_immagine_moduli)`
- Line 86: `imageSrc: resolveImageUrl(g.field_immagine)` → `image: resolveImage(g.field_immagine)`
- Line 92: `imageSrc: resolveImageUrl(d.field_immagine)` → `image: resolveImage(d.field_immagine)`

Update return type interfaces.

- [ ] **Step 5: `textile-product.ts`**

Import (line 2): replace `resolveImageUrl` with `resolveImage, type ResolvedImage`

Call sites:
- Line 103: `imageSrc: resolveImageUrl(doc.field_immagine)` → `image: resolveImage(doc.field_immagine)`
- Line 114: `imageSrc: resolveImageUrl(c.field_immagine)` → `image: resolveImage(c.field_immagine)`
- Line 125: `imageSrc: resolveImageUrl(m.field_immagine)` → `image: resolveImage(m.field_immagine)`

Update return type interfaces.

- [ ] **Step 6: `illuminazione-product.ts`**

Import (line 2): replace `resolveImageUrl` with `resolveImage, type ResolvedImage`

Call sites:
- Line 62: `imageUrl: resolveImageUrl(raw.field_immagine)` → `image: resolveImage(raw.field_immagine)`
- Line 72: `imageSrc: resolveImageUrl(d.field_immagine)` → `image: resolveImage(d.field_immagine)`

Update return type interfaces.

- [ ] **Step 7: Commit all 6 files**

```bash
git add src/lib/api/mosaic-product.ts src/lib/api/vetrite-product.ts src/lib/api/arredo-product.ts src/lib/api/pixall-product.ts src/lib/api/textile-product.ts src/lib/api/illuminazione-product.ts
git commit -m "refactor: all 6 product detail fetchers use resolveImage"
```

---

### Task 7: Update hub fetchers (3 files)

**Files:**
- Modify: `src/lib/api/mosaic-hub.ts`
- Modify: `src/lib/api/vetrite-hub.ts`
- Modify: `src/lib/api/category-hub.ts`

- [ ] **Step 1: `mosaic-hub.ts`**

Import (line 7): replace `resolveImageUrl` with `resolveImage, type ResolvedImage`

Interfaces:
- `MosaicTermItem` (line 30): `imageUrl: string | null` → `image: ResolvedImage | null`
- `MosaicCategoryPage` (line 201): `imageUrl: string | null` → `image: ResolvedImage | null`

Call sites:
- Line 44: `imageUrl: resolveImageUrl(item.field_immagine)` → `image: resolveImage(item.field_immagine)`
- Line 222: `imageUrl: resolveImageUrl(item.field_immagine)` → `image: resolveImage(item.field_immagine)`

- [ ] **Step 2: `vetrite-hub.ts`**

Import (line 7): replace `resolveImageUrl` with `resolveImage, type ResolvedImage`

Interface:
- `VetriteTermItem` (line 31): `imageUrl: string | null` → `image: ResolvedImage | null`

Call site:
- Line 48: `imageUrl: resolveImageUrl(item.field_immagine)` → `image: resolveImage(item.field_immagine)`

- [ ] **Step 3: `category-hub.ts`**

Import (line 2): replace `resolveImageUrl` with `resolveImage, type ResolvedImage`

Interface:
- `CategoryHubItem` (line 52): `imageUrl: string | null` → `image: ResolvedImage | null`

Call site:
- Line 69: `imageUrl: resolveImageUrl(item.field_immagine)` → `image: resolveImage(item.field_immagine)`

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/mosaic-hub.ts src/lib/api/vetrite-hub.ts src/lib/api/category-hub.ts
git commit -m "refactor: hub fetchers use resolveImage"
```

---

### Task 8: Update composed consumer components

**Files:**
- Modify: `src/components/composed/ProductCard.tsx`
- Modify: `src/components/composed/CategoryCard.tsx`
- Modify: `src/components/composed/DocumentCard.tsx`

- [ ] **Step 1: `ProductCard.tsx`**

Props (line 9): `imageUrl?: string | null;` → `image?: { url: string; width: number | null; height: number | null } | null;`

Usage (line 35 area): `{imageUrl ? (<Image src={imageUrl}` → `{image?.url ? (<Image src={image.url}`

- [ ] **Step 2: `CategoryCard.tsx`**

Props (line 9): `imageUrl?: string | null;` → `image?: { url: string; width: number | null; height: number | null } | null;`

Usage (line 48 area): `{imageUrl ? (<Image src={imageUrl}` → `{image?.url ? (<Image src={image.url}`
Usage (line 66 area): same pattern

- [ ] **Step 3: `DocumentCard.tsx`**

Props (line 16): `imageSrc?: string | null;` → `image?: { url: string; width: number | null; height: number | null } | null;`

Usage (line 87 area): `{item.imageSrc ? (<Image src={item.imageSrc}` → `{item.image?.url ? (<Image src={item.image.url}`

- [ ] **Step 4: Commit**

```bash
git add src/components/composed/ProductCard.tsx src/components/composed/CategoryCard.tsx src/components/composed/DocumentCard.tsx
git commit -m "refactor: composed components accept image: ResolvedImage"
```

---

### Task 9: Update spec blocks and templates

**Files:**
- Modify: `src/components/blocks/SpecHubCrossLinks.tsx`
- Modify: `src/components/blocks/SpecHubOtherPages.tsx`
- Modify: `src/components/blocks/SpecProjectListing.tsx`
- Modify: `src/components/blocks/SpecInspirationListing.tsx`
- Modify: `src/components/blocks/SpecNewsListing.tsx`
- Modify: `src/components/blocks/SpecTutorialListing.tsx`
- Modify: `src/templates/nodes/Ambiente.tsx`

- [ ] **Step 1: `SpecHubCrossLinks.tsx`**

Import (line 9): `import { resolveImageUrl }` → `import { resolveImage }`
Usage (line 34): `return resolveImageUrl(content.field_immagine);` → `return resolveImage(content.field_immagine)?.url ?? null;`

- [ ] **Step 2: `SpecHubOtherPages.tsx`**

Find where `page.imageUrl` is accessed and change to `page.image?.url`.

- [ ] **Step 3: `SpecProjectListing.tsx`**

Find where `project.imageUrl` (from `ProgettoCard`) is accessed in the JSX and change to `project.image?.url`.

- [ ] **Step 4: `SpecInspirationListing.tsx`**

Find where `article.imageUrl` (from `BlogCard`) is accessed and change to `article.image?.url`.

- [ ] **Step 5: `SpecNewsListing.tsx`**

Find where `item.imageUrl` (from `NewsCard`) is accessed and change to `item.image?.url`.

- [ ] **Step 6: `SpecTutorialListing.tsx`**

Find where `tutorial.imageUrl` (from `TutorialCard`) is accessed and change to `tutorial.image?.url`.

- [ ] **Step 7: `Ambiente.tsx`**

Import (line 5): `import { resolveImageUrl }` → `import { resolveImage }`
Usage (line 13): `const imageUrl = resolveImageUrl(node.field_immagine);` → `const imageUrl = resolveImage(node.field_immagine)?.url ?? null;`

- [ ] **Step 8: Commit**

```bash
git add src/components/blocks/SpecHubCrossLinks.tsx src/components/blocks/SpecHubOtherPages.tsx src/components/blocks/SpecProjectListing.tsx src/components/blocks/SpecInspirationListing.tsx src/components/blocks/SpecNewsListing.tsx src/components/blocks/SpecTutorialListing.tsx src/templates/nodes/Ambiente.tsx
git commit -m "refactor: spec blocks and templates use resolveImage / image?.url"
```

---

### Task 10: GalleryCarousel cleanup

**Files:**
- Modify: `src/components/composed/GalleryCarousel.tsx:10-16,131-164`

- [ ] **Step 1: Make `width` and `height` required in `GalleryCarouselSlide`**

```ts
// Before (lines 10-16):
export interface GalleryCarouselSlide {
  src: string;
  alt: string;
  caption?: string | null;
  width?: number;
  height?: number;
}

// After:
export interface GalleryCarouselSlide {
  src: string;
  alt: string;
  caption?: string | null;
  width: number;
  height: number;
}
```

- [ ] **Step 2: Simplify the slide render — remove opacity hack and onLoad**

Replace the slide container div and Image (lines ~131-166) with:

```tsx
<div
  className={cn(
    'relative rounded-xl overflow-hidden border border-border',
    slideClassName,
  )}
  style={{
    '--slide-ratio': `${slide.width / slide.height}`,
  } as React.CSSProperties}
>
  {slide.src && (
    <Image
      src={slide.src}
      alt={slide.alt}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  )}
</div>
```

Key removals:
- `slide.width && slide.height ? '' : 'md:opacity-0'` conditional — gone
- `style` conditional branch for `--slide-ratio` — always set
- `onLoad` handler — entirely removed (no more DOM manipulation for ratio detection)
- `transition-opacity duration-300` class — no longer needed (no opacity transition)

- [ ] **Step 3: Verify ResizeObserver and arrow logic are unchanged**

The `useEffect` with `ResizeObserver` (lines 43-55) and `scrollBySlide` (lines 57-67) must remain untouched. They handle window resize and manual scrolling — unrelated to the onLoad workaround.

- [ ] **Step 4: Commit**

```bash
git add src/components/composed/GalleryCarousel.tsx
git commit -m "refactor: GalleryCarousel — remove onLoad dimension detection hack"
```

---

### Task 11: ParagraphResolver simplification

**Files:**
- Modify: `src/components_legacy/blocks_legacy/ParagraphResolver.tsx:143-155,247-254`

- [ ] **Step 1: Simplify `adaptGenGallery` (lines 138-169)**

Replace the double-fallback dimension logic:

```ts
// Before (lines 143-154):
      const resolved = resolveImage(slide.field_immagine);
      if (!resolved) return null;
      const img = slide.field_immagine as Record<string, unknown> | undefined;
      const meta = img?.meta as Record<string, unknown> | undefined;
      const alt = (meta?.alt as string) ?? '';
      // Prefer dimensions from new format; fall back to meta dimensions
      const width = resolved.width ?? (meta?.width as number | undefined);
      const height = resolved.height ?? (meta?.height as number | undefined);
      // Use alt text as caption when available; skip filename fallback
      // (blocks/{nid} returns images without alt — filename makes ugly captions)
      const caption = alt || null;
      return { src: resolved.url, alt: alt || '', caption, width, height };

// After:
      const resolved = resolveImage(slide.field_immagine);
      if (!resolved) return null;
      const img = slide.field_immagine as Record<string, unknown> | undefined;
      const meta = img?.meta as Record<string, unknown> | undefined;
      const alt = (meta?.alt as string) ?? '';
      const width = resolved.width ?? 1200;
      const height = resolved.height ?? 800;
      const caption = alt || null;
      return { src: resolved.url, alt: alt || '', caption, width, height };
```

- [ ] **Step 2: Simplify `adaptGenGalleryIntro` (lines 235-268)**

Same pattern:

```ts
// Before (lines 252-254):
      const width = resolved.width ?? (meta?.width as number | undefined);
      const height = resolved.height ?? (meta?.height as number | undefined);
      return { src: resolved.url, alt, width, height };

// After:
      const width = resolved.width ?? 1200;
      const height = resolved.height ?? 800;
      return { src: resolved.url, alt, width, height };
```

- [ ] **Step 3: Commit**

```bash
git add src/components_legacy/blocks_legacy/ParagraphResolver.tsx
git commit -m "refactor: ParagraphResolver — remove dead meta.width/height fallback"
```

---

### Task 12: Update existing tests

**Files:**
- Modify: `src/lib/api/__tests__/products-normalizer.test.ts`
- Modify: `src/lib/api/__tests__/product-listing-factory.test.ts`

- [ ] **Step 1: Update `products-normalizer.test.ts`**

All assertions referencing `imageUrl` change to `image`:

- Line 63 (factory): `imageUrl: 'https://drupal.example.com/preview.jpg'` stays (this is the REST input shape, not the normalized output)
- Line 176: `expect(products[0].imageUrl).toBeNull()` → `expect(products[0].image).toBeNull()`
- Line 187: `expect(products[0].imageUrl).toBe(previewUrl)` → `expect(products[0].image?.url).toBe(previewUrl)`

- [ ] **Step 2: Update `product-listing-factory.test.ts`**

All assertions referencing `imageUrl` change to `image`:

- Line 59 (factory `makeItem`): `field_immagine` value stays as string (simulates REST input)
- Line 295: `expect(products[0].imageUrl).toBeNull()` → `expect(products[0].image).toBeNull()`
- Line 314: `expect(products[0].imageUrl).toBe(imageUrl)` — change variable name and assertion:
  ```ts
  // This test verifies that empty string image maps to null
  expect(products[0].image).toBeNull();
  ```
- Line 389: `expect(products[0].imageUrl).toBe(img)` → `expect(products[0].image?.url).toBe(img)`
- Line 394: similar pattern

Review each test for exact assertion. The factory `makeItem` returns raw Drupal data (strings) — `resolveImage` handles string input and returns `{ url, width: null, height: null }`.

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/lib/api/__tests__/products-normalizer.test.ts src/lib/api/__tests__/product-listing-factory.test.ts`

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/__tests__/products-normalizer.test.ts src/lib/api/__tests__/product-listing-factory.test.ts
git commit -m "test: update image field assertions for resolveImage migration"
```

---

### Task 13: Verification — type check + grep + visual

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`

Expected: 0 errors. If errors remain, they indicate missed call sites — fix them.

- [ ] **Step 2: Grep for any remaining `resolveImageUrl` references**

Run: `grep -r "resolveImageUrl" src/ --include="*.ts" --include="*.tsx"`

Expected: 0 results. If any remain, update them.

- [ ] **Step 3: Grep for any remaining `imageUrl` in fetcher/component files**

Run: `grep -rn "imageUrl" src/lib/api/ src/components/composed/ProductCard.tsx src/components/composed/CategoryCard.tsx src/components/composed/DocumentCard.tsx --include="*.ts" --include="*.tsx"`

Expected: Only in `types.ts` REST shapes (these represent the Drupal response format and are intentionally unchanged) and `products.ts` `normalizeProduct` input access (`item.imageUrl` — the REST field name).

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 5: Visual spot-check on dev server**

Start dev: `npm run dev`

Check these pages for image rendering:
- Homepage (carousel)
- `/it/mosaico` (hub page — category cards)
- `/it/mosaico/murano-smalto` (product listing — product cards)
- `/it/mosaico/murano-smalto/01-bora` (product detail — hero + gallery)
- `/it/chi-siamo` (page with GenTestoImmagine blocks — gallery carousel)
- `/it/ambienti` (Ambiente listing — environment cards)

Expected: All images render identically to before migration.

- [ ] **Step 6: Final commit with all remaining fixes (if any)**

```bash
git add -A
git commit -m "refactor: complete resolveImage migration — all image resolution unified"
```
