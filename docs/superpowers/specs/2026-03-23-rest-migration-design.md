# Design: Migrazione da JSON:API a Views REST + Custom REST

**Data:** 2026-03-23
**Stato:** Approvato
**Scope:** Sostituzione completa di JSON:API con Views REST (listings) e Custom REST module (entity detail) per la comunicazione Next.js-Drupal.

---

## Contesto

Il frontend Next.js 16 comunica con Drupal 10 via JSON:API. Questo causa:

- **Chiamate multiple per pagina:** fino a 6+ chiamate per product listing, 4-5 per category hub
- **Conteggi filtro disabilitati:** richiedevano 27s+ per paginazione forzata di tutti i prodotti
- **Deserializzazione pesante:** INCLUDE_MAP fino a 3 livelli, flattening manuale di relazioni nested
- **Waterfall paragrafi:** secondary fetch sequenziale per gallery, slider, correlati, documenti
- **Pagination loops:** per contare prodotti e raccogliere categorie

### Approccio scelto

**Views REST per listings + Custom REST module per entity detail.**

- Views REST: query builder con join nativi, aggregazione (GROUP BY + COUNT), filtri esposti, paginazione. Una View = una chiamata, dati pre-shaped.
- Custom REST module (`sicis_rest`): un controller PHP che carica un'entity dato il path alias, risolve ricorsivamente tutte le relazioni (paragrafi, taxonomy terms, file), e ritorna JSON pre-shaped.

### Alternative valutate e scartate

- **GraphQL (drupal/graphql v4):** schema definition manuale in PHP per ogni campo, modulo non maturo come Views, curva di apprendimento alta.
- **Views REST per tutto (incluso node detail):** field formatter custom per paragrafi nested sono piu complessi del modulo custom; la UI di Views diventa ingestibile con 15+ content type.
- **Ottimizzazione JSON:API (subrequests, caching):** non risolve i problemi fondamentali (no aggregazione, no custom shaping, multiple chiamate).

---

## Inventario Endpoint

### Endpoint invariati (non JSON:API)

| ID | Endpoint | Note |
|----|----------|------|
| K1 | `/{locale}/api/menu/{name}` | Menu API nativo Drupal. Usato da layout, footer, routing registry. |
| K2 | `POST /api/revalidate` | Webhook ISR Next.js. Nessun fetch verso Drupal. |

### Views REST (11 endpoint)

| ID | Endpoint | Scopo | Sostituisce |
|----|----------|-------|-------------|
| V1 | `GET /api/v1/products/{type}` | Listing prodotti con filtri, sort, paginazione | `fetchProducts()` |
| V2 | `GET /api/v1/products/{type}/counts/{field}` | Conteggi filtro via aggregazione `GROUP BY + COUNT` | `fetchFilterCounts()` (attivo in hub mode, disabilitato in grid mode per 27s) |
| V3 | `GET /api/v1/taxonomy/{vocabulary}` | Termini taxonomy per sidebar filtri | `fetchFilterOptions()` |
| V4 | `GET /api/v1/category-options/{productType}` | Opzioni filtro da `node--categoria` (arredo/illuminazione) | `fetchArredoCategoryOptions()` |
| V5 | `GET /api/v1/blog` | Articolo + news + tutorial unificati | 3x `fetchBlogType()` parallele |
| V6 | `GET /api/v1/projects` | Listing progetti | `fetchProjects()` |
| V7 | `GET /api/v1/environments` | Listing ambienti | `fetchEnvironments()` |
| V8 | `GET /api/v1/showrooms` | Listing showroom | `fetchShowrooms()` |
| V9 | `GET /api/v1/documents` | Listing documenti | `fetchDocuments()` |
| V10 | `GET /api/v1/subcategories/{parentId}` | Sottocategorie di un nodo categoria | `fetchSubcategories()` |
| V11 | `GET /api/v1/pages-by-category/{categoryId}` | Pagine legate a una categoria | `fetchPagesByCategory()` |

### Custom REST Module (2 endpoint)

| ID | Endpoint | Scopo | Sostituisce |
|----|----------|-------|-------------|
| C1 | `GET /api/v1/entity?path={path}&locale={locale}` | Path -> entity completa con paragrafi pre-risolti | `translatePath()` + `fetchJsonApiResource()` + `fetchParagraph()` + fallback EN tessuti |
| C2 | `GET /api/v1/translate-path?path={path}&from={locale}&to={locale}` | Traduzione path cross-locale | `getTranslatedPath()` (2 step sequenziali) |

