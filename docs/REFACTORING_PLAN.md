---
date: 2026-03-30
---

# Refactoring Plan — Sicis Next.js Frontend

> Data: 2026-03-30 | Autore: Ulysses (strategy agent) | Esecutore: Zeus + Fidia

## Goal

Eliminate all legacy code from the Sicis Next.js frontend in a phased, non-breaking manner. Each phase is independently shippable. End state: zero CSS modules, zero DrupalImage, zero legacy adapters, zero dead code files, 100% paragraph blocks on DS, product templates consume normalized API data directly (like MosaicProductPreview).

## Approach: Inside-Out, Smallest-to-Largest

1. Clean dead weight first (zero risk, immediate hygiene)
2. Finish 6 remaining Gen blocks (small, self-contained, unblocks editorial)
3. Migrate product templates largest-to-smallest following MosaicProductPreview gold standard
4. Migrate editorial templates + Footer
5. Consolidate i18n (cross-cutting, parallel with Phase 3-4)

---

## Phase 0: Dead Code Cleanup (~30 min)

All steps parallel. Zero functional risk.

| Step | Action                                                                        | Files | Lines Removed |
| ---- | ----------------------------------------------------------------------------- | ----- | ------------- |
| 0.1  | Delete `src/lib/api/entity.ts`                                                | 1     | ~25           |
| 0.2  | Delete `src/lib/api/filters.ts`                                               | 1     | ~260          |
| 0.3  | Delete `src/config/env.ts` + `src/config/isr.ts`                              | 2     | ~30           |
| 0.4  | Delete `src/hooks/useFilters.ts`                                              | 1     | ~50           |
| 0.5  | Delete `src/proxy.ts`                                                         | 1     | ~20           |
| 0.6  | Verify `translate-path.ts` is USED (NavbarMobile, NavLanguageSwitcher) — keep | 0     | 0             |
| 0.7  | Evaluate `FilterSidebar.tsx` — mark for Phase 3 if superseded                 | 0     | 0             |

**Total: ~7 files, ~400 lines removed**

---

## Phase 1: Complete 6 Remaining Gen Blocks (~3h)

Steps 1.1-1.6 parallel. Step 1.7 after all complete. Agent: fidia.

| Step | Block                                           | Replaces                        | Lines (legacy) | Complexity |
| ---- | ----------------------------------------------- | ------------------------------- | -------------- | ---------- |
| 1.1  | GenCorrelati                                    | BloccoCorrelati                 | 52             | Low        |
| 1.2  | GenAnni                                         | BloccoAnni                      | 89             | Low        |
| 1.3  | GenSliderHome                                   | BloccoSliderHome + SliderClient | 163            | Medium     |
| 1.4  | GenNewsletter                                   | BloccoNewsletter                | 22             | Low        |
| 1.5  | GenFormBlog                                     | BloccoFormBlog                  | 19             | Low        |
| 1.6  | GenTutorial                                     | BloccoTutorial                  | 25             | Low        |
| 1.7  | Cleanup: delete legacy blocks, empty LEGACY_MAP | —                               | —              | Low        |

**Result: 100% paragraph DS coverage (18/18). ~230 lines legacy deleted.**

---

## Phase 2: Product Template DS Migration (~8h)

Steps 2.1-2.5 parallel. Steps 2.6-2.7 after. Agent: fidia.

Migration pattern (from MosaicProductPreview gold standard):

1. Template receives typed product object directly (e.g., `VetriteProduct`)
2. Maps fields to Spec block props (Hero, Details, Specs, Resources, Gallery)
3. No DrupalImage, no CSS modules, no legacy adapter
4. In page.tsx: remove `*ToLegacyNode()` call, pass product directly

