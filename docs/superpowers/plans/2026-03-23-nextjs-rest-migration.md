# Next.js REST Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the JSON:API data layer (`src/lib/drupal/`) with a new REST data layer (`src/lib/api/`) consuming the Views REST + Custom REST endpoints created on Drupal.

**Architecture:** New `src/lib/api/` coexists with old `src/lib/drupal/` during migration. Each task switches one set of endpoints, tests, and commits. After all switches, old files are deleted.

**Tech Stack:** Next.js 16, React 19, TypeScript, React.cache()

**Spec:** `docs/superpowers/specs/2026-03-23-rest-migration-design.md`

**Prerequisite:** Drupal endpoints (V1-V11, C1, C2) must be deployed and accessible before starting.

---

### Task 1: Base Client + Types

**Files:**
- Create: `src/lib/api/client.ts`
- Create: `src/lib/api/types.ts`
- Create: `src/lib/api/index.ts`

- [ ] **Step 1: Create `src/lib/api/types.ts`**

```typescript
// Response wrapper for paginated listings
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// === V1: Products ===
export interface ProductCard {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  price: string | null;
  priceOnDemand: boolean;
  path: string | null;
}

// === V2: Filter Counts ===
export interface CountsResponse {
  counts: Record<string, number>;
}

// === V3/V4: Filter Options ===
export interface FilterOption {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  weight: number;
}

// === V5: Blog ===
export interface BlogCard {
  id: string;
  type: 'articolo' | 'news' | 'tutorial';
  title: string;
  imageUrl: string | null;
  path: string | null;
  created: string;
}

// === V6: Projects ===
export interface ProjectCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  category: string | null;
}

// === V7: Environments ===
export interface EnvironmentCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
}

// === V8: Showrooms ===
export interface ShowroomCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  gmapsUrl: string | null;
  externalUrl: string | null;
}

// === V9: Documents ===
export interface DocumentCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  fileUrl: string | null;
  externalUrl: string | null;
  documentType: string | null;
  category: string | null;
}

// === V10: Subcategories ===
export interface CategoryCard {
  id: string;
  uuid: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
}

// === V11: Pages by Category ===
export interface PageCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
}

// === C1: Entity ===
export interface EntityResponse {
  meta: {
    type: 'node' | 'taxonomy_term';
    bundle: string;
    id: number;
    uuid: string;
    locale: string;
    path: string;
  };
  data: Record<string, unknown>;
}

// === C2: Translate Path ===
export interface TranslatePathResponse {
  translatedPath: string | null;
}
```

- [ ] **Step 2: Create `src/lib/api/client.ts`**

```typescript
import { DRUPAL_BASE_URL } from '@/lib/drupal/config';

const API_BASE = `${DRUPAL_BASE_URL}/api/v1`;

export async function apiGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  revalidate: number = 300,
): Promise<T | null> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      console.error(`API error: ${res.status} ${res.statusText} for ${url.pathname}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`API fetch failed for ${url.pathname}:`, error);
    return null;
  }
}
```

- [ ] **Step 3: Create `src/lib/api/index.ts`**

```typescript
export * from './types';
export { apiGet } from './client';
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors related to new files.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/
git commit -m "feat: add REST API base client and type definitions"
```

---

### Task 2: V7 + V8 — Environments + Showrooms

The simplest endpoints. Establish the pattern for all listing migrations.

**Files:**
- Create: `src/lib/api/listings.ts`
- Modify: `src/app/[locale]/[...slug]/page.tsx` (switch imports)
- Modify: `src/components_legacy/EnvironmentListing.tsx` (if it imports from drupal/)
- Modify: `src/components_legacy/ShowroomListing.tsx` (if it imports from drupal/)

- [ ] **Step 1: Create `src/lib/api/listings.ts`**

```typescript
import { cache } from 'react';
import { apiGet } from './client';
import type {
  PaginatedResponse,
  EnvironmentCard,
  ShowroomCard,
} from './types';

// V7: Environments
export const fetchEnvironments = cache(
  async (locale: string, pageSize = 24, page = 0) =>
    apiGet<PaginatedResponse<EnvironmentCard>>(
      '/environments',
      { locale, page, pageSize },
      300,
    ),
);

