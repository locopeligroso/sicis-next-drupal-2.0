# CLAUDE.md — Sicis Next.js Frontend

> **Source of truth:** The code is always the source of truth. This document may be outdated — when in doubt, read the code. For Drupal data (fields, entities, menus, paragraphs), the only real source is what Drupal returns via REST endpoints — never assume field presence or structure from this doc alone, always verify against the actual API response.

> **⚠️ Cambiamenti recenti (2026-03-30):** Refactoring completo del data layer. Factory listing fetcher (`product-listing-factory.ts`) consolida 6 fetcher prodotto. `renderProductListing` estratto in modulo dedicato. 4 taxonomy templates eliminati (unreachable). 6 content listing endpoint integrati (articles, news, tutorials separati da blog). Sidebar filtri riattivata per mosaico/vetrite via hub endpoints. Arredo hub: sezioni Indoor/Outdoor/Next Art/Discover Also. Showroom detail via `showroom/{nid}`. `getPageData()` crea entità minimale quando `content/{nid}` è vuoto. Content listing slugs intercettati prima di `LISTING_SLUG_OVERRIDES`. 184 test data layer.
>
> **📋 Prossimo lavoro:** I template prodotto **vetrite** (`ProdottoVetrite`) e **tessuto** (`ProdottoTessuto`) usano ancora il rendering legacy (DrupalImage, CSS modules, inline styles). Devono essere migrati ai blocchi DS (Spec\*) come è già stato fatto per mosaico (`MosaicProductPreview`). I dati normalizzati dai fetcher `vetrite-product`/`textile-product` sono già pronti — serve solo costruire i template DS e rimuovere gli adapter legacy (`vetriteToLegacyNode`, `textileToLegacyNode`).

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

> Full details in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

- **Data layer:** All data from Drupal REST endpoints via `apiGet()`. Primary path: `resolvePath` → `content/{nid}` + `blocks/{nid}`. Product detail: `mosaic-product`, `vetrite-product`, `textile-product`, `pixall-product`, `illuminazione-product`, `arredo-product`, `showroom` (singular). Product listings: factory in `product-listing-factory.ts` (6 types). Content listings: `articles`, `news`, `tutorials`, `projects`, `environments`, `showrooms` (all return raw arrays). Filter options: `filter-options.ts` uses hub endpoints (`mosaic-colors/collections`, `vetrite-colors/collections`, `categories/{nid}`). `renderProductListing` extracted to `src/lib/render-product-listing.tsx`.
- **Routing:** 5-stage pipeline in `[...slug]/page.tsx` — PRODUCTS_MASTER_SLUGS → CONTENT_LISTING_SLUGS → LISTING_SLUG_OVERRIDES → resolve-path product/showroom/taxonomy detail → multi-slug filter interception → entity fallback.
- **Revalidation:** 3 ISR tiers — 60s (products), 300s (editorial), 3600s (taxonomy/menu).
- **Domain layer:** `src/domain/filters/` (FILTER_REGISTRY, 6 product types, P0/P1/P2 filter priorities) + `src/domain/routing/` (section-config, routing-registry shadow mode).
- **Server actions:** `loadMoreProducts` (Load More button), `getTranslatedPath` (cross-locale in client components).

## Components — Design System

> Full details in [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)

- **Blocks:** 12 `Spec*` (product/listing-specific) + 12 `Gen*` (paragraph-driven). 6 Gen blocks remaining: GenCorrelati, GenNewsletter, GenFormBlog, GenSliderHome, GenAnni, GenTutorial.
- **Composed:** 42 components in `src/components/composed/`. Key: Typography, ProductCard, CategoryCard, GalleryCarousel, DocumentCard, MediaElement.
- **Primitives:** 57 shadcn/ui (base-vega preset). NEVER modify directly. Blocks import only Composed, never Primitives.
- **ParagraphResolver:** Async server component dispatching `paragraph--{type}` to Gen* or legacy Blocco*. Source of truth for migration status.

## Templates — Migration Matrix

> Full details in [`docs/TEMPLATES_MIGRATION.md`](docs/TEMPLATES_MIGRATION.md)

