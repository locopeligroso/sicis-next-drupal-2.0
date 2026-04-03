# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### 2026-04-03

#### Contacts page — dedicated template

- **`Contatti.tsx`**: nuovo template dedicato per la pagina contatti, con contenuto hardcoded (sede legale, recapiti, showroom) tradotto in 6 lingue + US.
- **`page.tsx`**: `CONTATTI_SLUGS` set (5 slug localizzati) intercetta prima del dispatch generico `Page` → `Contatti`.
- **i18n**: namespace `contacts` aggiunto a tutti i 6 file `messages/*.json` (8 chiavi: heroTitle, recapiti, showroomWarehouse, phone, fax, email, address, discoverShowrooms).
- **Blocchi Drupal preservati**: `ParagraphResolver` renderizza i paragraph dal CMS sotto il contenuto hardcoded.
- **Form**: placeholder per Gabriele (commento nel codice).

#### Menu CMS-driven — rimozione hardcoded labels

- **Titoli sezione navbar** (Explore, Filter&Find, Projects, Info): ora da `sectionTitles` CMS, non più da `messages/*.json`. Fallback su i18n se CMS vuoto.
- **MegaMenuFilterFind**: descrizioni prodotti (Mosaico, Vetrite, Arredo, ecc.) da `item.description` CMS. Rimosso `DESC_KEY_PATTERNS` (30 keyword × 6 lingue) e `FILTER_FIND_SHORT_TITLES` (11 mapping).
- **MegaMenuProjects**: titoli e descrizioni figli (Progetti, Ambienti, Inspiration, Interior Design) da `item.title` + `item.description` CMS. Rimossi `TITLE_KEYS` e `DESC_KEYS`.
- **MegaMenuInfo**: descrizioni strategic links (Showroom, Contacts, Download) da `item.description` CMS. Rimosso `STRATEGIC_DESC_KEYS`.
- **menu-mapper.ts**: aggiunto `sectionTitles` nel return di `mapMenuToNavbar()`. Rimosso `FILTER_FIND_SHORT_TITLES`.
- **3 componenti** non importano più `useTranslations('nav')` per labels sottomenu.
- Tutte le 6 lingue (IT/EN/FR/DE/ES/RU) servite da Drupal con traduzioni corrette.

#### Infra & security hardening

- **Texture proxy SSRF fix**: `/api/texture` ora accetta solo URL da `DRUPAL_BASE_URL` e domini sicis.com/sicis-stage.com. Blocca protocolli non-http e origini sconosciute con 403.
- **Form sanitization**: `info-generali` e `info-prodotto` route ora escapano HTML in tutti i campi utente (previene XSS in email), validano formato email, e impongono limiti lunghezza (500 char campi brevi, 2000 richiesta).
- **BloccoE eliminato**: componente legacy orfano (191 righe, zero import).

#### Data layer cleanup

- **`resolveImageUrl()`**: nuova utility in `client.ts` — gestisce sia string URL che oggetti Drupal `{uri: {url}}` in un'unica funzione. Additive, nessun caller migrato ancora.
- **`fetchProductsPaginated`**: rinominato da `fetchProducts` per distinguere dal factory (che carica tutto). 2 caller aggiornati.
- **Vetrite cross-filtering baseCount**: stessa logica dual-count di mosaico. Quando finitura P1 attiva, doppia chiamata count (con/senza P1). `baseCount=0` → hidden, `count=0` + `baseCount>0` → dimmed.

#### Vetrite product card — fix image stretching

- **ProductListingTemplate**: vetrite usa `object-contain` per le card prodotto (come illuminazione/arredo). Immagini quadrate non vengono più stretchate nel container 1:2.

#### Test fixes

- Aggiornati 6 test stale: registry vetrite ora include finish P1, factory vetrite usa `field_immagine`, empty response testa il throw ISR.
- **32 nuovi test e2e** (`filters-mosaic-vetrite.spec.ts`): hub + collection + filtri P0/P1 + cross-filtering + persistenza locale /us/ per mosaico e vetrite in IT/EN/US/FR/DE/ES.

#### Tier 1+2 simplification

- **Dead code sweep**: deleted 6 composed components (ActiveFiltersBar, ListingBreadcrumb, ListingToolbar, PixallHubCard) + 2 legacy (FilterSidebar, ProductListing). ~800 lines removed.
- **132 dead nav keys** removed from messages/\*.json (22 keys x 6 locales) after CMS menu migration.
- **`getTitle(node)` + `getBody(node)`** helpers: extracted to field-helpers.ts, 11 templates updated.
- **`CATEGORY_LISTING_TYPES`** deduplicated to module scope in page.tsx.
- **`TAXONOMY_LISTING_MAP`**: 4 identical taxonomy interception blocks consolidated to 1 lookup + handler.
- **`resolveHubParentNid()`**: 3 identical hub NID resolution blocks extracted to `_helpers.ts`.
- **Legacy breadcrumbs removed** from ProdottoTessuto, ProdottoIlluminazione, ProdottoArredoFiniture (PageBreadcrumb from page.tsx replaces them).
- **Menu mapper test** updated for CMS-driven titles (no more FILTER_FIND_SHORT_TITLES abbreviations).
- **page.tsx**: 1133 → 1008 lines (-11%).

#### GenE block + Pixall routing

- **GenE block** (`blocco_e`): renders technical links grid (catalogs, certifications, tutorials, display solutions) with locale-aware aliases. Wired in ParagraphResolver.
- **Pixall under Mosaic**: `/mosaico/pixall` now intercepts as product listing (prodotto_pixall) instead of empty categoria page.
- **ProductListingTemplate**: Pixall added to CATEGORY_TYPES + CATEGORY_LABEL_KEYS for correct breadcrumb labels.

### 2026-04-02

#### Cross-filtering US stock + baseCount hide/dim

- `mosaic-hub.ts`, `vetrite-hub.ts`: passano `exclude_no_usa_stock=1` a count endpoint su `/us/` — conteggi escludono prodotti out-of-stock.
- `render-product-listing.tsx`: doppia chiamata count in parallelo (con e senza P1) per calcolare `baseCount`. Senza P1, `baseCount = count` cosi le opzioni P0 a zero vengono nascoste (non dimmate).
- Logica hide/dim simmetrica per colore↔collezione:
  - **P0 (collezione/colore) con `baseCount=0`** → hidden (non esiste quella combinazione).
  - **P0 con `baseCount>0` e `count=0`** → dimmed (esiste ma filtrato da P1 attivo).
  - **P1 (shape/finish) con `count=0`** → dimmed.
- `CheckboxFilter`, `ImageListFilter`, `ColorSwatchFilter`: nuova prop `hideZeroCount` con logica `hasNoBase` vs `isZeroCount`.
- Popover "Cambia": opzioni con `count=0` nascoste.
- `use-filter-sync.ts`: click su collezione P0 cancella filtri P1 (shape/finish) — contesto pulito.

#### BloccoE — fix link multilingua

- `BloccoE.tsx`: usa `getLocale()` + `toDrupalLocale()` per link alias tradotti (non piu hardcoded IT).

#### Menu description — solo CMS, niente fallback

- Rimosse chiavi `exploreDesc`/`filterFindDesc`/`projectsDesc`/`infoDesc` da tutti i messages/\*.json.
- NavbarDesktop: mostra description solo se CMS la fornisce, niente fallback.
- `cleanDescription()`: filtra stringa `"None"` da Drupal.

#### Routing fix — info-tecniche-textiles

- `page.tsx`: slug con bundle `page` in Drupal non vengono piu intercettati come listing (fix per pagine info-tecniche-\* figlie di menu prodotto). Eccezione: slug in `LISTING_SLUG_OVERRIDES` restano listing (es. `prodotti-tessili`).

#### Vetrite finiture USA + R3F finish pill UI

- `vetrite-product.ts`: nuovo campo `finitureUsa` da `field_finiture_usa` (Drupal endpoint).
- `ProdottoVetrite.tsx`: su `/us/` mostra solo finiture da `field_finiture_usa`.
- R3F `FinishSelector`: riscritto come pill buttons senza immagini, filtrato per `availableFinishes` su `/us/`. Token DS vetrite.

#### BloccoE — pagine Info Tecniche

- Nuovo `BloccoE.tsx` (legacy provvisorio) per `blocco_e` paragraph: griglia card con documenti, tutorial, pagine referenziate.
- `ParagraphResolver`: dispatch `paragraph--blocco_e`.
- Fix routing: slug `info-tecniche-textiles` non viene piu intercettato come product listing (resolve-path bundle `page` ha priorita).

