# Piano Prossima Sessione

> Data: 2026-03-30 | Agente: Zeus

## Lavoro completato oggi

### Data Layer

- Factory listing fetcher (`product-listing-factory.ts`) — 6 fetcher prodotto consolidati in 1
- `renderProductListing` estratto in modulo dedicato (`src/lib/render-product-listing.tsx`)
- 4 taxonomy templates eliminati (unreachable dead code)
- 6 content listing endpoint integrati (articles, news, tutorials separati da blog)
- Response shape corrette per tutti i fetcher listing (raw arrays, non PaginatedResponse)
- Sidebar filtri riattivata per mosaico/vetrite via `filter-options.ts`
- Showroom detail via `showroom/{nid}` endpoint
- `getPageData()` fallback per bundle senza content/{nid}
- Content listing slugs intercettati prima di LISTING_SLUG_OVERRIDES (fix 404)
- Merge prodotti figli per categorie parent (Seats, Accessories)

### Arredo Hub

- Sezioni Indoor / Outdoor / Next Art / Discover Also
- Immagini da `content/{nid}` (fetch per NID diretto, no resolvePath cross-locale)

### Test

- 184+ test data layer (product-listing-factory, products-normalizer, client-helpers, resolve-path, hub-fetchers, content-blocks)

---

## Da fare prossima sessione

### P0 — Dead Code Cleanup (~30 min, zero rischio)

Tutti paralleli. Elimina file confermati dead (0 import):

| File                      | Motivo                                                  |
| ------------------------- | ------------------------------------------------------- |
| `src/lib/api/entity.ts`   | C1 fetcher, 0 import                                    |
| `src/lib/api/filters.ts`  | V3/V4 dead endpoints, sostituito da `filter-options.ts` |
| `src/config/env.ts`       | 0 import                                                |
| `src/config/isr.ts`       | 0 import                                                |
| `src/hooks/useFilters.ts` | 0 import                                                |
| `src/proxy.ts`            | 0 import                                                |

**NON eliminare**: `translate-path.ts` (usato da NavbarMobile/NavLanguageSwitcher via `get-translated-path.ts`)

Dopo: rimuovi variabili dead in `render-product-listing.tsx` (righe 158-159: `currentPage` e `offset` non usati).

### P1 — Aggiornare REFACTORING_ROADMAP.md (~15 min)

Lo stato tracking è obsoleto. Aggiornare:

- Endpoint arredo: ✅ Attivo (non ⏳)
- Endpoint illuminazione: ✅ Attivo (non ⏳)
- Endpoint pixall: ✅ Attivo (non ⏳)
- Endpoint tessuto: ✅ Attivo (non 🔄)
- Item #16 (unixToIso): ✅ DONE
- Item #18 (MosaicProductPreview extraction): ✅ DONE
- Item #19 (adapter extraction): ✅ DONE

### P2 — Endpoint da verificare con Freddi

| Domanda                                         | Contesto                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `content/{nid}` per bundle `showroom`           | Ritorna `[]` — serve endpoint dedicato o va aggiunto al content view? |
| `content/{nid}` immagini per tutte le categorie | Outdoor (348) funziona ora, verificare le altre                       |
| Endpoint `documents`                            | Confermato attivo? Quale shape?                                       |
| Filtri P1 (shape, finish, type)                 | Servono nuovi endpoint per le opzioni sidebar?                        |
| Filter counts                                   | Endpoint `product-counts` è ancora dead — Freddi lo ricostruisce?     |

### P3 — i18n Quick Wins (~30 min)

- Aggiungere `resistant` e `absent` a DE, FR, ES, RU (mancano, esistono solo in IT/EN)
- 35+ stringhe hardcoded Italian in templates e listing components — estrarre in `messages/*.json`

### P4 — Test factory fix

Il test `product-listing-factory.test.ts` ha un bug: aspetta 6 tipi ma il config ne ha 7 (`next_art` mancante). Fix:

- `EXPECTED_TYPES` array: aggiungere `next_art`
- `toHaveLength(6)` → `toHaveLength(7)`

### P5 — CI/CD + Docker (dal piano originale)

- GitHub Actions: typecheck + build + test su push/PR
- Dockerfile multi-stage per produzione

---

## Stato endpoint Drupal (verificato 2026-03-30)

### Attivi

| Endpoint                         | Tipo       | Shape                                                           |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| `resolve-path`                   | routing    | `{ nid, type, bundle, aliases }`                                |
| `content/{nid}`                  | entity     | `[{ nid, type, field_titolo_main, field_immagine, ... }]`       |
| `blocks/{nid}`                   | paragraphs | `[{ type, pid, field_* }]`                                      |
| `mosaic-product/{nid}`           | detail     | Single product                                                  |
| `vetrite-product/{nid}`          | detail     | Single product                                                  |
| `textile-product/{nid}`          | detail     | Single product                                                  |
| `pixall-product/{nid}`           | detail     | Single product                                                  |
| `arredo-product/{nid}`           | detail     | Single product                                                  |
| `illuminazione-product/{nid}`    | detail     | Single product                                                  |
| `showroom/{nid}`                 | detail     | `[{ nid, field_titolo_main, field_citta, field_gallery, ... }]` |
| `mosaic-products/{tid1}/{tid2}`  | listing    | Raw array                                                       |
| `vetrite-products/{tid1}/{tid2}` | listing    | Raw array                                                       |
| `arredo-products/{nid}`          | listing    | Raw array                                                       |
| `illuminazione-products/{nid}`   | listing    | Raw array                                                       |
| `textile-products/{nid}`         | listing    | Raw array                                                       |
| `pixall-products`                | listing    | Raw array                                                       |
| `mosaic-colors`                  | hub        | Raw array                                                       |
| `mosaic-collections`             | hub        | Raw array                                                       |
| `vetrite-colors`                 | hub        | Raw array                                                       |
| `vetrite-collections`            | hub        | Raw array                                                       |
| `categories/{nid}`               | hub        | Raw array                                                       |
| `projects`                       | listing    | Raw array                                                       |
| `environments`                   | listing    | Raw array                                                       |
| `articles`                       | listing    | Raw array                                                       |
| `news`                           | listing    | Raw array                                                       |
| `tutorials`                      | listing    | Raw array                                                       |
| `showrooms`                      | listing    | Raw array                                                       |
| `menu/main`                      | nav        | Menu tree                                                       |

### Morti (404)

| Endpoint                | Sostituto                             |
| ----------------------- | ------------------------------------- |
| `entity` (C1)           | `content/{nid}` + `blocks/{nid}`      |
| `products` (V1)         | `product-listing-factory.ts`          |
| `product-counts` (V2)   | — (attesa Freddi)                     |
| `taxonomy/{vocab}` (V3) | `filter-options.ts` via hub endpoints |
| `category-options` (V4) | `categories/{nid}`                    |
| `blog` (V5)             | `articles` + `news` + `tutorials`     |
| `documents`             | Da verificare                         |

---

## Architettura routing page.tsx (780 righe)

```
Stage 1: PRODUCTS_MASTER_SLUGS → ProductsMasterPage
Stage 2: CONTENT_LISTING_SLUGS → Blog/Projects/Environments/Showroom/Documents
Stage 3: LISTING_SLUG_OVERRIDES → renderProductListing (hub mode)
Stage 4: resolve-path → product detail / showroom / taxonomy / categoria
Stage 5: getPageData → COMPONENT_MAP dispatch
```

**NON MODIFICARE** la struttura degli stage. Solo i punti di istanziazione template possono cambiare.