- **DS complete:** ProdottoMosaico (5 Spec\* blocks), ProductListingTemplate, ProductsMasterPage.
- **Legacy:** ProdottoVetrite, Arredo, Tessuto, Pixall, Illuminazione + all editorial templates (DrupalImage + product.module.css).
- **All templates receive** `node: Record<string, unknown>`, cast to typed interfaces from `src/types/drupal/entities.ts`.
- **Taxonomy templates:** 4 specialized (Mosaico/Vetrite Collezione/Colore) + 1 generic fallback (TaxonomyTerm wireframe).

## Types

- `src/types/drupal/entities.ts` — Single source of truth for all entity shapes
- `NodeTypeName` — union of all node types (page, landing*page, prodotto*\*, articolo, news, tutorial, progetto, showroom, ambiente, categoria, categoria_blog, documento, tag)
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

| Product Type           | P0 (Hub cards, path-based) | P1 (Sidebar, query-param) | P2 (Advanced) | Category card ratio | Product card ratio |
| ---------------------- | -------------------------- | ------------------------- | ------------- | ------------------- | ------------------ |
| prodotto_mosaico       | collection, color          | shape, finish             | grout         | 1/1                 | 1/1                |
| prodotto_vetrite       | collection, color          | finish, texture           | —             | 1/1                 | 1/2                |
| prodotto_arredo        | subcategory                | finish, fabric            | —             | 4/3                 | 1/1                |
| prodotto_tessuto       | category                   | type, color, finish       | —             | 4/3                 | 1/1                |
| prodotto_pixall        | —                          | color, shape              | grout         | 1/1                 | 1/1                |
| prodotto_illuminazione | subcategory                | —                         | —             | 4/3                 | 1/1                |

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

| Token group        | Tokens                                                                                                  | Notes                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Primary scale      | `--color-primary-100` through `--color-primary-500` + `--color-primary` (base)                          | Used for brand accents                                                      |
| Primary text       | `--color-primary-text`                                                                                  | Optimised for text on primary color; differs from primary base in dark mode |
| Surfaces           | `--color-surface-1` through `--color-surface-5`                                                         | Chromatic elevation (replaces opacity hacks)                                |
| Container          | `--container-main: var(--container-7xl)`                                                                | All blocks use `max-w-main` instead of `max-w-7xl`                          |
| Spacing — semantic | `--spacing-page`, `--spacing-section`, `--spacing-section-lg`, `--spacing-content`, `--spacing-element` | Responsive: 3 breakpoints (base / md 768px / lg 1024px)                     |
| Typography         | `--underline-offset`                                                                                    | Consistent link underlines across components                                |
| Fonts              | `--font-body` (Outfit), `--font-heading` (Geist), `--font-mono` (Geist Mono)                            |                                                                             |

**Theme:** Light default; dark mode via `next-themes` (toggle in Header).

**Breakpoints:** base (mobile-first), `md` 768px, `lg` 1024px.

## Key Decisions

1. **No CSS Modules** in new UI — only Tailwind + semantic tokens
2. **No Zod for Drupal data** — pure TS interfaces, optional chaining in templates
3. **Product-level overrides collection** — e.g. `body = product.field_testo_main || collection.field_testo`
4. **Translations for all static text** — messages/\*.json, future migration planned
5. **Static images** in `public/images/` (flat structure): `usa-mosaic-quality.jpg`, `Retinatura-mosaico-rete.jpg.webp`
6. **content+blocks split** — `content/{nid}` returns entity fields; `blocks/{nid}` returns paragraph blocks with recursive image normalization (4:3 default dimensions). C1 entity endpoint kept as fallback only.
7. **Blocks import only Composed, never Primitives** — enforced by /ds skill
8. **Block naming convention** — `Spec*` = template-specific, `Gen*` = paragraph-driven transversal. Gen names derived mechanically from Drupal machine name: `blocco_{name}` → `Gen{PascalCase(name)}`
9. **Primary-text token** for text on primary color — different from primary base, optimized per theme
10. **Surface tokens** (1-5) for elevation instead of opacity hacks
11. **Document filtering** — installation guides extracted from catalogs, linked in Maintenance card
12. **`next/image` for content images > 100px** — All DS composed components use `<Image>` from `next/image` with `fill` + `sizes` for Drupal content images. Exceptions: logos, CSS swatches, decorative thumbnails < 80px, video posters, legacy templates. See `CHANGELOG.md` for migration details.

