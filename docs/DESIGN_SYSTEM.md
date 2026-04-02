# Components — Design System

> Extracted from CLAUDE.md. See CLAUDE.md for project overview.

## Composed (`src/components/composed/`)

Scan with: `node /Users/nicolagasco/.claude/skills/ds/scripts/inventory.js composed`

**Full inventory (46 components):**

| Component                  | Purpose                                                                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ActiveFilters`            | Renders active filter chips (display only — no URL logic)                                                                                                                          |
| `ActiveFiltersBar`         | Client wrapper around `ActiveFilters`; wires chip removal to `useFilterSync` URL updates                                                                                           |
| `AiryHeader`               | Full-width section header with title, optional subtitle and decorative spacing                                                                                                     |
| `ArrowLink`                | Styled link with trailing arrow icon; supports `external` flag and `textRole` sizing                                                                                               |
| `AttributeGrid`            | Two-column grid for product attribute key/value pairs (e.g. dimensions, weight)                                                                                                    |
| `CategoryCard`             | Image card linking to a category hub page; accepts `aspectRatio` and `imageFit` props                                                                                              |
| `CategoryCardGrid`         | Responsive grid wrapper for a list of `CategoryCard` components                                                                                                                    |
| `CheckboxFilter`           | Multi-select checkbox list for a single filter group; shows item count badges                                                                                                      |
| `CollectionPopoverContent` | Popover body listing alternative collection options; used inside `ContextBar`                                                                                                      |
| `ColorSwatchFilter`        | Color swatch grid for a single filter group; single-select; dims zero-count options                                                                                                |
| `ColorSwatchLink`          | Circular color swatch + label that navigates to a filtered listing URL                                                                                                             |
| `ContextBar`               | Sticky bar shown when a P0 filter (collection or color) is active; shows thumbnail/swatch, title, subtitle, popover to switch, back link, and share button                         |
| `DocumentCard`             | Auto-detects label and icon from href URL pattern (PDF/video/catalog/fallback). Supports `vertical` and `horizontal` layout variants                                               |
| `FilterGroup`              | Collapsible accordion section wrapping a single filter group inside the sidebar                                                                                                    |
| `FilterPanel`              | CSS `position: sticky` sidebar panel; scrolls independently when taller than viewport; no JS scroll listeners                                                                      |
| `FinitureGallery`          | Interactive gallery for arredo/tessuto finishes: shows swatches and fabric variants with client-side selection state                                                               |
| `GalleryCarousel`          | Horizontal scroll carousel with snap alignment, prev/next arrows, optional `header` slot. Used by `GenGallery` and `GenGalleryIntro`                                               |
| `GenTestoImmagineBody`     | Shared text column used inside `GenTestoImmagine` and `GenTestoImmagineBig`                                                                                                        |
| `HubSection`               | Section wrapper with heading and optional slot for a "view all" link; used on hub pages                                                                                            |
| `ImageListFilter`          | Image-based single-select filter list (e.g. finishes with thumbnail previews)                                                                                                      |
| `ListingBreadcrumb`        | Client breadcrumb for listing pages; reads active collection/color from URL and resolves locale-aware segment labels                                                               |
| `ListingToolbar`           | Toolbar row above the product grid: result count, sort dropdown, and optional active-filter chips                                                                                  |
| `LoadMoreButton`           | Client button invoking the `loadMoreProducts` server action; shows a spinner during loading                                                                                        |
| `MediaElement`             | Unified media renderer: dispatches to `next/image`, `VimeoPlayer`, or `<video>` based on field type                                                                                |
| `MegaMenuExplore`          | Mega-menu panel for the "Explore" navigation section                                                                                                                               |
| `MegaMenuFilterFind`       | Mega-menu panel for the "Filter & Find" navigation section; includes category cards and secondary deep-dive links                                                                  |
| `MegaMenuInfo`             | Mega-menu panel for the informational/brand navigation section                                                                                                                     |
| `MegaMenuProjects`         | Mega-menu panel for the Projects navigation section                                                                                                                                |
| `MobileFilterTrigger`      | Fixed FAB (below `md`) opening Sheet drawer with filter tree. Shows active filter count and result count                                                                           |
| `NavDarkModeToggle`        | Icon button toggling light/dark theme via `next-themes`                                                                                                                            |
| `NavLanguageSwitcher`      | Locale picker in the navbar; resolves translated paths via `getTranslatedPath` server action                                                                                       |
| `PixallHubCard`            | Hero card for Pixall, Outdoor, and Next Art hub sections: full-bleed image, title, color swatches, and explore CTA                                                                 |
| `ProductCard`              | Product tile used in listing grids: image, name, collection tag, hover overlay                                                                                                     |
| `ProductCarousel`          | Main product image carousel on detail pages. Accepts `image`, `video`, and `static` slide types; renders thumbnails strip; ratio prop controls aspect                              |
| `ProductCta`               | Paired CTA buttons ("Request Sample" + "Get a Quote"); reads quote sheet context via `useQuoteSheet`                                                                               |
| `ProductGrid`              | Responsive CSS grid wrapper for product cards; handles empty-state rendering                                                                                                       |
| `ProductListingSkeleton`   | Loading skeleton matching the product grid layout; shown during server-action load-more                                                                                            |
| `ProductPricingCard`       | US-market card showing price, stock status, warehouse, and shipping time                                                                                                           |
| `QuoteFormSheet`           | Dialog form for "Get a Quote" submissions; POSTs to Resend email API; handles pending/sent/error states                                                                            |
| `QuoteSheetProvider`       | Context provider wrapping product detail pages; exposes `useQuoteSheet()` hook to open `QuoteFormSheet` from any child                                                             |
| `ResponsiveImage`          | Wrapper around `next/image` with `fill` mode; accepts `sizes` prop; enforces correct aspect ratio container                                                                        |
| `ShareButton`              | Client button that copies the current URL to clipboard; shows a tick confirmation                                                                                                  |
| `SpecsTable`               | Tabular display for structured product specification data                                                                                                                          |
| `SwatchList`               | Horizontal row of color/finish swatches; used in collection and product detail contexts                                                                                            |
| `Typography`               | Design-system text primitive. `textRole` prop selects from: `h1`–`h4`, `subtitle-1`, `subtitle-2`, `body`, `body-sm`, `caption`, `label`. `as` prop controls rendered HTML element |
| `VimeoPlayer`              | Client component wrapping `@vimeo/player` SDK. Poster image overlay; on play, Vimeo iframe with custom controls. Native controls disabled (`controls=0`)                           |

---

## Blocks (`src/components/blocks/`)

**Naming convention:**

- `Spec*` — Product and listing page blocks, tightly coupled to specific data shapes (product fields, filter registries). Used directly in templates.
- `Gen*` — General-purpose paragraph blocks driven by Drupal `paragraph--blocco_*` data. Wired through `ParagraphResolver` and reusable across all content types.

Scan with: `node /Users/nicolagasco/.claude/skills/ds/scripts/inventory.js blocks`

### Gen blocks (12 built) — `blocco_*` → `Gen*` mapping

| Drupal paragraph type                   | Gen block              |
| --------------------------------------- | ---------------------- |
| `paragraph--blocco_intro`               | `GenIntro`             |
| `paragraph--blocco_quote`               | `GenQuote`             |
| `paragraph--blocco_video`               | `GenVideo`             |
| `paragraph--blocco_testo_immagine`      | `GenTestoImmagine`     |
| `paragraph--blocco_testo_immagine_big`  | `GenTestoImmagineBig`  |
| `paragraph--blocco_testo_immagine_blog` | `GenTestoImmagineBlog` |
| `paragraph--blocco_gallery`             | `GenGallery`           |
| `paragraph--blocco_gallery_intro`       | `GenGalleryIntro`      |
| `paragraph--blocco_documenti`           | `GenDocumenti`         |
| `paragraph--blocco_a`                   | `GenA`                 |
| `paragraph--blocco_b`                   | `GenB`                 |
| `paragraph--blocco_c`                   | `GenC`                 |

**Gen blocks remaining to build** (still using legacy `Blocco*` in LEGACY_MAP):

`GenCorrelati`, `GenNewsletter`, `GenFormBlog`, `GenSliderHome`, `GenAnni`, `GenTutorial`

**Deleted legacy Blocco\* files** (replaced by Gen\* equivalents): BloccoIntro, BloccoQuote, BloccoVideo, BloccoGallery, BloccoTestoImmagine, BloccoTestoImmagineBig, BloccoTestoImmagineBlog, BloccoGalleryIntro, BloccoDocumenti

### Spec blocks (9 built) — full inventory

| Block                      | Purpose                                                                                                                                                                                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SpecProductHero`          | Two-column product hero: `ProductCarousel` left, title/collection/description/CTAs right. Includes sticky mobile CTA bar that hides when in-flow CTAs are visible (IntersectionObserver). US-market variant renders `ProductPricingCard`.                             |
| `SpecProductGallery`       | Full-width image gallery specific to mosaic product detail pages                                                                                                                                                                                                      |
| `SpecProductDetails`       | Specification detail block: attribute grid and specs table for a single product                                                                                                                                                                                       |
| `SpecProductSpecs`         | Extended specification panel; includes hardcoded "Maintenance and installation" heading (pending i18n migration)                                                                                                                                                      |
| `SpecProductResources`     | Downloads and catalog links block; includes hardcoded "Get inspired through catalogs" heading (pending i18n migration)                                                                                                                                                |
| `SpecProductListing`       | Server component rendering the full listing page: calls `SpecFilterSidebar` + product grid + `LoadMoreButton`                                                                                                                                                         |
| `SpecFilterSidebar`        | Outer sidebar shell: renders `SpecFilterSidebarContent` inside a `FilterPanel`; also wires `MobileFilterTrigger` Sheet                                                                                                                                                |
| `SpecFilterSidebarContent` | Client component: renders `FilterGroup` sections with `CheckboxFilter`, `ColorSwatchFilter`, or `ImageListFilter` per group config. Supports optional subcategory filter buttons (arredo/illuminazione style). Excludes the active P0 path filter from panel display. |
| `SpecListingHeader`        | Page header for listing pages: title, description, breadcrumb row                                                                                                                                                                                                     |
| `SpecCategory`             | Renders a category (hub) page: dispatches to `SpecHubMosaico` or `SpecHubArredo` based on product type                                                                                                                                                                |
| `SpecHubMosaico`           | Async server block for mosaico/vetrite hub pages. Fetches colors and collections in parallel; renders `ColorSwatchLink` row and `CategoryCard` grid. Filters out sub-collection entries.                                                                              |
| `SpecHubArredo`            | Async server block for arredo/illuminazione/tessuto hub pages. Renders Indoor typology cards, Outdoor hero, Next Art hero, descriptive categories, "Discover also" section, and deep-dive links. Shared across product types via `productType` prop.                  |

