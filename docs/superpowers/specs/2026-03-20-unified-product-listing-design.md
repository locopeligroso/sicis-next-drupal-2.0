# Unified Product Listing Template — Design Spec

## Overview

A single, config-driven listing template for all 6 product types (Mosaico, Vetrite, Arredo, Tessuto, Pixall, Illuminazione). Replaces the current Categoria.tsx product listing modes with a unified system that uses the existing FILTER_REGISTRY as the single source of truth.

## Requirements

- Sidebar layout: fixed sidebar on desktop, Sheet drawer on mobile
- Progressive disclosure: category cards (state 1) → product grid with secondary filters (state 2)
- P0 filters (collection, color, typology) visible in sidebar from the start and as browsable cards in main content
- P1/P2 filters appear only after a P0 is selected
- Product types with no P0 filters (Pixall) skip state 1 and render product grid directly
- Combinable P0 filters: first via path (ISR cacheable), second via query param
- Live counts on filter options to prevent empty intersections
- Sorting by name + filter typologies (varies per product type)
- Load more pagination (configurable batch size)
- Product card: image, name, collection/typology subtitle
- Category card: configurable aspect ratio per product type
- Header: title + optional description from Drupal CMS node, no hero image

## 1. Registry Extension

The existing `FILTER_REGISTRY` in `src/domain/filters/registry.ts` is extended with listing configuration via a `listing` property on `ProductTypeConfig`.

### Updated ProductTypeConfig

```ts
interface ProductTypeConfig {
  // Existing
  basePath: Record<Locale, string>
  filters: FilterDefinition[]

  // New
  listing: ListingConfig
}

interface ListingConfig {
  categoryCardRatio: string              // e.g. "1/1", "4/3", "3/4"
  categoryGroups: CategoryGroupDef[]     // empty array = skip state 1
  sortOptions: SortOptionDef[]
  pageSize: number                       // e.g. 48
}

interface CategoryGroupDef {
  filterKey: string        // reference to corresponding P0 filter
  labelKey: string         // i18n key for section title
  hasImage: boolean        // card with preview image?
  hasColorSwatch: boolean  // color swatch instead of image?
}

interface SortOptionDef {
  labelKey: string
  field: string            // JSON:API sort field
  direction: 'ASC' | 'DESC'
}
```

**Title and description** come from the Drupal CMS node resolved at render time (the existing `nodeTitle` flow in `page.tsx`), not from the registry. The registry only contains structural/behavioral config.

### Example: Mosaico

```ts
{
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
  }
}
```

### Example: Arredo

```ts
{
  listing: {
    categoryCardRatio: '4/3',
    categoryGroups: [
      { filterKey: 'subcategory', labelKey: 'filters.typologies', hasImage: true, hasColorSwatch: false },
    ],
    sortOptions: [
      { labelKey: 'sort.name', field: 'title', direction: 'ASC' },
      { labelKey: 'sort.typology', field: 'field_categoria.title', direction: 'ASC' },
    ],
    pageSize: 48,
  }
}
```

### Example: Pixall (no P0 filters — skips state 1)

```ts
{
  listing: {
    categoryCardRatio: '1/1',  // unused — no category cards
    categoryGroups: [],        // empty = go directly to product grid
    sortOptions: [
      { labelKey: 'sort.name', field: 'title', direction: 'ASC' },
    ],
    pageSize: 48,
  }
}
```

When `categoryGroups` is empty, the template skips state 1 and renders the product grid with all P1/P2 filters visible immediately.

## 2. Component Tree

