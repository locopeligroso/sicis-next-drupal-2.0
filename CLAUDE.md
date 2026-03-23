# CLAUDE.md — Sicis Next.js Frontend

> **Source of truth:** The code is always the source of truth. This document may be outdated — when in doubt, read the code. For Drupal data (fields, entities, menus, paragraphs), the only real source is what Drupal returns via JSON:API — never assume field presence or structure from this doc alone, always verify against the actual API response.

## Project Overview
Decoupled Next.js 16 frontend for Sicis (luxury mosaic brand) backed by headless Drupal 10.
6 languages: IT (default), EN, FR, DE, ES, RU.

## Commands
- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build
- `npm run storybook` — Storybook dev (localhost:6006)
- `npx tsc --noEmit` — TypeScript check
- `npx vitest run` — Run tests

## Tech Stack

Next 16.1.7 | React 19.2.4 | Tailwind 4.2.2 | Storybook 10.3.1 | next-intl | nuqs | embla-carousel

## Architecture

### Data Layer (`src/lib/drupal/`)
Single unified Drupal client split by responsibility:
- `config.ts` — DRUPAL_BASE_URL, DRUPAL_ORIGIN (single source of truth)
- `core.ts` — translatePath, fetchJsonApiResource, getResourceByPath
- `deserializer.ts` — buildIncludedMap, deserializeResource (preserves relationship meta: alt, width, height)
- `image.ts` — getDrupalImageUrl
- `menu.ts` — fetchMenu, transformMenuToNavItems
- `paragraphs.ts` — fetchParagraph, needsSecondaryFetch
- `products.ts` — fetchProducts, getCategoriaProductType, slugToTermName
- `filters.ts` — fetchFilterOptions, fetchAllFilterOptions
- `projects.ts` — fetchProjects
- `blog.ts` — fetchBlogPosts (articolo, news, tutorial merged)
- `documents.ts` — fetchDocuments
- `showrooms.ts` — fetchShowrooms
- `environments.ts` — fetchEnvironments (ambiente nodes)
- `pages-by-category.ts` — fetchPagesByCategory
- `subcategories.ts` — fetchSubcategories
- `types.ts` — JSON:API type definitions
- `translated-path.ts` — getTranslatedPath
- `index.ts` — barrel re-export (import from `@/lib/drupal`)

### Domain Layer
- `src/domain/filters/` — `registry.ts` (FILTER_REGISTRY, SLUG_OVERRIDES), `search-params.ts` (nuqs integration)
- `src/domain/routing/` — `routing-registry.ts` (shadow mode), `section-config.ts`

### Routing

Entry point: `src/app/[locale]/[...slug]/page.tsx`

**Stage 1 — LISTING_SLUG_OVERRIDES**
Set of hardcoded product slugs (mosaico, mosaic, arredo, furniture-and-accessories, pixall, illuminazione, vetrite variants, tessile variants, etc.) that bypass `translatePath`. These slugs have Drupal nodes (categoria_blog, documento, page) with the same alias that would be rendered instead of the correct product listing. `getSectionConfigAsync` resolves the `productType` → `renderProductListing()`.

**Stage 2 — Multi-slug interception**
URLs with 2+ segments (e.g. `/mosaico/murano-smalto`). `getSectionConfigAsync` runs first; if a config is found and `parseFiltersFromUrl` detects at least one active filter → `renderProductListing()` with filter active.

**Stage 3 — Drupal translatePath**
`translatePath` resolves the path via `decoupled_router` to a JSON:API node. Resource is fetched with `fetchJsonApiResource` using the bundle's INCLUDE_MAP. Rendered via `COMPONENT_MAP[componentName]`.

**Interception: node--categoria**
If `translatePath` resolves to `node--categoria` AND `getSectionConfigAsync` returns a config with `filterField` set → the node is a subcategory listing, not a hub category. Renders via `renderProductListing()` using the Drupal node title for the heading.