## Changelog

Project changelog is maintained in `CHANGELOG.md` at the repo root, organized by date with per-feature detail.

## Data Layer Architecture — Uniformity Analysis

> Full details in [`docs/DATA_LAYER_ANALYSIS.md`](docs/DATA_LAYER_ANALYSIS.md)

- **Uniform core:** All fetchers use `apiGet()`, same error handling (404→null), `React.cache()` + ISR, typed responses.
- **5 heterogeneous problems:** image URL access (4 patterns), price field polymorphism (string vs {value}), link field polymorphism, chaotic secondary fetches, entity normalization delegated to templates.
- **Key gotchas:** Showroom/Documento have NO `field_blocchi` (Drupal returns 400). Field cardinality anomalies require defensive `Array.isArray()` checks.

## Drupal Schema Reference

### Content Types

| Category     | Bundles                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Products (6) | `prodotto_mosaico`, `prodotto_vetrite`, `prodotto_arredo`, `prodotto_tessuto`, `prodotto_pixall`, `prodotto_illuminazione` |
| Content (8)  | `page`, `landing_page`, `articolo`, `news`, `tutorial`, `progetto`, `ambiente`, `showroom`                                 |
| Metadata (4) | `categoria`, `categoria_blog`, `documento`, `tag`                                                                          |

### Taxonomy Vocabularies

| Product | Vocabularies                                                                      |
| ------- | --------------------------------------------------------------------------------- |
| Mosaico | `mosaico_collezioni`, `mosaico_colori`                                            |
| Vetrite | `vetrite_collezioni`, `vetrite_colori`, `vetrite_finiture`, `vetrite_textures`    |
| Arredo  | `arredo_finiture`                                                                 |
| Tessuto | `tessuto_colori`, `tessuto_finiture`, `tessuto_tipologie`, `tessuto_manutenzione` |

### Paragraph Types

`blocco_intro`, `blocco_quote`, `blocco_video`, `blocco_testo_immagine`, `blocco_testo_immagine_big`, `blocco_testo_immagine_blog`, `blocco_gallery`, `blocco_gallery_intro`, `blocco_documenti`, `blocco_a`, `blocco_b`, `blocco_c`, `blocco_correlati`, `blocco_newsletter`, `blocco_form_blog`, `blocco_slider_home`, `blocco_anni`, `blocco_tutorial`

## Current State

### Migration Status

| Status      | Templates                                                                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DS complete | ProdottoMosaico (5 Spec blocks), ProductListingTemplate (filters + grid)                                                                                              |
| Minimal DS  | Page, LandingPage (ParagraphResolver only)                                                                                                                            |
| Hybrid      | VetriteCollezione (legacy listing + Tailwind documents)                                                                                                               |
| Legacy      | ProdottoVetrite, ProdottoArredo, ProdottoTessuto, ProdottoPixall, ProdottoIlluminazione, Articolo, News, Tutorial, Showroom, Documento, Ambiente, Progetto, Categoria |

### Component Coverage

- **Gen blocks built**: 12 (GenIntro, GenQuote, GenVideo, GenTestoImmagine, GenTestoImmagineBig, GenTestoImmagineBlog, GenGallery, GenGalleryIntro, GenDocumenti, GenA, GenB, GenC)
- **Gen blocks remaining to build**: GenCorrelati, GenNewsletter, GenFormBlog, GenSliderHome, GenAnni, GenTutorial
- **ParagraphResolver**: source of truth for Gen vs legacy wiring — check `LEGACY_MAP` in `src/components_legacy/blocks_legacy/ParagraphResolver.tsx`

### Layout

| Component | Status                                                                                     |
| --------- | ------------------------------------------------------------------------------------------ |
| Navbar    | Migrated — glassmorphism bar, 4 mega-menus, mobile overlay, scroll hide, language switcher |
| Footer    | Legacy                                                                                     |

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
