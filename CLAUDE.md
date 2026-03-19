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
- `translated-path.ts` — getTranslatedPath
- `index.ts` — barrel re-export (import from `@/lib/drupal`)

Server action wrapper: `src/lib/get-translated-path.ts` ('use server' for client components).

### Routing
- Catch-all `[locale]/[...slug]` resolves paths via Drupal decoupled_router
- `node-resolver.ts` maps bundle → component name + INCLUDE_MAP for JSON:API includes
- Templates in `src/templates/nodes/` and `src/templates/taxonomy/`

### INCLUDE_MAP
Critical: if a relationship field is not in the INCLUDE_MAP, Drupal returns only `{ type, id }` without data. All nested images (stucco, colori, forma, categoria) must be explicitly included.

### Components
- `src/components/ui/` — 57 shadcn/ui primitives (base-vega preset, base-ui)
- `src/components/composed/` — Typography only (for now)
- `src/components/blocks/` — Empty (to be built)
- `src/components_legacy/` — Active legacy components (Header, Footer, MegaMenu, DrupalImage, paragraphs)

### Templates
- `src/templates/nodes/` — 17 node type templates
- `src/templates/taxonomy/` — 5 taxonomy templates
- Templates receive `node` as `Record<string, unknown>`, cast to typed interface from `src/types/drupal/entities.ts`

### Types
- `src/types/drupal/entities.ts` — Single file with EntityTypeName, base shapes, all 5 product interfaces + TermMosaicoCollezione, TermVetriteCollezione, NodeCategoria, DocumentItem
- No Zod schemas — pure TypeScript interfaces extending `Record<string, unknown>`

### Translations
- `messages/{locale}.json` — All static frontend text via next-intl
- Organized by section: common, nav, products, filters, errors, pagination
- Technical spec labels include ISO/EN/DIN norm references from sicis.com
- Key `slipResistanceGrip` contains the long Sicis Grip NA Plus text

### Storybook
- `.storybook/stories/primitives/` — All 55 primitive stories
- `.storybook/stories/composed/` — Typography
- `.storybook/stories/design-tokens/` — Colors, Spacing, Typography catalog

### Design Tokens (`src/styles/globals.css`)
- OkLch color space
- Responsive spacing: `--spacing-page`, `--spacing-section`, `--spacing-content`, `--spacing-element`
- Fonts: Outfit (body), Geist (heading), Geist Mono (code)
- 3 structural breakpoints: base (mobile), md (768px), lg (1024px)

## Key Decisions
1. **No CSS Modules** in new UI — only Tailwind + semantic tokens
2. **No Zod for Drupal data** — pure TS interfaces, optional chaining in templates
3. **Product-level overrides collection** — e.g. `body = product.field_testo_main || collection.field_testo`
4. **Translations for all static text** — messages/*.json, future migration planned
5. **Static images** in `public/images/` (flat structure)
6. **Deserializer preserves meta** — relationship meta (alt, width, height) flows through to templates

## Current State (ProdottoMosaico template)
- All Drupal fields rendered (product + collection)
- Technical specs in single table with ISO norms
- Colors with Drupal images (fallback to CSS swatch)
- Stucchi with swatch images
- Category label + collection subtitle in hero
- Video player, sample image, pricing (EU + USA)
- Yellow reference table at bottom listing hardcoded content still to integrate (CTA buttons, forms, breadcrumb, alternative products carousel, regional logic)

## Next Steps
- Build Composed components extracted from ProdottoMosaico patterns
- Apply same completeness approach to other 4 product templates
- Create Blocks for reusable page sections
- Replace legacy components progressively

## Restore Points
- Tag `pre-refactor-drupal-layer` — before data layer consolidation
