# Unified Product Listing Template — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single, config-driven listing template for all 6 product types, replacing the current multi-mode Categoria.tsx with progressive disclosure (category cards → product grid + filters).

**Architecture:** Template-driven rendering from an extended FILTER_REGISTRY. Server components with two client boundaries (MobileFilterTrigger, LoadMoreButton). Data layer extended for sorting, counts, and color swatch images. /ds rules enforced: Composed import only Primitives, Blocks import only Composed. /shadcn rules: semantic colors, `gap-*` not `space-*`, `cn()`, `size-*`, `data-icon`, base (not radix) primitives.

**Tech Stack:** Next.js 16 (App Router, RSC), Drupal 10 JSON:API, shadcn/ui (base-vega), Tailwind v4, nuqs, next-intl, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-20-unified-product-listing-design.md`

---

## Phase 1: Data Layer

### Task 1: Extend FILTER_REGISTRY with ListingConfig

**Files:**
- Modify: `src/domain/filters/registry.ts:46-51` (ProductTypeConfig interface)
- Modify: `src/domain/filters/registry.ts:160-220` (prodotto_mosaico entry, add `listing`)
- Modify: all other product type entries in same file
- Test: `src/domain/filters/__tests__/registry.test.ts`

- [ ] **Step 1: Add ListingConfig types to registry.ts**

Add after line 51 (after `ProductTypeConfig`):

```ts
export interface ListingConfig {
  categoryCardRatio: string;
  categoryGroups: CategoryGroupDef[];
  sortOptions: SortOptionDef[];
  pageSize: number;
}

export interface CategoryGroupDef {
  filterKey: string;
  labelKey: string;
  hasImage: boolean;
  hasColorSwatch: boolean;
}

export interface SortOptionDef {
  labelKey: string;
  field: string;
  direction: 'ASC' | 'DESC';
}
```

Extend `ProductTypeConfig`:

```ts
export interface ProductTypeConfig {
  contentType: string;
  basePaths: Record<string, string>;
  includes: string[];
  filters: Record<string, FilterGroupConfig>;
  listing: ListingConfig;  // NEW
}
```

- [ ] **Step 2: Add listing config to prodotto_mosaico**

```ts
listing: {
  categoryCardRatio: '1/1',
  categoryGroups: [
    { filterKey: 'color', labelKey: 'filters.colors', hasImage: false, hasColorSwatch: true },
    { filterKey: 'collection', labelKey: 'filters.collections', hasImage: true, hasColorSwatch: false },
  ],
  sortOptions: [
    { labelKey: 'sort.name', field: 'title', direction: 'ASC' },
    { labelKey: 'sort.collection', field: 'field_collezione.name', direction: 'ASC' },
  ],
  pageSize: 48,
},
```

- [ ] **Step 3: Add listing config to remaining 5 product types**

Follow these patterns:
- **prodotto_vetrite**: same as Mosaico (collection + color P0), ratio `'1/1'`
- **prodotto_arredo**: subcategory P0 only, ratio `'4/3'`, sort by name + typology (`field_categoria.title`)
- **prodotto_tessuto**: category P0 only, ratio `'4/3'`, sort by name + category
- **prodotto_pixall**: `categoryGroups: []` (skip state 1), sort by name only
- **prodotto_illuminazione**: subcategory P0 only, ratio `'4/3'`, sort by name + subcategory

- [ ] **Step 4: Write test to verify all 6 product types have valid listing config**

```ts
// src/domain/filters/__tests__/registry.test.ts
import { FILTER_REGISTRY } from '../registry';