**Interception: node--page with field_page_id**
Drupal uses `node--page` nodes as hub pages for listing sections. `field_page_id` maps to a content type:
- `tessile` → `prodotto_tessuto` → `renderProductListing()`
- `progetti`, `environments`, `blog`, `showroom`, `download_catalogues` → fetcher + legacy listing component

#### Revalidation Strategy

| Entity Type | TTL | Source |
|---|---|---|
| Products (all 6 types) | 60 s | `node-resolver.ts` |
| Editorial (articolo, news, tutorial) | 300 s | `node-resolver.ts` |
| Static pages (page, landing_page) | 600 s | `node-resolver.ts` |
| Taxonomy terms | 3600 s | `node-resolver.ts` |
| Menus | 600 s | `menu.ts` |
| Paths (translatePath) | 3600 s | `core.ts` |

#### Server Actions

- `src/lib/actions/load-more-products.ts` — `loadMoreProducts` (product pagination via "Load More" button)
- `src/lib/get-translated-path.ts` — `getTranslatedPath` (`'use server'` wrapper for cross-locale path resolution in client components)

### INCLUDE_MAP

Rules:
- If a relationship field is not in the INCLUDE_MAP, Drupal returns only `{ type, id }` without data
- All nested images (stucco, colori, forma, categoria) must be explicitly included
- `showroom` and `documento`: do NOT have `field_blocchi` — Drupal returns 400 if included
- `prodotto_arredo` and `prodotto_illuminazione`: `field_finiture.field_immagine` included
- `mosaico_collezioni` and `vetrite_collezioni`: `field_documenti` chain included
- `blocco_documenti` included in PARAGRAPH_INCLUDE

### Dev Preview Routes
- `src/app/dev/layout.tsx` — Dev-only layout with fonts + tokens + theme, no Header/Footer/i18n. Guarded by `NODE_ENV !== 'development'`.
- Convention: draft pages go in `src/app/dev/preview/[name]/page.tsx` (e.g. `gen-intro/page.tsx`). Each page has its own `NODE_ENV` guard.
- Used by /ds workflow Get-a-Draft. Delete the preview page after extracting the component.
- URL: `localhost:3000/dev/preview/[name]`

## Components — Design System (`/ds` skill)

### Composed (`src/components/composed/`)

Scan with: `node /Users/nicolagasco/.claude/skills/ds/scripts/inventory.js composed`

**Non-obvious components:**

- **VimeoPlayer** — Client component wrapping `@vimeo/player` SDK. Poster image overlay; on play, Vimeo iframe with custom controls. Native controls disabled (`controls=0`).
- **GalleryCarousel** — Horizontal scroll carousel with snap alignment, prev/next arrows, optional `header` slot. Used by `GenGallery` and `GenGalleryIntro`.
- **DocumentCard** — Auto-detects label+icon from href URL pattern (PDF/video/catalog/fallback). Supports `vertical` and `horizontal` layout variants.
- **MobileFilterTrigger** — Fixed FAB (below `md`) opening Sheet drawer with filter tree. Shows active filter count + result count.
- **GenTestoImmagineBody** — Shared text column used inside `GenTestoImmagine` and `GenTestoImmagineBig`.

---

### Blocks (`src/components/blocks/`)

**Naming convention:**
- `Spec*` — Product and listing page blocks, tightly coupled to specific data shapes (product fields, filter registries). Used directly in templates.
- `Gen*` — General-purpose paragraph blocks driven by Drupal `paragraph--blocco_*` data. Wired through `ParagraphResolver` and reusable across all content types.

Scan with: `node /Users/nicolagasco/.claude/skills/ds/scripts/inventory.js blocks`

**Gen blocks built — `blocco_*` → `Gen*` mapping:**

| Drupal paragraph type | Gen block |
|-----------------------|-----------|
| `paragraph--blocco_intro` | `GenIntro` |
| `paragraph--blocco_quote` | `GenQuote` |
| `paragraph--blocco_video` | `GenVideo` |
| `paragraph--blocco_testo_immagine` | `GenTestoImmagine` |
| `paragraph--blocco_testo_immagine_big` | `GenTestoImmagineBig` |
| `paragraph--blocco_testo_immagine_blog` | `GenTestoImmagineBlog` |
| `paragraph--blocco_gallery` | `GenGallery` |
| `paragraph--blocco_gallery_intro` | `GenGalleryIntro` |
| `paragraph--blocco_documenti` | `GenDocumenti` |

