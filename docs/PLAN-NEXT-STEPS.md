# Plan: Next Steps — Sicis Next.js Frontend

> **Date:** 2026-04-03 (end of session)
> **Status:** READ-ONLY — Giuseppe reviews tomorrow morning
> **Author:** Ulysses (strategy agent), grounded in codebase analysis

---

## P0 — Blockers

### P0-1. Drupal `mosaic-products/all/all` endpoint timeout

- **Owner:** Freddi
- **Description:** ~640 mosaico products with new `{url,width,height}` image format times out. Blocks client-side collection filtering.
- **Frontend workaround:** Graceful degradation to server-side filtering if `all/all` fails.

### P0-2. `field_immagine_anteprima` null for mosaico products

- **Owner:** Freddi
- **Description:** Listing factory uses `field_immagine` (works), but preview images are null. Low immediate impact.

### P0-3. Tags endpoint `/api/v1/tags` returning 404

- **Owner:** Freddi
- **Description:** Intermittent. `fetchBlogTags` has fallback via `content/{nid}` but it's fragile and slow.

---

## P1 — This Week

### P1-1. Wire remaining 6 Gen blocks into ParagraphResolver

- **Owner:** Claude (Fidia)
- **Effort:** Low (2-3 hours)
- **Description:** GenSliderHome, GenCorrelati, GenNewsletter, GenFormBlog, GenAnni, GenTutorial — files exist, need adapter functions. Delete 7 legacy Blocco files.
- **Dependencies:** None

### P1-2. Jewels page with video + external link

- **Owner:** Claude (Fidia) + Giuseppe (content review)
- **Effort:** Medium (half day)
- **Description:** Template for `/it/sicis-jewels` — hero video, brand description, CTA to sicisjewels.com.
- **Dependencies:** Video at `/video/jewels-nav.mp4`, Drupal content node

### P1-3. Showroom images verification

- **Owner:** Giuseppe (verification) + Claude (fix if needed)
- **Effort:** Low (1 hour)

### P1-4. Footer: DS migration + CMS fallback fix

- **Owner:** Claude (Fidia)
- **Effort:** Medium (half day)
- **Description:** Migrate from `components_legacy/Footer.tsx` to `components/layout/Footer.tsx` with Tailwind + Typography. Fix `extractMenuSection` (was matching "explore" which no longer exists).
- **Dependencies:** None (full CMS-driven blocked by Freddi endpoint)

---

## P2 — Next Week

### P2-1. ProdottoVetrite DS migration

- **Owner:** Claude (Fidia)
- **Effort:** High (1-2 days)
- **Description:** 654 lines legacy → Spec blocks pattern (like MosaicProductPreview). Keep VetriteCanvasLoader.
- **Dependencies:** P0-2 (partial)

### P2-2. Faux Mosaic as product (tessili)

- **Owner:** Claude + Freddi (confirm product-category relationship)
- **Effort:** Medium (half day)

### P2-3. Mosaico descriptive categories: bagno, piscina

- **Owner:** Freddi (content) + Claude (fix if needed)
- **Effort:** Low (verification)

### P2-4. Arredo Indoor: cucine, bagno subcategories

- **Owner:** Gabriele (assets) + Freddi (data entry)
- **Effort:** High (content, not code)

### P2-5. Footer: full CMS-driven (post-Freddi endpoint)

- **Owner:** Freddi (endpoint) + Claude (integration)
- **Effort:** Low (1-2 hours)
- **Dependencies:** P1-4, Freddi endpoint

### P2-6. Projects: 2+ complete projects with content

- **Owner:** Freddi (content) + Giuseppe (curation)
- **Effort:** Medium (content creation)

---

## P3 — Backlog

### P3-1. Product template DS migration: Pixall, Tessuto, Illuminazione, Arredo

- **Effort:** High (1-2 days each, 4-8 days total)
- **Dependencies:** P2-1 (establishes pattern)

### P3-2. Editorial template DS migration

- **Effort:** Medium (2-3 days for all)

### P3-3. `page.tsx` extraction (1177 lines → helper modules)

- **Effort:** Medium (half day)

### P3-4. GenNewsletter actual submission

- **Dependencies:** Newsletter platform decision (Giuseppe)

### P3-5. GenFormBlog actual form

- **Dependencies:** Form field spec from Giuseppe

### P3-6. i18n: sync missing keys (resistant, absent + hardcoded labels)

- **Effort:** Low (1-2 hours)

### P3-7. Legacy component cleanup (target: delete `components_legacy/`)

- **Dependencies:** All template migrations

### P3-9. Animations (reimplementation)

- **Dependencies:** Approach decision

### P3-10. Vetrite collection images

- **Owner:** Gabriele (assets) + Freddi (upload)

### P3-11. Regional logic (EU vs US pricing, CTAs, stock)

- **Dependencies:** Business rules from Giuseppe

---

## Owner Summary

| Owner        | Focus                                      |
| ------------ | ------------------------------------------ |
| **Freddi**   | P0 blockers, content entry, new endpoints  |
| **Gabriele** | Assets (product photos, collection images) |
| **Giuseppe** | Decisions, content review, business rules  |
| **Claude**   | All frontend implementation                |

## Quick Wins (< 2 hours each)

1. **P1-1** — Wire 6 Gen blocks (adapters are mechanical)
2. **P3-6** — Sync missing i18n keys
3. **P1-3** — Showroom image verification

## Dependency Graph

```
P0-1 (timeout) ──> P2-3 (mosaico categories)
P0-2 (images) ───> P2-1 (vetrite DS, partial)
P1-1 (Gen blocks) ──> P3-8 (legacy cleanup)
P1-4 (footer DS) ──> P2-5 (footer CMS)
P2-1 (vetrite DS) ──> P3-1 (remaining products)
```