| Step | Template                                                | Lines (legacy) | Lines (DS est.) | Complexity  |
| ---- | ------------------------------------------------------- | -------------- | --------------- | ----------- |
| 2.1  | ProdottoVetrite                                         | 618            | ~280            | Medium-High |
| 2.2  | ProdottoPixall                                          | 529            | ~220            | Medium      |
| 2.3  | ProdottoTessuto                                         | 654            | ~280            | Medium      |
| 2.4  | ProdottoArredo                                          | 671            | ~280            | Medium      |
| 2.5  | ProdottoIlluminazione                                   | 659            | ~220            | Medium      |
| 2.6  | Delete `legacy-node-adapters.ts` + `product.module.css` | 446            | 0               | Low         |
| 2.7  | Merge ProdottoMosaico + MosaicProductPreview into one   | 647            | ~300            | Medium      |

**Result: ~3,131 lines legacy → ~1,300 DS. 446 lines adapters+CSS deleted. Net: -2,000+ lines.**

---

## Phase 3: Editorial Templates, Footer, Legacy Components (~4h)

Steps 3.1-3.5 parallel. Steps 3.6-3.7 after. Agent: fidia.

| Step | Component                                                                       | Lines  | Action                                   |
| ---- | ------------------------------------------------------------------------------- | ------ | ---------------------------------------- |
| 3.1  | Showroom template                                                               | 209    | Tailwind + i18n + next/image             |
| 3.2  | Categoria template                                                              | 410    | Tailwind + next/image                    |
| 3.3  | Articolo, News, Tutorial, Progetto, Documento, Ambiente                         | ~250   | Replace DrupalImage                      |
| 3.4  | Footer                                                                          | 322    | Full DS migration                        |
| 3.5  | 5 listing components (Blog, Project, Environment, Showroom, Document)           | ~1,400 | Tailwind + next/image, move to composed/ |
| 3.6  | Delete DrupalImage.tsx                                                          | 40     | After all above                          |
| 3.7  | Delete components_legacy/ directory, relocate ParagraphResolver + UnknownEntity | —      | Final cleanup                            |

**Result: components_legacy/ eliminated. ~1,500 lines migrated.**

---

## Phase 4: i18n Consolidation (~2h)

Can start alongside Phase 2. Agent: fidia + clio.

| Step | Action                                             | Scope                |
| ---- | -------------------------------------------------- | -------------------- |
| 4.1  | Add missing `resistant`/`absent` to DE, FR, ES, RU | 4 files, 2 keys each |
| 4.2  | Extract ProdottoMosaico hardcoded labels           | ~12 strings          |
| 4.3  | Extract Showroom + Footer + listing labels         | ~25 strings          |
| 4.4  | Document i18n conventions in CLAUDE.md             | Documentation        |

**Result: 35+ hardcoded strings → i18n keys. 100% translation coverage.**

---

## Impact Summary

| Metric                   | Before                | After   |
| ------------------------ | --------------------- | ------- |
| DS component coverage    | 79%                   | 100%    |
| Paragraph DS coverage    | 67%                   | 100%    |
| Legacy template files    | 18                    | 0       |
| CSS module files         | 1                     | 0       |
| Legacy adapter functions | 5                     | 0       |
| Dead code files          | ~8                    | 0       |
| components_legacy/       | 18 files, 3,474 lines | Deleted |
| Hardcoded i18n strings   | 35+                   | 0       |
| Net lines removed        | —                     | ~2,500  |

## Execution Strategy

- **Swarm mode within phases, sequential between phases**
- Phase 0: 7 agents parallel
- Phase 1: 6 agents parallel → 1 cleanup
- Phase 2: 5 agents parallel → 2 cleanup
- Phase 3: 5 agents parallel → 2 cleanup
- Phase 4: starts during Phase 2, completes after Phase 3

**Verification checkpoint after each phase**: `npx tsc --noEmit` + `npm run build` + spot-check 2-3 pages per modified template.

## Risks

| Risk                                            | Mitigation                                                      |
| ----------------------------------------------- | --------------------------------------------------------------- |
| Spec blocks not flexible for non-mosaico        | Audit props before migration; extend generically                |
| Vetrite 3D canvas breaks                        | Keep as standalone client component, compose via optional slot  |
| Hardcoded strings need professional translation | Mark new keys with \_NEEDS_REVIEW suffix                        |
| page.tsx routing changes                        | DO NOT MODIFY ROUTING. Only change template instantiation lines |