### Mappatura completa: funzioni attuali -> nuovi endpoint

| Funzione attuale | Call sites | Nuovo endpoint |
|------------------|-----------|----------------|
| `translatePath()` | 3 | C1 (unificato) |
| `fetchJsonApiResource()` | 2 | C1 (unificato) |
| `getResourceByPath()` | 1 | C1 (unificato) |
| `fetchParagraph()` (6 tipi) | N per pagina | **Eliminato** -- C1 pre-risolve |
| `fetchProducts()` | 3 | V1 |
| `fetchFilterOptions()` | N | V3 |
| `fetchArredoCategoryOptions()` | 2 | V4 |
| `fetchFilterCounts()` | N (attivo in hub mode, disabilitato in grid mode) | V2 (attivo ovunque) |
| `fetchAllFilterOptions()` | 2 | V3 + V4 combinati |
| `fetchProjects()` | 1 | V6 |
| `fetchBlogType()` x 3 | 3 | V5 (una sola View) |
| `fetchDocuments()` | 1 | V9 |
| `fetchShowrooms()` | 1 | V8 |
| `fetchEnvironments()` | 1 | V7 |
| `fetchPagesByCategory()` | 1 | V11 |
| `fetchSubcategories()` | 1 | V10 |
| `getTranslatedPath()` | 1 | C2 |
| EN tessuti fallback (inline) | 2 | **Eliminato** -- C1 gestisce |
| `fetchMenu()` | 2 | **Invariato** (K1) |
| `fetchMenuForLocale()` (routing) | 6 | **Invariato** (K1) |
| `loadMoreProducts()` (server action) | 1 | Usa V1 |

---

## Response Shapes (contratto API)

### Convenzioni globali

**Due shape per le immagini** a seconda del contesto:

1. **Listing (Views REST V1-V11):** URL piatto come stringa. I listing non servono alt/dimensioni.
```typescript
// Usato nei card: imageUrl: string | null
```

2. **Entity detail (C1):** struttura compatibile con il deserializer attuale, ma con URL assoluti.
   C1 preserva la stessa shape che `deserializeResource()` produce oggi, cosi i template e
   `getDrupalImageUrl()` continuano a funzionare senza modifiche. La differenza: `uri.url`
   contiene gia l'URL assoluto (non serve piu `DRUPAL_ORIGIN` prefix).
```typescript
// Shape immagine nelle entity response (C1):
{
  type: "file--file",
  uri: { url: "https://drupal.example.com/sites/default/files/image.jpg" },  // URL assoluto
  meta: { alt: "Alt text", width: 800, height: 600 }  // Metadata dalla relazione
}
```

**Testo formattato:** HTML processato da Drupal.
```typescript
interface DrupalText {
  value: string;      // Markup grezzo
  processed: string;  // HTML processato (filtri Drupal applicati)
}
```

**Paginazione:** uniforme su tutti i listing.
```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;      // Pagina corrente (0-based)
  pageSize: number;
}
```

**Locale:** sempre query param `?locale={it|en|fr|de|es|ru}`. Drupal ritorna campi e path alias nella lingua corretta.

### Views REST

**V1** `GET /api/v1/products/{type}?locale=it&page=0&pageSize=48&sort=title&collection=murano-smalto&color=rosso`
```typescript
interface ProductCard {
  id: string;
  type: string;             // e.g. "node--prodotto_mosaico"
  title: string;
  subtitle: string | null;  // Nome collezione/categoria padre
  imageUrl: string | null;
  price: string | null;
  priceOnDemand: boolean;
  path: string | null;      // Path alias con locale (null se non ha alias)
}
// Response: PaginatedResponse<ProductCard>
```

**V2** `GET /api/v1/products/{type}/counts/{field}?locale=it&collection=murano-smalto`
```typescript
// I filtri attivi (escluso quello contato) passati come query params
interface CountsResponse {
  counts: Record<string, number>;  // { "Rosso": 12, "Blu": 8, "Verde": 3 }
}
```