#### ISR cold start fix

- `product-listing-factory.ts`: `throw` invece di `return []` su risposta vuota. `unstable_cache` non cacha eccezioni — retry automatico.
- Nuovo `error.tsx` boundary per `[...slug]`: safety net primo request, pulsante "Riprova".

#### Menu description da CMS

- `MenuItem.description` mappata da endpoint Drupal menu.
- Navbar Explore subtitle ora da CMS (`menu.sectionDescriptions`) con fallback i18n.

#### Script warmup

- `package.json`: `npm run start:warm`, `npm run warmup`, `npm run warmup:full`.

#### Sample Cart — sistema richiesta campioni per /us/ (mosaico + vetrite)

Riscrittura nativa del widget `sicis-ecommerce-react` (IIFE) come componenti Next.js integrati nel Design System. Carrello campioni con checkout PayPal, solo locale `/us/`.

**Domain layer** (`src/domain/sample-cart/`):

- `types.ts`: tipi cart, pricing, shipping, checkout. `SampleProductType = 'mosaico' | 'vetrite'`.
- `cart-logic.ts`: funzioni pure — `addItem`, `removeItem`, `clearCart`, `getPricingSummary`. Free tier: 5 mosaici + 3 vetrite, poi $20 flat.
- `pricing.ts`: calcolo costi spedizione per 4 regioni USA (east/central/west/outer), 4 fasce quantità.
- `shipping-data.json`: 50 stati + DC mappati alle 4 regioni con costi e tempi.
- `storage.ts`: persistenza localStorage con contratto `useSyncExternalStore` (SSR-safe, cross-tab sync).
- `SampleCartProvider.tsx`: React Context + `useSampleCart()` hook. Locale-gated: no-op su non-US.
- 51 unit test (cart-logic + pricing).

**UI components** (`src/components/composed/`):

- `SampleCartSheet.tsx`: Sheet multi-step (cart review → checkout form 16 campi → summary + PayPal redirect).
- `SampleCartBadge.tsx`: icona carrello nel Navbar con badge contatore. Auto-hidden su non-US.
- `AddToSampleCartButton.tsx`: bottone "Request Sample" con stati (default/added/in-cart), selector variante per vetrite.
- `VetriteSampleSection.tsx`: wrapper client per template legacy ProdottoVetrite.

**Server Action** (`src/lib/actions/sample-checkout.ts`):

- `submitSampleCheckout`: POST a Drupal `/ecstore/checkout/confirm`, ritorna `approval_url` PayPal.

**Wiring**:

- `layout.tsx`: `SampleCartProvider` wrappa tutto il contenuto dentro `NextIntlClientProvider`.
- `ProductCta.tsx`: prop `sampleItem` sostituisce `onRequestSample` callback (mai implementato). Renderizza `AddToSampleCartButton`.
- `SpecProductHero.tsx`: passa `sampleItem` + `variantOptions` a `ProductCta`.
- `MosaicProductPreview.tsx`: costruisce `sampleItem` da `MosaicProduct` data (US + hasSample gated).
- `ProdottoVetrite.tsx`: aggiunto `VetriteSampleSection` con selector finiture USA.
- `NavbarDesktop.tsx` + `NavbarMobile.tsx`: aggiunto `SampleCartBadge`.

**i18n**: namespace `sampleCart` aggiunto a tutti e 6 i file `messages/*.json` (~45 chiavi). IT tradotto, altri locali con placeholder EN.

**Zero dipendenze npm nuove.**

#### US out-of-stock — prodotti non disponibili nascosti su /us/

Prodotti mosaico e vetrite con `noUsaStock=true` completamente nascosti su `/us/`:

- **Pagine dettaglio**: `notFound()` in `[...slug]/page.tsx` per mosaico e vetrite.
- **Listing grids**: filtro `products.filter(p => !p.noUsaStock)` in `product-listing-factory.ts` e `products.ts`.
- **Normalizer robusto**: `toBool()` ora accetta `'1'`, `'On'`, `'True'`, `true` (Drupal manda formati diversi tra listing e detail endpoint).
- `ProductListingItemRest`: aggiunto `field_no_usa_stock` al tipo REST.
- `ProductCard`: aggiunto `noUsaStock: boolean` all'interfaccia normalizzata.

#### Fix — ISR cold start: listing vuoti dopo build

- `product-listing-factory.ts`: `throw` invece di `return { products: [], total: 0 }` quando Drupal non risponde. `unstable_cache` non cacha eccezioni → retry automatico al prossimo request. Su revalidate, Next.js mantiene l'ultima pagina valida in cache.
- Nuovo `error.tsx` boundary per `[...slug]` — safety net per il primo request in assoluto (mai cachato). Mostra "Riprova" con retry che trova Drupal warm.

#### Vetrite finiture USA

- `vetrite-product.ts`: nuovo campo `finitureUsa: string[]` da `field_finiture_usa` (endpoint Drupal).
- `ProdottoVetrite.tsx`: su `/us/` mostra solo le finiture da `field_finiture_usa` invece di tutte.
- R3F fullscreen: `FinishSelector` riscritto con pill buttons (no immagini), filtrati per `availableFinishes` su `/us/`. Usa token DS vetrite (`--hs-surface-on`, `--hs-radius-full`).

#### SpecHubMosaico redesign — colori + collezioni affiancati

- Colori e collezioni affiancati su desktop (grid 75%/25%) invece che impilati verticalmente.
- Collezioni da CategoryCard grandi a lista compatta (thumbnail 32px + label), stile sidebar.
- Mobile: colori full width, collezioni in Collapsible chiuso di default.
- Applicato a mosaico e vetrite (entrambi usano SpecHubMosaico).

#### SmartBreadcrumb — breadcrumb generico con dropdown siblings

- Nuovo Composed `SmartBreadcrumb`: ogni segmento con siblings rende un dropdown per navigare tra pagine allo stesso livello.
- Sostituisce `ListingBreadcrumb` in `ProductListingTemplate` (hub + listing mode).
- Segmenti risolti dal chiamante — nessuna logica di dominio nel componente.

#### Debug Mode — overlay visuale blocchi

- Sistema dev-only: outline verde = DS, rosso = legacy, badge con nome blocco.
- Pulsante toggle "Debug Mode" (bottom-right), stato persistito in localStorage.
- Indicatore breakpoint visibile quando debug mode attivo.
- Iniettato in ParagraphResolver (Gen* + Blocco*), ProductListingTemplate, ProdottoMosaico, MosaicProductPreview.

#### Template cleanup — blocchi gestiscono il proprio contenitore

- Rimosso `max-w-main mx-auto px-(--spacing-page)` dal wrapper hub in ProductListingTemplate.
- `SpecListingHeader`, `SpecHubMosaico`, `SpecHubArredo` ora gestiscono il proprio contenitore.
- Regola: il breadcrumb va dentro i blocchi intro, non nei template (applicazione incrementale).

#### Fix — hub category/color hrefs perdevano `/us/` locale

- `mosaic-hub.ts`, `vetrite-hub.ts`: gli href delle category card e color swatch nel hub usavano il locale Drupal (`/en/`) invece del locale Next.js (`/us/`). Ora `stripDomain` + `stripLocalePrefix` + `/${locale}` garantiscono la persistenza del prefisso `/us/` su tutti gli hub (mosaico, vetrite, arredo, tessili, illuminazione) e sotto-pagine (collezioni, colori).

#### Form i18n + rename componenti (Gabriele)

- `QuoteFormSheet` rinominato `InfoProdottoForm` — form richiesta info prodotto con Dialog (non piu Sheet).
- Nuovo `InfoGeneraliForm` — form richiesta informazioni generali con route dedicata `/api/info-generali`.
- Route `/api/quote` rinominata `/api/info-prodotto`.
- Aggiunte 37 chiavi i18n per form a tutti i 6 `messages/*.json` (namespace `forms`).

#### Fix — locale prefix missing on product hrefs (`/us/`)

- `ProductGrid.tsx`: product card `href` ora usa `` `/${locale}${product.path}` `` — in precedenza la rotta `/us/` generava link senza prefisso locale, causando 404 sul click.

#### Filtri mosaico P1 — cross-filtering e subcategorie illuminazione/tessili

- P1 sidebar mosaico: click su un filtro attivo lo deseleziona, click su uno diverso mantiene gli altri — logica cross-filtering coerente con il comportamento P0.
- Filtri P1 non si azzerano automaticamente quando il count scende a 0 — deselect solo su click esplicito.
- Subcategorie illuminazione e tessili: conteggi NeoColibrì/Neoglass calcolati con fetch parallelo per sub-collection e sommati.