// V8: Showrooms
export const fetchShowrooms = cache(
  async (locale: string) =>
    apiGet<{ items: ShowroomCard[] }>(
      '/showrooms',
      { locale },
      300,
    ),
);
```

- [ ] **Step 2: Update imports in catch-all route**

In `src/app/[locale]/[...slug]/page.tsx`, find where `fetchEnvironments` and `fetchShowrooms` are imported from `@/lib/drupal` and change to import from `@/lib/api/listings`.

Adapt the call sites to use the new response shape (`result.items` and `result.total` instead of the old destructured shape).

**ShowroomCard field renames:** The new type uses `gmapsUrl` (was `mapsUrl` in old code) and adds `externalUrl` (new field). Update any consuming component (`ShowroomListing.tsx`, `Showroom.tsx`) that references `mapsUrl` to use `gmapsUrl`.

- [ ] **Step 3: Verify pages render**

Start dev server (`npm run dev`) and navigate to:
- An environments listing page
- A showrooms listing page

Verify data loads correctly.

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/listings.ts src/app/[locale]/[...slug]/page.tsx
git commit -m "feat: switch environments and showrooms to REST API (V7, V8)"
```

---

### Task 3: V5 + V6 + V9 — Blog, Projects, Documents

**Files:**
- Modify: `src/lib/api/listings.ts` (add blog, projects, documents)
- Modify: `src/app/[locale]/[...slug]/page.tsx` (switch imports)

- [ ] **Step 1: Add to `src/lib/api/listings.ts`**

```typescript
import type {
  // ... existing imports
  BlogCard,
  ProjectCard,
  DocumentCard,
} from './types';

// V5: Blog (unified)
export const fetchBlogPosts = cache(
  async (locale: string, pageSize = 24, page = 0, type?: string) =>
    apiGet<PaginatedResponse<BlogCard>>(
      '/blog',
      { locale, page, pageSize, type },
      300,
    ),
);

// V6: Projects
export const fetchProjects = cache(
  async (locale: string, pageSize = 24, page = 0) =>
    apiGet<PaginatedResponse<ProjectCard>>(
      '/projects',
      { locale, page, pageSize },
      300,
    ),
);

// V9: Documents
export const fetchDocuments = cache(
  async (locale: string, type?: string) =>
    apiGet<{ items: DocumentCard[] }>(
      '/documents',
      { locale, type },
      300,
    ),
);
```

- [ ] **Step 2: Switch imports in catch-all route**

Replace imports of `fetchBlogPosts`, `fetchProjects`, `fetchDocuments` from `@/lib/drupal` with `@/lib/api/listings`.

Adapt call sites to new response shape.

- [ ] **Step 3: Verify pages render**

Navigate to blog, projects, and documents listing pages.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/listings.ts src/app/[locale]/[...slug]/page.tsx
git commit -m "feat: switch blog, projects, documents to REST API (V5, V6, V9)"
```

---

### Task 4: V3 + V4 — Filter Options

**Files:**
- Create: `src/lib/api/filters.ts`
- Modify: `src/app/[locale]/[...slug]/page.tsx`
- Modify: taxonomy templates that call `fetchAllFilterOptions` or `fetchFilterOptions`

- [ ] **Step 1: Create `src/lib/api/filters.ts`**

```typescript
import { cache } from 'react';
import { apiGet } from './client';
import type { FilterOption } from './types';

// V3: Taxonomy filter options
export const fetchFilterOptions = cache(
  async (vocabulary: string, locale: string, includeImage = false) =>
    apiGet<{ items: FilterOption[] }>(
      `/taxonomy/${vocabulary}`,
      { locale, include_image: includeImage },
      3600,
    ),
);

// V4: Category options (node-based, for arredo/illuminazione)
export const fetchCategoryOptions = cache(
  async (productType: string, locale: string) =>
    apiGet<{ items: FilterOption[] }>(
      `/category-options/${productType}`,
      { locale },
      3600,
    ),
);