**V3** `GET /api/v1/taxonomy/{vocabulary}?locale=it&include_image=true`
```typescript
interface FilterOption {
  id: string;
  name: string;
  slug: string;             // Derivato da path alias
  imageUrl: string | null;  // Solo se include_image=true
  weight: number;
}
// Response: { items: FilterOption[] }  (no paginazione, max ~200 termini)
```

**V4** `GET /api/v1/category-options/{productType}?locale=it`
```typescript
// Stessa shape di FilterOption. Categorie node--categoria referenziate da prodotti.
// Response: { items: FilterOption[] }
```

**V5** `GET /api/v1/blog?locale=it&page=0&pageSize=24&type=articolo`
```typescript
interface BlogCard {
  id: string;
  type: "articolo" | "news" | "tutorial";
  title: string;
  imageUrl: string | null;
  path: string | null;
  created: string;  // ISO 8601
}
// Response: PaginatedResponse<BlogCard>
```

**V6** `GET /api/v1/projects?locale=it&page=0&pageSize=24`
```typescript
interface ProjectCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string;
  category: string | null;
}
// Response: PaginatedResponse<ProjectCard>
```

**V7** `GET /api/v1/environments?locale=it&page=0&pageSize=24`
```typescript
interface EnvironmentCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string;
}
// Response: PaginatedResponse<EnvironmentCard>
```

**V8** `GET /api/v1/showrooms?locale=it`
```typescript
interface ShowroomCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string;
  address: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  gmapsUrl: string | null;
  externalUrl: string | null;
}
// Response: { items: ShowroomCard[] }
```

**V9** `GET /api/v1/documents?locale=it&type=catalogo`
```typescript
interface DocumentCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string;
  fileUrl: string | null;
  externalUrl: string | null;
  documentType: string | null;
  category: string | null;
}
// Response: { items: DocumentCard[] }
```

**V10** `GET /api/v1/subcategories/{parentUuid}?locale=it`
```typescript
interface CategoryCard {
  id: string;
  uuid: string;
  title: string;
  imageUrl: string | null;
  path: string;
}
// Response: { items: CategoryCard[] }
```

**V11** `GET /api/v1/pages-by-category/{categoryUuid}?locale=it`
```typescript
interface PageCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string;
}
// Response: { items: PageCard[] }
```

### Custom REST

**C1** `GET /api/v1/entity?path=/mosaico/murano-smalto-10-01&locale=it`
```typescript
interface EntityResponse {
  meta: {
    type: "node" | "taxonomy_term";
    bundle: string;           // "prodotto_mosaico", "mosaico_collezioni", etc.
    id: number;
    uuid: string;
    locale: string;
    path: string;             // Path alias canonico
  };
  data: Record<string, unknown>;  // Campi specifici del bundle
}
```

**Principi della struttura `data`:**

La struttura `data` di C1 DEVE essere compatibile con l'output attuale di `deserializeResource()`.
Questo significa che i template e gli helper esistenti (`getDrupalImageUrl()`, `getTextValue()`,
`getBoolValue()`, gli adapter Gen* in ParagraphResolver) continuano a funzionare senza modifiche.

1. **Relazioni inline** -- ogni relazione e risolta come oggetto completo, mai `{ type, id }`:
```json
{
  "field_collezione": {
    "type": "taxonomy_term--mosaico_collezioni",
    "name": "Murano Smalto",
    "field_immagine": {
      "type": "file--file",
      "uri": { "url": "https://drupal.example.com/sites/default/files/collection.jpg" },
      "meta": { "alt": "Murano Smalto", "width": 800, "height": 600 }
    },
    "field_dimensione_foglio_inch": "12x12",
    "field_documenti": [
      {
        "type": "node--documento",
        "title": "Catalogo Murano",
        "field_allegato": {
          "type": "file--file",
          "uri": { "url": "https://drupal.example.com/sites/default/files/catalogo.pdf" }
        },
        "field_immagine": {
          "type": "file--file",
          "uri": { "url": "https://drupal.example.com/sites/default/files/doc-cover.jpg" },
          "meta": { "alt": "Catalogo", "width": 400, "height": 300 }
        }
      }
    ]
  }
}
```

2. **Paragrafi pre-risolti** -- tutti i livelli di nesting risolti ricorsivamente.
   La shape di ogni paragrafo e identica a quella che `fetchParagraph()` ritorna oggi:
```json
{
  "field_blocchi": [
    {
      "type": "paragraph--blocco_gallery",
      "field_titolo_formattato": "Gallery Title",
      "field_slide": [
        {
          "type": "paragraph--blocco_gallery_slide",
          "field_immagine": {
            "type": "file--file",
            "uri": { "url": "https://drupal.example.com/sites/default/files/slide1.jpg" },
            "meta": { "alt": "Slide 1", "width": 1200, "height": 800 }
          }
        }
      ]
    },
    {
      "type": "paragraph--blocco_intro",
      "field_titolo_formattato": "Intro Title",
      "field_testo": { "value": "<p>Raw</p>", "processed": "<p>HTML content</p>" },
      "field_immagine": {
        "type": "file--file",
        "uri": { "url": "https://drupal.example.com/sites/default/files/intro.jpg" },
        "meta": { "alt": "Intro", "width": 600, "height": 400 }
      }
    }
  ]
}
```

3. **Tessuti con fallback EN** -- il modulo gestisce internamente: se un termine manca di nome nella locale corrente, usa il nome EN. Istruzioni esplicite nel piano Drupal.

4. **Immagini con URL assoluto** -- tutti i `uri.url` sono URL assoluti (non relativi). `getDrupalImageUrl()` viene semplificato a estrarre `uri.url` senza aggiungere `DRUPAL_ORIGIN`.

5. **Bundle-specific fields** -- il modulo conosce la mappatura bundle -> campi da includere. Non serve INCLUDE_MAP lato Next.js.

6. **Relationship meta preservata** -- la `meta` sulle relazioni immagine (alt, width, height) e inclusa come oggi. I Gen adapter in ParagraphResolver accedono a `field_immagine.meta.alt` e questo pattern resta invariato.

**C2** `GET /api/v1/translate-path?path=/mosaico/murano-smalto&from=it&to=en`
```typescript
interface TranslatePathResponse {
  translatedPath: string | null;  // "/en/mosaic/murano-smalto" o null
}
```

---

## Redesign Data Layer Next.js

### Nuova struttura: `src/lib/api/`

Coesiste con `src/lib/drupal/` durante la migrazione, poi il vecchio viene eliminato.

```
src/lib/api/
  client.ts            -- Fetch wrapper base (apiGet, gestione errori, caching)
  products.ts          -- V1 (fetchProducts), V2 (fetchFilterCounts)
  filters.ts           -- V3 (fetchFilterOptions), V4 (fetchCategoryOptions)
  listings.ts          -- V5 (blog), V6 (projects), V7 (environments), V8 (showrooms), V9 (documents)
  categories.ts        -- V10 (subcategories), V11 (pages-by-category)
  entity.ts            -- C1 (fetchEntity)
  translate-path.ts    -- C2 (translatePath)
  types.ts             -- Tutte le response interfaces
  index.ts             -- Barrel export
```

### Flusso catch-all route semplificato

**Prima (5 step sequenziali + N secondary fetches):**
```
translatePath(path, locale)          -> tipo + bundle + jsonapi URL
getIncludeFields(bundle)             -> stringa includes
fetchJsonApiResource(url, includes)  -> dato grezzo JSON:API
deserializeResource(data, included)  -> dato flat
ParagraphResolver -> fetchParagraph() x N  -> paragrafi risolti
```

**Dopo (1 chiamata):**
```
fetchEntity(path, locale)            -> { meta, data } tutto pre-risolto
render template con data             -> nessun secondary fetch
```

La logica di routing (LISTING_SLUG_OVERRIDES, `getSectionConfigAsync`, routing registry) non cambia -- si basa sui menu (K1), non su JSON:API.

### File eliminati