```
ProductListingTemplate (template, server component)
├── ListingHeader (block)
│   ├── Typography (composed) — title (from Drupal node)
│   └── Typography (composed) — description (from Drupal node)
├── FilterSidebar (block, desktop: fixed sidebar, mobile: Sheet drawer)
│   ├── ActiveFilters (composed) — active filter chips with ×
│   ├── FilterGroup (composed) — repeated per filter
│   │   ├── ColorSwatchFilter (composed) — for color filters
│   │   ├── ImageListFilter (composed) — for collections with preview
│   │   └── CheckboxFilter (composed) — for generic P1/P2 filters
│   └── MobileFilterTrigger (composed, 'use client') — FAB "Filters" for mobile
├── [State 1] CategorySection (block) — when no P0 active and categoryGroups not empty
│   └── CategoryCardGrid (composed) — category cards, repeated per group
│       └── CategoryCard (composed) — single card with image/swatch
└── [State 2] ProductSection (block) — when P0 active OR categoryGroups empty
    ├── ListingToolbar (composed) — count + sorting
    ├── ProductGrid (composed) — responsive grid
    │   └── ProductCard (composed) — image + name + subtitle
    └── LoadMoreButton (composed, 'use client') — "Load 48 more"
```

### Hierarchy Rules

- Blocks import only Composed, never Primitives (enforced by /ds skill)
- Composed import only Primitives from `src/components/ui/`
- ProductCard and CategoryCard are separate composed components
- State 1 vs State 2 selection happens in the template, not inside a block

### Client Components

- `MobileFilterTrigger`: `'use client'` — manages Sheet open/close state via local `useState`. Renders the FAB button and wraps FilterSidebar content in a Sheet primitive.
- `LoadMoreButton`: `'use client'` — manages load more state, fetches next batch via Server Action, appends to product list.
- `FilterSidebar` itself is a server component; only the mobile trigger wraps its content in a client boundary.

## 3. Data Flow

### State 1: No P0 active (and categoryGroups not empty)

```
URL: /it/mosaico
  → getSectionConfig() → productType: prodotto_mosaico, no path filter
  → getListingConfig() → categoryGroups, sortOptions
  → hasActiveP0? NO, categoryGroups.length > 0? YES → State 1
  → Fetch in parallel:
    • fetchFilterOptions() for each P0 filter → populates sidebar + category cards
    • NO fetchProducts()
  → Render: ListingHeader + FilterSidebar (P0 only) + CategorySection
```

### State 1 skipped: No P0 filters defined (e.g. Pixall)

```
URL: /it/pixall
  → getSectionConfig() → productType: prodotto_pixall, no path filter
  → getListingConfig() → categoryGroups: [] → skip to State 2
  → Fetch in parallel:
    • fetchProducts() (all products, no P0 filter)
    • fetchAllFilterOptions() for P1/P2 filters
  → Render: ListingHeader + FilterSidebar (P1/P2 only) + ProductSection
```

### State 2: P0 active

```
URL: /it/mosaico/murano-smalto?color=rosso&shape=cube
  → getSectionConfig() → productType: prodotto_mosaico, filterField: collezione = "Murano Smalto"
  → getListingConfig() → same config
  → hasActiveP0? YES → State 2
  → Fetch in parallel:
    • fetchProducts() with active filters
    • fetchAllFilterOptions() for ALL filters (P0 + P1/P2) with counts
  → Render: ListingHeader + FilterSidebar (P0 + P1/P2, with counts) + ProductSection
```

### Key Points

- State 1 fetches no products — lighter, faster
- State 2 fetches products + all filter options with counts to prevent empty intersections
- First P0 selection → URL navigation (path-based, ISR cacheable)
- Second P0 or P1/P2 → query param, server render with `React.cache()`
- Load more → client-side via Server Action (see section 3.1)
- Sorting → query param `?sort=title:ASC`, triggers server render

### 3.1 Load More Mechanism

Load more uses a **Server Action** (`loadMoreProducts`):

```ts
// src/lib/actions/load-more-products.ts
'use server'

export async function loadMoreProducts(
  productType: string,
  activeFilters: FilterDefinition[],
  sort: string,
  offset: number,
  pageSize: number
): Promise<{ products: ProductCard[], hasMore: boolean }>
```

The `LoadMoreButton` client component calls this action, appends results to local state, and increments the offset. No Route Handler needed — Server Actions handle the server-side fetch with the same `React.cache()` deduplication.

### 3.2 Live Counts Strategy

Live counts are computed **server-side by aggregating from the product list**:

1. When state 2 renders, `fetchProducts()` already applies active filters
2. A new function fetches the total product count for each possible value of a given filter:

