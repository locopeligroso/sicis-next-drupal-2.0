# SmartBreadcrumb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a generic `SmartBreadcrumb` composed component where every segment with siblings renders a dropdown, and replace `ListingBreadcrumb` with it in `ProductListingTemplate`.

**Architecture:** Single `'use client'` Composed component using shadcn Breadcrumb + DropdownMenu primitives. Receives fully resolved `BreadcrumbSegment[]` — no domain logic inside. Templates compose segments and pass them in.

**Tech Stack:** React 19, Next.js 16, shadcn/ui (base-vega), next-intl, Tailwind 4

---

## File Structure

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/components/composed/SmartBreadcrumb.tsx` | Generic breadcrumb with dropdown-per-segment |
| Modify | `src/templates/nodes/ProductListingTemplate.tsx` | Replace ListingBreadcrumb with SmartBreadcrumb, compose segments |
| Keep (deprecated) | `src/components/composed/ListingBreadcrumb.tsx` | Not deleted yet — other templates may still reference indirectly |

---

### Task 1: Create SmartBreadcrumb component

**Files:**
- Create: `src/components/composed/SmartBreadcrumb.tsx`

- [ ] **Step 1: Create the component file**

```tsx
'use client'

import React from 'react'
import Link from 'next/link'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

export function SmartBreadcrumb({ segments, className }: SmartBreadcrumbProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {segments.map((segment, i) => {
          const isLast = i === segments.length - 1
          const hasSiblings = segment.siblings && segment.siblings.length > 0

          return (
            <React.Fragment key={segment.href}>
              <BreadcrumbItem>
                {hasSiblings ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={
                        isLast
                          ? 'font-normal text-foreground'
                          : 'transition-colors hover:text-foreground'
                      }
                    >
                      {segment.label}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {segment.siblings!.map((sibling) => (
                        <DropdownMenuItem
                          key={sibling.href}
                          className={
                            sibling.href === segment.href
                              ? 'font-semibold text-foreground'
                              : ''
                          }
                          render={<Link href={sibling.href} />}
                        >
                          {sibling.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : isLast ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={segment.href} />}>
                    {segment.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v resend`
Expected: no errors related to SmartBreadcrumb

- [ ] **Step 3: Commit**

```bash
git add src/components/composed/SmartBreadcrumb.tsx
git commit -m "feat: add SmartBreadcrumb composed component with dropdown siblings"
```

---

### Task 2: Replace ListingBreadcrumb in ProductListingTemplate (hub mode)

**Files:**
- Modify: `src/templates/nodes/ProductListingTemplate.tsx`

The template must compose `BreadcrumbSegment[]` with the same data that `ListingBreadcrumb` currently resolves internally. The sibling data comes from `FILTER_REGISTRY` and translation keys already available in the render context.

- [ ] **Step 1: Add imports and helper function**

Replace the `ListingBreadcrumb` import with `SmartBreadcrumb`. Add a helper that builds segments from the existing props. Add this at the top of the file:

```tsx
import { SmartBreadcrumb } from '@/components/composed/SmartBreadcrumb'
import type { BreadcrumbSegment } from '@/components/composed/SmartBreadcrumb'
```

Remove:
```tsx
import { ListingBreadcrumb } from '@/components/composed/ListingBreadcrumb'
```

Add a helper function inside the file (before `ProductListingTemplate`):

```tsx
const PRODUCTS_PATH: Record<string, string> = {
  it: '/it/prodotti',
  en: '/en/products',
  fr: '/fr/produits',
  de: '/de/produkte',
  es: '/es/productos',
  ru: '/ru/продукция',
}

const CATEGORY_TYPES = [
  'prodotto_mosaico',
  'prodotto_vetrite',
  'prodotto_arredo',
  'prodotto_illuminazione',
  'prodotto_tessuto',
] as const

const CATEGORY_LABEL_KEYS: Record<string, { ns: 'nav' | 'products'; key: string }> = {
  prodotto_mosaico: { ns: 'nav', key: 'mosaico' },
  prodotto_vetrite: { ns: 'nav', key: 'vetrite' },
  prodotto_arredo: { ns: 'nav', key: 'arredo' },
  prodotto_illuminazione: { ns: 'products', key: 'lighting' },
  prodotto_tessuto: { ns: 'nav', key: 'tessuto' },
}
```

- [ ] **Step 2: Build segments in hub mode**

In the hub variant block, replace:
```tsx
<div className="max-w-main mx-auto px-(--spacing-page)">
  <ListingBreadcrumb locale={locale} activeCategory={productType} />
</div>
```

With segment composition + SmartBreadcrumb. This is a server component file so we need to use `getTranslations` (already available in scope via `renderProductListing` caller). Since `ProductListingTemplate` is a plain function component (not async), the translations must be passed as props. Add two new props to `ProductListingTemplateProps`:

```tsx
// Add to ProductListingTemplateProps interface:
tNav?: (key: string) => string
tBreadcrumb?: (key: string) => string
tProducts?: (key: string) => string
```

Then in the hub mode block, build segments:

```tsx
const getCategoryLabel = (type: string) => {
  const mapping = CATEGORY_LABEL_KEYS[type]
  if (!mapping || !tNav || !tProducts) return type
  return mapping.ns === 'nav' ? tNav(mapping.key) : tProducts(mapping.key)
}

const getCategoryHref = (type: string) => {
  const config = FILTER_REGISTRY[type]
  if (!config) return '#'
  const bp = config.basePaths[locale] ?? config.basePaths.it
  return `/${locale}/${bp}`
}

const categorySiblings = CATEGORY_TYPES.map((type) => ({
  label: getCategoryLabel(type),
  href: getCategoryHref(type),
}))

const hubSegments: BreadcrumbSegment[] = [
  {
    label: tBreadcrumb?.('filterAndFind') ?? 'Products',
    href: PRODUCTS_PATH[locale] ?? PRODUCTS_PATH.it,
  },
  {
    label: getCategoryLabel(productType),
    href: getCategoryHref(productType),
    siblings: categorySiblings,
  },
]
```

Then render:
```tsx
<div className="max-w-main mx-auto px-(--spacing-page)">
  <SmartBreadcrumb segments={hubSegments} />
</div>
```

- [ ] **Step 3: Do the same for listing mode**

Replace the listing mode `ListingBreadcrumb` call with the same pattern. For listing mode with a subcategory, add a third segment:

```tsx
const listingSegments: BreadcrumbSegment[] = [
  {
    label: tBreadcrumb?.('filterAndFind') ?? 'Products',
    href: PRODUCTS_PATH[locale] ?? PRODUCTS_PATH.it,
  },
  {
    label: getCategoryLabel(productType),
    href: getCategoryHref(productType),
    siblings: categorySiblings,
  },
  ...(title !== getCategoryLabel(productType)
    ? [{ label: title, href: basePath }]
    : []),
]
```

Replace:
```tsx
<ListingBreadcrumb
  locale={locale}
  activeCategory={productType}
  subcategoryLabel={title}
/>
```

With:
```tsx
<SmartBreadcrumb segments={listingSegments} />
```

- [ ] **Step 4: Pass translation functions from renderProductListing**

Open `src/lib/render-product-listing.tsx`. Find where `ProductListingTemplate` is called and pass the translation functions. The file already uses `getTranslations` — add:

```tsx
const tNav = await getTranslations('nav')
const tBreadcrumb = await getTranslations('breadcrumb')
const tProducts = await getTranslations('products')
```

And pass them as props:
```tsx
<ProductListingTemplate
  // ... existing props
  tNav={(key: string) => tNav(key)}
  tBreadcrumb={(key: string) => tBreadcrumb(key)}
  tProducts={(key: string) => tProducts(key)}
/>
```

- [ ] **Step 5: Add FILTER_REGISTRY import to ProductListingTemplate**

```tsx
import { FILTER_REGISTRY } from '@/domain/filters/registry'
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v resend`
Expected: no errors

- [ ] **Step 7: Visual verification**

Open hub pages in dev (`/it/mosaico`, `/it/arredo`, `/it/illuminazione`) and verify:
- Breadcrumb renders with correct labels
- Clicking category segment opens dropdown with all 5 categories
- Active category is bold in dropdown
- Clicking a sibling navigates to that hub

- [ ] **Step 8: Commit**

```bash
git add src/templates/nodes/ProductListingTemplate.tsx src/lib/render-product-listing.tsx
git commit -m "feat: replace ListingBreadcrumb with SmartBreadcrumb in ProductListingTemplate"
```

---

### Task 3: Update CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add entry**

Add under today's date at the top of CHANGELOG.md:

```markdown
## 2026-04-02

### SmartBreadcrumb
- New `SmartBreadcrumb` composed component — generic breadcrumb where each segment with siblings renders a dropdown for sibling navigation
- Replaces `ListingBreadcrumb` in `ProductListingTemplate` (hub + listing modes)
- Breadcrumb segments are fully resolved by the caller — no domain logic in the component

### Debug Mode
- Dev-only block overlay system: green outline = DS, red outline = legacy, badge with block name
- Toggle button (bottom-right) persists state in localStorage across navigations
- Breakpoint indicator visible when debug mode is active

### Template cleanup
- Removed container constraints (max-w, padding) from ProductListingTemplate hub wrapper — blocks own their own container
- SpecListingHeader, SpecHubMosaico, SpecHubArredo now manage their own `max-w-main mx-auto px-(--spacing-page)`
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG with SmartBreadcrumb and debug mode changes"
```
