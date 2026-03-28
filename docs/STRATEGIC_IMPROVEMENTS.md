# Strategic Improvements — Data Layer Architecture Recommendations

**Date:** 2026-03-25
**Subtitle:** Based on codebase analysis (5 Hermes agents) + best practices research (5 Athena agents) + strategic analysis (Apollo)

---

## Executive Summary

The Sicis Next.js frontend has a functional data layer serving 6 product types across 6 locales, backed by a headless Drupal 10 REST API. Codebase analysis identified 10 architectural problems that reduce type safety, increase error-handling debt, and complicate future maintenance.

All recommendations are **frontend-only** — the Drupal REST API is not changed. The improvements are organized across 5 phases ordered by impact-to-effort ratio, allowing incremental delivery without disrupting active development.

Key findings:

- NID/UUID confusion at fetch boundaries is a silent runtime bug waiting to happen
- Missing `error.tsx` boundaries means any fetch failure kills the entire page
- Normalizer logic is scattered across 4+ files, creating drift risk
- ParagraphResolver's string-keyed `LEGACY_MAP` has no exhaustiveness guarantee
- Cache invalidation is purely TTL-based with no webhook infrastructure

---

## Section 1: Type Safety Improvements

### 1a. Branded Types for NID vs UUID

**Problem.** `fetchSubcategories` and `fetchPagesByCategory` (endpoints subcategories, pages-by-category) require an integer NID — the Drupal node ID — not a UUID. The function signatures accept a plain `string | number`, meaning any caller can silently pass a UUID string and receive an empty 200 response. There is no compile-time guard.

```typescript
// current — nothing prevents UUID here
fetchSubcategories(parentId: string | number, locale: string)
fetchPagesByCategory(parentId: string | number, locale: string, ...)
```

**Solution.** Zero-runtime-cost branded types.

```typescript
// src/types/drupal/ids.ts
type Brand<T, B extends string> = T & { readonly __brand: B };

export type Nid = Brand<number, 'Nid'>;
export type Uuid = Brand<string, 'Uuid'>;

export function asNid(value: unknown): Nid {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new TypeError(`Expected integer NID, got: ${String(value)}`);
  }
  return n as Nid;
}
```

Apply `asNid()` at the call sites where entity endpoint response data is first read (`node._nid`), then thread `Nid` through to both fetch functions. TypeScript will reject any attempt to pass a UUID where an NID is required at compile time, with zero runtime overhead.

**Scope:** 1 hour, 3-5 call sites in templates and the routing layer.

---

### 1b. Result Type for Fetch Functions

**Problem.** `fetchEntity` currently returns `EntityResponse | null`. This conflates three distinct outcomes:

- The node exists → render it
- The node does not exist (404) → call `notFound()`
- A network or parse failure occurred → surface an error boundary

Callers must guess which case `null` represents, and network errors are silently swallowed.

**Solution.** A discriminated `ApiResult<T>` type.

```typescript
// src/lib/api/result.ts
export type ApiError =
  | { kind: 'not_found' }
  | { kind: 'network'; message: string }
  | { kind: 'timeout' }
  | { kind: 'parse'; cause: unknown };

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };
```

Routing layer handling:

```typescript
const result = await fetchEntity(path, locale);

if (!result.ok) {
  if (result.error.kind === 'not_found') return notFound();
  throw new Error(result.error.message); // caught by error.tsx
}

return renderEntity(result.data);
```

**Migration path:** Start with `fetchEntity` (highest-value, used in the main routing entry point), then propagate to `fetchProducts`, `fetchSubcategories`, and ancillary fetchers. Existing callers can be adapted gradually — the `null` path is replaced by `{ ok: false, error: { kind: 'not_found' } }`.

---

### 1c. Zod Stance — Keep Current No-Zod Decision

The CLAUDE.md documents an explicit no-Zod decision. This analysis confirms that decision is correct for the current context:

- Drupal is a controlled, internal data source — field shapes change infrequently
- Branded types + `ApiResult<T>` + entity mappers provide 80% of the safety at 20% of the effort
- Zod parse overhead on server components is non-trivial for paginated endpoints (products, blog, projects, environments, showrooms, documents, subcategories, pages-by-category)
- The dev team is familiar with TypeScript interfaces; Zod schemas would be a context switch