**Gen blocks remaining — still using legacy `Blocco*` fallback:**

`GenCorrelati`, `GenNewsletter`, `GenFormBlog`, `GenSliderHome`, `GenAnni`, `GenTutorial`

---

#### ParagraphResolver

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

**Current wiring status:** Gen adapters active for all built Gen blocks; BloccoSliderHome, BloccoVideo, BloccoCorrelati, BloccoNewsletter, BloccoFormBlog, BloccoAnni, BloccoTutorial remain in `LEGACY_MAP`.

---

### Primitives (`src/components/ui/`)

shadcn/ui primitives (base-vega preset, base-ui). NEVER modify directly.

---

### Layout (`src/components/layout/`)

| Component | Purpose |
|-----------|---------|
| `Navbar` | Client wrapper — manages `openMenu` state and scroll-direction visibility, renders `NavbarDesktop` and `NavbarMobile` |
| `NavbarDesktop` | Full desktop navigation bar with mega-menu panels |
| `NavbarMobile` | Mobile hamburger navigation with sheet drawer |

---

### Legacy (`src/components_legacy/`)

Being replaced progressively. Check directory contents for current state.

Notes:
- Header, MegaMenu, LanguageSwitcher superseded by `src/components/layout/` — kept for reference only
- Footer still actively used (not yet migrated)
- DrupalImage still used in all legacy product templates
- `blocks_legacy/`: `Blocco*` paragraph components + `ParagraphResolver`. Migration status tracked in ParagraphResolver's `LEGACY_MAP` — source of truth for what's still legacy

## Templates — Migration Matrix

### Node Templates (`src/templates/nodes/`)

| Template | Drupal Type | Status | Uses ParagraphResolver | Notes |
|---|---|---|---|---|
| ProdottoMosaico | node--prodotto_mosaico | DS | No | 5 blocks (Spec*), 9 composed; collection-level fallback for body/specs |
| ProductListingTemplate | (unified listing) | DS | No | Hub mode (SpecCategory) + Grid mode (SpecProductListing); accepts all 6 product types |
| Page | node--page | Minimal DS | Yes | title + body + ParagraphResolver |
| LandingPage | node--landing_page | Minimal DS | Yes | ParagraphResolver only, no title/body |
| ProdottoVetrite | node--prodotto_vetrite | Legacy | No | DrupalImage + product.module.css; inline styles throughout |
| ProdottoArredo | node--prodotto_arredo | Legacy | Yes | DrupalImage + product.module.css; async tessuti secondary fetch |
| ProdottoTessuto | node--prodotto_tessuto | Legacy | No | DrupalImage + product.module.css |
| ProdottoPixall | node--prodotto_pixall | Legacy | No | DrupalImage + product.module.css |
| ProdottoIlluminazione | node--prodotto_illuminazione | Legacy | No | DrupalImage + product.module.css; async secondary fetch |
| Articolo | node--articolo | Legacy+Para | Yes | title + DrupalImage + body + ParagraphResolver |
| News | node--news | Legacy+Para | Yes | title + DrupalImage + body + ParagraphResolver |
| Tutorial | node--tutorial | Legacy+Para | Yes | title + DrupalImage + body + ParagraphResolver |
| Ambiente | node--ambiente | Legacy+Para | Yes | title + DrupalImage + body + ParagraphResolver |
| Progetto | node--progetto | Legacy+Para | Yes | + field_categoria_progetto link |
| Showroom | node--showroom | Legacy | No | NO field_blocchi — Drupal returns 400 if included |
| Documento | node--documento | Legacy | No | NO field_blocchi — Drupal returns 400 if included |
| Categoria | node--categoria | Legacy | Yes | 3-branch: products / subcategories / pages; getCategoriaProductType() |
| CategoriaBlog | node--categoria_blog | Legacy+Para | Yes | |
| Tag | node--tag | Legacy+Para | Yes | |

