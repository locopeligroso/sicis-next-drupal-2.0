# AGENTS.md — SICIS Next.js Frontend

Next.js 16 (App Router, Turbopack) + Drupal 10 headless via JSON:API.
TypeScript strict, Tailwind CSS v4 (oklch tokens), next-intl v4 (6 locales: it/en/fr/de/es/ru).
shadcn/ui + Radix primitives. Storybook 10 with Vitest + Playwright.

---

## Commands

```bash
npm run dev          # dev server (Turbopack) — usually port 3001 if 3000 is taken
npm run build        # production build
npm run lint         # ESLint via next lint
npm run type-check   # tsc --noEmit (strict)

# Tests (Vitest + happy-dom + Playwright browser)
npx vitest                          # run all tests
npx vitest run                      # run once (CI mode)
npx vitest src/lib/drupal/deserializer.test.ts  # single file
npx vitest --reporter=verbose       # verbose output
npx vitest --coverage               # coverage report (v8)

# Storybook
npm run storybook          # launch on port 6006
npm run build-storybook    # static build
```

Test files live at `src/**/*.test.ts` — no `.test.tsx` yet.
Storybook stories live at `.storybook/stories/**/*.stories.tsx`.

---

## Architecture

```
src/
├── app/[locale]/               # Next.js App Router — one dir per route
│   ├── layout.tsx              # i18n + menu provider (fetches main+footer menus)
│   ├── page.tsx                # Homepage resolver via decoupled_router
│   ├── [...slug]/page.tsx      # Catch-all: translatePath() → entity → template (~1200 lines)
│   ├── progetti/page.tsx       # Dedicated listing (bypasses catch-all)
│   ├── projects/page.tsx       # EN alias → re-exports from progetti
│   ├── projets/page.tsx        # FR alias
│   ├── projekte/page.tsx       # DE alias
│   ├── proyectos/page.tsx      # ES alias
│   ├── проекты/page.tsx        # RU alias (Cyrillic filename)
│   ├── not-found.tsx           # 404 handler
│   └── error.tsx               # Error boundary (client)
├── app/api/revalidate/route.ts # ISR on-demand revalidation endpoint
│
├── components/                 # Design System
│   ├── ui/                     # 57 shadcn/ui primitives (button, card, dialog, etc.)
│   ├── composed/               # 9 composed components (see below)
│   ├── blocks/                 # 5 product page blocks (see below)
│   └── theme-provider.tsx      # next-themes with keyboard 'd' toggle
├── components_legacy/          # Legacy components (Header, Footer, DrupalImage…)
│   └── blocks_legacy/          # 15 legacy paragraph blocks + ParagraphResolver
│
├── config/
│   ├── env.ts                  # Zod-validated env vars (DRUPAL_BASE_URL, REVALIDATE_SECRET)
│   └── isr.ts                  # ISR revalidation time constants
│
├── domain/
│   ├── filters/
│   │   ├── registry.ts         # FILTER_REGISTRY (6 product types, 116 slug overrides)
│   │   └── search-params.ts    # URL filter parsing (nuqs + JSON:API filter builder)
│   └── routing/
│       ├── section-config.ts   # Path → { productType, filterField? } mapping
│       └── routing-registry.ts # Menu-derived hub detection (shadow mode)
│
├── hooks/
│   └── use-mobile.ts           # Mobile breakpoint detection
│
├── lib/
│   ├── drupal/                 # Consolidated Drupal data layer (see below)
│   ├── node-resolver.ts        # INCLUDE_MAP, component mapping, ISR times
│   ├── field-helpers.ts        # getTextValue(), getProcessedText(), getBoolValue()
│   ├── product-helpers.ts      # COLOR_MAP, getColorSwatch(), formatRetinatura()
│   ├── sanitize.ts             # HTML sanitization (sanitize-html)
│   ├── get-translated-path.ts  # Server Action wrapper for cross-locale path resolution
│   └── utils.ts                # cn() — clsx + tailwind-merge
│
├── styles/globals.css          # Tailwind v4 + oklch design tokens + responsive spacing
│
├── templates/
│   ├── nodes/                  # 18 node templates (one per Drupal bundle)
│   └── taxonomy/               # 5 taxonomy templates
│
└── types/drupal/
    └── entities.ts             # All Drupal entity interfaces (18 node types + taxonomy)
```

