# Refactoring Roadmap — Post CMS REST Migration

> Data: 2026-03-26 | Trigger: completamento progressivo degli endpoint REST Drupal

Questa roadmap elenca i refactoring da eseguire man mano che il backend CMS completa la migrazione da entity/JSON:API ai nuovi endpoint REST dedicati. Ogni sezione ha un **trigger** — la condizione che lo sblocca.

---

## Trigger: Tutti gli endpoint prodotto REST attivi (mosaic-product–pixall-product)

Quando mosaico, vetrite, tessuto, arredo, illuminazione e pixall hanno endpoint REST dedicati funzionanti.

| #   | Refactoring                                                                             | File                                            | Note                                                                            |
| --- | --------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Eliminare Point B (fallback entity ⚠️ LEGACY — Drupal view to be rewritten in page.tsx) | `src/app/[locale]/[...slug]/page.tsx`           | Il blocco `fetchEntity` + `getPageData` fallback non serve più                  |
| 2   | Eliminare `getPageData()` cache wrapper                                                 | `src/app/[locale]/[...slug]/page.tsx`           | Era il wrapper React.cache() per entity ⚠️ LEGACY — Drupal view to be rewritten |
| 3   | Rimuovere import `fetchEntity` e tipo `EntityResponse`                                  | `src/lib/api/entity.ts`, `src/lib/api/types.ts` | Solo se nessun altro consumer li usa                                            |

---

## Trigger: Le View rispettano il locale correttamente

Quando tutti gli endpoint REST restituiscono i dati nella lingua corretta in base al prefisso `/{locale}/` nell'URL.

| #   | Refactoring                           | File                                                                                      | Note                                                                                                                                                                |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4   | Rimuovere workaround JSON:API tessuti | `src/templates/nodes/ProdottoArredo.tsx`, `src/templates/nodes/ProdottoIlluminazione.tsx` | Fetch diretto a `/en/jsonapi/taxonomy_term/...` — unico JSON:API usage del progetto. Eliminabile quando le View REST includono le traduzioni dei termini tassonomia |

---

## Trigger: Le relazioni sono complete in tutti gli endpoint

Quando gli endpoint prodotto includono tutte le relazioni (colori, finiture, texture, stucchi, forma, etc.) e non solo i campi base + collezione.

| #   | Refactoring                                     | File                                                                                                 | Note                                                                                                                             |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 5   | Popolare array vuoti negli adapter              | `src/app/[locale]/[...slug]/page.tsx` (o `src/lib/adapters/legacy-node-adapters.ts` dopo extraction) | Oggi: `field_colori: []`, `field_finiture: []`, `field_texture: []` sono placeholder. Passare i dati reali quando disponibili    |
| 6   | Rimuovere `toImageField()` helper negli adapter | Adapter legacy                                                                                       | Oggi ricostruisce la shape entity endpoint `{ uri: { url } }`. Non serve quando tutti i template sono DS e ricevono URL assoluti |

---

## Trigger: Template DS sostituiscono i legacy

Per ogni prodotto: quando il template DS (Spec\* blocks) sostituisce il template legacy (DrupalImage + CSS modules).

| #   | Refactoring                           | File                                                                            | Note                                                                                                   |
| --- | ------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 7   | Eliminare adapter legacy del prodotto | `vetriteToLegacyNode`, `textileToLegacyNode`, futuri `arredoToLegacyNode`, etc. | Ogni adapter vive fino a quando il template DS lo rimpiazza                                            |
| 8   | Eliminare `DrupalImage` component     | `src/components_legacy/DrupalImage.tsx`                                         | Sostituito da `next/image` via `ResponsiveImage`. Eliminabile quando nessun template legacy lo importa |
| 9   | Eliminare `product.module.css`        | `src/styles/product.module.css`                                                 | CSS modules legacy. Eliminabile quando tutti i template prodotto usano Tailwind                        |

---

## Trigger: translate-path disabilitato definitivamente

Quando `resolve-path` con aliases è l'unico meccanismo di traduzione path.

