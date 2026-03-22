# CLAUDE.md — Sicis Next.js Frontend

## Project Overview
Decoupled Next.js 16 frontend for Sicis (luxury mosaic brand) backed by headless Drupal 10.
6 languages: IT (default), EN, FR, DE, ES, RU.

## Commands
- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build
- `npm run storybook` — Storybook dev (localhost:6006)
- `npx tsc --noEmit` — TypeScript check
- `npx vitest run` — Run tests

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

Server action wrapper: `src/lib/get-translated-path.ts` ('use server' for client components).

### Routing
- Catch-all `[locale]/[...slug]` resolves paths via Drupal decoupled_router
- `node-resolver.ts` maps bundle → component name + INCLUDE_MAP for JSON:API includes
- Templates in `src/templates/nodes/` and `src/templates/taxonomy/`

### Dev Preview Routes
- `src/app/dev/layout.tsx` — Dev-only layout with fonts + tokens + theme, no Header/Footer/i18n. Guarded by `NODE_ENV !== 'development'`.
- Convention: draft pages go in `src/app/dev/preview/[name]/page.tsx` (e.g. `gen-intro/page.tsx`). Each page has its own `NODE_ENV` guard.
- Used by /ds workflow Get-a-Draft. Delete the preview page after extracting the component.
- URL: `localhost:3000/dev/preview/[name]`

### INCLUDE_MAP
Critical: if a relationship field is not in the INCLUDE_MAP, Drupal returns only `{ type, id }` without data. All nested images (stucco, colori, forma, categoria) must be explicitly included.

Recent updates (2026-03-20 session):
- `prodotto_arredo` and `prodotto_illuminazione`: added `field_finiture.field_immagine`
- `mosaico_collezioni` and `vetrite_collezioni`: added `field_documenti` chain
- `blocco_documenti` added to PARAGRAPH_INCLUDE
- `showroom` and `documento`: do NOT have `field_blocchi` — Drupal returns 400 if included

### Domain Layer
- `src/lib/filters/` — `registry.ts` (FILTER_REGISTRY, 116 SLUG_OVERRIDES), `search-params.ts` (nuqs integration)
- `src/lib/routing/` — `routing-registry.ts` (shadow mode), `section-config.ts`

### Components — Design System (`/ds` skill)

#### Composed (`src/components/composed/`)
- `Typography` — Text roles (display, h1-h4, subtitle, body, overline, caption, etc.)
- `ResponsiveImage` — AspectRatio + img, configurable ratio
- `ProductCarousel` — Carousel with thumbnails navigation, supports image/video/static slides
- `ProductCta` — Request Sample + Get a Quote buttons
- `ProductPricingCard` — Card with price (Starting at), stock badge, shipping info
- `AttributeGrid` — Row of label/value pairs with vertical separators
- `SwatchList` — Color/grout swatches with image or CSS color fallback
- `SpecsTable` — Grid layout (4 cols) for technical specs with label + value
- `DocumentCard` — Catalog card with cover image, type overline, title, download link

#### Blocks (`src/components/blocks/`) — Naming Convention

Two prefixes distinguish block types:
- **`Spec*`** — Template-specific blocks. Tied to a specific template (e.g. product page, listing page). The name says WHERE it's used.
- **`Gen*`** — Generic/transversal blocks. Map 1:1 to Drupal paragraph types from `field_blocchi`. Can appear on any page. Name derived mechanically from Drupal machine name: `blocco_intro` → `GenIntro`, `blocco_video` → `GenVideo`.

**Spec blocks (template-specific):**
- `SpecProductHero` — Carousel + title + collection subtitle + description + CTAs + pricing card + discover link + sticky mobile CTA bar
- `SpecProductDetails` — Attribute row (dimensions, shape, finishing)
- `SpecProductSpecs` — Title + info cards (Assembly/Grouting/Maintenance) + technical sheet grid, on surface-1 background
- `SpecProductResources` — Catalog document cards grid
- `SpecProductGallery` — Image grid
- `SpecCategory` — Category card grid section
- `SpecListingHeader` — Listing page title + description
- `SpecProductListing` — Product grid with toolbar + load more
- `SpecFilterSidebar` — Desktop sidebar + mobile sheet for filters
- `SpecFilterSidebarContent` — Filter groups with active filters