---

## Drupal Data Layer (`src/lib/drupal/`)

Consolidated module replacing the old `src/api/` directory. Single entry point: `import { ... } from '@/lib/drupal'`.

### Module Map

| Module | Exports | Purpose |
|--------|---------|---------|
| `config.ts` | `DRUPAL_BASE_URL`, `DRUPAL_ORIGIN` | Env-based connection params |
| `types.ts` | `JsonApiResource`, `TranslatePathResponse`, `DrupalResource`, `FetchJsonApiOptions` | JSON:API type definitions |
| `deserializer.ts` | `buildIncludedMap()`, `deserializeResource()` | Flatten JSON:API → plain objects, resolve relationships, preserve meta (image alt/title) |
| `core.ts` | `translatePath()`, `fetchJsonApiResource()`, `getResourceByPath()` | High-level fetch functions with ISR caching |
| `image.ts` | `getDrupalImageUrl()` | Extract URL from file--file relationships |
| `menu.ts` | `fetchMenu()`, `transformMenuToNavItems()` | Navigation menu fetch + locale transform |
| `paragraphs.ts` | `PARAGRAPH_INCLUDE`, `needsSecondaryFetch()`, `fetchParagraph()` | Nested paragraph relationship resolution |
| `products.ts` | `fetchProducts()`, `ProductCard`, `getCategoriaProductType()`, `slugToTermName()` | Product listing with filtering + pagination |
| `filters.ts` | `fetchFilterOptions()`, `fetchArredoCategoryOptions()`, `fetchAllFilterOptions()` | Filter dropdown population from taxonomy |
| `projects.ts` | `fetchProjects()`, `ProgettoCard` | Project listing |
| `blog.ts` | `fetchBlogPosts()` | Blog post listing |
| `documents.ts` | `fetchDocuments()` | Document listing |
| `showrooms.ts` | `fetchShowrooms()` | Showroom listing |
| `environments.ts` | `fetchEnvironments()` | Environment/ambiente listing |
| `pages-by-category.ts` | `fetchPagesByCategory()` | Pages filtered by category term |
| `subcategories.ts` | `fetchSubcategories()` | Subcategory term listing |
| `translated-path.ts` | `getTranslatedPath()` | Cross-locale path resolution (entity UUID → target locale alias) |
| `index.ts` | *(barrel)* | Re-exports all public APIs |

### Data Flow

```
translatePath(path, locale)          → TranslatePathResponse | null
  ↓ (extracts jsonapi.individual URL)
fetchJsonApiResource(url, options)   → DrupalResource | null
  ↓ (uses deserializeResource)
getResourceByPath(path, options)     → DrupalResource | null  (convenience wrapper)
```

### Fetch Pattern

Always use functions from `@/lib/drupal` — never raw `fetch()` for Drupal calls.

```typescript
import { translatePath, fetchJsonApiResource } from '@/lib/drupal';
import { getIncludeFields } from '@/lib/node-resolver';

const resolved = await translatePath(slug, locale);
if (!resolved) return notFound();

const resource = await fetchJsonApiResource(resolved.jsonapi.individual, {
  include: getIncludeFields(bundle),
  revalidate: 60,
});
```

### Error Handling

- **404** → returns `null` (not error) — caller decides fallback
- **HTTP errors** → logged with `[module]` prefix, returns null or empty result
- **Network errors** → wrapped with context tag
- **Missing includes** → dev warning for unmapped bundles
- **Circular references** → stub `{ type, id }` at depth > 5 in deserializer

---

## INCLUDE_MAP (`src/lib/node-resolver.ts`)