| File | Motivo |
|------|--------|
| `src/lib/drupal/core.ts` | translatePath + fetchJsonApiResource -> C1 |
| `src/lib/drupal/deserializer.ts` | Drupal ritorna dati pre-shaped |
| `src/lib/drupal/deserializer.test.ts` | Test del deserializer obsoleto |
| `src/lib/drupal/image.ts` | Drupal ritorna URL assoluti |
| `src/lib/drupal/paragraphs.ts` | Secondary fetches eliminati |
| `src/lib/drupal/products.ts` | -> `src/lib/api/products.ts` |
| `src/lib/drupal/filters.ts` | -> `src/lib/api/filters.ts` |
| `src/lib/drupal/blog.ts` | -> `src/lib/api/listings.ts` |
| `src/lib/drupal/projects.ts` | -> `src/lib/api/listings.ts` |
| `src/lib/drupal/environments.ts` | -> `src/lib/api/listings.ts` |
| `src/lib/drupal/showrooms.ts` | -> `src/lib/api/listings.ts` |
| `src/lib/drupal/documents.ts` | -> `src/lib/api/listings.ts` |
| `src/lib/drupal/subcategories.ts` | -> `src/lib/api/categories.ts` |
| `src/lib/drupal/pages-by-category.ts` | -> `src/lib/api/categories.ts` |
| `src/lib/drupal/translated-path.ts` | -> `src/lib/api/translate-path.ts` |
| `src/lib/drupal/types.ts` | -> `src/lib/api/types.ts` |

### File ridotti (non eliminati)

| File | Cosa rimuovere | Cosa resta |
|------|----------------|------------|
| `src/lib/node-resolver.ts` | `INCLUDE_MAP`, `getIncludeFields()` | `getComponentName()` (dispatch template), `getRevalidateTime()` (ISR TTL) |
| `src/lib/drupal/image.ts` | Logica `DRUPAL_ORIGIN` prefix | `getDrupalImageUrl()` semplificato: estrae solo `uri.url` (gia assoluto da C1) |
| `src/domain/filters/search-params.ts` | `buildJsonApiFilters()` (dead code con Views REST) | `parseFiltersFromUrl()`, `parseAsString`, `parseAsArrayOf` (nuqs) |

### File invariati

| File/Area | Motivo |
|-----------|--------|
| `src/lib/drupal/config.ts` | DRUPAL_BASE_URL e DRUPAL_ORIGIN servono ancora |
| `src/lib/drupal/menu.ts` | Usa `/api/menu/` (non JSON:API) |
| `src/domain/routing/` | Routing registry usa menu API |
| `src/domain/filters/registry.ts` | FILTER_REGISTRY, deslugify -- logica pura |
| `src/domain/filters/search-params.ts` | nuqs integration -- logica pura |
| `src/lib/navbar/` | Menu mapper -- logica pura |
| `src/app/api/revalidate/` | Webhook ISR |
| `src/lib/actions/load-more-products.ts` | Cambia solo l'import |
| `src/lib/get-translated-path.ts` | Cambia solo l'import |
| `src/lib/field-helpers.ts` | Helper puri per estrazione campi (getTextValue, getBoolValue, etc.) |
| `src/lib/product-helpers.ts` | Helper puri (color swatch, retinatura). `getCategoriaProductType()` e `slugToTermName()` migrati in `src/lib/api/products.ts` |
| `src/lib/sanitize.ts`, `src/lib/utils.ts` | Utility pure, nessuna dipendenza API |

### Caching e revalidation

**`React.cache()`:** Tutte le funzioni in `src/lib/api/` che servono sia `generateMetadata()` che il body della pagina devono essere wrappate con `React.cache()` per evitare doppio fetch. In particolare `fetchEntity()` (C1) sostituisce `getPageData()` che oggi usa cache().

**ISR revalidation:** `fetchEntity()` deve accettare un parametro `revalidate` o determinarlo internamente da `meta.bundle` usando `getRevalidateTime()` (che resta in `node-resolver.ts`). I TTL restano invariati:

| Entity Type | TTL |
|---|---|
| Products (6 tipi) | 60s |
| Editorial (articolo, news, tutorial) | 300s |
| Static pages (page, landing_page) | 600s |
| Taxonomy terms | 3600s |

**Slug resolution:** Con Views REST (V1), i filtri vengono passati come slug nei query params (e.g. `?collection=murano-smalto`). La risoluzione slug->term-name avviene lato Drupal (la View accetta slug e li risolve internamente). Il map `SLUG_TO_TERM` in `products.ts` e `buildJsonApiFilters()` in `search-params.ts` diventano dead code e vengono rimossi.

### Impatto sui template