**Revisit Zod if:**

- Drupal fields change frequently due to active CMS work
- A second team independently modifies the Drupal backend
- Consumer-driven contract testing is introduced

---

## Section 2: Data Normalization Layer

### 2a. Consolidate Normalizers

**Problem.** Normalization logic is currently spread across multiple files:

- `stripDomain`, `stripLocalePrefix`, `emptyToNull` live in `client.ts`
- `unixToIso` is inlined in `listings.ts`
- `getDrupalImageUrl` lives in `drupal/image.ts`
- Link and price normalization is repeated inline in templates

This creates drift: a new developer adding a fetcher may not discover existing normalizers and writes a third version of `emptyToNull`.

**Solution.** A single `src/lib/api/normalize.ts` as the canonical home for all normalization utilities.

```typescript
// src/lib/api/normalize.ts

/** Remove the Drupal base domain, returning a site-relative path. */
export function stripDomain(url: string): string { ... }

/** Remove the locale prefix from a path segment. */
export function stripLocalePrefix(path: string, locale: string): string { ... }

/** Treat empty string as null (Drupal returns "" for missing image URLs). */
export function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}

/** Convert Unix timestamp string to ISO 8601. */
export function unixToIso(timestamp: string): string {
  return new Date(Number(timestamp) * 1000).toISOString();
}

/** Extract image URL from entity image shape. Handles both string and object forms. */
export function extractImageUrl(
  image: unknown
): string | null {
  if (!image) return null;
  if (typeof image === 'string') return emptyToNull(image);
  if (typeof image === 'object' && image !== null) {
    const obj = image as Record<string, unknown>;
    // entity endpoint shape: { uri: { url: "https://..." } }
    if (obj.uri && typeof (obj.uri as Record<string, unknown>).url === 'string') {
      return emptyToNull((obj.uri as Record<string, unknown>).url as string);
    }
    // Listing shape: direct imageUrl string
    if (typeof obj.imageUrl === 'string') return emptyToNull(obj.imageUrl);
  }
  return null;
}

/** Normalize a Drupal link field. Handles <nolink>, absolute, and relative paths. */
export function normalizeLink(
  link: unknown,
  baseUrl = ''
): string | null {
  if (!link) return null;

  // String shorthand (Views endpoints)
  if (typeof link === 'string') {
    if (link === '<nolink>' || link === '') return null;
    if (link.startsWith('http')) return stripDomain(link);
    return link;
  }

  // Object form (entity endpoint: { uri: string, title: string })
  if (typeof link === 'object' && link !== null) {
    const obj = link as Record<string, unknown>;
    if (typeof obj.uri === 'string') return normalizeLink(obj.uri, baseUrl);
    if (typeof obj.url === 'string') return normalizeLink(obj.url, baseUrl);
  }

  return null;
}

/** Normalize price: return number or null if price-on-demand. */
export function normalizePrice(
  price: unknown,
  priceOnDemand: '0' | '1' | null
): number | null {
  if (priceOnDemand === '1') return null;
  const n = Number(price);
  return isNaN(n) ? null : n;
}

/** Normalize a Drupal path (may contain full domain URL). */
export function normalizePath(
  path: unknown,
  locale: string
): string | null {
  if (typeof path !== 'string' || path === '') return null;
  return stripLocalePrefix(stripDomain(path), locale);
}
```

After extraction, update `client.ts`, `drupal/image.ts`, and `listings.ts` to import from `normalize.ts` instead of defining inline.

---

### 2b. Entity Mapper Layer

**Problem.** Every template currently receives `node` as `Record<string, unknown>` and individually casts and accesses fields with optional chaining. This means:

- The same field access logic (`node.field_testo_main as string ?? ''`) is repeated across templates
- Bugs (e.g. wrong field name) reproduce across multiple templates
- There is no single place to verify the entity response shape

**Solution.** One mapper function per entity family that transforms `Record<string, unknown>` into a fully typed domain model.