Every node bundle with relationships **must** have an entry.

### Products (NO field_blocchi — products don't have paragraphs)

| Bundle | Includes |
|--------|----------|
| `prodotto_mosaico` | `field_immagine`, `field_collezione` (+ nested: `field_collezione.field_documenti.field_allegato`, `field_collezione.field_documenti.field_immagine`), `field_colori`, `field_forme`, `field_finiture`, `field_stucco` |
| `prodotto_vetrite` | `field_immagine`, `field_collezione`, `field_colori`, `field_finiture`, `field_texture` |
| `prodotto_arredo` | `field_immagine`, `field_categorie`, `field_finiture`, `field_finiture.field_immagine`, `field_tessuti` |
| `prodotto_tessuto` | `field_immagine`, `field_colori`, `field_categorie`, `field_finiture`, `field_manutenzione` |
| `prodotto_pixall` | `field_immagine`, `field_colori`, `field_forme`, `field_stucco` |
| `prodotto_illuminazione` | `field_immagine`, `field_categorie`, `field_finiture`, `field_finiture.field_immagine` |
| `progetto` | `field_immagine` only |

### Editorial (with paragraphs)

- `page`, `landing_page`, `articolo`, `news`, `tutorial`, `ambiente`, `tag`, `categoria_blog`: `field_immagine,field_blocchi,field_blocchi.field_immagine`
- `showroom`: `field_immagine,field_gallery` (no `field_blocchi`)
- `documento`: `field_immagine,field_allegato` (no `field_blocchi`)

### Taxonomy

| Vocabulary | Includes |
|-----------|----------|
| `mosaico_collezioni` | `field_immagine`, `field_documenti.field_allegato`, `field_documenti.field_immagine` |
| `mosaico_colori` | `field_immagine` |
| `vetrite_collezioni` | `field_immagine`, `field_documenti.field_allegato`, `field_documenti.field_immagine` |
| `vetrite_colori` | `field_immagine` |

**Before adding a new include field, verify it exists on Drupal:**
```bash
curl -s "https://www.sicis-stage.com/it/jsonapi/node/{bundle}/{uuid}" \
  -H "Accept: application/vnd.api+json" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(list(d['data']['relationships'].keys()))"
```
A wrong include returns HTTP 400 → page shows 404.

### PARAGRAPH_INCLUDE (`src/lib/drupal/paragraphs.ts`)

| Paragraph Type | Secondary Include Fields |
|----------------|--------------------------|
| `blocco_gallery` | `field_slide.field_immagine` |
| `blocco_gallery_intro` | `field_slide.field_immagine` |
| `blocco_slider_home` | `field_elementi.field_immagine` |
| `blocco_correlati` | `field_elementi.field_immagine` |
| `blocco_documenti` | `field_documenti.field_allegato,field_documenti.field_immagine` |

---

## ISR Revalidation Strategy

| Content Type | Time | Rationale |
|-------------|------|-----------|
| Products | 60s | Price/stock changes frequently |
| Product counts | 3600s | Totals change less often |
| Editorial (articolo, news, tutorial) | 300s | Content updates moderately |
| Static pages | 600s | Rarely changes |
| Taxonomy terms | 3600s | Very stable |
| Menus | 600s | Moderate changes |
| Filter options | 3600s | Taxonomy-based, stable |
| translatePath | 3600s | Path aliases rarely change |
| Projects listing | 300s | Moderate frequency |

Source of truth: `src/config/isr.ts` + per-function defaults in `src/lib/drupal/`.

---

## Components Architecture

### Design System — Composed Components (`src/components/composed/`)