I template non cambiano strutturalmente. C1 ritorna la stessa shape del deserializer attuale (vedi sezione Response Shapes). Le differenze:
- Ricevono `data` da C1 invece che da fetchJsonApiResource + deserializer
- La shape dei dati e la stessa (C1 produce output compatibile con `deserializeResource()`)
- `getDrupalImageUrl()` funziona invariato (C1 ritorna `{ uri: { url: "https://..." } }` con URL assoluti)
- Gli adapter Gen* in ParagraphResolver funzionano invariati (C1 preserva `meta` sulle relazioni)
- ParagraphResolver non chiama piu fetchParagraph() -- i paragrafi arrivano gia risolti in `data.field_blocchi`
- ParagraphResolver si semplifica: rimuove needsSecondaryFetch() e fetchParagraph(), diventa puro dispatch (tipo -> componente)
- I template taxonomy (MosaicoCollezione, VetriteCollezione, etc.) aggiornano gli import delle funzioni listing (fetchProducts -> api/products, fetchAllFilterOptions -> api/filters)
- La homepage (`src/app/[locale]/page.tsx`) aggiorna la chiamata da translatePath+fetchJsonApiResource a fetchEntity (C1)

---

## Strategia di Migrazione

### 5 fasi con zero downtime

```
Phase 0        Phase 1           Phase 2           Phase 3         Phase 4       Phase 5
PREPARE   ->  DRUPAL: ADD   ->  NEXT: BUILD   ->  NEXT: SWITCH  ->  DRUPAL: RM  ->  VERIFY
               new endpoints    new data layer    cut over          JSON:API
               (JSON:API ON)    (both layers)     (old layer off)   (disable)
```

### Phase 0 -- Preparazione

**Drupal:**
- `git tag pre-rest-migration` -- restore point
- `drush cex` -- export configurazione completo
- Documentare moduli attivi relativi ad API

**Next.js:**
- `git tag pre-rest-migration` -- restore point
- `npx vitest run` -- tutti i test passano
- `npm run build` -- build ok

### Phase 1 -- Drupal: creare nuovi endpoint

JSON:API resta attivo. Implementazione in ordine crescente di complessita:

| Step | Cosa | Tipo | Complessita |
|------|------|------|-------------|
| 1.1 | Abilitare moduli REST (rest, serialization, views_ui) | Config | Bassa |
| 1.2 | V7 (environments), V8 (showrooms) | Views REST | Bassa |
| 1.3 | V6 (projects), V9 (documents) | Views REST | Bassa |
| 1.4 | V5 (blog unificato) | Views REST | Media |
| 1.5 | V10 (subcategories), V11 (pages-by-category) | Views REST | Media |
| 1.6 | V3 (taxonomy options) | Views REST | Media |
| 1.7 | V4 (category options arredo/illuminazione) | Views REST | Media |
| 1.8 | V1 (product listing) | Views REST | Alta |
| 1.9 | V2 (filter counts) | Views REST | Alta |
| 1.10 | Modulo custom sicis_rest con C1 + C2 | Modulo PHP | Alta |
| 1.11 | Test manuale di tutti gli endpoint | Verifica | -- |

### Phase 2 -- Next.js: costruire nuovo data layer

| Step | Cosa |
|------|------|
| 2.1 | Creare `src/lib/api/client.ts` + `types.ts` |
| 2.2 | Implementare V7, V8 (piu semplici) -> switchare |
| 2.3 | Implementare V5, V6, V9 -> switchare |
| 2.4 | Implementare V3, V4 -> switchare |
| 2.5 | Implementare V1, V2 -> switchare, riabilitare conteggi filtro |
| 2.6 | Implementare V10, V11 -> switchare |
| 2.7 | Implementare C1 -> switchare catch-all route (`src/app/[locale]/[...slug]/page.tsx`) |
| 2.8 | Switchare homepage (`src/app/[locale]/page.tsx`) a C1 |
| 2.9 | Implementare C2 -> switchare getTranslatedPath |
| 2.10 | Semplificare ParagraphResolver (rimuovere needsSecondaryFetch, fetchParagraph) |
| 2.11 | Aggiornare import nei template taxonomy (MosaicoCollezione, VetriteCollezione, etc.) |
| 2.12 | Ridurre `node-resolver.ts` (rimuovere INCLUDE_MAP, getIncludeFields) |
| 2.13 | Semplificare `getDrupalImageUrl()` (rimuovere DRUPAL_ORIGIN prefix, solo estrai uri.url) |
| 2.14 | Rimuovere `buildJsonApiFilters()` e `SLUG_TO_TERM` (dead code) |