#### Form — InfoProdottoForm e InfoGeneraliForm con i18n

- **InfoProdottoForm** (ex QuoteFormSheet): form "Info prodotto" in Sheet (slide da destra) nelle pagine mosaico, triggerato dal pulsante "Get a Quote" via `QuoteSheetProvider` context. Campi: email, nome, cognome, nazione, professione, nome prodotto (pre-compilato), richiesta, privacy. API: `/api/info-prodotto`.
- **InfoGeneraliForm**: form "Informazioni generali" in Sheet (slide da destra), triggerato dal pulsante "Contattaci" (`ContactCta`) in fondo a tutte le pagine Ambiente. Campi: email, nome, cognome, nazione, professione, richiesta, privacy. API: `/api/info-generali`.
- **ContactCta**: pulsante "Contattaci" centrato con icona mail, gestisce stato apertura/chiusura del form InfoGeneraliForm.
- **i18n**: sezione `forms` aggiunta a tutti e 6 i locali (IT, EN, FR, DE, ES, RU) con namespace `infoProdotto` e `infoGenerali`. Chiave `common.contactUs` aggiunta a tutti i locali. Entrambi i form usano `useTranslations()`.
- **Naming convention**: componenti form seguono pattern `<NomeForm>Form`, API routes in `/api/info-prodotto` e `/api/info-generali`.
- Email destinatario letta da `process.env.SEND_TO_EMAIL` con guard esplicito (500 se mancante). Invio email via Resend API.

#### Documentazione — aggiornamento completo e pulizia

- Aggiornati: ARCHITECTURE, DESIGN_SYSTEM, TEMPLATES_MIGRATION, DATA_LAYER_ANALYSIS, CHANGELOG.
- Rimossi 9 doc obsoleti (REFACTORING_PLAN, ROADMAP, NEXT_SESSION_PLAN, STRATEGIC_IMPROVEMENTS, TYPE_SAFETY_AUDIT, SICIS_VETRITE_NEXT, ARCHITECTURAL_ASSESSMENT, FREDDI-MOSAIC-FILTERS, DRUPAL_BACKEND_BRIEF).
- Nuovo: `FREDDI-HARDCODED-TEXT-BRIEF.md` — audit completo 109 stringhe hardcoded con priorità e destinazione (i18n/cms).
- Nuovo: `PLAN-I18N-MIGRATION.md` — piano esecutivo migrazione i18n in 4 fasi.

#### Cleanup — artefatti di test e temp rimossi

- Rimossi `.playwright-mcp/`, `coverage/`, `test-results/`, `PERF_BLOAT_REPORT.md`.

---

### 2026-04-01 — Locale US, fix client/server boundary, i18n multilingua

#### Locale US (`/us/`)

- `i18n/request.ts`: import statici espliciti per tutti i locale — `us` riusa `messages/en.json` senza file dedicato
- `toDrupalLocale('us')` → `'en'` già gestito in `apiGet`, `resolvePath`, `fetchMenu`

#### Fix client/server component boundary

- **`ProductPricingCard`**: convertito da async server component (`getTranslations`) a client component (`useTranslations`) — era importato dentro `SpecProductHero` (`'use client'`), causava errore SSR su `/us/`
- **`MosaicProductPreview`**: dynamic import di `next-intl/server` e Spec\* blocks convertiti a import statici

#### Mega menu Filter & Find — i18n video/descrizioni

- `THUMB_VIDEOS`: aggiunte keyword FR (mosaïque, ameublement, éclairage), DE (mosaik, einrichtung, leuchten), ES (iluminación, mueble), RU (мозаика, обстановка, освещение, текстильн)
- `DESC_KEYS` sostituito con `DESC_KEY_PATTERNS` + `resolveDescKey()` — substring match multilingua al posto di exact match

#### Finiture gallery — sidebar a 2 livelli

- Sidebar mostra categoria + fabric figli indentati (es. LEATHERS → Hamptons, Oregon)
- Click su sidebar → smooth scroll (`scrollIntoView`) al target con evidenziazione attiva
- Anchor `id="fabric-{tid}"` + `scroll-mt-32` su ogni fabric section

#### Altro

- `routing-registry.ts`: timeout fetch menu da 8s a 30s (cold cache Drupal)

### 2026-03-31 — Arredo finiture: pagina dedicata stile Molteni

#### Pagina finiture (`/[locale]/arredo/.../finiture`)

Nuova route dedicata alle finiture di ogni prodotto arredo, modellata sul layout di Molteni.

**Routing** (`[...slug]/page.tsx`): intercettazione slug `finiture` come ultimo segmento prima della risoluzione prodotto. Risolve il percorso prodotto senza l'ultimo segmento, verifica bundle `prodotto_arredo`, renderizza `ProdottoArredoFiniture`.

**`ProdottoArredoFiniture.tsx`** (nuovo template): breadcrumb uppercase tracking, titolo stile `"NOME - FINITURE"`, passa entrambe le category list (tessuto + arredo) alla gallery.

**`FinitureGallery.tsx`** (nuovo componente `'use client'`):

- Layout a due colonne: sidebar sinistra sticky con anchor link per categoria + contenuto scrollabile a destra
- Categorie **non** nascoste da tab — tutte visibili in verticale, sidebar naviga via anchor `#cat-{tid}`
- Swatch `aspect-[4/3]` (landscape) anziché quadrato
- Heading fabric: `text-[11px] uppercase tracking-[0.15em]`
- Pulsante "VEDI TUTTI (N)": bordered uppercase `text-[11px]`, solo se varianti > 8

**CTA dal prodotto** (`ProdottoArredo.tsx`): sezioni 6.6/6.7 (rendering inline finiture ~130 righe) sostituite con link CTA `"Vedi tutte le finiture →"` che punta alla pagina dedicata. `_finitureHref` iniettato in `page.tsx` dopo `arredoToLegacyNode`.

#### Data layer (`arredo-product.ts`)

- `field_finiture_arredo.arredo_finiture` ora normalizzato con struttura **3 livelli completa** (categoria → sottogruppo → variante con immagine) — in precedenza strippava i children a `{ tid, name }`
- `ArredoFinitureArredoRest` ridefinito come alias di `ArredoFinituracategoryRest` (stessa shape)
- `ArredoFinituraArredo` ridefinito come alias di `ArredoFinituraCategory`
- `normalizeFabric()`: gestisce Drupal 2-level anomaly — quando un fabric ha `field_immagine` ma nessun children, sintetizza un singolo variant da sé stesso (fix per sezione Marmo su Amaretto Sofa)

#### i18n

`viewAllFinishes` aggiunto a tutti e 6 i file di messaggi (IT/EN/FR/DE/ES/RU).

---

### 2026-03-31 — Performance: Phase 1 + Phase 2 listing optimization

#### P1-A: Serial → Parallel fetches

**`SpecHubArredo.tsx`:** Due catene `await` sequenziali convertite a `Promise.all`:

- `fetchHubCategories(indoorNid)` e `fetchHubCategories(ARREDO_DESCRIPTIVE_PARENT_NID)` ora parallele.
- `resolvePath('/prodotti-tessili/tappeti')`, `fetchContent(337)`, `fetchContent(350)` ora in un unico `Promise.all` (prima `resolvePath` era sequenziale prima del `.all`).

**`render-product-listing.tsx`:**

- `deepDiveLinksPromise` pre-lanciata in hub mode prima del fetch categories (risparmio ~100ms).
- `filterOptionsPromise` avviata all'inizio del branch product-grid, in parallelo con `fetchProductData`.

#### P1-B: ISR cache su hub-links (`hub-links.ts`)

`getHubDeepDiveLinks` ora usa due layer di cache:

- `unstable_cache` (ISR) con `revalidate: 3600` e tag `['menu', 'hub-links']` — persiste il risultato del menu parsing cross-request, evita re-parsing ad ogni ISR cycle.
- `React.cache()` — deduplicates chiamate identiche nello stesso render pass.

#### P1-C: `searchParams` isolation (`[...slug]/page.tsx`)

Rimossa la riga `const sp = await searchParams` dal top-level della page. Sostituita con lazy getter:

```ts
const getSearchParams = () => searchParams ?? Promise.resolve(undefined);
```

Entity detail routes (prodotto\_\*, showroom) non toccano mai `searchParams` — restano fuori dalla dynamic signal. 11 call site aggiornati con `await getSearchParams()` nel proprio branch.

#### P2-A: `unstable_cache` su `renderProductListing` (`render-product-listing.tsx`)

Splitting del data layer in due layer:

- `_fetchListingData` — funzione async che ritorna solo dati serializzabili (`ListingData` interface). Nessun JSX.
- `_cachedFetchListingData` — `unstable_cache(_fetchListingData, ['listing'], { revalidate: 300, tags: ['listing'] })` creata a module scope (non per-request). Next.js auto-appende tutti gli argomenti alla cache key.
- JSX (`CollectionPopoverContent`) costruito fuori dalla cache layer in `renderProductListing`.

#### P2-B: PPR + Suspense boundary

**`next.config.mjs`:** `experimental.ppr: 'incremental'` (hard-deprecated in Next 16.1) sostituito con `cacheComponents: true` a top-level config.

**`page.tsx`:** `export const experimental_ppr = true` aggiunto. Branch single-slug `isListingSlug` wrappato in `<Suspense fallback={<ProductListingSkeleton />}>`.

**`_ListingContent.tsx`** (nuovo): Async Server Component che vive dentro il Suspense. Awaita `searchParams` qui (nel dynamic hole), non a livello page. Risolve `sectionConfig` e `hubParentNid`, poi chiama `renderProductListing`.

**`ProductListingSkeleton.tsx`** (nuovo): Skeleton a 12 card con `animate-pulse` usato come Suspense fallback. Nessun import server-only — safe per uso come fallback PPR.

**Impatto atteso:**

- Listing pages: static shell da CDN a ~0ms TTFB; dynamic hole (griglia prodotti + filtri) streama in.
- Entity detail pages (prodotto\_\*, showroom): non toccano `searchParams` → potenzialmente eligibili per Full Route Cache.
- Hub pages: -40–60% render time grazie ai Promise.all paralleli + ISR cache del menu.

### 2026-03-31

#### Arredo sidebar — category list, subcategory filtering, URL cleanup, sticky scroll

**Category list in sidebar (arredo/illuminazione/tessuto):**

`renderProductListing` ora chiama `fetchHubCategories(hubParentNid, locale)` e passa tutte le categorie come opzioni `ImageListFilter` nella sidebar. Prima la sidebar mostrava solo le sottocategorie del nodo attivo — ora mostra sempre la lista completa (es. tutti gli stili arredo: Sedute, Tavoli, Armadi...).

**Subcategory filter funzionante (`?sub=`):**

Aggiunto `subCategoryNid` tracking in `renderProductListing`: quando `?sub=slug` è attivo, il fetcher usa `effectiveCategoryNid = subCategoryNid` (NID del figlio) invece di quello del parent. In precedenza il bottone cambiava solo l'URL ma il fetch products usava sempre il NID della categoria navigata. Subcategories array ora include `nid: Number(child.nid)`.

**URL cleanup al cambio filtro path-based:**

`useFilterSync.toggleFilter()` ora fa `router.push(basePath)` invece di `router.push(basePath?${searchParams.toString()})` per i filtri path-based — evita che `?sub=sedute` rimanga in URL dopo aver cliccato su un'altra categoria.

**`activePathFilterKey` corretto per TYPOLOGY_TYPES:**

Per prodotto_arredo, prodotto_illuminazione, prodotto_tessuto il filtro P0 è "subcategory" ma la sidebar deve mostrarlo comunque (è il filtro principale). `activePathFilterKey` ora è `undefined` per questi tipi invece di escludere il gruppo dal pannello.

**ImageListFilter — fix conteggio e allineamento:**

- `baseCount ?? count` non più usato come soglia — se il valore è `null`/`undefined`, il filtro è sempre visibile (categorie senza conteggio prodotti)
- Aggiunto `text-left` al bottone per label multiriga

**FilterPanel — sticky CSS puro:**

Rimosso il listener JS `scroll` + `translateY` dinamico. Sostituito con `position: sticky` + `top: calc(72px + 2rem)` + `max-h: calc(100dvh - 72px - 2rem)` + `overflow-y: auto`. La sidebar ora scorre indipendentemente senza jitter e senza JavaScript.

**Label sidebar più descrittive:**

- `SpecFilterSidebarContent` usa `categoryGroup.labelKey` dalla registry (es. `filters.typologies`) invece del fallback generico `t(group.key)`
- `messages/it.json`: `filters.subcategories` → "Filtra per tipo" (era "Sottocategorie")
- Stessa chiave aggiornata in `messages/de.json`, `fr.json`, `es.json`, `ru.json`

---

#### P0 — Eliminazione dead code (6 file)

Rimossi file non più referenziati dopo il refactoring del data layer:

- `src/lib/api/entity.ts` — wrapper C1 legacy (rimpiazzato da `content.ts` + `blocks.ts`)
- `src/lib/api/filters.ts` — `fetchFilterOptions` V3 dead endpoint
- `src/config/env.ts` — duplicato di variabili già in `client.ts`
- `src/lib/api/isr.ts` — helper ISR non più usato dopo la rimozione del `revalidate` globale
- `src/hooks/useFilters.ts` — hook legacy sostituito da `useFilterSync`
- `src/proxy.ts` — file rinominato male (vedi fix middleware sotto)

---

#### Fix — middleware next-intl ripristinato

`src/proxy.ts` conteneva il middleware next-intl ma Next.js ignora qualsiasi file che non si chiami `middleware.ts`. Eliminando `proxy.ts` (P0) il sito tornava 404 su `/`. Creato `src/middleware.ts` con la stessa logica `createMiddleware({ locales, defaultLocale, localePrefix: 'always' })`.

---

#### i18n — chiavi mancanti aggiunte a DE/FR/ES/RU

Aggiunte le chiavi `products.resistant` e `products.absent` a tutti i 4 file locale che le mancavano (de, fr, es, ru). Era un gap noto documentato in CLAUDE.md.

---

#### Test — fix product-listing-factory.test.ts

`EXPECTED_TYPES` aggiornato con `next_art` — test suite ora passa correttamente con `toHaveLength(7)`.

---

#### Arredo routing — Freddi DB changes

`category-hub.ts`: aggiunte costanti `ARREDO_INDOOR_PARENT_NID = 4261` e `ARREDO_DESCRIPTIVE_PARENT_NID = 3522`. Le categorie indoor (Console, Divani, Sedute, ecc.) vengono ora da `/api/v1/categories/4261` invece del NID della hub page.

`SpecHubArredo.tsx`: la hub page mostra sezione Indoor (da NID 4261) + sezione Tipologie descrittive (da NID 3522 — Bar e Ristoranti, Guardaroba, Cucina, Bagno, Porte, Vasche da bagno).

Sidebar arredo: `hubParentNid` è hardcoded a `ARREDO_INDOOR_PARENT_NID = 4261` in tutti i punti di routing — la sidebar mostra le sottocategorie indoor corrette (Console, Divani, Letti...) invece delle categorie descrittive.

---

#### Arredo routing — categorie descrittive slug-based

`category-hub.ts`: aggiunte `slugifyDescriptiveName()` e `fetchDescriptiveCategorySlugToNid(locale)` — ritorna `Map<slug, nid>` per i figli di NID 3522. Necessario perché queste pagine non hanno alias Drupal, quindi `resolvePath` ritorna null e i controlli NID-based erano inefficaci.

`page.tsx`: aggiunto intercettore slug-based prima di tutti i blocchi `slug.length > 1`. Quando il primo segmento è un prefix arredo e il secondo segmento è nella mappa descrittiva, fetcha content+blocks per NID direttamente e renderizza via `COMPONENT_MAP['Categoria']` (blocchi Drupal, nessun listing).

Fix: `/it/arredo/bar-e-ristoranti`, `/it/arredo/guardaroba-e-cabine-armadio`, ecc. non vengono più renderizzati come product listings.

---

#### Arredo/outdoor — pagina dedicata senza sidebar

`page.tsx`: intercettore hardcoded per `secondSlug === 'outdoor'` (NID 348). Chiama `renderProductListing` con `resolvedCategoryNid: 348` e senza `hubParentNid` — griglia prodotti outdoor senza sidebar e senza selettore filtro Cambia, identico al layout di `/it/next-art`.

---

#### Warmup script — `scripts/warmup.mjs`

Nuovo script Node.js ESM (zero dipendenze) per pre-riscaldare la cache ISR di Next.js su tutte le pagine del sito.

**3 tier di discovery:**