| Component | Props | Purpose |
|-----------|-------|---------|
| `Typography` | `textRole`, `as?`, `className?` | 15 text roles (display, h1–h4, subtitle, body, lead, overline, blockquote, caption, inline-code) |
| `ResponsiveImage` | `src`, `alt`, `ratio?` | Image with aspect ratio container |
| `ProductCarousel` | `slides[]` (image/video/static) | Carousel with thumbnail navigation, video indicators |
| `ProductCta` | `hasSample?`, callbacks | CTA buttons (Request Sample + Get Quote) |
| `ProductPricingCard` | `price?`, `inStock?`, `shippingWarehouse?` | Pricing and availability card |
| `AttributeGrid` | `items[]` (label/value) | Key-value grid for attributes |
| `SwatchList` | `items[]` (name, imageSrc?, cssColor?) | Color/grout swatches |
| `SpecsTable` | `rows[]` (label/value) | Technical specs grid |
| `DocumentCard` | `item` (title, type?, href?) | Document/resource download card |

### Design System — Page Blocks (`src/components/blocks/`)

| Block | Purpose | Consumes |
|-------|---------|----------|
| `ProductHero` | Hero section: carousel + pricing + sticky mobile CTA | Product node (title, description, slides, pricing, collection) |
| `ProductGallery` | Multi-column image grid (2→3→4 cols responsive) | Image array |
| `ProductDetails` | Attributes, colors, grouts sections | Product attributes + taxonomy refs |
| `ProductSpecs` | Specs table + assembly/grouting/maintenance cards | Collection specs + product fields |
| `ProductResources` | Document download grid | Document collection |

### Legacy Components (`src/components_legacy/`) — 18 root-level components

| Component | Type | Notes |
|-----------|------|-------|
| `Header` | client | Sticky + mega-menu + dark mode toggle |
| `Footer` | server | Multi-column layout, locale switcher |
| `MegaMenu` | client | Column layout, max 8 links per column |
| `LanguageSwitcher` | client | Cross-locale path translation |
| `ProductListing` | server | Product grid + pagination |
| `FilterSidebar` | client | Responsive filters (desktop sticky / mobile drawer) |
| `DrupalImage` | server | Generic Drupal image field renderer |
| `Documents` | server | Document list with thumbnails |
| `Specs` | server | Key-value specs with HTML sanitization |
| `ColorSwatches` | server | Circular color swatches |
| `UnknownEntity` | server | Fallback for unmapped entity types |

### Legacy Paragraph Blocks (`src/components_legacy/blocks_legacy/`)

Resolved dynamically by `ParagraphResolver.tsx` which maps 15 `paragraph--blocco_*` types.
Async components (require secondary fetch): `BloccoSliderHome`, `BloccoGallery`, `BloccoGalleryIntro`, `BloccoCorrelati`.

| Block | Drupal Fields | Purpose |
|-------|---------------|---------|
| `BloccoIntro` | `field_titolo_formattato`, `field_testo` | Centered intro section |
| `BloccoQuote` | `field_testo` | Blockquote with left border |
| `BloccoTestoImmagine` | `field_titolo_formattato`, `field_testo`, `field_immagine`, `field_layout_blocco_testo_img` | Text + image side-by-side (swappable layout) |
| `BloccoTestoImmagineBig` | Same as above | Larger layout variant |
| `BloccoTestoImmagineBlog` | Same as above | Blog-optimized variant |
| `BloccoGallery` | `field_slide.field_immagine` | Image grid gallery (async — needs secondary fetch) |
| `BloccoGalleryIntro` | `field_slide.field_immagine` | Gallery with intro text (async — needs secondary fetch) |
| `BloccoSliderHome` | `field_elementi.field_immagine` | Auto-playing hero carousel, 5s interval (async — needs secondary fetch) |
| `BloccoVideo` | `field_codice_video`, `field_immagine` | Vimeo embed with thumbnail |
| `BloccoCorrelati` | `field_elementi.field_immagine` | Related items grid (async — needs secondary fetch) |
| `BloccoDocumenti` | `field_documenti` | Document list section |
| `BloccoAnni` | — | Timeline/chronological block |
| `BloccoTutorial` | — | Tutorial/steps block |
| `BloccoNewsletter` | `field_titolo_formattato` | Email signup form |
| `BloccoFormBlog` | — | Blog contact form |