```ts
// src/lib/drupal/filters.ts
async function fetchFilterCounts(
  productType: string,
  activeFilters: FilterDefinition[],
  filterKey: string,
  locale: string
): Promise<Record<string, number>>  // { "Murano Smalto": 24, "Waterglass": 12, ... }
```

   It uses the same JSON:API endpoint with the active filters plus one additional filter per value
3. This is N requests per filter group (one per option value), but:
   - Requests are parallelized via `Promise.all()`
   - Each request uses `page[limit]=0` (count only, no data) for minimal payload
   - `React.cache()` deduplicates within the same render
4. If N requests per group is too expensive, fallback: fetch all products (IDs only, no includes) in a single request and count client-side by iterating relationships

The implementation should start with approach 4 (single fetch, client count) and upgrade to approach 3 if performance allows.

### 3.3 Color Swatch Data

`fetchFilterOptions()` in `src/lib/drupal/filters.ts` must be extended to include image data for taxonomy types that have it:

- For `mosaico_colori`: include `field_immagine` in the JSON:API request
- Return extended `FilterOption`: `{ id, slug, label, count?, imageUrl?, cssColor? }`
- `ColorSwatchFilter` renders `imageUrl` if available, falls back to `cssColor`, falls back to a neutral placeholder

### 3.4 Second P0 as Query Param

When a P0 filter is already active via path (e.g. collection), a second P0 filter (e.g. color) is applied via query param. This requires:

- `parseFiltersFromUrl()` must check: if a filter is typed as `'path'` in the registry but a same-key query param exists, treat it as a query-based filter for this request
- The filter's `type` in the registry stays `'path'` (it defines the *primary* behavior)
- When a second P0 is resolved from query params, its `ActiveFilter.type` is overridden to `'query'` (not a new field — the existing `type` field on `ActiveFilter` reflects the effective behavior for this request, not the registry definition)
- `useFilterSync` hook: when toggling a P0 filter and another P0 is already in the path, navigate with query param instead of path

## 4. URL Structure

```
State 1 (no P0):
  /it/mosaico                                    → category cards
  /it/arredo                                     → typology cards
  /it/lastre-vetro-vetrite                       → category cards
  /it/pixall                                     → product grid directly (no P0)

State 2 (first P0 via path):
  /it/mosaico/murano-smalto                      → collection products
  /it/mosaico/rosso                              → color products
  /it/arredo/tavoli                              → typology products

State 2 (second P0 via query):
  /it/mosaico/murano-smalto?color=rosso          → collection + color

P1/P2 filters (always query):
  /it/mosaico/murano-smalto?shape=cube&finish=lucido

Sorting (query):
  /it/mosaico/murano-smalto?sort=title:ASC

Load more (client-side, not in URL):
  Managed via Server Action offset, not reflected in URL

Full combination:
  /it/mosaico/murano-smalto?color=rosso&shape=cube&sort=title:ASC
```

### URL Rules

- One path segment max after base path — never `/mosaico/murano-smalto/rosso`
- Path determines ISR cache — each path is a pre-generatable page
- Query params are additive — accumulate without conflicts
- Load more offset is client-side state only, not a URL param
- Any filter or sort change resets load more offset to 0
- Tessuto note: base paths may contain multi-segment paths in some locales (e.g. `/prodotti-tessili`). The "one segment after base" rule applies relative to the base path, not the root.

## 5. Mobile Handling

### Breakpoint

`md` (768px) — below is mobile, above is desktop.

### Desktop

- Fixed sidebar left (~16rem width)
- Main content right
- Product grid: 3-4 columns
- Category card grid: 4 columns

### Mobile

- No sidebar, content full-width
- Product grid: 2 columns
- Category card grid: 2 columns
- **FAB "Filters"** fixed at bottom center, shows active filter count
- FAB click → opens **Sheet** (shadcn primitive) from left side, same structure as sidebar
- **Active filter chips** visible above grid without opening drawer, with × to remove
- Sheet has sticky "Show N products" button at bottom

### State 1 → State 2 Transition on Mobile