**Status key:** DS = design system blocks (Spec*/Gen* composed components, Tailwind only). Legacy = DrupalImage + `product.module.css` + inline styles. Minimal DS = Tailwind layout, legacy ParagraphResolver inside. Legacy+Para = legacy render with ParagraphResolver for `field_blocchi`. Hybrid = legacy structure + Tailwind sections.

**Common rule:** All templates receive `node` as `Record<string, unknown>`, cast to a typed interface from `src/types/drupal/entities.ts`.

Only `ProdottoMosaico` and `ProductListingTemplate` use the design system (Spec* blocks, no legacy imports).

---

### Taxonomy Templates (`src/templates/taxonomy/`)

| Template | Drupal Type | Status | Notes |
|---|---|---|---|
| MosaicoCollezione | taxonomy_term--mosaico_collezioni | Legacy listing | Legacy FilterSidebar + legacy ProductListing |
| MosaicoColore | taxonomy_term--mosaico_colori | Legacy listing | Legacy FilterSidebar + legacy ProductListing |
| VetriteCollezione | taxonomy_term--vetrite_collezioni | Hybrid | Legacy listing + FilterSidebar + Tailwind documents section + getTranslations |
| VetriteColore | taxonomy_term--vetrite_colori | Legacy listing | Legacy FilterSidebar + legacy ProductListing |
| TaxonomyTerm | (generic fallback) | Wireframe | name + description only |

---

## Types

- `src/types/drupal/entities.ts` — Single source of truth for all entity shapes
- `NodeTypeName` — union of all node types (page, landing_page, prodotto_*, articolo, news, tutorial, progetto, showroom, ambiente, categoria, categoria_blog, documento, tag)
- `TaxonomyTypeName` — union of all taxonomy types (mosaico_collezioni, mosaico_colori, vetrite_collezioni, vetrite_colori, vetrite_finiture, vetrite_textures, arredo_finiture, tessuto_colori, tessuto_finiture, tessuto_tipologie, tessuto_manutenzione)
- `EntityTypeName` — `NodeTypeName | TaxonomyTypeName | (string & Record<never, never>)` (open union for unknown types)
- Shared field shapes: `DrupalTextField`, `DrupalPath`, `DrupalLinkField`, `DrupalEntity` (base for all)
- Typed product interfaces: `ProdottoMosaico`, `ProdottoVetrite`, `ProdottoArredo`, `ProdottoTessuto`, `ProdottoPixall`, `ProdottoIlluminazione`
- Taxonomy term interfaces: `TermMosaicoCollezione`, `TermVetriteCollezione`
- Node interfaces: `NodeCategoria`, `DocumentItem`
- No Zod — pure TypeScript interfaces extending `Record<string, unknown>`; optional chaining used throughout templates

---

## Translations

- `messages/{locale}.json` — 6 locales (IT, EN, FR, DE, ES, RU)
- Sections: common, nav, projects, products, filters, sort, listing, errors, pagination

**Missing translations:** `resistant` and `absent` (under `products`) exist only in IT and EN — missing from DE, FR, ES, RU.

**Hardcoded labels to migrate** (not yet in messages/\*.json):
- `"Maintenance and installation"` — ProdottoMosaico `SpecProductSpecs`
- `"Get inspired through catalogs"` — ProdottoMosaico `SpecProductResources`
- `"Scopri"` / `"catalogo"` — ProdottoMosaico download label
- Attribute labels in detail blocks (Sheet size, Chip size, Thickness, Shape, Finishing)

---

## Filter Registry

Path: `src/domain/filters/registry.ts`

Zero React/Next.js dependencies — 100% unit-testable.

### 6 product types — filter priority levels