---

### ParagraphResolver

**Location:** `src/components_legacy/blocks_legacy/ParagraphResolver.tsx`

Async server component. Maps incoming `paragraph--{type}` data to either a DS `Gen*` block or a legacy `Blocco*` fallback component.

**Dispatch flow:**

1. Checks if the paragraph type requires a secondary Drupal fetch via `needsSecondaryFetch(type)` (used for paragraphs with nested children, e.g. gallery slides).
2. If yes, calls `fetchParagraph()` to hydrate nested data before rendering.
3. Attempts Gen adapter functions (`adaptGenIntro`, `adaptGenVideo`, etc.) in order of type match.
4. Falls back to `LEGACY_MAP[type]` for types not yet migrated.
5. In development, renders a yellow dashed warning box for unknown paragraph types; in production, returns `null`.

**Templates using ParagraphResolver:**
Page, LandingPage, Articolo, News, Tutorial, Ambiente, Progetto, CategoriaBlog, Tag, ProdottoArredo, Categoria

**Current wiring status:** Gen adapters active for all 12 built Gen blocks; BloccoSliderHome, BloccoCorrelati, BloccoNewsletter, BloccoFormBlog, BloccoAnni, BloccoTutorial remain in `LEGACY_MAP`.

---

## Primitives (`src/components/ui/`)