- State 1: category cards full-width, FAB present to open P0 filters
- Click category card → URL navigation → State 2 with product grid
- Alternative: open drawer, select P0, click "Show results" → same navigation

No functional difference between mobile and desktop, only layout.

## 6. Caching Strategy

| URL Pattern | Rendering | Cache |
|---|---|---|
| `/it/mosaico` (state 1) | ISR | Pre-generated, revalidate ~1h |
| `/it/mosaico/murano-smalto` (first P0) | ISR | Pre-generated via `generateStaticParams` |
| `/it/mosaico/murano-smalto?color=rosso` (second P0) | Server render | `React.cache()` dedup per request |
| `/it/mosaico/murano-smalto?shape=cube` (P1/P2) | Server render | `React.cache()` dedup per request |
| Load more batch | Server Action | `React.cache()` dedup, no page cache |

### ISR and generateStaticParams

`generateStaticParams` is NOT added to the existing catch-all `[...slug]/page.tsx`. The catch-all already has `revalidate = 60` which provides ISR for all routes. Pre-generation of listing paths happens naturally through Drupal's `decoupled_router` resolution — no explicit `generateStaticParams` needed. The existing ISR mechanism is sufficient.

## 7. Files Affected

### New Files (to be created)

- `src/templates/nodes/ProductListingTemplate.tsx` — unified template
- `src/lib/actions/load-more-products.ts` — Server Action for load more
- `src/components/blocks/ListingHeader.tsx`
- `src/components/blocks/FilterSidebar.tsx` (new design system version)
- `src/components/blocks/CategorySection.tsx`
- `src/components/blocks/ProductSection.tsx`
- `src/components/composed/ActiveFilters.tsx`
- `src/components/composed/FilterGroup.tsx`
- `src/components/composed/ColorSwatchFilter.tsx`
- `src/components/composed/ImageListFilter.tsx`
- `src/components/composed/CheckboxFilter.tsx`
- `src/components/composed/MobileFilterTrigger.tsx`
- `src/components/composed/CategoryCardGrid.tsx`
- `src/components/composed/CategoryCard.tsx`
- `src/components/composed/ListingToolbar.tsx`
- `src/components/composed/ProductGrid.tsx`
- `src/components/composed/ProductCard.tsx`
- `src/components/composed/LoadMoreButton.tsx`

### Modified Files

- `src/domain/filters/registry.ts` — extend with `listing: ListingConfig` on ProductTypeConfig
- `src/app/[locale]/[...slug]/page.tsx` — route to new template. The existing `PAGE_SIZE` constant is retained for non-product listings (projects, blog, showroom, etc.); product listings use `listing.pageSize` from the registry instead
- `src/lib/node-resolver.ts` — map to new template
- `src/lib/drupal/products.ts` — support sorting, load more offset
- `src/lib/drupal/filters.ts` — support image data on filter options, live counts
- `src/domain/filters/search-params.ts` — support sort param, second P0 as query, effectiveType resolution
- `src/hooks/use-filter-sync.ts` — handle second P0 via query param navigation
- `messages/*.json` — add i18n keys for filters, sorting, UI labels

### Legacy Files (partially deprecated after migration)

- `src/components_legacy/FilterSidebar.tsx` — replaced by new FilterSidebar block
- `src/components_legacy/ProductListing.tsx` — replaced by new ProductSection block
- `src/templates/nodes/Categoria.tsx` — product listing modes replaced; content category fallback mode remains until a separate feature covers non-product listings

## 8. Out of Scope

- Component styling and design tokens (handled via /ds and /shadcn skills during implementation)
- Breadcrumb block (separate feature)
- Contact form / CTA dialogs
- Content category mode in Categoria.tsx (non-product listings like blog, showroom — remains in Categoria.tsx)
- Regional logic (EU vs US)
- Search/keyword filter
- Remaining product type configs follow by analogy: Vetrite ≈ Mosaico (collection + color P0), Tessuto ≈ Arredo (category P0). Illuminazione uses `node--categoria` for its P0 subcategory (same as Arredo), with `hasImage: true` and `hasColorSwatch: false`