---

## Templates

### Node Templates (`src/templates/nodes/`) — 18 total

| Template | Bundle | Components Used | Status |
|----------|--------|----------------|--------|
| `ProdottoMosaico` | `node--prodotto_mosaico` | ProductHero, ProductDetails, ProductSpecs, ProductResources, ProductGallery | **Design System** |
| `ProdottoArredo` | `node--prodotto_arredo` | DrupalImage, product.module.css, inline styles | Legacy |
| `ProdottoVetrite` | `node--prodotto_vetrite` | DrupalImage, product.module.css, inline styles | Legacy |
| `ProdottoTessuto` | `node--prodotto_tessuto` | DrupalImage, product.module.css, inline styles | Legacy |
| `ProdottoPixall` | `node--prodotto_pixall` | DrupalImage, product.module.css, inline styles | Legacy |
| `ProdottoIlluminazione` | `node--prodotto_illuminazione` | DrupalImage, product.module.css, inline styles | Legacy |
| `Page` | `node--page` | ParagraphResolver (legacy) | Legacy |
| `LandingPage` | `node--landing_page` | Delegates to Page | Legacy |
| `Articolo` | `node--articolo` | DrupalImage + ParagraphResolver | Legacy |
| `News` | `node--news` | DrupalImage + ParagraphResolver | Legacy |
| `Tutorial` | `node--tutorial` | DrupalImage + ParagraphResolver | Legacy |
| `Progetto` | `node--progetto` | DrupalImage + ParagraphResolver | Legacy |
| `Showroom` | `node--showroom` | DrupalImage + ParagraphResolver | Legacy |
| `Ambiente` | `node--ambiente` | DrupalImage + ParagraphResolver | Legacy |
| `Documento` | `node--documento` | DrupalImage + ParagraphResolver | Legacy |
| `Tag` | `node--tag` | DrupalImage + ParagraphResolver | Legacy |
| `Categoria` | `node--categoria` | Auto-detects product type → ProductListing | Legacy |
| `CategoriaBlog` | `node--categoria_blog` | DrupalImage + ParagraphResolver | Legacy |

### Taxonomy Templates (`src/templates/taxonomy/`) — 5 total

| Template | Vocabulary | Purpose | Status |
|----------|-----------|---------|--------|
| `MosaicoCollezione` | `mosaico_collezioni` | FilterSidebar + ProductListing (collection filter) | Legacy |
| `MosaicoColore` | `mosaico_colori` | FilterSidebar + ProductListing (color filter) | Legacy |
| `VetriteCollezione` | `vetrite_collezioni` | Legacy listing + Tailwind documents section + getTranslations | Hybrid |
| `VetriteColore` | `vetrite_colori` | FilterSidebar + ProductListing (color filter) | Legacy |
| `TaxonomyTerm` | *(fallback)* | Generic unmapped taxonomy handler | Legacy |

---

## Routing

### Catch-All (`[...slug]/page.tsx`)

Three resolution paths (in order):

1. **Listing slug bypass** — `LISTING_SLUG_OVERRIDES` + `getRoutingRegistry()` detect product listing hubs
2. **Drupal entity resolution** — `translatePath()` → `fetchJsonApiResource()` → template via `COMPONENT_MAP`
3. **Fallback to listing** — `getSectionConfigAsync()` tries to match as product section

**Subcategory interception**: `node--categoria` with `filterField` renders as filtered product listing instead of generic category page.

### Registry-First Routing (`routing-registry.ts`)

Fetches all 6 locale menus in parallel, builds `RoutingRegistry`:
- `listingSlugs: Set<string>` — all hub slugs across locales
- `slugToProductType: Map<string, string>` — slug → Drupal bundle
- `subcategoryMap` — tessuto category filters

**Hardcoded anchors** (cannot come from Drupal):
```
mosaico → prodotto_mosaico
lastre-vetro-vetrite → prodotto_vetrite
arredo → prodotto_arredo
prodotti-tessili → prodotto_tessuto
pixall → prodotto_pixall
```