| #   | Refactoring                                       | File                             | Note                                                                                 |
| --- | ------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| 10  | Rimuovere doppio tentativo in `getTranslatedPath` | `src/lib/get-translated-path.ts` | Oggi: prova translate-path → fallback resolve-path. Semplificare a solo resolve-path |
| 11  | Rimuovere `src/lib/api/translate-path.ts`         | `src/lib/api/translate-path.ts`  | L'intero fetcher translate-path diventa dead code                                    |

---

## Trigger: View listing (products–pages-by-category) ricostruite

Quando le View Drupal per i listing (prodotti, blog, progetti, showroom, etc.) sono ricostruite con nuove response shape.

| #   | Refactoring                             | File                                                                    | Note                                                                  |
| --- | --------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 12  | Aggiornare `types.ts`                   | `src/lib/api/types.ts`                                                  | Le response shape products–pages-by-category cambieranno              |
| 13  | Aggiornare normalizer nei fetcher Views | `src/lib/api/products.ts`, `listings.ts`, `categories.ts`, `filters.ts` | Allineare alle nuove shape                                            |
| 14  | Rimuovere `stripDomain()`               | `src/lib/api/client.ts`                                                 | Se le nuove View non includono il dominio Drupal nei path             |
| 15  | Rimuovere `emptyToNull()`               | `src/lib/api/client.ts`                                                 | Se le nuove View usano `null` invece di `""` per campi immagine vuoti |
| 16  | Rimuovere `unixToIso()`                 | `src/lib/api/listings.ts`                                               | Se le nuove View restituiscono date in ISO 8601 nativo                |

---

## Refactoring strutturali (indipendenti dal CMS)

Da eseguire PRIMA di aggiungere altri product type per evitare accumulo di debito tecnico.

| #   | Refactoring                                                   | Priorità    | Tempo stimato | Note                                                                               |
| --- | ------------------------------------------------------------- | ----------- | ------------- | ---------------------------------------------------------------------------------- |
| 17  | Consolidare resolve-path dispatch in `resolveProductDetail()` | **CRITICA** | 2-3 ore       | Elimina duplicazione tra Point A e Point B — già driftata dopo 1 giorno            |
| 18  | Estrarre `MosaicProductPreview` in file dedicato              | Alta        | 30 min        | 240 righe + 8 dynamic import fuori da page.tsx                                     |
| 19  | Estrarre adapter legacy in modulo dedicato                    | Alta        | 30 min        | `src/lib/adapters/legacy-node-adapters.ts`                                         |
| 20  | Creare shared normalizer utilities                            | Alta        | 1 ora         | `normalizeDocument()` (duplicato 3x), `toArray()`, `toImageField()`, `stripHtml()` |
| 21  | Fix alt text vuoto nelle gallery adapter                      | Media       | 30 min        | Oggi `alt: ''` per tutte le immagini gallery — regressione accessibilità           |
| 22  | Normalizzazione prezzi uniforme                               | Media       | 30 min        | Vetrite filtra "0.00"→null, altri no                                               |
| 23  | `stripHtml` mancante su `peso` tessuto                        | Bassa       | 10 min        | Campo peso ha `<p>` tags non strippati                                             |

---

## Stato tracking

| Trigger                                        | Stato                   | Data completamento |
| ---------------------------------------------- | ----------------------- | ------------------ |
| Endpoint mosaico (mosaic-product)              | ✅ Attivo               | 2026-03-26         |
| Endpoint vetrite (vetrite-product)             | ✅ Attivo               | 2026-03-26         |
| Endpoint tessuto (textile-product)             | 🔄 In corso             | —                  |
| Endpoint arredo (arredo-product)               | ⏳ Pianificato          | —                  |
| Endpoint illuminazione (illuminazione-product) | ⏳ Pianificato          | —                  |
| Endpoint pixall (pixall-product)               | ⏳ Pianificato          | —                  |
| resolve-path                                   | ✅ Attivo (con aliases) | 2026-03-26         |
| View listing products–pages-by-category        | ⏳ Da ricostruire       | —                  |
| entity ⚠️ LEGACY — Drupal view to be rewritten | 🔴 Da riscrivere        | —                  |
| translate-path ⚠️ LEGACY                       | 🔴 Da riscrivere        | —                  |
| Locale corretto nelle View                     | ❌ Non ancora           | —                  |
| JSON:API workaround tessuti                    | 🔴 Ancora necessario    | —                  |