| Product Type | P0 (Hub cards, path-based) | P1 (Sidebar, query-param) | P2 (Advanced) | Product card ratio |
|---|---|---|---|---|
| prodotto_mosaico | collection, color | shape, finish | grout | 1/1 |
| prodotto_vetrite | collection, color | finish, texture | — | 1/2 |
| prodotto_arredo | subcategory | finish, fabric | — | 3/2 |
| prodotto_tessuto | category | type, color, finish | — | 1/1 |
| prodotto_pixall | — | color, shape | grout | 1/1 |
| prodotto_illuminazione | subcategory | — | — | 1/1 |

**Priority semantics:**
- **P0** — hub category cards; single-select; path-based routing (e.g. `/mosaico/murano-smalto`)
- **P1** — sidebar checkboxes or dropdowns; multi-select; query-param (e.g. `?shape=hexagon&finish=polished`)
- **P2** — advanced panel; collapsed by default

**Key exports:**
- `FILTER_REGISTRY` — `Record<string, ProductTypeConfig>` — full config per product type
- `SLUG_OVERRIDES` — `Record<string, string>` — explicit slug-to-term-name mappings for accented characters, slashes, and capitalisation exceptions
- `deslugify(slug)` — converts URL slug to Drupal term name; NFC-normalised; falls back to title-case
- `getFilterConfig(contentType)` — returns `ProductTypeConfig | null`
- `translateBasePath(path, targetLocale)` — translates listing base path across locales
- `ListingConfig` — `categoryCardRatio`, `productCardRatio`, `categoryGroups`, `sortOptions`, `pageSize`

**nuqs integration:** `src/domain/filters/search-params.ts` — `parseAsString`, `parseAsArrayOf`; `FilterDefinition` type used by `ProductListingTemplate` for active filter state.

---

## Storybook

**Status: not actively maintained.** Decision pending on whether to dismiss or resume.

Framework: `@storybook/nextjs-vite`. Stories in `.storybook/stories/` organized by layer (primitives, composed, blocks, design-tokens).

---

## Design Tokens

Source: `src/styles/globals.css`

**Color space:** OkLch throughout.

| Token group | Tokens | Notes |
|---|---|---|
| Primary scale | `--color-primary-100` through `--color-primary-500` + `--color-primary` (base) | Used for brand accents |
| Primary text | `--color-primary-text` | Optimised for text on primary color; differs from primary base in dark mode |
| Surfaces | `--color-surface-1` through `--color-surface-5` | Chromatic elevation (replaces opacity hacks) |
| Container | `--container-main: var(--container-7xl)` | All blocks use `max-w-main` instead of `max-w-7xl` |
| Spacing — semantic | `--spacing-page`, `--spacing-section`, `--spacing-section-lg`, `--spacing-content`, `--spacing-element` | Responsive: 3 breakpoints (base / md 768px / lg 1024px) |
| Typography | `--underline-offset` | Consistent link underlines across components |
| Fonts | `--font-body` (Outfit), `--font-heading` (Geist), `--font-mono` (Geist Mono) | |

**Theme:** Light default; dark mode via `next-themes` (toggle in Header).

**Breakpoints:** base (mobile-first), `md` 768px, `lg` 1024px.

## Key Decisions