- **Tier 1 — Percorsi statici:** hub pages, listing pages, pagine speciali (next-art, showroom, environments, blog, download) per tutti e 6 i locale. ~200 URL.
- **Tier 2 — Categorie dinamiche:** mosaic-collections, mosaic-colors, vetrite-collections, vetrite-colors, categories/4261 (arredo indoor), categories/3522 (arredo descrittive) — costruisce gli URL dalla risposta Drupal REST. ~100–300 URL.
- **Tier 3 — Prodotti e contenuti individuali:** tutti gli endpoint listing Drupal (mosaico, vetrite, arredo, tessuto, pixall, illuminazione + articles, news, tutorials, projects, environments, showrooms) — scopre URL tramite il campo `view_node`. ~15k URL totali.

**Opzioni CLI:**

```
node scripts/warmup.mjs [--base=URL] [--drupal=URL] [--concurrency=N] [--timeout=MS] [--quick] [--locale=xx] [--dry-run]
```

- `--quick` — salta il Tier 3 (solo hub/listing/tassonomie)
- `--locale=it` — riscalda un solo locale
- `--dry-run` — stampa gli URL senza fare richieste
- `DRUPAL_BASE` / `NEXT_BASE` — sovrascrivibili anche via env var

**Files changed:** `scripts/warmup.mjs` (nuovo, 542 righe)

---

### 2026-03-30

#### Content listings, filter sidebar, arredo hub, showroom detail

**6 content listing fetchers rewritten to match real Drupal response shapes:**

All endpoints return raw arrays (not `PaginatedResponse`). Fetchers updated: `fetchEnvironments`, `fetchShowrooms`, `fetchProjects`, `fetchArticles` (NEW), `fetchNews` (NEW), `fetchTutorials` (NEW). `fetchBlogPosts` now aggregates articles+news+tutorials in parallel. `unixToIso()` removed — `field_data` is already ISO.

**Content listing routing (blog/showroom/environments 404 fix):**

Added `CONTENT_LISTING_SLUGS` early interception in page.tsx BEFORE `LISTING_SLUG_OVERRIDES` — fixes 404s when Drupal routing registry catches content slugs before the listing renderer. Blog (`/en/blog`), showroom, environments, projects, download catalogues all work even with Drupal offline.

**Showroom detail page (`showroom/{nid}` endpoint):**

New fetcher `src/lib/api/showroom-detail.ts` — calls `showroom/{nid}` (singular). Gallery images wrapped in `{ uri: { url } }` for `getDrupalImageUrl` compatibility. Only first gallery image shown as hero preview. Intercepted in page.tsx via `resolved.bundle === 'showroom'`.

**Filter sidebar reactivated (mosaic/vetrite):**

New `src/lib/api/filter-options.ts` — `fetchListingFilterOptions()` fetches from alive hub endpoints (`mosaic-colors`, `mosaic-collections`, `vetrite-colors`, `vetrite-collections`, `categories/{nid}`) instead of dead V3/V4 taxonomy endpoints. Change popover + sidebar functional for mosaico/vetrite.

**Arredo hub sections (SpecHubArredo):**

- **Indoor** — heading renamed from "Esplora per tipologia" (arredo-only)
- **Outdoor** — PixallHubCard, image from `content/348` (fetched by NID directly, avoids cross-locale alias issues)
- **Next Art** — PixallHubCard, image from `content/3545`
- **Discover also** — CategoryCards for Illuminazione (`content/337`) + Carpets (`content/350`) with images
- Non-arredo hubs (illuminazione/tessuto) unchanged

**getPageData fallback for unsupported bundles:**

When `resolvePath` succeeds but `content/{nid}` returns empty, `getPageData` now creates a minimal entity with type/id/langcode so COMPONENT_MAP can still dispatch to the correct template.

---

#### Refactoring — factory listing fetcher, renderProductListing extraction, taxonomy template cleanup

**Factory listing fetcher (`src/lib/api/product-listing-factory.ts`):**

6 near-identical `*-product-listing.ts` files (mosaic, vetrite, arredo, illuminazione, textile, pixall) consolidated into a single config-driven factory. Each file had the same pattern: raw REST interface → `normalizeItem()` → `cache()`-wrapped fetcher. The factory captures the 5 axes of variation (endpoint name, image field, price field, priceOnDemand strategy, param shape) in `PRODUCT_LISTING_CONFIGS` and exposes a single entry point: `fetchProductListing(productType, locale, params?)`.

- Deleted: `mosaic-product-listing.ts`, `vetrite-product-listing.ts`, `arredo-product-listing.ts`, `illuminazione-product-listing.ts`, `textile-product-listing.ts`, `pixall-product-listing.ts`
- 3 param shapes: `dual-tid` (mosaic/vetrite), `single-nid` (arredo/illuminazione/tessuto), `none` (pixall)
- Per-type `cache()` identity preserved via eager `FETCHER_REGISTRY`

**renderProductListing extraction (`src/lib/render-product-listing.tsx`):**

Extracted the ~320-line `renderProductListing()` helper from `page.tsx` into its own module. Reduces page.tsx complexity and makes the listing orchestration logic independently testable. All imports (6 listing fetchers, `ProductListingTemplate`, `CollectionPopoverContent`, `fetchHubCategories`) moved to the new module.

**Taxonomy template elimination:**

Removed 4 dead taxonomy templates that were unreachable since resolve-path intercepts taxonomy bundles (`mosaico_collezioni`, `mosaico_colori`, `vetrite_collezioni`, `vetrite_colori`) before the COMPONENT_MAP dispatch:

- Deleted: `MosaicoCollezione.tsx`, `MosaicoColore.tsx`, `VetriteCollezione.tsx`, `VetriteColore.tsx`
- Removed imports, COMPONENT_MAP entries, and `node-resolver.ts` mappings
- Generic `TaxonomyTerm.tsx` fallback preserved

**Data layer tests (106 tests):**

- `product-listing-factory.test.ts` (43 tests) — URL building per param shape, normalizer per product type, priceOnDemand variants, emptyToNull edge cases
- `products-normalizer.test.ts` (63 tests) — type prefix, priceOnDemand casting, toAbsoluteUrl, filtersToQueryParams mapping, getCategoriaProductType locale coverage

**Files changed:** 4 created, 3 modified, 10 deleted. `page.tsx` reduced by ~350 lines.

---

#### Performance optimizations — 13× faster product pages, streaming, dead code purge

**Measured improvements (dev LAN):**

- Product detail: 2.6s → 0.2s (13× faster) — removed 6s C1 timeout from getPageData
- Homepage: 8.8s → 1.2s (7× faster) — removed 6s fetchEntity fallback
- Listing filtrato: 7.3s → 4.0s — removed dead fetchFilterCounts base counts (2-4s timeout)
- Hub pages: 3.3s → 0.3s (11× faster) — all hubs fetch internally, no dead V3/V4
- TTFB all pages: under 0.2s — Suspense streaming enabled

**Quick wins:**

- Font loading: `display: 'swap'` + weight 700 on all 3 fonts (Outfit, Geist, Geist Mono)
- Image priority: `priority` prop on first ProductCarousel slide (LCP improvement)
- Prefetch: `prefetch={false}` on CategoryCard/ProductCard links (reduces hub prefetch traffic)
- Request timeout: `AbortSignal.timeout(8000)` on all apiGet calls (prevents 120s hangs)
- Language switcher: C2+R1 calls parallelized via Promise.all (was sequential)

**Streaming:**

- Suspense boundary in layout.tsx wrapping `{children}` — navbar renders instantly
- `loading.tsx` created for `[locale]/` and `[locale]/[...slug]/` route segments

**ISR fix:**

- Removed blanket `export const revalidate = 60` from catch-all page — each fetch uses its own TTL (products 60s, editorial 300s, taxonomy 3600s, menu 600s)

**Dead code purge (all V1-V9 legacy imports removed from page.tsx):**

- `fetchEntity` (C1) — disabled in getPageData, removed from homepage
- `fetchProducts` (V1) — replaced by `useNewListingEndpoint = true` always, using type-specific fetchers with `'all'` fallback
- `fetchFilterCounts` (V2) — both main counts and base counts blocks removed
- `fetchAllFilterOptions` (V3+V4) — removed, hub State 1 entirely skipped
- `fetchFilterOptions`, `fetchCategoryOptions` — imports removed

**Slug-based listing routing:**

- `field_page_id` dependency removed — editorial listing pages (progetti, ambienti, showroom, cataloghi) now detected by URL slug mapping instead of Drupal field

#### New endpoint integration + legacy cleanup — 9 new fetchers, dead V1-V9 calls removed

All legacy Drupal Views endpoints (V1-V9, C1, C2) are confirmed dead (404). Integrated 9 new REST endpoints and removed all dead legacy calls from the routing.

**New fetcher files (9):**