shadcn/ui primitives (base-vega preset, base-ui). NEVER modify directly.

**Full inventory (55 components):** accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, button-group, calendar, card, carousel, chart, checkbox, collapsible, combobox, command, context-menu, dialog, direction, drawer, dropdown-menu, empty, field, hover-card, input, input-group, input-otp, item, kbd, label, menubar, native-select, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toggle, toggle-group, tooltip

---

## Layout (`src/components/layout/`)

| Component       | Purpose                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `Navbar`        | Client wrapper — manages `openMenu` state and scroll-direction visibility, renders `NavbarDesktop` and `NavbarMobile` |
| `NavbarDesktop` | Full desktop navigation bar with mega-menu panels                                                                     |
| `NavbarMobile`  | Mobile hamburger navigation with sheet drawer                                                                         |

---

## Legacy (`src/components_legacy/`)

Being replaced progressively. Check directory contents for current state.

Notes:

- Header, MegaMenu, LanguageSwitcher superseded by `src/components/layout/` — kept for reference only
- Footer still actively used (not yet migrated)
- DrupalImage still used in all legacy product templates
- `blocks_legacy/`: `Blocco*` paragraph components + `ParagraphResolver`. Migration status tracked in ParagraphResolver's `LEGACY_MAP` — source of truth for what's still legacy
