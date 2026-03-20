# Unified Product Listing Template — Design Spec

## Overview

A single, config-driven listing template for all 6 product types (Mosaico, Vetrite, Arredo, Tessuto, Pixall, Illuminazione). Replaces the current Categoria.tsx multi-mode template with a unified system that uses the existing FILTER_REGISTRY as the single source of truth.

## Requirements

- Sidebar layout: fixed sidebar on desktop, Sheet drawer on mobile
- Progressive disclosure: category cards (state 1) → product grid with secondary filters (state 2)
- P0 filters (collection, color, typology) visible in sidebar from the start and as browsable cards in main content
- P1/P2 filters appear only after a P0 is selected
- Combinable P0 filters: first via path (ISR cacheable), second via query param
- Live counts on filter options to prevent empty intersections
- Sorting by name + filter typologies (varies per product type)
- Load more pagination (configurable batch size)
- Product card: image, name, collection/typology subtitle
- Category card: configurable aspect ratio per product type
- Header: title + optional description, no hero image

## 1. Registry Extension

The existing `FILTER_REGISTRY` in `src/domain/filters/registry.ts` is extended with listing configuration.

### New Types

```ts
interface ListingConfig {
  // Existing
  basePath: Record<Locale, string>
  filters: FilterDefinition[]

  // New
  title: Record<Locale, string>
  description?: Record<Locale, string>
  categoryCardRatio: string              // e.g. "1/1", "4/3", "3/4"
  categoryGroups: CategoryGroupDef[]
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

### Example: Mosaico

```ts
{
  title: { it: 'Mosaico', en: 'Mosaic', fr: 'Mosaïque', de: 'Mosaik', es: 'Mosaico', ru: 'Мозаика' },
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
```

### Example: Arredo

```ts
{
  title: { it: 'Arredo', en: 'Furniture', fr: 'Ameublement', de: 'Möbel', es: 'Mobiliario', ru: 'Мебель' },
  categoryCardRatio: '4/3',
  categoryGroups: [
    { filterKey: 'subcategory', labelKey: 'filters.typologies', hasImage: true, hasColorSwatch: false },
  ],
  sortOptions: [
    { labelKey: 'sort.name', field: 'title', direction: 'ASC' },
    { labelKey: 'sort.typology', field: 'field_categoria.name', direction: 'ASC' },
  ],
  pageSize: 48,
}
```

## 2. Component Tree

```
ProductListingTemplate (template, server component)
├── ListingHeader (block)
│   ├── Typography (composed) — title
│   └── Typography (composed) — description
├── ListingContent (block, manages state 1 vs state 2)
│   ├── FilterSidebar (block, desktop: fixed sidebar, mobile: Sheet drawer)
│   │   ├── ActiveFilters (composed) — active filter chips with ×
│   │   ├── FilterGroup (composed) — repeated per filter
│   │   │   ├── ColorSwatchFilter (composed) — for color filters
│   │   │   ├── ImageListFilter (composed) — for collections with preview
│   │   │   └── CheckboxFilter (composed) — for generic P1/P2 filters
│   │   └── MobileFilterTrigger (composed) — FAB "Filters" for mobile
│   └── MainContent (block, right area)
│       ├── [State 1] CategoryCardGrid (composed) — category cards, repeated per group
│       │   └── CategoryCard (composed) — single card with image/swatch
│       └── [State 2] ProductListing (block)
│           ├── ListingToolbar (composed) — count + sorting
│           ├── ProductGrid (composed) — responsive grid
│           │   └── ProductCard (composed) — image + name + subtitle
│           └── LoadMoreButton (composed) — "Load 48 more"
```

### Hierarchy Rules

- Blocks import only Composed, never Primitives (enforced by /ds skill)
- Composed import only Primitives from `src/components/ui/`
- ProductCard and CategoryCard are separate composed components

## 3. Data Flow

### State 1: No P0 active

```
URL: /it/mosaico
  → getSectionConfig() → productType: prodotto_mosaico, no path filter
  → getListingConfig() → title, categoryGroups, sortOptions
  → hasActiveP0? NO
  → Fetch in parallel:
    • fetchFilterOptions() for each P0 filter → populates sidebar + category cards
    • NO fetchProducts()
  → Render: FilterSidebar (P0 only) + CategoryCardGrid
```

### State 2: P0 active

```
URL: /it/mosaico/murano-smalto?color=rosso&shape=cube
  → getSectionConfig() → productType: prodotto_mosaico, filterField: collezione = "Murano Smalto"
  → getListingConfig() → same config
  → hasActiveP0? YES
  → Fetch in parallel:
    • fetchProducts() with active filters
    • fetchAllFilterOptions() for ALL filters (P0 + P1/P2) with counts relative to active filters
  → Render: FilterSidebar (P0 + P1/P2, with counts) + ProductListing (grid + sorting)
```

### Key Points

- State 1 fetches no products — lighter, faster
- State 2 fetches products + all filter options with live counts to prevent empty intersections
- First P0 selection → URL navigation (path-based, ISR cacheable)
- Second P0 or P1/P2 → query param, server render with `React.cache()`
- Load more → client-side fetch (offset + pageSize), append to DOM
- Sorting → query param `?sort=title:ASC`, triggers server render

## 4. URL Structure

```
State 1 (no P0):
  /it/mosaico                                    → category cards
  /it/arredo                                     → typology cards
  /it/lastre-vetro-vetrite                       → category cards

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

Load more (query, client-side only):
  /it/mosaico/murano-smalto?page=2

Full combination:
  /it/mosaico/murano-smalto?color=rosso&shape=cube&sort=title:ASC&page=2
```

### URL Rules

- One path segment max after base path — never `/mosaico/murano-smalto/rosso`
- Path determines ISR cache — each path is a pre-generatable page
- Query params are additive — accumulate without conflicts
- `page` is client-side only — does not trigger server render, is an offset for incremental fetch
- Any filter or sort change resets `page` to 1

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
| Load more batch | Client fetch | Browser cache, short TTL |

## 7. Files Affected

### New Files (to be created)

- `src/templates/nodes/ProductListingTemplate.tsx` — unified template
- `src/components/blocks/ListingHeader.tsx`
- `src/components/blocks/ListingContent.tsx`
- `src/components/blocks/FilterSidebar.tsx` (new design system version)
- `src/components/blocks/ProductListing.tsx` (new design system version)
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

- `src/domain/filters/registry.ts` — extend with ListingConfig
- `src/app/[locale]/[...slug]/page.tsx` — route to new template
- `src/lib/node-resolver.ts` — map to new template
- `src/lib/drupal/products.ts` — support sorting, load more offset
- `src/lib/drupal/filters.ts` — support live counts
- `src/domain/filters/search-params.ts` — support sort + page params
- `messages/*.json` — add i18n keys for filters, sorting, UI labels

### Legacy Files (to be deprecated after migration)

- `src/components_legacy/FilterSidebar.tsx`
- `src/components_legacy/ProductListing.tsx`
- `src/templates/nodes/Categoria.tsx` (product listing modes)

## 8. Out of Scope

- Component styling and design tokens (handled via /ds and /shadcn skills during implementation)
- Breadcrumb block (separate feature)
- Contact form / CTA dialogs
- Content category mode (non-product listings like blog, showroom)
- Regional logic (EU vs US)
- Search/keyword filter