- `src/lib/api/vetrite-hub.ts` — `vetrite-colors` + `vetrite-collections` (hub page)
- `src/lib/api/arredo-product-listing.ts` — `arredo-products/{categoryNid}` (product grid)
- `src/lib/api/illuminazione-product-listing.ts` — `illuminazione-products/{categoryNid}` (product grid)
- `src/lib/api/category-hub.ts` — `categories/{nid}` (replaces dead V4 category-options, with NID deduplication)
- `src/lib/api/illuminazione-product.ts` — `illuminazione-product/{nid}` (single product detail)
- `src/lib/api/content.ts` — `content/{nid}` (basic entity fields, replaces dead C1 entity)
- `src/lib/api/blocks.ts` — `blocks/{nid}` (paragraph blocks, replaces C1 field_blocchi)

**Routing overhaul (`page.tsx`):**

- `getPageData()` refactored: uses `resolvePath` → `content/{nid}` + `blocks/{nid}` as primary, C1 as fallback
- `generateMetadata()` uses same content+blocks fallback for page titles
- Hub State 1: ALL hub types (mosaico, vetrite, arredo, illuminazione, tessuto) now fetch internally — dead V3/V4/V2 calls removed entirely
- Stage 1.5 categoria matching checks basePaths of ALL locales (fixes cross-locale URLs like `/it/lighting/table-lamps`)
- Subcategory resolution replaced: `fetchCategoryOptions` (V4, dead) → `fetchHubCategories` (new `categories/{nid}`)
- Arredo/illuminazione product grid uses new listing endpoints via `useNewListingEndpoint`
- Illuminazione single product routed via resolve-path Stage 1.5
- Homepage (`[locale]/page.tsx`): uses `content/1` + `blocks/1` with C1 fallback

**Removed dead legacy imports:**

- `fetchFilterOptions` — V3 taxonomy endpoint (dead)
- `fetchCategoryOptions` — V4 category-options endpoint (dead)
- Hub State 1 filter/count fetch block — all 50+ lines of dead V3/V4/V2 calls

**Still present (no replacement available — awaiting Freddi):**

- `fetchProducts` (V1) — State 2 fallback when useNewListingEndpoint is false
- `fetchFilterCounts` (V2) — sidebar filter counts in State 2
- `fetchAllFilterOptions` — sidebar filter options in State 2 (returns empty for dead endpoints)
- `fetchProjects/Environments/BlogPosts/Showrooms/Documents` (V5-V9) — content listings via field_page_id

**Component changes:**

- `SpecHubMosaico` — generic: accepts `productType`, dispatches mosaic vs vetrite endpoints
- `SpecHubArredo` — fetches categories internally via `fetchHubCategories`, `slugifyName()` for accented/Cyrillic hrefs
- `ProductListingTemplate` — passes `productType` + `hubParentNid` to hub components
- `ParagraphResolver` — gallery caption: removed filename fallback (blocks/{nid} has no alt text)
- `blocks.ts` — recursive `normalizeImageFields`: converts nested `field_immagine` strings (in field_slide, field_elementi, field_documenti) to C1 shape with 4:3 default dimensions

**Bug fixes:**

- Vetrite hub showed mosaic data → dispatches by productType
- Illuminazione hub broken for FR/DE/ES/RU → 4 missing slugs added to LISTING_SLUG_OVERRIDES
- Language switcher wrong-locale URLs → `translateBasePath` as third fallback in getTranslatedPath
- Tessili hub duplicates → NID-based deduplication in category-hub.ts
- US locale missing i18n hub keys → added to messages/us.json
- Page titles showing "Sicis" → generateMetadata uses content/{nid} fallback

### 2026-03-28

#### Endpoint nomenclature overhaul — descriptive names replace opaque codes

Replaced all shorthand endpoint codes (P1, V3, R1, C1, etc.) with self-describing names throughout documentation and source comments. Convention: **singular = detail** (`mosaic-product`), **plural = listing** (`mosaic-products`). The name matches the Drupal endpoint path.

**Endpoint status classification:**

- **11 NEW definitive endpoints** (type-specific, NID/TID path params, no pagination): `resolve-path`, `mosaic-product`, `vetrite-product`, `textile-product`, `pixall-product`, `mosaic-products`, `vetrite-products`, `textile-products`, `pixall-products`, `mosaic-colors`, `mosaic-collections`
- **14 LEGACY endpoints** (generic Drupal Views, to be rewritten as dedicated endpoints): `entity`, `translate-path`, `products`, `product-counts`, `taxonomy`, `category-options`, `blog`, `projects`, `environments`, `showrooms`, `documents`, `subcategories`, `pages-by-category`, `menu`

**Files changed:** 24 (9 docs, 14 source comments, 1 new script). No runtime code modified — comments and documentation only.

**Verification script:** `scripts/check-endpoints.sh` — curls all 25 endpoints against Drupal and reports HTTP status. Run when local database is online to verify which LEGACY views are active vs disabled.

#### CLAUDE.md reduction — extracted 4 sections to docs/

Reduced `CLAUDE.md` from 56K to 18K chars by extracting large reference sections:

- `docs/ARCHITECTURE.md` (22K) — data layer, endpoint reference, routing pipeline, revalidation
- `docs/DESIGN_SYSTEM.md` (5K) — blocks, composed, primitives, ParagraphResolver
- `docs/TEMPLATES_MIGRATION.md` (6K) — node/taxonomy template status matrix
- `docs/DATA_LAYER_ANALYSIS.md` (8K) — uniformity analysis, 5 heterogeneous problem areas

Each extracted section replaced with 3-5 bullet summary + link in CLAUDE.md.

#### Project configuration initialized

- Created project-specific `CLAUDE.md` at `~/.claude/projects/` with stack, agent routing, critical rules, endpoint architecture overview
- Initialized project memory index at `~/.claude/projects/.../memory/MEMORY.md`

### 2026-03-27

#### R3F 3D Glass Slab Viewer — Interactive canvas on vetrite product pages

Replaced the static main product image on `ProdottoVetrite` with an interactive React Three Fiber canvas showing a 3D glass slab. Ported from the standalone `sicis-vetrite-next` proof-of-concept.

**Architecture:**

- Full TypeScript port of the material system (Solid, Chrome, OpalOff, OpalOn, Glass finishes)
- Self-contained module at `src/r3f/vetrite/` (27 files: config, materials, stores, hooks, components)
- `VetriteCanvasLoader` — client component wrapper with `next/dynamic` + `ssr: false`
- Texture proxy via `/api/texture` route (avoids CORS for WebGL texture loading from Drupal)
- Default HDRI environment (RR.hdr) at `public/assets/hdri/vetrite/`
- Product image from Drupal used as diffuse texture (10% zoom crop)

**Canvas features (identical to sicis-vetrite-next):**

- Slab geometry with mouse-tracking rotation (quaternion slerp)
- Finish Selector (Solid / Chrome / Opalescent OFF / Opalescent ON)
- Mirror toggle with smooth animation (maath/easing damp)
- Opal toggle (pill switch, disabled when Solid/Chrome active)
- Backlight presets (Neutral / Warm / Cold) for Opal ON
- Fullscreen mode with editorial sidebar ("Luxury Atelier Panel")
- Material pre-warming on mount (prevents shader jank)
- RendererSync (tone mapping, exposure, clear color from Zustand store)

**Dependencies added:** three, @react-three/fiber, @react-three/drei, zustand, maath, @types/three

**New files:** `src/r3f/vetrite/` (27 TS files), `src/app/api/texture/route.ts`, `public/assets/hdri/vetrite/RR.hdr`, `public/assets/vetrite/` (4 finish thumbnails), `docs/SICIS_VETRITE_NEXT.md`

---

#### Mosaico Hub — Colori & Collezioni listings from Drupal Views

Replaced the old SpecHubMosaico implementation (which used V3 taxonomy endpoints) with data fetched directly from two Drupal Views REST exports: `mosaic-colors` and `mosaic-collections`.

**New fetcher:** `src/lib/api/mosaic-hub.ts`

- `fetchMosaicColors(locale)` — `/{locale}/api/v1/mosaic-colors` → `MosaicTermItem[]`
- `fetchMosaicCollections(locale)` — `/{locale}/api/v1/mosaic-collections` → `MosaicTermItem[]`
- Response shape: `{ name, field_immagine, view_taxonomy_term }` → normalized to `{ name, imageUrl, href }`
- `href` derived via `stripDomain()` from `view_taxonomy_term` (full Drupal URL → relative path)
- Revalidate: 3600s

**SpecHubMosaico rewrite:**