**Gen blocks (paragraph-driven, to be built via /ds):**
Mapping from Drupal paragraph types → Gen component names:
- `blocco_intro` → `GenIntro` — title + body + optional image + optional link + layout variant
- `blocco_quote` → `GenQuote` — quote text + optional link
- `blocco_video` → `GenVideo` — video code + poster image
- `blocco_testo_immagine` → `GenTestoImmagine` — title + text + image + layout (text_dx/text_sx/text_up). text_dx/text_sx → portrait 2:3 with muted bands. text_up → landscape 3:2 with offset muted
- `blocco_testo_immagine_big` → `GenTestoImmagineBig` — title + text + large image + layout (text-up/text-down)
- `blocco_testo_immagine_blog` → `GenTestoImmagineBlog` — title + text + image + caption
- `blocco_gallery` → `GenGallery` — title + image slides (via elemento_blocco_gallery children)
- `blocco_gallery_intro` → `GenGalleryIntro` — title + text + link + image slides
- `blocco_documenti` → `GenDocumenti` — title + document nodes list
- `blocco_correlati` → `GenCorrelati` — related content items (via elemento_blocco_correlati children)
- `blocco_newsletter` → `GenNewsletter` — newsletter signup (0 instances in current data)
- `blocco_form_blog` → `GenFormBlog` — title (form block)
- `blocco_slider_home` → `GenSliderHome` — hero slider with video + CTA slides (via elemento_blocco_slider_home children)
- `blocco_anni` → `GenAnni` — timeline with year entries (via elemento_blocco_anni children)
- `blocco_tutorial` → `GenTutorial` — title + tutorial node references

Gen blocks are rendered via `ParagraphResolver` which maps `paragraph--{type}` → component. Templates append `field_blocchi` paragraphs after their Spec blocks.

#### Primitives (`src/components/ui/`)
57 shadcn/ui primitives (base-vega preset, base-ui). NEVER modify directly.

#### Legacy (`src/components_legacy/`)
18 root components (Header, Footer, MegaMenu, DrupalImage, LanguageSwitcher, etc.) + 15 paragraph blocks in `blocks_legacy/` — to be replaced progressively.

### Templates
- `src/templates/nodes/` — 18 node type templates (includes ProdottoIlluminazione)
- `src/templates/taxonomy/` — 5 taxonomy templates
- Templates receive `node` as `Record<string, unknown>`, cast to typed interface from `src/types/drupal/entities.ts`
- ProdottoMosaico fully migrated to design system blocks (no legacy imports)
- ProdottoVetrite, ProdottoArredo, ProdottoTessuto, ProdottoPixall, ProdottoIlluminazione: all legacy (DrupalImage + inline styles + product.module.css)
- VetriteCollezione: hybrid — legacy structure + documents section uses Tailwind + getTranslations

### Types
- `src/types/drupal/entities.ts` — Single file with EntityTypeName, base shapes, 6 product interfaces (including ProdottoIlluminazione), 11 taxonomy types, 18 node types, TermMosaicoCollezione, TermVetriteCollezione, NodeCategoria, DocumentItem
- No Zod schemas — pure TypeScript interfaces extending `Record<string, unknown>`

### Translations
- `messages/{locale}.json` — 163 total keys across 6 sections (common, nav, products, filters, errors, pagination)
- 2 keys (`resistant`, `absent`) exist only in IT — not yet translated to other locales
- Some labels still hardcoded (to be migrated): "Maintenance and installation", "Get inspired through catalogs", "Scopri", "catalogo" (on ProdottoMosaico), attribute labels

### Filter Registry
- `src/lib/filters/registry.ts` — covers 6 product types: prodotto_mosaico, prodotto_vetrite, prodotto_arredo, prodotto_tessuto, prodotto_pixall, prodotto_illuminazione
- prodotto_illuminazione registered with subcategory filter
- 116 SLUG_OVERRIDES for term slug normalization

### Storybook
- `.storybook/stories/primitives/` — 57 primitive stories
- `.storybook/stories/composed/` — 21 composed stories (all Composed components covered)
- `.storybook/stories/blocks/` — 10 block stories (all Spec blocks covered)
- `.storybook/stories/design-tokens/` — 3 stories (Colors, Spacing, Typography catalog)
- Total: 91 stories across all directories
- `.storybook/drafts/` — Empty (drafts deleted after extraction)
- Story rules: single `Playground` story per component with `argTypes` controls, import from `@storybook/nextjs-vite`, `satisfies Meta` pattern
- `nextjs.appDirectory: true` + `nextjs.navigation` configured globally in `preview.ts` for App Router mock

### Design Tokens (`src/styles/globals.css`)
- OkLch color space
- **Colors**: primary scale (100, 200, base, 400, 500) + primary-text (optimized for readability in both themes)
- **Surfaces**: surface-1 through surface-5 for chromatic elevation
- **Spacing**: responsive semantic tokens `--spacing-page`, `--spacing-section`, `--spacing-section-lg`, `--spacing-content`, `--spacing-element` (scale on 3 breakpoints)
- **Typography**: `--underline-offset` for consistent link underlines
- **Fonts**: Outfit (body), Geist (heading), Geist Mono (code)
- **Breakpoints**: base (mobile), md (768px), lg (1024px)
- **Theme**: light default, dark mode via next-themes (toggle in header)