// Combined: fetch all filter options for a product type
// IMPORTANT: Read src/domain/filters/registry.ts to understand the actual
// FilterGroupConfig shape. The FILTER_REGISTRY maps product types to configs
// where filters is a Record<string, FilterGroupConfig>. Each FilterGroupConfig
// has taxonomyType (for taxonomy-based filters) or nodeType (for node-based
// like arredo categories). Adapt this function to match the actual structure.
export async function fetchAllFilterOptions(
  productType: string,
  locale: string,
): Promise<Record<string, FilterOption[]>> {
  const { getFilterConfig } = await import('@/domain/filters/registry');
  const config = getFilterConfig(productType);
  if (!config) return {};

  const promises: Promise<[string, FilterOption[]]>[] = [];

  for (const [key, filterGroup] of Object.entries(config.filters)) {
    if (filterGroup.taxonomyType) {
      promises.push(
        fetchFilterOptions(filterGroup.taxonomyType, locale)
          .then((res) => [key, res?.items ?? []] as [string, FilterOption[]]),
      );
    } else if (filterGroup.nodeType) {
      promises.push(
        fetchCategoryOptions(productType, locale)
          .then((res) => [key, res?.items ?? []] as [string, FilterOption[]]),
      );
    }
  }

  const results = await Promise.all(promises);
  return Object.fromEntries(results);
}
```

**Note:** The exact property names (`taxonomyType`, `nodeType`, etc.) depend on the actual `FilterGroupConfig` interface in `src/domain/filters/registry.ts`. Read that file and adapt if the property names differ.

- [ ] **Step 2: Switch imports in catch-all route and taxonomy templates**

Replace `fetchFilterOptions`, `fetchArredoCategoryOptions`, `fetchAllFilterOptions` imports.

Files to check:
- `src/app/[locale]/[...slug]/page.tsx`
- `src/templates/taxonomy/MosaicoCollezione.tsx`
- `src/templates/taxonomy/MosaicoColore.tsx`
- `src/templates/taxonomy/VetriteCollezione.tsx`
- `src/templates/taxonomy/VetriteColore.tsx`

- [ ] **Step 3: Verify filter sidebars render**

Navigate to a product listing page with filters. Verify sidebar shows filter options.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/filters.ts src/app/ src/templates/
git commit -m "feat: switch filter options to REST API (V3, V4)"
```

---

### Task 5: V1 + V2 — Products + Filter Counts

**Files:**
- Create: `src/lib/api/products.ts`
- Modify: `src/app/[locale]/[...slug]/page.tsx`
- Modify: `src/lib/actions/load-more-products.ts`
- Modify: `src/templates/nodes/Categoria.tsx`
- Modify: taxonomy templates

- [ ] **Step 1: Create `src/lib/api/products.ts`**

```typescript
import { cache } from 'react';
import { apiGet } from './client';
import type { PaginatedResponse, ProductCard, CountsResponse } from './types';

interface FetchProductsOpts {
  locale: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  filters?: Record<string, string>;
}

// V1: Product listing
export const fetchProducts = cache(
  async (productType: string, opts: FetchProductsOpts) =>
    apiGet<PaginatedResponse<ProductCard>>(
      `/products/${productType}`,
      {
        locale: opts.locale,
        page: opts.page ?? 0,
        pageSize: opts.pageSize ?? 48,
        sort: opts.sort,
        ...opts.filters,
      },
      60,
    ),
);

// V2: Filter counts
export const fetchFilterCounts = cache(
  async (
    productType: string,
    field: string,
    locale: string,
    activeFilters?: Record<string, string>,
  ) =>
    apiGet<CountsResponse>(
      `/products/${productType}/counts/${field}`,
      { locale, ...activeFilters },
      60,
    ),
);
```

**Note:** Migrate `getCategoriaProductType()` from `src/lib/drupal/products.ts` to this file. It's a pure function with no API dependency.

- [ ] **Step 2: Switch imports everywhere**

Files to update:
- `src/app/[locale]/[...slug]/page.tsx` — main listing render
- `src/lib/actions/load-more-products.ts` — server action
- `src/templates/nodes/Categoria.tsx` — category template
- All taxonomy templates that call `fetchProducts`

- [ ] **Step 3: Re-enable filter counts in grid mode**