### Localized Aliases

Create a `page.tsx` per locale slug that re-exports the canonical page.
Always declare `export const revalidate = N` locally — Next.js cannot statically analyze re-exported route config.

### `section-config.ts`

Maps URL slug arrays to `{ productType, filterField?, filterValue?, filterOperator? }`.
Special cases:
- Tessuto distinguishes hub from subcategories (Arazzi/Coperte/Tappeti/Cuscini)
- NeoColibri collections use `STARTS_WITH` operator (has subcollections)

---

## Filter System (`src/domain/filters/`)

### FILTER_REGISTRY (6 product types)

| Product | Filters | P0 (path) | P1 (query) | P2 (query) |
|---------|---------|-----------|------------|------------|
| `prodotto_mosaico` | 5 | collection, color | shape, finish | grout |
| `prodotto_vetrite` | 4 | collection, color | finish, texture | — |
| `prodotto_arredo` | 3 | subcategory | finish, fabric | — |
| `prodotto_tessuto` | 4 | category | type, color, finish | — |
| `prodotto_pixall` | 3 | — | color, shape, grout | — |
| `prodotto_illuminazione` | 2 | subcategory | finish | — |

- **P0 filters** appear in URL path segments
- **P1/P2 filters** appear as query parameters
- Priority affects UI: P0/P1 expanded, P2 collapsed

### 116 Slug Overrides

`SLUG_OVERRIDES` in `registry.ts` handles accented characters, special formatting:
- `colibri` → `Colibrì`, `neocolibri` → `NeoColibrì`
- `murano-smalto` → `Murano Smalto`
- `opus-vermiculatum` → `Opus Vermiculatum`

---

## Types (`src/types/drupal/entities.ts`)

Single file defining all Drupal entity interfaces.

### Node Types (18)

`NodeTypeName`: `page`, `landing_page`, `prodotto_mosaico`, `prodotto_arredo`, `prodotto_pixall`, `prodotto_tessuto`, `prodotto_vetrite`, `prodotto_illuminazione`, `articolo`, `news`, `tutorial`, `progetto`, `showroom`, `ambiente`, `categoria`, `categoria_blog`, `documento`, `tag`

### Taxonomy Vocabularies (11 mapped)

`TaxonomyTypeName`: `mosaico_collezioni`, `mosaico_colori`, `vetrite_collezioni`, `vetrite_colori`, `vetrite_finiture`, `vetrite_textures`, `arredo_finiture`, `tessuto_colori`, `tessuto_finiture`, `tessuto_tipologie`, `tessuto_manutenzione`

### Product Interfaces (6)

`NodeProdottoMosaico`, `NodeProdottoVetrite`, `NodeProdottoArredo`, `NodeProdottoTessuto`, `NodeProdottoPixall`, `NodeProdottoIlluminazione`

### Supporting Interfaces

- `DrupalEntity` — base with id, type, langcode, status, title, path
- `DrupalTextField` — value + processed HTML
- `DrupalPath` — alias, pid, langcode
- `DrupalLinkField` — uri, title
- `DocumentItem` — file, typology, link, image metadata
- `NodeCategoria` — categoria node with product type detection fields
- `TermMosaicoCollezione` — mosaico collection term with field_documenti
- `TermVetriteCollezione` — vetrite collection term with field_documenti

---

## TypeScript

- **strict: true** — no implicit any, no loose nulls
- **Path alias**: `@/` → `src/`
- Prefer `import type` for type-only imports
- Entity interfaces in `src/types/drupal/entities.ts` — no Zod schemas for product types (removed in refactor)
- `Record<string, unknown>` for untyped Drupal node props in legacy templates
- Avoid `as any` — use `as unknown as T` with a comment if unavoidable

---

## Code Style

