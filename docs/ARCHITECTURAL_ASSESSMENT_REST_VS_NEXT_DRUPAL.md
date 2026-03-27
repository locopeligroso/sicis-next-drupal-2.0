# Architectural Assessment: Custom REST vs next-drupal Migration

> **Date:** 2026-03-27
> **Status:** Decision made — KEEP custom REST implementation

## 1. Current State Assessment

### Data Layer — Quantified

| Layer                                   | Files | LOC    | Quality                                                                                                                                          |
| --------------------------------------- | ----- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/api/` (REST client + fetchers) | 14    | ~1,750 | **High** — uniform `apiGet<T>()` pattern, typed responses                                                                                        |
| `src/lib/drupal/` (config, menu, image) | 4     | ~153   | Clean, single-purpose utilities                                                                                                                  |
| `src/lib/api/types.ts`                  | 1     | 328    | **25+ explicit interfaces** — `ProductCard`, `MosaicProductRest`, `VetriteProductRest`, `TextileProductRest`, full collection/document sub-types |
| `src/app/[locale]/[...slug]/page.tsx`   | 1     | ~950   | Complex but well-structured — 4 routing stages with clear comments                                                                               |

### What We Built Well

**Uniform API client core.** Every fetcher follows the same pattern:

```
React.cache() -> apiGet<T>(path, params, ttl) -> typed response | null
```

- Error handling is consistent: 404 -> `null`, error -> `console.error` + `null`
- Three revalidation tiers: 60s (products), 300s (editorial), 3600s (taxonomy)
- Normalizers (`stripDomain`, `stripLocalePrefix`, `emptyToNull`) run in the API layer, not in templates

**TypeScript typing is solid.** `types.ts` has 25+ interfaces covering all REST response shapes. Product-specific types (`MosaicProductRest`, `VetriteProductRest`, `TextileProductRest`) include nested collection/document/grout sub-types with field-level precision. This is equal or better than what next-drupal provides (which only gives generic `DrupalNode` envelopes).

**URL alias resolution is custom and working.** Two complementary systems:

- **R1 (`resolvePath`)** — resolves alias -> `{ nid, bundle, locale, aliases }` for product routing
- **C1 (`fetchEntity`)** — resolves alias -> fully pre-resolved entity with all relationships inline (one call, no secondary fetches)
- **`LISTING_SLUG_OVERRIDES`** — 60+ hardcoded slugs across 6 locales that bypass entity resolution for product listings

**On-demand revalidation already exists.** `src/app/api/revalidate/route.ts` — a secured POST endpoint with Bearer auth, locale validation, and path traversal protection. Uses `revalidatePath()`.

### Where It Hurts

**C1 entity -> template is untyped.** `EntityResponse.data` is `Record<string, unknown>`. All 26 templates receive `node: Record<string, unknown>` and do ad-hoc field extraction with optional chaining. This is where most bugs live — but next-drupal doesn't fix this either.

**Two JSON:API escapes remain.** `ProdottoArredo` and `ProdottoIlluminazione` fetch English taxonomy terms via raw `jsonapi/taxonomy_term/` calls — the only JSON:API usage in the entire project.

**Routing is a 950-line behemoth.** 4 stages, 60+ slug overrides, special interception for `node--categoria` and `node--page` with `field_page_id`. But this complexity is inherent to the domain (6 product types x 6 locales x taxonomy/category routing).

---

## 2. Missing Features Analysis

| Feature                    | Our Project                                   | next-drupal                     | Verdict                                                                                     |
| -------------------------- | --------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| **Preview / Draft Mode**   | Not implemented                               | `SitePreviewer` + Drupal module | **Only genuine gap**                                                                        |
| **On-Demand Revalidation** | `POST /api/revalidate` with Bearer auth       | Tag-based `revalidateTag()`     | We have path-based; next-drupal has tag-based (more granular). Can adopt tags independently |
| **Time-based ISR**         | 3-tier TTL (60/300/3600s)                     | Same mechanism                  | Equivalent                                                                                  |
| **Path Resolution**        | R1 + C1 + slug overrides                      | `translatePath()`               | Ours is more capable (handles listing interceptions)                                        |
| **Entity Fetching**        | C1 pre-resolves all relationships in one call | `getResource()` + `?include=`   | Ours is simpler                                                                             |
| **Relationship Mapping**   | Server-side pre-resolution in C1              | Client-side `?include=` param   | **Ours is superior**                                                                        |
| **Multilingual**           | 6 locales, C2 translate-path, R1 aliases      | Locale prefix handling          | Equivalent                                                                                  |
| **Filter System**          | FILTER_REGISTRY + V2 counts + nuqs            | Not in scope                    | JSON:API cannot do aggregated counts                                                        |
| **Pagination**             | Server actions + V1-V11                       | JSON:API pagination             | Ours has no 50-item hard limit                                                              |

---

## 3. Migration Effort — Hard Numbers

### Cannot Be Migrated (next-drupal has no equivalent)

| Component                                 | LOC          | Why                                      |
| ----------------------------------------- | ------------ | ---------------------------------------- |
| V2 — Filter counts endpoint               | ~40          | JSON:API cannot return aggregated counts |
| V4 — Category options                     | ~50          | Non-entity listing data                  |
| V10/V11 — Subcategories/pages-by-category | ~120         | Custom Drupal Views logic                |
| `FILTER_REGISTRY` + nuqs integration      | ~400         | Domain logic, no library covers this     |
| `LISTING_SLUG_OVERRIDES` routing          | ~100         | Business rules, not data fetching        |
| **Total unmigrateable**                   | **~710 LOC** | **These survive ANY migration**          |

### Would Need Complete Rewrite

| Component                                                | LOC            | Effort        |
| -------------------------------------------------------- | -------------- | ------------- |
| 14 REST fetchers -> JSON:API equivalents                 | ~1,400         | 3-4 days      |
| `types.ts` — new interfaces for JSON:API response shapes | ~330           | 1 day         |
| 26 templates — adapt to JSON:API `attributes` shape      | ~5,000+        | 2-3 weeks     |
| Routing `page.tsx` — adapt entity resolution             | ~950           | 2-3 days      |
| **Total rewrite**                                        | **~7,700 LOC** | **3-4 weeks** |

### What We'd Gain

- Tag-based revalidation (incremental improvement over path-based)
- Preview Mode integration (could be built in 1-2 days without next-drupal)
- A dependency on a library maintained by a single agency (Chapter Three), with 170 open issues, unconfirmed Next.js 16/React 19 support

### What We'd Lose

- **Pre-normalized REST responses** — JSON:API sends raw Drupal field shapes
- **Payload efficiency** — JSON:API envelope overhead is 3-10x larger per entity response
- **50-item pagination freedom** — JSON:API hard-limits to 50 items/request
- **Server-side relationship resolution** — C1 pre-resolves everything
- **Independence** — no dependency on a niche library's release cycle

---

## 4. Final Recommendation

### Verdict: DO NOT MIGRATE. Keep the custom REST implementation.

1. **next-drupal is a JSON:API client. Our project doesn't use JSON:API — by design.** Our Drupal team built 14 custom REST endpoints that deliver pre-normalized, frontend-ready payloads. Adopting next-drupal means abandoning all of this.

2. **The sunk cost is substantial and the code is clean.** ~2,000 LOC in a uniform, well-typed API layer with consistent error handling, caching, and normalization.

3. **next-drupal's value proposition doesn't match our gaps.** The one feature we're missing (Preview Mode) is a 1-2 day standalone implementation, not a reason for a 3-4 week migration.

4. **The maintenance risk goes the wrong direction.** next-drupal is maintained by a single agency, has 170 open issues. Our custom code has zero external dependencies beyond `fetch()` and React's `cache()`.

### Recommended Investments Instead

| Investment                                         | Effort   | Impact                                                          |
| -------------------------------------------------- | -------- | --------------------------------------------------------------- |
| **Upgrade revalidation to tag-based**              | 1 day    | More granular cache invalidation without next-drupal            |
| **Build Preview Mode**                             | 1-2 days | Covers the one genuinely missing feature                        |
| **Normalize C1 entity data** — shared mapper layer | 2-3 days | Addresses the real pain point (26 templates doing ad-hoc casts) |

---

## Sources

- [next-drupal 2.0 Release](https://next-drupal.org/blog/next-drupal-2-0) — v2 feature announcement (Feb 2025)
- [chapter-three/next-drupal GitHub](https://github.com/chapter-three/next-drupal) — 706 stars, 170 open issues
- [Drupal.org: What JSON:API Doesn't Do](https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module/what-jsonapi-doesnt-do)
- [Drupal.org: JSON:API vs REST module](https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module/jsonapi-vs-cores-rest-module)
- [Drupal.org JSON:API Pagination](https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module/pagination) — 50-item hard limit