In `src/app/[locale]/[...slug]/page.tsx`, find the TODO comment about disabled filter counts (around line 323). Remove the comment and enable the V2 calls using the new `fetchFilterCounts`.

- [ ] **Step 4: Verify product listings render**

Test:
- Hub mode (category cards with counts)
- Grid mode (product grid with filter sidebar)
- "Load More" button
- Sort switching

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/products.ts src/app/ src/lib/actions/ src/templates/
git commit -m "feat: switch products and filter counts to REST API (V1, V2)"
```

---

### Task 6: V10 + V11 — Subcategories + Pages by Category

**Files:**
- Create: `src/lib/api/categories.ts`
- Modify: `src/templates/nodes/Categoria.tsx`

- [ ] **Step 1: Create `src/lib/api/categories.ts`**

```typescript
import { cache } from 'react';
import { apiGet } from './client';
import type { CategoryCard, PageCard } from './types';

// V10: Subcategories
export const fetchSubcategories = cache(
  async (parentUuid: string, locale: string) =>
    apiGet<{ items: CategoryCard[] }>(
      `/subcategories/${parentUuid}`,
      { locale },
      300,
    ),
);

// V11: Pages by category
export const fetchPagesByCategory = cache(
  async (categoryUuid: string, locale: string) =>
    apiGet<{ items: PageCard[] }>(
      `/pages-by-category/${categoryUuid}`,
      { locale },
      300,
    ),
);
```

- [ ] **Step 2: Switch imports in Categoria template**

- [ ] **Step 3: Verify categoria pages render**

Test all three branches of the Categoria template:
- Product listing branch
- Subcategories branch
- Pages by category branch

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/categories.ts src/templates/nodes/Categoria.tsx
git commit -m "feat: switch subcategories and pages-by-category to REST API (V10, V11)"
```

---

### Task 7: C1 — Entity Endpoint (Main Switch)

This is the biggest change. Replaces `translatePath` + `fetchJsonApiResource` + `fetchParagraph` with a single call.

**Files:**
- Create: `src/lib/api/entity.ts`
- Modify: `src/app/[locale]/[...slug]/page.tsx` (major refactor of data fetching)
- Modify: `src/app/[locale]/page.tsx` (homepage)

- [ ] **Step 1: Create `src/lib/api/entity.ts`**

```typescript
import { cache } from 'react';
import { apiGet } from './client';
import { getRevalidateTime } from '@/lib/node-resolver';
import type { EntityResponse } from './types';

// C1: Fetch entity by path
export const fetchEntity = cache(
  async (path: string, locale: string): Promise<EntityResponse | null> => {
    const result = await apiGet<EntityResponse>(
      '/entity',
      { path, locale },
      60, // Use minimum TTL; actual caching handled by Drupal
    );

    if (!result) return null;

    // Optionally adjust revalidation based on bundle type
    // This is handled at the fetch level already via Next.js ISR
    return result;
  },
);
```

- [ ] **Step 2: Refactor catch-all route data fetching**

In `src/app/[locale]/[...slug]/page.tsx`:

Replace the `getPageData` function that calls `translatePath` + `fetchJsonApiResource` with `fetchEntity`. The key change:

**Before:**
```typescript
const { type, data } = await getPageData(locale, drupalPath);
// type comes from translatePath response
// data comes from fetchJsonApiResource + deserializer
```

**After:**
```typescript
const entity = await fetchEntity(drupalPath, locale);
if (!entity) { /* try listing fallback or notFound() */ }
const type = `${entity.meta.type}--${entity.meta.bundle}`;
const data = entity.data;
```

The rest of the routing logic (LISTING_SLUG_OVERRIDES, getSectionConfigAsync) stays unchanged.

- [ ] **Step 3: Switch homepage**

In `src/app/[locale]/page.tsx`, replace `translatePath` + `fetchJsonApiResource` with `fetchEntity('/', locale)`.

- [ ] **Step 4: Verify all page types render**