- Uses DS blocks: `HubSection` (h2 + hr wrapper) + `CategoryCard` (image + title link)
- Colors rendered with `hasColorSwatch` (circular 64px swatch)
- Collections rendered with full image (`object-cover`)
- Removed: Pixall section, "Scopri anche", "Approfondimenti" — hub now shows only the two term listings

**i18n — missing hub keys added to 5 locales:**

| Key                       | EN                    | FR                      | DE                        | ES                     | RU               |
| ------------------------- | --------------------- | ----------------------- | ------------------------- | ---------------------- | ---------------- |
| `hub.exploreByColor`      | Explore by colour     | Explorer par couleur    | Nach Farbe entdecken      | Explorar por color     | По цвету         |
| `hub.exploreByCollection` | Explore by collection | Explorer par collection | Nach Kollektion entdecken | Explorar por colección | По коллекции     |
| `hub.exploreByTypology`   | Explore by typology   | Explorer par typologie  | Nach Typologie entdecken  | Explorar por tipología | По типологии     |
| `hub.solidColours`        | Solid Colours         | Couleurs unies          | Unifarben                 | Colores sólidos        | Однотонные цвета |

**Encoded slug routing fix (FR `mosaïque`, RU `мозаика`):**

- `page.tsx`: `singleSlug` now decoded + NFC-normalized before `LISTING_SLUG_OVERRIDES.has()` check
- `section-config.ts`: both `getSectionConfig()` and `getSectionConfigAsync()` decode + NFC-normalize slug segments
- `registry.ts`: `deslugify()` decodes URL-encoded slugs before `SLUG_OVERRIDES` lookup

**Files changed:** 9 modified + 1 new (`src/lib/api/mosaic-hub.ts`)

---

#### US Locale (`/us/`) — Regional variant for the American market

Added `us` as a 7th locale. It mirrors `en` entirely (same Drupal endpoints, same translations) with US-specific conditional rendering on product pages.

**Core infrastructure:**

- `toDrupalLocale()` in `src/i18n/config.ts` — maps `us → en` for all Drupal API calls
- Applied in 5 API entry points: `apiGet()`, `fetchMenu()`, `fetchMenuForLocale()`, `getTranslatedPath()`, `resolvePath()`
- `resolvePath()` expands aliases post-response: `aliases.us = aliases.en`
- `messages/us.json` — copy of `en.json`
- Filter registry: `basePaths.us` + `pathPrefix.us` for all 6 product types

**Conditional rendering (mosaico + vetrite):**

| Element                                  | `/us/`                           | Other locales |
| ---------------------------------------- | -------------------------------- | ------------- |
| Price                                    | `$` (USD) or `$-----` if not set | Hidden        |
| PricingCard (stock, warehouse, shipping) | Visible                          | Hidden        |
| Request Sample button                    | Visible                          | Hidden        |
| Get a Quote button                       | Visible                          | Visible       |
| Sample image (field_immagine_campione)   | Visible                          | Hidden        |
| Measurements                             | Inch only                        | mm only       |
| Grout consumption                        | kg/sqft                          | kg/m²         |

**Components modified:**

- `SpecProductHero` — `isUs` prop gates PricingCard + Request Sample
- `ProductCta` — `showRequestSample` prop
- `ProductPricingCard` — unchanged (gated by parent)
- `MosaicProductPreview` (page.tsx) — locale-aware price cascade, mm/inch branching, sample image gating
- `ProdottoMosaico` — `getLocale()` for route locale, same conditional logic
- `ProdottoVetrite` — price section US-only, inch/cm dimension gating

**Files changed:** 14 modified + 3 new (messages/us.json, e2e/us-locale.spec.ts, playwright.config.ts)

---

#### New REST View Integration: `mosaic-products` Listing Endpoint

Integrated the new Drupal REST View `mosaic-products/{collectionTid}/{colorTid}` for mosaic product listings, replacing the broken V1 `products/prodotto_mosaico` endpoint for collection pages.

**New fetcher:**

| Fetcher                     | Endpoint                                       | File                                    |
| --------------------------- | ---------------------------------------------- | --------------------------------------- |
| `fetchMosaicProductListing` | `/{locale}/api/v1/mosaic-products/{tid}/{tid}` | `src/lib/api/mosaic-product-listing.ts` |

- Uses `"all"` as wildcard for either filter (e.g. `mosaic-products/58/all` = all products in collection 58)
- Normalizes `view_node` (full Drupal URL) to relative path via `stripDomain()` + `stripLocalePrefix()`
- `field_prezzo_on_demand` mapped from `"Off"`/`"On"` to boolean
- No server-side pagination — endpoint returns all matching items

**Hybrid routing approach (resolve-path TID + renderProductListing UX):**

- `resolvePath()` returns the collection TID directly (e.g. 58 for Murano Smalto) — no extra V3 taxonomy fetch needed
- New `resolvedTid` parameter on `renderProductListing()` — when set with `prodotto_mosaico`, uses `fetchMosaicProductListing` instead of V1
- Full `ProductListingTemplate` UX preserved: filter sidebar, context bar, collection popover
- Single fetch chain: resolve-path (cached 3600s) → mosaic-products/{tid}/all (60s) + filter options (parallel)

**Endpoint shape (`mosaic-products`):**

```
Response: MosaicProductListingItemRest[]
Item: { nid, field_titolo_main, field_immagine, field_prezzo_eu, field_prezzo_usa_sheet, field_prezzo_usa_sqft, field_prezzo_on_demand, view_node }
```

**Files changed:**

- `src/lib/api/mosaic-product-listing.ts` — new fetcher + normalizer
- `src/app/[locale]/[...slug]/page.tsx` — `mosaico_collezioni` handler in resolve-path intercept, `resolvedTid` param on `renderProductListing`, conditional mosaic endpoint in State 2

---

#### Bug Fix: URL-encoded Slug Segments Breaking FR and RU Locales

French (`/fr/mosaïque/murano-smalto`) and Russian (`/ru/мозаика/murano-smalto`) collection pages rendered in hub mode (category cards only, 0 products) instead of product grid mode.

**Root cause:** Next.js passes `slug[]` params URL-encoded (`mosa%C3%AFque`, `%D0%BC%D0%BE%D0%B7%D0%B0%D0%B8%D0%BA%D0%B0`), not decoded. The `===` comparison against decoded NFC strings in `FILTER_REGISTRY.basePaths` failed silently → `parseFiltersFromUrl` returned no active P0 filter → hub mode.

**Fix:** `decodeURIComponent(s).normalize('NFC')` applied in two places:

- `src/domain/filters/search-params.ts` — slug segments normalized before matching against registry basePaths
- `src/app/[locale]/[...slug]/page.tsx` — `renderProductListing` basePath matchCount calculation

**Impact:** All 6 locales now render collection pages correctly. This was a latent bug affecting any locale with non-ASCII characters in the URL path (FR `ï`, RU Cyrillic, ES `á`).

**Files changed:**

- `src/domain/filters/search-params.ts`
- `src/app/[locale]/[...slug]/page.tsx`

---

### 2026-03-26

#### New REST Endpoint Integration: `resolve-path` + Product Endpoints

Replaced the disabled C1 entity endpoint with a new two-step routing pattern: `resolve-path` resolves URL aliases to entity metadata (NID, bundle, locale, multilingual aliases), then type-specific product endpoints fetch the data.

**New fetchers created:**

| Fetcher                    | Endpoint                                     | File                             |
| -------------------------- | -------------------------------------------- | -------------------------------- |
| `resolvePath` (R1)         | `/{locale}/api/v1/resolve-path?path={alias}` | `src/lib/api/resolve-path.ts`    |
| `fetchMosaicProduct` (P1)  | `/{locale}/api/v1/mosaic-product/{nid}`      | `src/lib/api/mosaic-product.ts`  |
| `fetchVetriteProduct` (P2) | `/{locale}/api/v1/vetrite-product/{nid}`     | `src/lib/api/vetrite-product.ts` |
| `fetchTextileProduct` (P3) | `/{locale}/api/v1/textile-product/{nid}`     | `src/lib/api/textile-product.ts` |

**Routing changes (`src/app/[locale]/[...slug]/page.tsx`):**

- Product detail pages (2+ URL segments) now try `resolve-path` before the multi-slug listing interception
- `prodotto_mosaico` → renders via `MosaicProductPreview` using DS Spec\* blocks (SpecProductHero, SpecProductDetails, SpecProductSpecs, SpecProductResources, SpecProductGallery)
- `prodotto_vetrite` → renders via legacy `ProdottoVetrite` template with `vetriteToLegacyNode` adapter
- `prodotto_tessuto` → renders via legacy `ProdottoTessuto` template with `textileToLegacyNode` adapter
- Added `decodeURIComponent` on `drupalPath` for non-Latin scripts (Cyrillic, accented characters)

