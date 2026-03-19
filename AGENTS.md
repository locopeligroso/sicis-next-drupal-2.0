# AGENTS.md — SICIS Next.js Frontend

Next.js 16 (App Router, Turbopack) + Drupal 11 headless via JSON:API.
TypeScript strict, Tailwind CSS v4, next-intl (6 locales: it/en/fr/de/es/ru).

---

## Commands

```bash
npm run dev          # dev server (Turbopack) — usually port 3001 if 3000 is taken
npm run build        # production build
npm run lint         # ESLint via next lint
npm run type-check   # tsc --noEmit (no emit, strict)

# Tests (Vitest + happy-dom)
npx vitest                          # run all tests
npx vitest run                      # run once (CI mode)
npx vitest src/domain/routing/section-config.test.ts   # single file
npx vitest --reporter=verbose       # verbose output
npx vitest --coverage               # coverage report (v8)
```

Test files live at `src/**/*.test.ts` — no `.test.tsx` yet.

---

## Architecture

```
src/
├── app/[locale]/           # Next.js App Router — one dir per route
│   ├── [...slug]/page.tsx  # catch-all: resolves Drupal paths via translatePath()
│   ├── progetti/page.tsx   # dedicated listing (bypasses catch-all)
│   └── [locale]/*/page.tsx # localized aliases (projects, projets, projekte…)
├── api/
│   ├── client.ts           # drupalFetch<T>() — single fetch wrapper
│   ├── jsonapi/            # buildQuery(), deserialize()
│   └── resources/          # fetchProduct() per product type
├── components/             # new shadcn/ui components
├── components_legacy/      # legacy components (DrupalImage, ParagraphResolver…)
├── config/                 # drupal.ts, env.ts, isr.ts
├── domain/
│   ├── filters/            # FILTER_REGISTRY, parseFiltersFromUrl()
│   └── routing/            # section-config.ts, routing-registry.ts
├── lib/                    # server-side helpers (fetch-products, fetch-projects…)
├── templates/
│   ├── nodes/              # one component per Drupal node type
│   └── taxonomy/           # one component per taxonomy type
└── types/drupal/           # Zod schemas + TypeScript interfaces
```

---

## Drupal Integration Rules

### INCLUDE_MAP (`src/lib/node-resolver.ts`)
Every node bundle that has relationship fields **must** have an entry in `INCLUDE_MAP`.
- Products: no `field_blocchi` (they don't have paragraphs)
- Editorial content: `field_immagine,field_blocchi,field_blocchi.field_immagine`
- `progetto`: `field_immagine` only (no `field_gallery`, no `field_blocchi` on sicis-stage)

Before adding a new include field, **verify it exists** on the Drupal instance:
```bash
curl -s "https://www.sicis-stage.com/it/jsonapi/node/{bundle}/{uuid}" \
  -H "Accept: application/vnd.api+json" | python3 -c "
import json,sys; d=json.load(sys.stdin)
print(list(d['data']['relationships'].keys()))"
```
A wrong include returns HTTP 400 → node page shows 404.

### PARAGRAPH_INCLUDE (`src/lib/fetch-paragraph.ts`)
Only paragraph types with **nested relationships** (images inside slides/elements)
need an entry. Types without nested includes return as-is (no secondary fetch).

### ISR Revalidation (`src/config/isr.ts`, `src/lib/node-resolver.ts`)
- Products: 60 s
- Editorial (articolo, news, tutorial): 300 s
- Static pages: 600 s
- Taxonomy terms: 3600 s

### Fetch pattern
Always use `drupalFetch<T>()` from `src/api/client.ts` — never raw `fetch()` for
Drupal calls. It handles timeout (10 s), ISR cache tags, and typed error results.

```typescript
const result = await drupalFetch<MyType>('/it/jsonapi/node/page', {
  next: { revalidate: 600, tags: ['page'] },
});
if (!result.ok) return; // result.error.code: 'NOT_FOUND' | 'TIMEOUT' | …
const data = result.data; // typed
```

---

## TypeScript

- **strict: true** — no implicit any, no loose nulls
- Path alias: `@/` → `src/`
- Prefer `import type` for type-only imports
- Use Zod schemas for all Drupal API responses (`src/types/drupal/`)
- `ApiResult<T>` discriminated union — never throw from fetch functions:
  ```typescript
  type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }
  ```
- Avoid `as any` — use `as unknown as T` with a comment if unavoidable
- `Record<string, unknown>` for untyped Drupal node props in legacy templates

---

## Code Style

- **Formatting**: no Prettier config — follow existing indentation (2 spaces, single quotes)
- **Imports order**: external libs → `@/` aliases → relative paths
- **Named exports** preferred over default exports (except Next.js page/layout files)
- **`React.cache()`** on all server-side fetchers that may be called from both
  `generateMetadata` and the page component
- **No `console.log`** in production paths — use `console.error` / `console.warn`
  with a `[module]` prefix: `console.error('[fetchProjects] Error:', err)`
- **JSDoc** on all exported functions in `src/lib/`, `src/api/`, `src/domain/`
  (see `node-resolver.ts` for the expected format)

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `fetch-projects.ts` |
| React components | PascalCase | `ProgettoCard` |
| Hooks | camelCase + `use` prefix | `useFilterState` |
| Zod schemas | PascalCase + `Schema` suffix | `ProgettoCardSchema` |
| Inferred types | PascalCase (from schema) | `type ProgettoCard = z.infer<…>` |
| Constants | SCREAMING_SNAKE | `DRUPAL_BASE_URL`, `INCLUDE_MAP` |
| Drupal field names | snake_case (as-is from API) | `field_titolo_main` |

---

## Routing Rules

- **`[...slug]/page.tsx`** is the catch-all. It calls `translatePath()` → Drupal
  decoupled router → fetches the node → renders the matching template.
- **Dedicated pages** (e.g. `progetti/page.tsx`) take priority over the catch-all.
  Add the slug to `LISTING_SLUG_OVERRIDES` only if Drupal has a colliding node alias.
- **Localized aliases**: create a `page.tsx` per locale slug that re-exports the
  canonical page. Always declare `export const revalidate = N` locally — Next.js
  cannot statically analyze re-exported route segment config.
- **`section-config.ts`**: maps URL slug arrays to `{ productType, filterField? }`.
  Add new product listing sections here, not in the catch-all.

---

## Testing

- Framework: **Vitest** with `happy-dom` environment
- Mock `global.fetch` with `vi.fn()` — never make real HTTP calls in tests
- Test files co-located with source: `src/domain/routing/section-config.test.ts`
- Pattern: `describe('functionName') > it('does X given Y')`
- Assert on `result.ok` before accessing `result.data` (discriminated union)

---

## Environment Variables

| Variable | Used in | Purpose |
|----------|---------|---------|
| `DRUPAL_BASE_URL` | server-side only | Drupal origin for SSR fetches |
| `NEXT_PUBLIC_DRUPAL_BASE_URL` | client + server | Public origin for image URLs |
| `REVALIDATE_SECRET` | `/api/revalidate` | ISR on-demand revalidation |

Copy `.env.local.example` → `.env.local` before running locally.

---

## Content Reference

Full Drupal content map: `docs/DRUPAL_CONTENT_MAP.md`
- 17 node types, 16 taxonomy vocabularies, 19 paragraph types
- Menu slugs for all 6 locales with UUID cross-reference
- Gap analysis: unused fields, missing routes, known anomalies