Test at least one page of each type:
- Product detail (mosaico, vetrite, arredo, tessuto, pixall, illuminazione)
- Page, Landing page
- Articolo, News, Tutorial
- Progetto, Ambiente
- Showroom, Documento
- Categoria, CategoriaBlog, Tag
- Homepage

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/entity.ts src/app/
git commit -m "feat: switch entity fetching to C1 REST endpoint"
```

---

### Task 8: C2 — Translate Path

**Files:**
- Create: `src/lib/api/translate-path.ts`
- Modify: `src/lib/get-translated-path.ts`

- [ ] **Step 1: Create `src/lib/api/translate-path.ts`**

```typescript
import { apiGet } from './client';
import type { TranslatePathResponse } from './types';

export async function getTranslatedPath(
  path: string,
  fromLocale: string,
  toLocale: string,
): Promise<string | null> {
  const result = await apiGet<TranslatePathResponse>(
    '/translate-path',
    { path, from: fromLocale, to: toLocale },
    3600,
  );
  return result?.translatedPath ?? null;
}
```

- [ ] **Step 2: Update server action wrapper**

In `src/lib/get-translated-path.ts`, change the import to use the new function.

- [ ] **Step 3: Test language switcher**

Navigate to a page and switch language using the navbar language switcher.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/translate-path.ts src/lib/get-translated-path.ts
git commit -m "feat: switch translate-path to C2 REST endpoint"
```

---

### Task 9: Simplify ParagraphResolver

**Files:**
- Modify: `src/components_legacy/blocks_legacy/ParagraphResolver.tsx`

- [ ] **Step 1: Remove secondary fetch logic**

In ParagraphResolver, remove:
- Import of `needsSecondaryFetch` and `fetchParagraph` from `@/lib/drupal/paragraphs`
- The conditional `if (needsSecondaryFetch(type))` block
- The `await fetchParagraph()` call

Paragraphs now arrive fully resolved from C1. The resolver becomes pure dispatch: `type` -> component.

- [ ] **Step 2: Verify paragraph-heavy pages render**

Test pages with galleries, sliders, and other paragraph types that previously needed secondary fetches.

- [ ] **Step 3: Commit**

```bash
git add src/components_legacy/blocks_legacy/ParagraphResolver.tsx
git commit -m "refactor: simplify ParagraphResolver (remove secondary fetches)"
```

---

### Task 10: Reduce node-resolver.ts + Simplify getDrupalImageUrl

**Files:**
- Modify: `src/lib/node-resolver.ts`
- Modify: `src/lib/drupal/image.ts`
- Modify: `src/domain/filters/search-params.ts`

- [ ] **Step 1: Remove INCLUDE_MAP and getIncludeFields from node-resolver.ts**

Keep: `getComponentName()`, `getRevalidateTime()`, `getListingConfig()`.
Remove: `INCLUDE_MAP`, `getIncludeFields()`.

- [ ] **Step 2: Simplify getDrupalImageUrl**

C1 now returns absolute URLs in `uri.url`. Simplify the function to just extract the URL without adding `DRUPAL_ORIGIN`:

```typescript
export function getDrupalImageUrl(field: unknown): string | null {
  if (!field || typeof field !== 'object') return null;
  const f = field as Record<string, unknown>;
  const uri = f.uri as Record<string, unknown> | undefined;
  const url = uri?.url;
  if (typeof url === 'string') return url;
  return null;
}
```

- [ ] **Step 3: Remove dead code from search-params.ts**

Remove `buildJsonApiFilters()` function. Keep `parseFiltersFromUrl()` and nuqs integration.

- [ ] **Step 4: TypeScript check + tests**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 5: Commit**

```bash
git add src/lib/node-resolver.ts src/lib/drupal/image.ts src/domain/filters/search-params.ts
git commit -m "refactor: remove INCLUDE_MAP, simplify image URL extraction, remove JSON:API filter builder"
```

---

### Task 11: Cutover — Delete Old Files

**Files to delete:**
- `src/lib/drupal/core.ts`
- `src/lib/drupal/deserializer.ts`
- `src/lib/drupal/deserializer.test.ts`
- `src/lib/drupal/paragraphs.ts`
- `src/lib/drupal/products.ts`
- `src/lib/drupal/filters.ts`
- `src/lib/drupal/blog.ts`
- `src/lib/drupal/projects.ts`
- `src/lib/drupal/environments.ts`
- `src/lib/drupal/showrooms.ts`
- `src/lib/drupal/documents.ts`
- `src/lib/drupal/subcategories.ts`
- `src/lib/drupal/pages-by-category.ts`
- `src/lib/drupal/translated-path.ts`
- `src/lib/drupal/types.ts`