describe('FILTER_REGISTRY listing config', () => {
  const productTypes = Object.keys(FILTER_REGISTRY);

  it.each(productTypes)('%s has a listing config', (pt) => {
    const config = FILTER_REGISTRY[pt];
    expect(config.listing).toBeDefined();
    expect(config.listing.pageSize).toBeGreaterThan(0);
    expect(config.listing.sortOptions.length).toBeGreaterThan(0);
  });

  it('pixall has empty categoryGroups', () => {
    expect(FILTER_REGISTRY.prodotto_pixall.listing.categoryGroups).toEqual([]);
  });

  it('mosaico has 2 categoryGroups', () => {
    expect(FILTER_REGISTRY.prodotto_mosaico.listing.categoryGroups).toHaveLength(2);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/domain/filters/__tests__/registry.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/domain/filters/registry.ts src/domain/filters/__tests__/registry.test.ts
git commit -m "feat: extend FILTER_REGISTRY with ListingConfig for all 6 product types"
```

---

### Task 2: Extend FilterOption with image/color data

**Files:**
- Modify: `src/domain/filters/registry.ts:19-24` (FilterOption interface)
- Modify: `src/lib/drupal/filters.ts:14-49` (fetchFilterOptions function)

- [ ] **Step 1: Extend FilterOption interface**

In `src/domain/filters/registry.ts`, update:

```ts
export interface FilterOption {
  slug: string;
  label: string;
  id?: string;
  count?: number;
  imageUrl?: string;    // NEW: preview image for category cards
  cssColor?: string;    // NEW: fallback CSS color for swatches
}
```

- [ ] **Step 2: Update fetchFilterOptions to include field_immagine**

In `src/lib/drupal/filters.ts`, modify `fetchFilterOptions` to accept an optional `includeImage` parameter:

```ts
export async function fetchFilterOptions(
  taxonomyType: string,
  locale: string,
  options?: { includeImage?: boolean },
): Promise<FilterOption[]> {
```

When `includeImage` is true:
- Add `field_immagine` to `fields` and `include` params
- Extract image URL from included data
- Set it on the returned `FilterOption.imageUrl`

- [ ] **Step 3: Run existing tests to ensure no regression**

Run: `npx vitest run`
Expected: All existing tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/domain/filters/registry.ts src/lib/drupal/filters.ts
git commit -m "feat: extend FilterOption with imageUrl and cssColor fields"
```

---

### Task 3: Add sorting support to fetchProducts

**Files:**
- Modify: `src/lib/drupal/products.ts:46-59` (FetchProductsOptions interface)
- Modify: `src/lib/drupal/products.ts` (fetchProducts implementation — JSON:API sort param)

- [ ] **Step 1: Add sort option to FetchProductsOptions**

```ts
export interface FetchProductsOptions {
  // ... existing fields
  sort?: string;  // NEW: JSON:API sort field, e.g. 'title' or '-title' for DESC
}
```

- [ ] **Step 2: Apply sort param in fetchProducts URL building**

When `options.sort` is provided, add `url.searchParams.set('sort', options.sort)` to the JSON:API request.

- [ ] **Step 3: Add subtitle field to ProductCard**

```ts
export interface ProductCard {
  // ... existing fields
  subtitle: string | null;  // NEW: collection/typology name
}
```

Extract subtitle from the product's relationship field (e.g. `field_collezione.name` for mosaico, `field_categoria.title` for arredo). Map the correct relationship field per product type.

- [ ] **Step 4: Run existing tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/drupal/products.ts
git commit -m "feat: add sorting and subtitle support to fetchProducts"
```

---

### Task 4: Add sort and second-P0 support to search-params

**Files:**
- Modify: `src/domain/filters/search-params.ts:18-35` (filterSearchParamsCache)
- Modify: `src/domain/filters/search-params.ts:88-146` (parseFiltersFromUrl)

- [ ] **Step 1: Ensure `sort` is parsed from query params**

`sort` is already in `filterSearchParamsCache` (line 33). Verify `parseFiltersFromUrl` passes it through. Add `sort` to the return type `ParsedFilters`:

```ts
export interface ParsedFilters {
  contentType: string | null;
  filterDefinitions: FilterDefinition[];
  activeFilters: ActiveFilter[];
  sort?: string;  // NEW
}
```

- [ ] **Step 2: Handle second P0 as query param**

In `parseFiltersFromUrl`, after processing path-based filters (lines 111-131), add logic to check query params for `'path'`-typed filters that aren't already active from the path:

```ts
// After path detection loop, check for second P0 via query
for (const filterConfig of Object.values(config.filters)) {
  if (filterConfig.type !== 'path') continue;
  // Skip if already resolved from path
  if (activeFilters.some(f => f.key === filterConfig.key)) continue;
  // Check if present as query param
  const queryKey = filterConfig.queryKey ?? filterConfig.key;
  const queryValue = searchParams[queryKey];
  if (queryValue) {
    const termName = deslugify(decodeURIComponent(queryValue));
    definitions.push({
      field: filterConfig.drupalField,
      value: termName,
      operator: '=',
    });
    active.push({
      key: filterConfig.key,
      value: decodeURIComponent(queryValue),
      label: termName,
      type: 'query',  // Override: effective type is query for this request
    });
  }
}
```

- [ ] **Step 3: Write test for second P0 as query**

```ts
describe('parseFiltersFromUrl second P0', () => {
  it('handles collection from path + color from query', () => {
    const result = parseFiltersFromUrl(
      ['mosaico', 'murano-smalto'],
      { color: 'rosso' },
      'it',
    );
    expect(result.activeFilters).toHaveLength(2);
    expect(result.activeFilters[0]).toMatchObject({ key: 'collection', type: 'path' });
    expect(result.activeFilters[1]).toMatchObject({ key: 'color', type: 'query', value: 'rosso' });
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/domain/filters/__tests__/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/filters/search-params.ts src/domain/filters/__tests__/
git commit -m "feat: support sort param and second P0 as query in parseFiltersFromUrl"
```

---

### Task 5: Update useFilterSync for second P0

**Files:**
- Modify: `src/hooks/use-filter-sync.ts`

- [ ] **Step 1: Add second P0 logic to toggleFilter**

When `type === 'path'` and another path filter is already active, fall back to query param navigation:

```ts
const toggleFilter = useCallback(
  (key: string, value: string, type: 'path' | 'query', pathPrefix?: string) => {
    const currentActive = activeFilters.find(f => f.key === key);

    if (type === 'path') {
      // If another P0 is already active via path, use query param instead
      const otherPathActive = activeFilters.find(
        f => f.type === 'path' && f.key !== key,
      );

      if (otherPathActive) {
        // Second P0 → query param
        const params = new URLSearchParams(searchParams.toString());
        const queryKey = key;
        if (currentActive?.value === value) {
          params.delete(queryKey);
        } else {
          params.set(queryKey, value);
        }
        params.delete('page');
        const currentPath = window.location.pathname;
        router.push(`${currentPath}?${params.toString()}`);
        return;
      }

      // First P0 → path navigation (existing logic)
      // ...existing code...
    }
    // ...existing query logic...
  },
  [basePath, activeFilters, router, searchParams],
);
```

- [ ] **Step 2: Run existing tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-filter-sync.ts
git commit -m "feat: useFilterSync handles second P0 as query param"
```

---

### Task 6: Server Action for load more

**Files:**
- Create: `src/lib/actions/load-more-products.ts`

- [ ] **Step 1: Create the Server Action**

```ts
// src/lib/actions/load-more-products.ts
'use server';

import { fetchProducts, type ProductCard } from '@/lib/drupal/products';
import type { FilterDefinition } from '@/domain/filters/search-params';

export async function loadMoreProducts(
  productType: string,
  activeFilters: FilterDefinition[],
  sort: string,
  offset: number,
  pageSize: number,
  locale: string,
): Promise<{ products: ProductCard[]; hasMore: boolean }> {
  const { products, total } = await fetchProducts({
    productType,
    locale,
    limit: pageSize,
    offset,
    filters: activeFilters,
    sort: sort || undefined,
  });

  return {
    products,
    hasMore: offset + pageSize < total,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/load-more-products.ts
git commit -m "feat: add loadMoreProducts Server Action"
```

---

### Task 7: Add i18n keys

**Files:**
- Modify: `messages/it.json`
- Modify: `messages/en.json`
- Modify: `messages/fr.json`, `messages/de.json`, `messages/es.json`, `messages/ru.json`

- [ ] **Step 1: Add filter/sort/listing keys to all locale files**

Keys to add in each locale file:

```json
{
  "filters": {
    "title": "Filtri",
    "colors": "Colori",
    "collections": "Collezioni",
    "typologies": "Tipologie",
    "categories": "Categorie",
    "additionalFilters": "Filtri aggiuntivi",
    "clearAll": "Rimuovi tutti",
    "showResults": "Mostra {count} prodotti",
    "activeCount": "Filtri ({count})"
  },
  "sort": {
    "label": "Ordina per",
    "name": "Nome",
    "collection": "Collezione",
    "typology": "Tipologia",
    "category": "Categoria",
    "color": "Colore"
  },
  "listing": {
    "productCount": "{count} prodotti",
    "loadMore": "Carica altri {count}",
    "noResults": "Nessun prodotto trovato"
  }
}
```

Translate for each locale (en, fr, de, es, ru).

- [ ] **Step 2: Commit**

```bash
git add messages/
git commit -m "feat: add i18n keys for filters, sorting, and listing UI"
```

---

## Phase 2: Composed Components

> **Rules reminder for all composed components:**
> - Import only from `@/components/ui/` (Primitives)
> - Use semantic colors (`bg-primary`, `text-muted-foreground`), never raw values
> - Use `gap-*` not `space-*`, `size-*` when w=h, `cn()` for conditional classes
> - Use `data-icon` for icons in buttons, no sizing classes on icons
> - CVA for variants when applicable
> - No color, margin, or layout spacing on Typography — only `textRole` + `as`

### Task 8: CategoryCard composed component

**Files:**
- Create: `src/components/composed/CategoryCard.tsx`

- [ ] **Step 1: Create CategoryCard**

Props: `title`, `imageUrl?`, `cssColor?`, `href`, `aspectRatio` (string like "1/1"), `hasColorSwatch` (boolean).

Uses: `AspectRatio` primitive, `Card` primitive, next/image or color swatch fallback. Link wraps the card for navigation.

```tsx
import Link from 'next/link';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  title: string;
  imageUrl?: string | null;
  cssColor?: string | null;
  href: string;
  aspectRatio: string;
  hasColorSwatch?: boolean;
}

export function CategoryCard({ title, imageUrl, cssColor, href, aspectRatio, hasColorSwatch }: CategoryCardProps) {
  // Implementation: AspectRatio wrapper, image or color swatch, title below
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/composed/CategoryCard.tsx
git commit -m "feat: add CategoryCard composed component"
```

---

### Task 9: CategoryCardGrid composed component

**Files:**
- Create: `src/components/composed/CategoryCardGrid.tsx`

- [ ] **Step 1: Create CategoryCardGrid**

Props: `title` (section label like "Collezioni"), `cards` (array of CategoryCard data), `aspectRatio` (forwarded to cards).

Renders: section heading (Typography overline) + responsive CSS grid (4 cols desktop, 2 cols mobile).

- [ ] **Step 2: Commit**

```bash
git add src/components/composed/CategoryCardGrid.tsx
git commit -m "feat: add CategoryCardGrid composed component"
```

---

### Task 10: ProductCard composed component

**Files:**
- Create: `src/components/composed/ProductCard.tsx`

- [ ] **Step 1: Create ProductCard**

Props: `title`, `subtitle?`, `imageUrl?`, `href`.

Uses: `Card` primitive, next/image, Typography (body-sm for title, caption for subtitle). Link wraps entire card.

- [ ] **Step 2: Commit**

```bash
git add src/components/composed/ProductCard.tsx
git commit -m "feat: add ProductCard composed component"
```

---

### Task 11: ProductGrid composed component

**Files:**
- Create: `src/components/composed/ProductGrid.tsx`

- [ ] **Step 1: Create ProductGrid**

Props: `products` (ProductCard data array), no layout responsibility beyond the grid.

Renders: responsive CSS grid (2 cols mobile, 3 cols md, 4 cols lg). Maps each product to `ProductCard`.

- [ ] **Step 2: Commit**

```bash
git add src/components/composed/ProductGrid.tsx
git commit -m "feat: add ProductGrid composed component"
```

---

### Task 12: Filter composed components (ActiveFilters, FilterGroup, CheckboxFilter, ColorSwatchFilter, ImageListFilter)

**Files:**
- Create: `src/components/composed/ActiveFilters.tsx`
- Create: `src/components/composed/FilterGroup.tsx`
- Create: `src/components/composed/CheckboxFilter.tsx`
- Create: `src/components/composed/ColorSwatchFilter.tsx`
- Create: `src/components/composed/ImageListFilter.tsx`

- [ ] **Step 1: Create ActiveFilters**

Props: `filters` (ActiveFilter[]), `onRemove` callback, `onClearAll` callback.

Renders: horizontal flex wrap of `Badge` primitives with × button per chip, plus "Clear all" button. Hidden when no active filters.

- [ ] **Step 2: Create FilterGroup**

Props: `label`, `priority`, `children` (the actual filter UI), `defaultExpanded?`.

Renders: `Collapsible` primitive with label as trigger. P0/P1 expanded by default, P2 collapsed.

- [ ] **Step 3: Create CheckboxFilter**

Props: `options` (FilterOption[]), `activeValues` (string[]), `onChange` callback.

Renders: list of `Checkbox` primitives with labels and optional counts.

- [ ] **Step 4: Create ColorSwatchFilter**

Props: `options` (FilterOption[] with imageUrl/cssColor), `activeValue?`, `onChange` callback.

Renders: flex wrap of color circles. Uses `imageUrl` as background-image if available, `cssColor` as background-color fallback, neutral placeholder if neither.

- [ ] **Step 5: Create ImageListFilter**

Props: `options` (FilterOption[] with imageUrl), `activeValue?`, `onChange` callback.

Renders: vertical list of items with small preview thumbnail (32px) + label. Uses next/image for thumbnails.

- [ ] **Step 6: Commit**

```bash
git add src/components/composed/ActiveFilters.tsx src/components/composed/FilterGroup.tsx src/components/composed/CheckboxFilter.tsx src/components/composed/ColorSwatchFilter.tsx src/components/composed/ImageListFilter.tsx
git commit -m "feat: add filter composed components (ActiveFilters, FilterGroup, CheckboxFilter, ColorSwatchFilter, ImageListFilter)"
```

---

### Task 13: ListingToolbar composed component

**Files:**
- Create: `src/components/composed/ListingToolbar.tsx`

- [ ] **Step 1: Create ListingToolbar**

Props: `totalCount`, `sortOptions` (SortOptionDef[]), `currentSort`, `onSortChange` callback, `locale`.

Renders: flex row with product count (Typography caption) left-aligned, sort `Select` primitive right-aligned. Uses next-intl for labels.

- [ ] **Step 2: Commit**

```bash
git add src/components/composed/ListingToolbar.tsx
git commit -m "feat: add ListingToolbar composed component"
```

---

### Task 14: LoadMoreButton composed component

**Files:**
- Create: `src/components/composed/LoadMoreButton.tsx`

- [ ] **Step 1: Create LoadMoreButton**

`'use client'` component.

Props: `productType`, `activeFilters` (FilterDefinition[]), `sort`, `pageSize`, `initialTotal`, `initialProducts` (ProductCard[]), `locale`.

State: `products` (starts with initialProducts), `offset`, `loading`, `hasMore`.

Calls `loadMoreProducts` Server Action on click. Renders `Button` primitive with "Carica altri {pageSize}" label. Hidden when `!hasMore`. Shows `Spinner` when loading.

**Note:** This component also owns the product list state and renders the `ProductGrid`. It wraps both the grid and the button to manage the append-on-load-more flow.

- [ ] **Step 2: Commit**

```bash
git add src/components/composed/LoadMoreButton.tsx
git commit -m "feat: add LoadMoreButton client component with Server Action integration"
```

---

### Task 15: MobileFilterTrigger composed component

**Files:**
- Create: `src/components/composed/MobileFilterTrigger.tsx`

- [ ] **Step 1: Create MobileFilterTrigger**

`'use client'` component.

Props: `activeFilterCount`, `children` (the sidebar content to render inside Sheet), `totalCount?`.

State: `open` (boolean) for Sheet.

Renders:
- FAB button (fixed bottom center, visible only below `md`) with "Filtri ({count})" label using `Badge`
- `Sheet` primitive (side="left") containing `children` + sticky footer with "Mostra {totalCount} prodotti" `Button`
- `SheetTitle` with `className="sr-only"` for accessibility

- [ ] **Step 2: Commit**

```bash
git add src/components/composed/MobileFilterTrigger.tsx
git commit -m "feat: add MobileFilterTrigger client component with Sheet drawer"
```

---

## Phase 3: Blocks

### Task 16: ListingHeader block

**Files:**
- Create: `src/components/blocks/ListingHeader.tsx`

- [ ] **Step 1: Create ListingHeader**

Props: `title`, `description?`.

Renders: `Typography` (h1, textRole="heading-1") + optional `Typography` (p, textRole="body-md"). Container uses `max-w-7xl mx-auto px-[--spacing-page] py-[--spacing-section]`.

- [ ] **Step 2: Commit**

```bash
git add src/components/blocks/ListingHeader.tsx
git commit -m "feat: add ListingHeader block"
```

---

### Task 17: FilterSidebar block

**Files:**
- Create: `src/components/blocks/FilterSidebar.tsx`

- [ ] **Step 1: Create FilterSidebar**

Server component. Props: `filters` (Record<string, FilterGroupConfig>), `filterOptions` (Record<string, FilterOption[]>), `activeFilters` (ActiveFilter[]), `hasActiveP0` (boolean), `listingConfig` (ListingConfig), `basePath`, `locale`.

Renders:
- Desktop: `<aside>` with `sticky top-0` and `hidden md:block`, width ~16rem
- `ActiveFilters` composed component at top
- For each filter group (sorted by priority):
  - If `!hasActiveP0` → show only P0 filters
  - If `hasActiveP0` → show all filters, with `Separator` + "Filtri aggiuntivi" label before P1/P2
  - Render appropriate filter component based on `CategoryGroupDef`: `ColorSwatchFilter`, `ImageListFilter`, or `CheckboxFilter`
- Wraps everything in `ScrollArea` for overflow
- `MobileFilterTrigger` for mobile — passes sidebar content as children

- [ ] **Step 2: Commit**

```bash
git add src/components/blocks/FilterSidebar.tsx
git commit -m "feat: add FilterSidebar block with desktop/mobile rendering"
```

---

### Task 18: CategorySection block

**Files:**
- Create: `src/components/blocks/CategorySection.tsx`

- [ ] **Step 1: Create CategorySection**

Props: `categoryGroups` (CategoryGroupDef[]), `filterOptions` (Record<string, FilterOption[]>), `aspectRatio`, `basePath`, `locale`.

For each group in `categoryGroups`: renders a `CategoryCardGrid` with the options from `filterOptions[group.filterKey]`, building href for each card (path-based navigation to `basePath/{slug}` or `basePath/{pathPrefix}/{slug}`).

- [ ] **Step 2: Commit**

```bash
git add src/components/blocks/CategorySection.tsx
git commit -m "feat: add CategorySection block"
```

---

### Task 19: ProductSection block

**Files:**
- Create: `src/components/blocks/ProductSection.tsx`

- [ ] **Step 1: Create ProductSection**

Props: `products` (ProductCard[]), `total`, `sortOptions` (SortOptionDef[]), `currentSort`, `productType`, `activeFilters` (FilterDefinition[]), `pageSize`, `locale`.

Renders: `ListingToolbar` + `LoadMoreButton` (which owns the ProductGrid and load more state).

- [ ] **Step 2: Commit**

```bash
git add src/components/blocks/ProductSection.tsx
git commit -m "feat: add ProductSection block"
```

---

## Phase 4: Template & Routing

### Task 20: ProductListingTemplate

**Files:**
- Create: `src/templates/nodes/ProductListingTemplate.tsx`

- [ ] **Step 1: Create the unified template**

Server component. Props: `node` (Record<string, unknown>), `locale`, `productType`, `listingConfig`, `filterOptions`, `activeFilters`, `hasActiveP0`, `products?`, `total?`, `currentSort?`, `basePath`.

Renders:
- `ListingHeader` with title/description from node
- Grid layout: `grid grid-cols-1 md:grid-cols-[16rem_1fr]`
  - `FilterSidebar`
  - Main area:
    - If `!hasActiveP0 && listingConfig.categoryGroups.length > 0` → `CategorySection`
    - Else → `ProductSection`

- [ ] **Step 2: Commit**

```bash
git add src/templates/nodes/ProductListingTemplate.tsx
git commit -m "feat: add ProductListingTemplate unified template"
```

---

### Task 21: Wire routing in page.tsx

**Files:**
- Modify: `src/app/[locale]/[...slug]/page.tsx`
- Modify: `src/lib/node-resolver.ts`

- [ ] **Step 1: Update node-resolver to map listing routes to new template**

Add a helper `getListingConfig(productType)` that returns the `listing` property from `FILTER_REGISTRY[productType]`.

- [ ] **Step 2: Update page.tsx renderListingLayout**

Replace the current `renderListingLayout` function to render `ProductListingTemplate` instead of the legacy `FilterSidebarAsync` + `ProductListingAsync` components.

The function should:
1. Get `listingConfig` from registry
2. Parse filters from URL (with sort and second P0 support)
3. Determine `hasActiveP0`
4. If state 1: fetch only filter options for P0 groups
5. If state 2: fetch products + all filter options in parallel
6. Pass everything to `ProductListingTemplate`
7. Use `listing.pageSize` instead of hardcoded `PAGE_SIZE` for product listings

- [ ] **Step 3: Test manually**

Open in browser:
- `http://localhost:3000/it/mosaico` — should show category cards (state 1)
- `http://localhost:3000/it/mosaico/murano-smalto` — should show product grid (state 2)
- `http://localhost:3000/it/pixall` — should show product grid directly (no state 1)
- `http://localhost:3000/it/arredo` — should show typology cards

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/[...slug]/page.tsx src/lib/node-resolver.ts
git commit -m "feat: wire ProductListingTemplate into catch-all route"
```

---

## Phase 5: Live Counts

### Task 22: Implement fetchFilterCounts

**Files:**
- Modify: `src/lib/drupal/filters.ts`

- [ ] **Step 1: Implement fetchFilterCounts (approach 4: single fetch, client count)**

```ts
export async function fetchFilterCounts(
  productType: string,
  activeFilters: FilterDefinition[],
  filterKey: string,
  locale: string,
): Promise<Record<string, number>> {
  // Fetch all products matching active filters (IDs + target relationship only)
  // Count by iterating the relationship field values
  // Return { "Murano Smalto": 24, "Waterglass": 12, ... }
}
```

- [ ] **Step 2: Wire counts into FilterSidebar**

In `page.tsx` state 2 rendering, call `fetchFilterCounts` for each visible filter group and pass counts to FilterSidebar → FilterGroup → individual filter components.

- [ ] **Step 3: Test manually**

Open `http://localhost:3000/it/mosaico/murano-smalto` — filter options should show counts.

- [ ] **Step 4: Commit**

```bash
git add src/lib/drupal/filters.ts src/app/[locale]/[...slug]/page.tsx
git commit -m "feat: add live filter counts to FilterSidebar"
```

---

## Phase 6: TypeScript & Build Verification

### Task 23: Final verification

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Manual smoke test all 6 product types**

Open each in browser and verify state 1 → state 2 transition:
- `/it/mosaico`
- `/it/lastre-vetro-vetrite`
- `/it/arredo`
- `/it/prodotti-tessili`
- `/it/pixall`
- `/it/illuminazione`

- [ ] **Step 5: Commit any remaining fixes**

```bash
git add -A
git commit -m "fix: address build and type issues from unified listing template"
```