```typescript
// src/lib/mappers/product-mosaico.mapper.ts
import { extractImageUrl, normalizePath, emptyToNull } from '../api/normalize';
import type { ProdottoMosaico } from '../../types/drupal/entities';

export interface MappedProdottoMosaico {
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  price: number | null;
  priceOnDemand: boolean;
  body: string | null;
  path: string;
  collectionTitle: string | null;
  // ... all fields
  _raw: ProdottoMosaico; // escape hatch during migration
}

export function mapProdottoMosaico(
  raw: Record<string, unknown>,
  locale: string,
): MappedProdottoMosaico {
  const node = raw as ProdottoMosaico;
  return {
    title: String(node.title ?? ''),
    subtitle: emptyToNull(String(node.field_sottotitolo ?? '')),
    imageUrl: extractImageUrl(node.field_immagine),
    price: node.field_prezzo ? Number(node.field_prezzo) : null,
    priceOnDemand: node.field_prezzo_su_richiesta === '1',
    body: emptyToNull(String(node.field_testo_main ?? '')),
    path: normalizePath(node.path, locale) ?? '',
    collectionTitle: emptyToNull(String(node.field_collezione?.title ?? '')),
    _raw: node,
  };
}
```

**Entity families to cover (in migration order):**

| Family                  | Mapper file                       | Feeds template(s)             |
| ----------------------- | --------------------------------- | ----------------------------- |
| `product-mosaico`       | `product-mosaico.mapper.ts`       | ProdottoMosaico               |
| `product-vetrite`       | `product-vetrite.mapper.ts`       | ProdottoVetrite               |
| `product-arredo`        | `product-arredo.mapper.ts`        | ProdottoArredo                |
| `product-tessuto`       | `product-tessuto.mapper.ts`       | ProdottoTessuto               |
| `product-pixall`        | `product-pixall.mapper.ts`        | ProdottoPixall                |
| `product-illuminazione` | `product-illuminazione.mapper.ts` | ProdottoIlluminazione         |
| `article`               | `article.mapper.ts`               | Articolo, News, Tutorial      |
| `category`              | `category.mapper.ts`              | Categoria, CategoriaBlog      |
| `page`                  | `page.mapper.ts`                  | Page, LandingPage             |
| `listing-item`          | `listing-item.mapper.ts`          | Shared listing response items |

**Migration path:** Start with `ProdottoMosaico` (already DS-complete, highest-confidence baseline), then `ProductListingTemplate`, then editorial types, and finally legacy templates.

---

## Section 3: Paragraph System Evolution

### 3a. Discriminated Union Dispatch in ParagraphResolver

**Problem.** `ParagraphResolver` dispatches on paragraph type using a string-keyed `LEGACY_MAP` and a sequence of `if` checks. There is no exhaustiveness guarantee — a new Drupal paragraph type added without a corresponding handler silently falls through to the dev warning box (and returns `null` in production).

**Solution.** Replace the ad-hoc dispatch with a typed discriminated union and a `switch` statement that TypeScript can exhaustiveness-check.

```typescript
// src/types/drupal/paragraphs.ts
export type KnownParagraphType =
  | 'paragraph--blocco_intro'
  | 'paragraph--blocco_quote'
  | 'paragraph--blocco_video'
  | 'paragraph--blocco_testo_immagine'
  | 'paragraph--blocco_testo_immagine_big'
  | 'paragraph--blocco_testo_immagine_blog'
  | 'paragraph--blocco_gallery'
  | 'paragraph--blocco_gallery_intro'
  | 'paragraph--blocco_documenti'
  | 'paragraph--blocco_correlati'
  | 'paragraph--blocco_newsletter'
  | 'paragraph--blocco_form_blog'
  | 'paragraph--blocco_slider_home'
  | 'paragraph--blocco_anni'
  | 'paragraph--blocco_tutorial';

// ParagraphResolver dispatch (simplified)
function dispatch(type: KnownParagraphType, data: unknown): ReactNode {
  switch (type) {
    case 'paragraph--blocco_intro':          return <GenIntro {...adaptGenIntro(data)} />;
    case 'paragraph--blocco_quote':          return <GenQuote {...adaptGenQuote(data)} />;
    case 'paragraph--blocco_video':          return <GenVideo {...adaptGenVideo(data)} />;
    // ... all 15 known types
    default: {
      const _exhaustive: never = type; // TypeScript error if a case is missing
      return <ParagraphUnknown type={_exhaustive} />;
    }
  }
}
```