**Files to keep in `src/lib/drupal/`:**
- `config.ts` (DRUPAL_BASE_URL)
- `menu.ts` (not JSON:API)
- `image.ts` (simplified)
- `index.ts` (update barrel export)

- [ ] **Step 1: Verify zero imports from old files**

```bash
grep -r "from '@/lib/drupal/" src/ --include="*.ts" --include="*.tsx" | grep -v "config" | grep -v "menu" | grep -v "image" | grep -v "index"
```

Expected: no results. If there are results, fix the imports first.

- [ ] **Step 2: Delete old files**

```bash
rm src/lib/drupal/core.ts
rm src/lib/drupal/deserializer.ts
rm src/lib/drupal/deserializer.test.ts
rm src/lib/drupal/paragraphs.ts
rm src/lib/drupal/products.ts
rm src/lib/drupal/filters.ts
rm src/lib/drupal/blog.ts
rm src/lib/drupal/projects.ts
rm src/lib/drupal/environments.ts
rm src/lib/drupal/showrooms.ts
rm src/lib/drupal/documents.ts
rm src/lib/drupal/subcategories.ts
rm src/lib/drupal/pages-by-category.ts
rm src/lib/drupal/translated-path.ts
rm src/lib/drupal/types.ts
```

- [ ] **Step 3: Update barrel exports**

Update `src/lib/drupal/index.ts` to only export from `config.ts`, `menu.ts`, `image.ts`.

Check if `DRUPAL_ORIGIN` in `config.ts` is still referenced anywhere:
```bash
grep -r "DRUPAL_ORIGIN" src/ --include="*.ts" --include="*.tsx"
```
If no remaining references (likely after image.ts simplification), remove `DRUPAL_ORIGIN` from `config.ts`.

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 5: Run tests**

Run: `npx vitest run`

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: successful build.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove legacy JSON:API data layer files"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Manual testing matrix**

Test every page type in at least IT and EN:

| Page Type | IT URL | EN URL | Status |
|---|---|---|---|
| Homepage | `/it` | `/en` | |
| Product (mosaico) | `/it/mosaico/{name}` | `/en/mosaic/{name}` | |
| Product (vetrite) | `/it/vetrite/{name}` | | |
| Product (arredo) | `/it/arredo/{name}` | | |
| Product (tessuto) | `/it/tessili/{name}` | | |
| Product (pixall) | `/it/pixall/{name}` | | |
| Product (illuminazione) | `/it/illuminazione/{name}` | | |
| Product listing (hub) | `/it/mosaico` | `/en/mosaic` | |
| Product listing (filtered) | `/it/mosaico/murano-smalto` | | |
| Product listing (sidebar) | `/it/mosaico?shape=hexagon` | | |
| Blog listing | `/it/blog` | | |
| Projects listing | `/it/progetti` | | |
| Environments listing | `/it/ambienti` | | |
| Showrooms listing | `/it/showroom` | | |
| Documents listing | `/it/download-cataloghi` | | |
| Page | `/it/{any-page}` | | |
| Landing page | `/it/{any-landing}` | | |
| Articolo | `/it/articoli/{name}` | | |
| Categoria | `/it/{category-name}` | | |
| Taxonomy (collezione) | `/it/mosaico-collezioni/{name}` | | |
| Language switch | Switch from IT to EN on any page | | |
| Load More | Click "Load More" on product listing | | |
| Filter counts | Verify counts show on hub cards | | |

- [ ] **Step 2: Verify filter counts are working**

Navigate to a product hub page (e.g., `/it/mosaico`). Verify that category cards show product counts (these were previously disabled).

- [ ] **Step 3: Notify Drupal team**

Confirm to the Drupal team that the Next.js cutover is complete. They can proceed with Phase 4 (disable JSON:API).

- [ ] **Step 4: Final commit and tag**

```bash
git tag post-rest-migration
```