### Phase 3 -- Next.js: cutover completo

| Step | Cosa |
|------|------|
| 3.1 | Verificare zero import da `src/lib/drupal/` (tranne config.ts e menu.ts) |
| 3.2 | Eliminare file obsoleti |
| 3.3 | `npx tsc --noEmit` -- zero errori |
| 3.4 | `npx vitest run` -- tutti i test passano |
| 3.5 | `npm run build` -- build ok |
| 3.6 | Test manuale di ogni tipo di pagina (19 node + 5 taxonomy) |

### Phase 4 -- Drupal: rimuovere JSON:API

| Step | Cosa |
|------|------|
| 4.1 | Disabilitare modulo jsonapi |
| 4.2 | Disabilitare modulo decoupled_router |
| 4.3 | Disabilitare jsonapi_menu_items se presente |
| 4.4 | `drush cr` -- cache rebuild |
| 4.5 | Verificare che /api/v1/* funziona |
| 4.6 | Verificare che /api/menu/* funziona |
| 4.7 | `drush cex` -- esportare nuova configurazione |

### Phase 5 -- Verifica finale

| Check | Cosa |
|-------|------|
| 5.1 | Navigare tutti i tipi di pagina nelle 6 lingue |
| 5.2 | Testare filtri prodotto (hub -> griglia -> filtri sidebar) |
| 5.3 | Verificare conteggi filtro funzionanti |
| 5.4 | Testare "Load More" su listing prodotti |
| 5.5 | Testare language switcher (translate-path) |
| 5.6 | Testare menu e footer in tutte le lingue |
| 5.7 | Confronto performance: tempo di risposta prima/dopo |
| 5.8 | Monitoraggio errori per 48h |

---

## Piano per il collega Drupal

Il deliverable principale e un documento Markdown autosufficiente che il collega da a Claude Code. Contiene:

1. **Principi di implementazione** (vincoli non negoziabili)
2. **Contesto del progetto** (cos'e il frontend, perche si migra)
3. **Restore point** (comandi esatti per tag + export config)
4. **Per ogni endpoint (V1-V11, C1-C2):**
   - Scopo e chi lo consuma
   - Path esatto e parametri
   - Response shape attesa con esempio JSON
   - Per Views: content type, campi, relazioni, filtri esposti, sort
   - Per custom: logica PHP, entity loading, risoluzione ricorsiva
5. **Test di validazione** (comandi curl per ogni endpoint)
6. **Phase 4** (istruzioni di cleanup post-migrazione)

### Principi di implementazione (non negoziabili)

Questi principi si applicano a OGNI decisione durante l'implementazione:

- Se un endpoint non funziona come previsto, fermarsi e risolvere il problema alla radice. Mai workaround.
- Se un modulo contrib non supporta un caso d'uso, scrivere codice custom pulito piuttosto che forzare il modulo.
- Se una View non puo esprimere una query, usare un hook o un custom views plugin. Non riadattare la View con hack.
- Se un campo Drupal ha una struttura inaspettata, documentarla e adattare la response shape. Non ignorarla.
- Zero TODO, zero "temporary fix", zero codice commentato. Ogni endpoint e production-ready prima di passare al successivo.
- Se qualcosa e impossibile o troppo complesso, fermarsi e comunicare il blocco. Mai inventare soluzioni creative non richieste.
- L'implementazione deve essere pulita, completa e solida. Nessuna scorciatoia, nessun "faccio dopo", nessun "e brutto ma funziona".

---

## Risultati attesi

| Metrica | Prima | Dopo |
|---------|-------|------|
| Chiamate API per product listing | 2-6+ | 2 (V1 + V3/V4) |
| Chiamate API per category hub | 4-5 | 2 (V3 + V2) |
| Chiamate API per node detail | 1 + N secondary | 1 (C1) |
| Conteggi filtro | Disabilitati (27s) | Attivi (Views aggregation) |
| Blog listing | 3 chiamate parallele | 1 (V5) |
| Deserializzazione client | Complessa (5 livelli) | Zero (dati pre-shaped) |
| File nel data layer | 17+ | 9 |
| Complessita ParagraphResolver | Fetch + dispatch | Solo dispatch |