Unknown paragraph types (e.g. new types added in Drupal before the frontend is updated) fall through to a `ParagraphUnknown` component that renders nothing in production and a dev warning in development.

---

### 3b. Paragraph Adapter Extraction

**Problem.** Adapter functions (`adaptGenIntro`, `adaptGenVideo`, etc.) currently live inline in `ParagraphResolver.tsx`. This makes them impossible to unit-test without rendering a full React component tree, and the file grows with each new Gen block.

**Solution.** Move adapters to `src/lib/adapters/paragraphs/`, one file per adapter.

```
src/lib/adapters/paragraphs/
  adapt-gen-intro.ts
  adapt-gen-quote.ts
  adapt-gen-video.ts
  adapt-gen-testo-immagine.ts
  adapt-gen-testo-immagine-big.ts
  adapt-gen-testo-immagine-blog.ts
  adapt-gen-gallery.ts
  adapt-gen-gallery-intro.ts
  adapt-gen-documenti.ts
  index.ts    ← barrel
```

Each adapter is a pure function: `(raw: unknown) => ComponentProps`. Unit testable with plain objects, no React renderer required.

---

## Section 4: Caching and Revalidation

### 4a. Tag-Based Revalidation

**Problem.** Cache invalidation is purely TTL-based (60s for products, 300s for editorial, 600s for static). When a Drupal editor updates a product, the change is invisible to users for up to 60 seconds. For editorial updates (news, articoli), the delay is 300 seconds. There is no webhook infrastructure.

**Solution.** Add Next.js cache tags to all fetch calls, enabling on-demand revalidation.

```typescript
// Example: fetchEntity with tags
export async function fetchEntity(path: string, locale: string): Promise<...> {
  const url = buildUrl(path, locale);
  const res = await fetch(url, {
    next: {
      revalidate: 60,
      tags: [
        `locale:${locale}`,
        `path:${path}`,
        // Added after entity resolution:
        `entity:${nid}`,
        `type:${bundle}`,
      ],
    },
  });
  // ...
}
```

**Tag convention:**

| Tag pattern             | Scope                        | Example                       |
| ----------------------- | ---------------------------- | ----------------------------- |
| `entity:{nid}`          | Single entity                | `entity:42`                   |
| `type:{bundle}`         | All entities of a type       | `type:prodotto_mosaico`       |
| `locale:{locale}`       | All cached data for a locale | `locale:it`                   |
| `menu:{name}`           | A specific menu              | `menu:main`                   |
| `listing:{productType}` | A product listing            | `listing:prodotto_mosaico`    |
| `taxonomy:{vocabulary}` | Taxonomy terms               | `taxonomy:mosaico_collezioni` |

**Revalidation endpoint:**

```typescript
// src/app/api/revalidate/route.ts
export async function POST(request: Request) {
  const { secret, tags } = await request.json();

  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  await Promise.all(tags.map((tag: string) => revalidateTag(tag)));
  return Response.json({ revalidated: tags, at: new Date().toISOString() });
}
```

After webhooks are active, increase TTLs 2-3x as a safety net rather than the primary invalidation mechanism.

---

### 4b. `unstable_cache` for Derived Data

Computed values that depend on multiple fetch results — filter option derivation, section config resolution — currently re-execute on every request. These are good candidates for `unstable_cache` with locale in the cache key.

```typescript
import { unstable_cache } from 'next/cache';

export const getCachedSectionConfig = unstable_cache(
  async (slug: string, locale: string) => getSectionConfigAsync(slug, locale),
  ['section-config'],
  { revalidate: 600, tags: ['section-config'] },
);
```

Apply to: `getSectionConfigAsync`, `fetchAllFilterOptions`, and filter count aggregations.

---

## Section 5: Filter System