1. **No CSS Modules** in new UI — only Tailwind + semantic tokens
2. **No Zod for Drupal data** — pure TS interfaces, optional chaining in templates
3. **Product-level overrides collection** — e.g. `body = product.field_testo_main || collection.field_testo`
4. **Translations for all static text** — messages/*.json, future migration planned
5. **Static images** in `public/images/` (flat structure): `usa-mosaic-quality.jpg`, `Retinatura-mosaico-rete.jpg.webp`
6. **Deserializer preserves meta** — relationship meta (alt, width, height) flows through to templates
7. **Blocks import only Composed, never Primitives** — enforced by /ds skill
8. **Block naming convention** — `Spec*` = template-specific, `Gen*` = paragraph-driven transversal. Gen names derived mechanically from Drupal machine name: `blocco_{name}` → `Gen{PascalCase(name)}`
9. **Primary-text token** for text on primary color — different from primary base, optimized per theme
10. **Surface tokens** (1-5) for elevation instead of opacity hacks
11. **Document filtering** — installation guides extracted from catalogs, linked in Maintenance card

## Drupal Schema Reference

### Content Types

| Category | Bundles |
|----------|---------|
| Products (6) | `prodotto_mosaico`, `prodotto_vetrite`, `prodotto_arredo`, `prodotto_tessuto`, `prodotto_pixall`, `prodotto_illuminazione` |
| Content (8) | `page`, `landing_page`, `articolo`, `news`, `tutorial`, `progetto`, `ambiente`, `showroom` |
| Metadata (4) | `categoria`, `categoria_blog`, `documento`, `tag` |

### Taxonomy Vocabularies

| Product | Vocabularies |
|---------|-------------|
| Mosaico | `mosaico_collezioni`, `mosaico_colori` |
| Vetrite | `vetrite_collezioni`, `vetrite_colori`, `vetrite_finiture`, `vetrite_textures` |
| Arredo | `arredo_finiture` |
| Tessuto | `tessuto_colori`, `tessuto_finiture`, `tessuto_tipologie`, `tessuto_manutenzione` |

### Paragraph Types

`blocco_intro`, `blocco_quote`, `blocco_video`, `blocco_testo_immagine`, `blocco_testo_immagine_big`, `blocco_testo_immagine_blog`, `blocco_gallery`, `blocco_gallery_intro`, `blocco_documenti`, `blocco_correlati`, `blocco_newsletter`, `blocco_form_blog`, `blocco_slider_home`, `blocco_anni`, `blocco_tutorial`

## Current State

### Migration Status

| Status | Templates |
|--------|-----------|
| DS complete | ProdottoMosaico (5 Spec blocks), ProductListingTemplate (filters + grid) |
| Minimal DS | Page, LandingPage (ParagraphResolver only) |
| Hybrid | VetriteCollezione (legacy listing + Tailwind documents) |
| Legacy | ProdottoVetrite, ProdottoArredo, ProdottoTessuto, ProdottoPixall, ProdottoIlluminazione, Articolo, News, Tutorial, Showroom, Documento, Ambiente, Progetto, Categoria |

### Component Coverage

- **Gen blocks remaining to build**: GenCorrelati, GenNewsletter, GenFormBlog, GenSliderHome, GenAnni, GenTutorial
- **ParagraphResolver**: source of truth for Gen vs legacy wiring — check `LEGACY_MAP` in `src/components_legacy/blocks_legacy/ParagraphResolver.tsx`

### Layout

| Component | Status |
|-----------|--------|
| Navbar | Migrated — glassmorphism bar, 4 mega-menus, mobile overlay, scroll hide, language switcher |
| Footer | Legacy |

### Storybook

- Not actively maintained (see Storybook section above)

### Known Gaps

- 2 i18n keys missing from DE, FR, ES, RU: `resistant`, `absent`
- Several hardcoded labels not yet moved to `messages/*.json`
- Animations removed, to be reimplemented with proper approach

## Next Steps

### Immediate

1. Remaining Gen blocks (6): GenCorrelati → GenNewsletter → GenFormBlog → GenSliderHome → GenAnni → GenTutorial

### Backlog

- Product template DS migration: ProdottoVetrite → ProdottoArredo → ProdottoTessuto → ProdottoPixall → ProdottoIlluminazione
- Footer migration to design system
- Breadcrumb block (separate, above hero)
- Contact form (Dialog/Sheet for CTA actions)
- Alternative products carousel
- Regional logic (EU vs US: pricing, CTAs, stock)
- Translate hardcoded labels to `messages/*.json`
- Sync missing i18n keys (`resistant`, `absent`) to all 6 locales

## Agent Teams

This project uses `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`. Whenever ci sono task indipendenti (es. modificare più template, esplorare più directory, eseguire check paralleli), lancia agenti in background (`run_in_background: true`) in un singolo messaggio anziché lavorare sequenzialmente. Usa foreground solo quando il risultato serve prima di procedere.

## Restore Points

- Tag `pre-refactor-drupal-layer` — before data layer consolidation
