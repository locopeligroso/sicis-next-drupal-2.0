# SmartBreadcrumb — Design Spec

> **Date:** 2026-04-02 | **Status:** Approved

## Problem

Breadcrumbs across the project are inconsistent. Only `ListingBreadcrumb` has the dropdown pattern (click a segment to see sibling pages). Product templates use static inline breadcrumbs with hardcoded labels. The dropdown pattern is valuable for navigation and should be universal.

## Decision

Create a single generic Composed component `SmartBreadcrumb` that renders breadcrumb segments. Any segment that has siblings renders a dropdown; otherwise it renders a link or static page marker.

## Interface

```ts
export interface BreadcrumbSegment {
  label: string
  href: string
  /** If present, this segment renders a dropdown with sibling pages */
  siblings?: { label: string; href: string }[]
}

interface SmartBreadcrumbProps {
  segments: BreadcrumbSegment[]
  className?: string
}
```

## Rendering Rules

For each `segment[i]`:

| Condition | Renders |
|---|---|
| Has siblings | `DropdownMenuTrigger` with label; dropdown lists all siblings; active sibling (matching href) is `font-semibold` |
| No siblings, not last | `BreadcrumbLink` with `next/link` |
| No siblings, last | `BreadcrumbPage` (static, `aria-current="page"`) |
| Last with siblings | Dropdown (same as "has siblings") with current-page visual treatment |

Separators are inserted automatically between segments.

## Component Details

- **Layer:** Composed (`src/components/composed/SmartBreadcrumb.tsx`)
- **Directive:** `'use client'` (DropdownMenu requires interactivity)
- **Primitives used:** `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger`, `Link` (next/link)
- **Spacing:** None. The breadcrumb owns no padding/margin. The containing intro block manages spacing.
- **Domain logic:** None. The component receives fully resolved segments. Sibling resolution is the caller's responsibility.

## Usage Example

Hub page (arredo):
```tsx
<SmartBreadcrumb segments={[
  { label: "Products", href: "/it/prodotti", siblings: [
    { label: "Products", href: "/it/prodotti" },
    { label: "Projects", href: "/it/progetti" },
  ]},
  { label: "Arredo", href: "/it/arredo", siblings: [
    { label: "Mosaico", href: "/it/mosaico" },
    { label: "Vetrite", href: "/it/lastre-vetro-vetrite" },
    { label: "Arredo", href: "/it/arredo" },
    { label: "Illuminazione", href: "/it/illuminazione" },
    { label: "Tessuto", href: "/it/prodotti-tessili" },
  ]},
]} />
```

Product detail page:
```tsx
<SmartBreadcrumb segments={[
  { label: "Products", href: "/it/prodotti" },
  { label: "Mosaico", href: "/it/mosaico", siblings: [
    { label: "Mosaico", href: "/it/mosaico" },
    { label: "Vetrite", href: "/it/lastre-vetro-vetrite" },
    { label: "Arredo", href: "/it/arredo" },
  ]},
  { label: "Waterglass", href: "/it/mosaico/waterglass", siblings: [
    { label: "Waterglass", href: "/it/mosaico/waterglass" },
    { label: "Murano Smalto", href: "/it/mosaico/murano-smalto" },
  ]},
  { label: "Aquamarine", href: "/it/mosaico/waterglass/aquamarine", siblings: [
    { label: "Aquamarine", href: "/it/mosaico/waterglass/aquamarine" },
    { label: "Emerald", href: "/it/mosaico/waterglass/emerald" },
  ]},
]} />
```

## Migration Plan

### Phase 1 — Create and first adoption

1. Create `SmartBreadcrumb` composed component
2. Replace `ListingBreadcrumb` usage in `ProductListingTemplate` with `SmartBreadcrumb`
3. Move sibling resolution logic (FILTER_REGISTRY, CATEGORY_TYPES) from ListingBreadcrumb into the template

### Phase 2 — Incremental adoption

As each intro block is revised, integrate `SmartBreadcrumb` inside the intro block (per breadcrumb-in-intro rule) and remove it from the template. Templates affected:

- `ProdottoMosaico` / `MosaicProductPreview`
- `ProdottoArredo`
- `ProdottoIlluminazione`
- `ProdottoTessuto`
- `ProdottoArredoFiniture`
- `ProductsMasterPage`

### Phase 3 — Cleanup

Delete `ListingBreadcrumb.tsx` when all call sites are migrated.

## Replaces

- `src/components/composed/ListingBreadcrumb.tsx` (DS, with dropdown — domain-coupled)
- Inline breadcrumbs in `ProdottoArredo.tsx`, `ProdottoIlluminazione.tsx`, `ProdottoTessuto.tsx` (legacy, static)
- Custom breadcrumb in `ProdottoArredoFiniture.tsx` (Tailwind, static)

## Verification

- TypeScript compile (`npx tsc --noEmit`)
- Visual check in dev with Debug Mode enabled
- No unit tests (pure rendering component)