- **Formatting**: 2 spaces, single quotes, no Prettier config
- **Imports order**: external libs → `@/` aliases → relative paths
- **Named exports** preferred (except Next.js page/layout files)
- **`React.cache()`** on all server-side fetchers callable from both `generateMetadata` and page component
- **No `console.log`** in production — use `console.error` / `console.warn` with `[module]` prefix
- **JSDoc** on all exported functions in `src/lib/`, `src/domain/`

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `fetch-projects.ts` |
| React components | PascalCase | `ProductHero` |
| Hooks | camelCase + `use` prefix | `useMobile` |
| Constants | SCREAMING_SNAKE | `DRUPAL_BASE_URL`, `INCLUDE_MAP` |
| Drupal field names | snake_case (as-is from API) | `field_titolo_main` |
| CSS custom properties | kebab-case | `--spacing-page` |

---

## Testing

- **Vitest** with `happy-dom` environment (unit) + Playwright/Chromium (Storybook)
- Mock `global.fetch` with `vi.fn()` — never make real HTTP calls in tests
- Test files co-located: `src/lib/drupal/deserializer.test.ts`
- Pattern: `describe('functionName') > it('does X given Y')`
- Key test file: `src/lib/drupal/deserializer.test.ts` (320 lines, relationship resolution, meta preservation)

---

## Storybook

- **87 stories** across primitives, composed, blocks, and design tokens
- Framework: `@storybook/nextjs-vite`
- Stories in `.storybook/stories/` (NOT co-located with components)
- Addons: Vitest, A11y (todo mode), Docs, Themes (light/dark), Chromatic
- Design token stories: colors, spacing, typography (oklch visualization)

---

## Environment Variables

| Variable | Used in | Purpose |
|----------|---------|---------|
| `DRUPAL_BASE_URL` | server-side only | Drupal origin for SSR fetches |
| `NEXT_PUBLIC_DRUPAL_BASE_URL` | client + server | Public origin for image URLs |
| `REVALIDATE_SECRET` | `/api/revalidate` | ISR on-demand revalidation (min 8 chars) |

Validated by Zod in `src/config/env.ts`. Copy `.env.local.example` → `.env.local`.

---

## Security (next.config.mjs)

- **CSP**: default-src 'self', img-src allows staging/prod, frame-ancestors 'none'
- **Headers**: X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff
- **Permissions-Policy**: camera/microphone/geolocation disabled
- **Image domains**: localhost, `www.sicis-stage.com`, `sicis.com` (HTTP + HTTPS)
- **HTML sanitization**: `sanitize-html` in `src/lib/sanitize.ts` — allows img, iframe (YouTube/Vimeo only), figure, video

---

## Design Tokens (`src/styles/globals.css`)

- **Color space**: oklch via CSS custom properties
- **Responsive spacing** (3 breakpoints):
  - `--spacing-page`: 1.5rem → 1.75rem → 2rem
  - `--spacing-section`: 3rem → 3.5rem → 4rem
  - `--spacing-element`: 1rem → 1.25rem → 1.5rem
- **Radius system**: base 0.625rem with multipliers (sm 0.6x → 4xl 2.6x)
- **Dark mode**: `&:is(.dark *)` variant, inverted oklch values
- **Chart colors**: 5 distinct oklch values for data visualization

---

## Content Reference

Full Drupal content map: `docs/DRUPAL_CONTENT_MAP.md`
- 18 node types, 16 taxonomy vocabularies, 19 paragraph types
- Menu slugs for all 6 locales with UUID cross-reference
- Gap analysis: unused fields, missing routes, known anomalies

Additional references:
- `DRUPAL_NODE_TYPES.md` / `DRUPAL_NODE_TYPES.json` — all 18 content types mapped
- `DRUPAL_JSONAPI_MAP.md` — all ~100 JSON:API endpoints
- `JSONAPI_QUICK_REFERENCE.md` — curl examples and query patterns
- `docs/DRUPAL_FIELD_INVENTORY.md` — field-level inventory for 7 priority node types