### 5a. Race Condition — Ensure `useQueryStates` Batching

nuqs's `useQueryStates` batches all URL param changes into a single `history.push` when called with an object. Verify that all active filter updates in `ProductListingTemplate` pass the full new state object in one call rather than calling `setFilter` multiple times in sequence. Multiple calls in the same tick will each push a separate history entry, creating browser back-button pollution and potential race conditions with concurrent React rendering.

### 5b. SEO Canonical for Filtered URLs

Filtered product listing URLs (e.g. `/mosaico?color=bianco&finish=lucido`) are duplicate content from Google's perspective. Add `rel=canonical` pointing to the unfiltered hub page, and `noindex` for URLs with 3 or more active filters.

```typescript
// In ProductListingTemplate
const activeFilterCount = Object.values(activeFilters).flat().length;
const canonicalUrl = `/${locale}/${basePath}`;

return (
  <>
    <link rel="canonical" href={canonicalUrl} />
    {activeFilterCount >= 3 && (
      <meta name="robots" content="noindex, follow" />
    )}
    {/* ... rest of template */}
  </>
);
```

### 5c. Optimistic UI for Filters (Lower Priority)

Wrap filter state updates with `useOptimistic` + `useTransition` to immediately reflect selection in the UI before the network round-trip completes. This is a polish item with meaningful UX benefit but no correctness impact. Implement after items 1-4 are stable.

---

## Section 6: Error Handling

### 6a. `error.tsx` Boundaries

Next.js App Router requires `error.tsx` files to catch unhandled errors within a segment. Currently, any `fetch` exception in `[...slug]/page.tsx` crashes the entire page with an unformatted error screen.

Add boundaries at two levels:

- `src/app/[locale]/error.tsx` — catches errors for all routes under a locale
- `src/app/[locale]/[...slug]/error.tsx` — catches errors for individual entity pages

```typescript
// src/app/[locale]/error.tsx
'use client';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-heading">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="btn-primary">Try again</button>
    </main>
  );
}
```

### 6b. Graceful Degradation for Ancillary Data

Pages that require multiple parallel fetches (e.g. Categoria: entity + subcategories + filter options) should not fail entirely if one ancillary fetch fails. Use `Promise.allSettled` for non-critical data.

```typescript
const [entityResult, subcategoriesResult, filtersResult] =
  await Promise.allSettled([
    fetchEntity(path, locale),
    fetchSubcategories(nid, locale),
    fetchAllFilterOptions(productType, locale),
  ]);

// Entity is critical — hard fail
if (entityResult.status === 'rejected') throw entityResult.reason;

// Subcategories and filters degrade gracefully
const subcategories =
  subcategoriesResult.status === 'fulfilled' ? subcategoriesResult.value : [];
```

### 6c. Integration: Result Type + Error Boundaries

The `ApiResult<T>` type from Section 1b integrates directly with this pattern:

- `ok: true` → proceed to render
- `ok: false, kind: 'not_found'` → call `notFound()` (renders 404 page)
- `ok: false, kind: 'network' | 'timeout'` → `throw` (caught by `error.tsx`)
- `ok: false, kind: 'parse'` → log + `throw` (data contract violation, always investigate)

---

## Section 7: Priority Matrix

| #   | Recommendation                        | Impact (1-5) | Effort (1-5) | Risk (1-5) | Dependencies | Phase   |
| --- | ------------------------------------- | ------------ | ------------ | ---------- | ------------ | ------- |
| 1   | Branded types (NID/UUID)              | 3            | 1            | 1          | None         | Phase 1 |
| 2   | `error.tsx` boundaries                | 4            | 1            | 1          | None         | Phase 1 |
| 3   | Filter batching (`useQueryStates`)    | 2            | 1            | 1          | None         | Phase 1 |
| 4   | SEO canonical for filtered URLs       | 3            | 1            | 1          | None         | Phase 1 |
| 5   | Result type for fetch functions       | 5            | 2            | 2          | None         | Phase 2 |
| 6   | Normalizer consolidation              | 3            | 2            | 1          | None         | Phase 2 |
| 7   | Entity mapper (ProdottoMosaico)       | 4            | 3            | 3          | #6           | Phase 3 |
| 8   | Entity mapper (remaining products)    | 4            | 4            | 3          | #7           | Phase 3 |
| 9   | ParagraphResolver discriminated union | 3            | 2            | 2          | None         | Phase 3 |
| 10  | Paragraph adapter extraction          | 2            | 2            | 1          | #9           | Phase 3 |
| 11  | Cache tag infrastructure              | 3            | 2            | 1          | None         | Phase 4 |
| 12  | `unstable_cache` for derived data     | 2            | 2            | 2          | None         | Phase 4 |
| 13  | Entity mapper (editorial + metadata)  | 3            | 3            | 2          | #7           | Phase 4 |
| 14  | Tessuti JSON:API encapsulation        | 2            | 1            | 1          | #7           | Phase 4 |
| 15  | Optimistic UI for filters             | 2            | 3            | 2          | #3           | Phase 5 |