## Key Decisions
1. **No CSS Modules** in new UI — only Tailwind + semantic tokens
2. **No Zod for Drupal data** — pure TS interfaces, optional chaining in templates
3. **Product-level overrides collection** — e.g. `body = product.field_testo_main || collection.field_testo`
4. **Translations for all static text** — messages/*.json, future migration planned
5. **Static images** in `public/images/` (flat structure): `usa-mosaic-quality.jpg`, `Retinatura-mosaico-rete.jpg.webp`
6. **Deserializer preserves meta** — relationship meta (alt, width, height) flows through to templates
7. **Blocks import only Composed, never Primitives** — enforced by /ds skill
11. **Block naming convention** — `Spec*` = template-specific, `Gen*` = paragraph-driven transversal. Gen names derived mechanically from Drupal machine name: `blocco_{name}` → `Gen{PascalCase(name)}`
8. **Primary-text token** for text on primary color — different from primary base, optimized per theme
9. **Surface tokens** (1-5) for elevation instead of opacity hacks
10. **Document filtering** — installation guides extracted from catalogs, linked in Maintenance card

## Current State
- **ProdottoMosaico**: fully migrated to design system (5 Spec blocks, 9 composed, no legacy)
- **Other 5 product templates** (Vetrite, Arredo, Tessuto, Pixall, Illuminazione): all legacy — next to migrate
- **VetriteCollezione**: hybrid (legacy + Tailwind documents section)
- **Header/Footer**: legacy, managed separately from product templates
- **Animations**: removed for now, to be reimplemented with proper approach
- **Storybook**: all Composed and Spec blocks have stories, rules enforced (single Playground, controls, @storybook/nextjs-vite)
- **Block naming**: Spec*/Gen* convention in place. All 10 Spec blocks renamed.
- **Gen blocks built**: GenIntro, GenQuote, GenVideo (VimeoPlayer composed), GenTestoImmagine (portrait/landscape adaptive with muted bands), GenGallery (temporary grid layout — carousel WIP)
- **Gen blocks remaining**: GenTestoImmagineBig, GenTestoImmagineBlog, GenGalleryIntro, GenDocumenti, GenCorrelati, GenNewsletter, GenFormBlog, GenSliderHome, GenAnni, GenTutorial
- **New Composed components**: ArrowLink (inline link + arrow), VimeoPlayer (Vimeo SDK + custom controls + poster click-to-play), GalleryCarousel (temporary grid — needs Apple-style scroll-snap carousel), GenTestoImmagineBody (text block with title + body + link)
- **ParagraphResolver**: async, uses fetchParagraph for secondary fetches. GenIntro, GenQuote, GenVideo, GenTestoImmagine, GenGallery wired with adapters. Rest still legacy.
- **Templates updated**: Page, News, Ambiente — removed legacy containers, added flex/gap spacing + ParagraphResolver

## Next Steps — Immediate
1. **GenGallery carousel**: implement Apple-style CSS scroll-snap carousel (reference: apple.com/iphone-17-pro photo gallery). Key: scroll-container full-width with `overflow-x: scroll` + `scrollbar-width: none` + `scroll-snap-type: x mandatory` + `scroll-padding: gutter`. Inner track with `padding: 0 gutter` + `min-width: fit-content`. Slides snap to container edge. Last slide: `scroll-snap-align: start end`. No Embla — pure CSS scroll-snap with JS only for arrow buttons.
2. Continue remaining Gen blocks: GenTestoImmagineBig → GenTestoImmagineBlog → GenGalleryIntro → GenDocumenti → GenCorrelati → GenNewsletter → GenFormBlog → GenSliderHome → GenAnni → GenTutorial

## Next Steps — After Gen Blocks
- Apply ProdottoMosaico pattern to ProdottoVetrite template
- Then: ProdottoArredo, ProdottoTessuto, ProdottoPixall, ProdottoIlluminazione
- Breadcrumb block (separate, above hero)
- Contact form (Dialog/Sheet for CTA actions)
- Alternative products carousel
- Regional logic (EU vs US: pricing, CTAs, stock)
- Translate hardcoded labels to messages/*.json (including "Get inspired through catalogs", "Scopri", "catalogo")
- Sync missing translation keys (`resistant`, `absent`) to all 6 locales

## Agent Teams
This project uses `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`. Whenever ci sono task indipendenti (es. modificare più template, esplorare più directory, eseguire check paralleli), lancia agenti in background (`run_in_background: true`) in un singolo messaggio anziché lavorare sequenzialmente. Usa foreground solo quando il risultato serve prima di procedere.

## Restore Points
- Tag `pre-refactor-drupal-layer` — before data layer consolidation