**Language switcher fix (`src/components/composed/NavLanguageSwitcher.tsx`):**

- Replaced `router.push()` (soft navigation) with `window.location.href` (hard navigation) to force full re-render on locale change — fixes stale RSC layout cache keeping old locale's messages
- Added `decodeURIComponent` in `getTranslatedPath` server action for encoded paths (Cyrillic, French accented)
- `getTranslatedPath` now falls back to `resolve-path` aliases when C2 `translate-path` endpoint is unavailable

**CSP update (`next.config.mjs`):**

- Added `http://192.168.86.201` to `media-src` for local Drupal video playback

**Types added (`src/lib/api/types.ts`):**

- `ResolvePathResponse` (R1) — includes `aliases?: Record<string, string>` for multilingual paths
- `MosaicProductRest`, `MosaicProductCollectionRest`, `MosaicProductDocumentRest`, `MosaicProductGroutRest` (P1)
- `VetriteProductRest`, `VetriteProductCollectionRest`, `VetriteProductDocumentRest` (P2)
- `TextileProductRest`, `TextileProductCategoryRest`, `TextileProductDocumentRest`, `TextileProductFinituraRest`, `TextileProductMaintenanceRest`, `TextileProductTypologyRest` (P3)

**Normalizer pattern established:**
Each product fetcher includes a normalizer that transforms raw Drupal REST shapes into clean typed domain models (boolean coercion, `emptyToNull`, HTML stripping for simple value fields). Legacy template adapters (`vetriteToLegacyNode`, `textileToLegacyNode`) reconstruct C1-like shapes from normalized data.

---

#### Documentation Overhaul: Drupal Data Layer Analysis

15-agent swarm analysis (5 Hermes codebase mapping + 5 Athena best practices research + Apollo strategic analysis + 4 Clio report writers) produced comprehensive documentation replacing all outdated files.

**New/rewritten reports:**

- `docs/API_QUICK_REFERENCE.md` — Endpoint cheat sheet (14 endpoints)
- `docs/DRUPAL_API_CATALOG.md` — Full endpoint reference with response shapes
- `docs/DRUPAL_CONTENT_MAP.md` — Entity types, taxonomy, paragraphs, migration status
- `docs/DRUPAL_FIELD_INVENTORY.md` — Per-template field access map (19 templates)
- `docs/STRATEGIC_IMPROVEMENTS.md` — 15 recommendations in 5 phases with priority matrix
- `docs/DRUPAL_BACKEND_BRIEF_resolve-path.md` — Brief for Drupal team (resolve-path endpoint spec)

**CLAUDE.md updates:**

- Added 3 Gen blocks (GenA, GenB, GenC) — total now 12
- Fixed card ratios (arredo 4/3, not 3/2)
- Added `imageUrlMain` to V1 response documentation
- New section "Data Layer Architecture — Uniformity Analysis" with 5 uniform + 5 heterogeneous dimensions
- Removed obsolete INCLUDE_MAP reference

**Deleted obsolete files:**

- `AGENTS.md` (25KB — JSON:API era docs)
- `TAXONOMY_CATALOG.md` (14KB — replaced by DRUPAL_CONTENT_MAP)
- `docs/superpowers/` (7 completed migration plans/specs)
- 4 root-level dev screenshots (7.7MB)
- `test-results/` (empty directory)

**Restore point:** Tag `pre-rest-views-rebuild` created before REST Views rebuild work.

---

#### Textile Product: Hierarchical Finiture, Maintenance Icons, HTML Fixes

- **Hierarchical finiture support** — `field_finiture_tessuto` now arrives with `children[]` array containing color variants (tid, name, field_codice_colore hex, field_immagine swatch, field_testo composition, field_colore term). Updated `TextileProductFinituraRest` type, normalizer, and legacy adapter to flatten parent→children into the flat array the legacy template expects.
- Added maintenance instruction icons in `ProdottoTessuto` legacy template — `getDrupalImageUrl()` extracts icon URL from `field_immagine` on each maintenance term, rendered as 20x20px inline icon next to term name
- Fixed HTML tag leakage in textile adapter — `field_altezza_cm` and `field_altezza_inch` values stripped of `<p>` tags via `stripHtml()` in `textileToLegacyNode`

**Files changed:**

- `src/lib/api/types.ts` — added `TextileProductFinituraChildRest` with `children[]` + `field_colore` as object
- `src/lib/api/textile-product.ts` — `TextileProductFinituraChild` + `TextileProductFinitura` with hierarchical normalizer
- `src/app/[locale]/[...slug]/page.tsx` — `textileToLegacyNode` flattens children into legacy format
- `src/templates/nodes/ProdottoTessuto.tsx` — added `getDrupalImageUrl` import + icon rendering in maintenance list

---

#### Refactoring Roadmap

Created `docs/REFACTORING_ROADMAP.md` — 23 refactoring items organized by trigger condition (CMS endpoint completion, locale support, DS migration, etc.) with tracking table for endpoint status.

---

#### Image Optimization: `next/image` Migration (Phase 1 — Composed Components)

Migrated all content-image rendering in design-system composed components from native `<img>` to `next/image` `<Image>` for automatic srcset, WebP/AVIF format negotiation, and lazy loading.

**Migrated to `next/image` (fill mode):**

| Component         | `sizes`                                                    | Notes                                                                            |
| ----------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `ProductCard`     | `(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw`  | Product grid cards                                                               |
| `CategoryCard`    | `(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw`  | Category hub cards; swatch variant uses `width={64} height={64}`                 |
| `PixallHubCard`   | `(max-width: 768px) 100vw, 50vw`                           | Pixall product hub card                                                          |
| `GalleryCarousel` | `(max-width: 768px) 100vw, 50vw`                           | Gallery slides                                                                   |
| `ProductCarousel` | `56px` (thumbnails)                                        | Main slides delegate to `ResponsiveImage`; thumbnails use `fill` with fixed size |
| `MediaElement`    | `(max-width: 768px) 100vw, 50vw`                           | Content images in Gen\* paragraph blocks                                         |
| `ResponsiveImage` | Configurable via `sizes` prop (default `100vw`)            | New `sizes` prop added to interface                                              |
| `DocumentCard`    | `(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw` | Document cover images                                                            |

**Intentionally kept as `<img>` (with documentation comments):**

| Component                        | Reason                                                   |
| -------------------------------- | -------------------------------------------------------- |
| `CollectionPopoverContent`       | `size-7` (28px) thumbnail — below 80px threshold         |
| `ContextBar`                     | `size-16` (64px) thumbnail — below 80px threshold        |
| `SwatchList`                     | `size-6` (24px) decorative swatch — below 80px threshold |
| `VimeoPlayer`                    | Poster frame — transient, replaced by iframe on play     |
| `NavbarDesktop` / `NavbarMobile` | Logo — static tiny PNG                                   |
| `SpecProductSpecs`               | Assembly/grouting images — 80x80px decorative            |
| Color swatch `backgroundImage`   | CSS pattern-fill, not an `<img>` element                 |

**Files changed:**

- `src/components/composed/ProductCard.tsx`
- `src/components/composed/CategoryCard.tsx`
- `src/components/composed/PixallHubCard.tsx`
- `src/components/composed/GalleryCarousel.tsx`
- `src/components/composed/ProductCarousel.tsx`
- `src/components/composed/MediaElement.tsx`
- `src/components/composed/ResponsiveImage.tsx`
- `src/components/composed/DocumentCard.tsx`
- `src/components/composed/CollectionPopoverContent.tsx` (skip comment added)
- `src/components/composed/ContextBar.tsx` (skip comment added)
- `src/components/composed/SwatchList.tsx` (skip comment added)

**Policy established:**

> Every `<img>` rendering Drupal content > 100px must use `next/image`. Exceptions: logos, CSS swatches, decorative thumbnails < 80px, video posters, and legacy templates pending DS migration.

**Sentinel quality-gate fixes (post-migration):**

- `CategoryCard.tsx` — Added `sizes="64px"` to fixed-dimension swatch `<Image>` + inline comment
- `VimeoPlayer.tsx` — Added skip comment on poster `<img>` for consistency
- `next.config.mjs` — Added `www.sicis.com` to `remotePatterns` (was missing; CSP already allowed it)

**Verification:** TypeScript check passed (`npx tsc --noEmit`), zero errors. Sentinel quality gate: PASS after fixes.