**Score key:** 1 = low, 5 = high. Risk measures regression potential, not implementation complexity.

---

## Phase Timeline

### Phase 1 — Quick Wins (1-2 days)

**Items 1-4.** Zero regression risk. Each item is self-contained, touches 2-5 files, and delivers immediate value.

- Branded NID/UUID types prevent a class of silent runtime bugs
- `error.tsx` boundaries stop full-page crashes from single-fetch failures
- Filter batching audit takes 30 minutes and prevents browser history pollution
- SEO canonical improves search ranking for product listings

**Deliverable:** A safer, more resilient frontend with no visible changes to users.

### Phase 2 — Core Foundation (3-4 days)

**Items 5-6.** These are prerequisites for the mapper layer. The Result type changes the contract of every fetch function, so it should land before mapper work begins.

- `ApiResult<T>` propagated to `fetchEntity` first, then progressively to other fetchers
- All normalizers moved to `normalize.ts` with existing callers updated to import from the new location

**Deliverable:** A stable, well-factored API layer that mappers can build on.

### Phase 3 — Data Layer Transformation (1-2 weeks)

**Items 7-10.** The largest investment, and the largest payoff. Entity mappers eliminate duplicated field-access logic across templates. ParagraphResolver gets exhaustiveness guarantees.

- Start with `ProdottoMosaico` (already DS-complete, well-understood shape)
- Propagate mapper pattern to remaining product templates
- Refactor ParagraphResolver to discriminated union dispatch
- Extract adapters to testable pure functions

**Deliverable:** A fully typed data domain layer. Templates receive typed models, not raw `Record<string, unknown>`.

### Phase 4 — Infrastructure and Propagation (1 week)

**Items 11-14.** Additive improvements on top of the stable foundation from Phase 3.

- Cache tag infrastructure enables sub-minute invalidation from Drupal webhooks
- `unstable_cache` for derived data reduces redundant computation
- Editorial + metadata mappers complete the mapper coverage
- Tessuti secondary fetch is encapsulated within the mapper (not in the template)

**Deliverable:** Cache-coherent data layer ready for webhook integration.

### Phase 5 — Polish (when bandwidth allows)

**Item 15.** Optimistic UI for filters. Implement after Phase 1-4 are stable. The payoff is a snappier perceived filter interaction, not a correctness fix.

---

## Conditions That Change Priority

| Condition                                                             | Adjustment                                                                             |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Drupal fields change frequently (active CMS work)                     | Add Zod schemas to mapper layer; move to Phase 2                                       |
| SEO is top priority                                                   | Move canonical work to immediate action + add JSON-LD structured data                  |
| Drupal team can deliver webhooks quickly                              | Move cache tag infrastructure from Phase 4 to Phase 2                                  |
| Remaining Gen blocks are imminent (GenCorrelati, GenNewsletter, etc.) | Complete ParagraphResolver discriminated union (item 9) before building new Gen blocks |
| Second team begins touching Drupal backend                            | Activate Zod regardless of phase schedule                                              |
| Product template DS migration begins                                  | Ensure entity mapper for that product type is complete first                           |

---

_Generated by Clio (Technical Documentation Writer) — Sicis Next.js frontend, 2026-03-25._
