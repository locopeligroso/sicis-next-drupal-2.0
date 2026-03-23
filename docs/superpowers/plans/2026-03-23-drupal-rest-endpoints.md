# Drupal REST Endpoints — Piano di Implementazione

> **Per Claude Code:** questo documento contiene TUTTO quello che serve per implementare gli endpoint REST nel progetto Drupal. Leggilo dall'inizio alla fine prima di iniziare. Segui i task in ordine. NON saltare task. NON procedere al task successivo se quello corrente non e completato e validato.

**Goal:** Creare 11 Views REST endpoint + 1 modulo custom con 2 endpoint per sostituire JSON:API come data layer per il frontend Next.js.

**Contesto:** Il frontend Next.js attualmente usa JSON:API per comunicare con Drupal 10. JSON:API causa chiamate multiple per pagina, deserializzazione pesante, e impossibilita di aggregazione (i conteggi filtro sono disabilitati perche richiedono 27s). Stiamo migrando a Views REST (per i listing) e un modulo custom (per il dettaglio entity). Durante la migrazione JSON:API RESTA ATTIVO — il frontend lo usa ancora.

---

## PRINCIPI DI IMPLEMENTAZIONE (NON NEGOZIABILI)

Questi principi si applicano a OGNI decisione durante l'implementazione. Leggili, interiorizzali, applicali.

1. **Se un endpoint non funziona come previsto, fermarsi e risolvere il problema alla radice.** Mai workaround. Mai "funziona abbastanza". Se la View non produce l'output giusto, capire perche e risolvere.

2. **Se un modulo contrib non supporta un caso d'uso, scrivere codice custom pulito piuttosto che forzare il modulo.** Non installare moduli solo per patchare un problema. Un modulo custom ben scritto e meglio di una catena di contrib forzati.

3. **Se una View non puo esprimere una query, usare un hook o un custom views plugin.** Non riadattare la View con hack (es. campi calcolati con PHP inline, aggregazione forzata con hook_views_pre_render).

4. **Se un campo Drupal ha una struttura inaspettata, documentarla e adattare la response shape.** Non ignorarla. Se un campo restituisce dati in formato diverso da quello atteso, notificalo come blocco.

5. **Zero TODO, zero "temporary fix", zero codice commentato.** Ogni endpoint e production-ready prima di passare al successivo.

6. **Se qualcosa e impossibile o troppo complesso, fermarsi e comunicare il blocco.** Mai inventare soluzioni creative non richieste. Scrivi il problema, scrivi cosa hai provato, e fermati.

7. **L'implementazione deve essere pulita, completa e solida.** Nessuna scorciatoia, nessun "faccio dopo", nessun "e brutto ma funziona".

---

## Task 0: Preparazione

- [ ] **Step 1: Creare restore point**

```bash
git tag pre-rest-migration
drush cex -y
git add config/sync/
git commit -m "chore: export config before REST migration"
```

- [ ] **Step 2: Documentare moduli attivi**

```bash
drush pm:list --status=enabled --type=module --format=list | grep -E "jsonapi|rest|serial|views|decoupled" > /tmp/active-api-modules.txt
cat /tmp/active-api-modules.txt
```

Annotare i risultati. Servono per Phase 4 (cleanup).

- [ ] **Step 3: Abilitare moduli necessari**

```bash
drush en rest serialization views_ui -y
drush cr
```

Verificare:
```bash
drush pm:list --status=enabled | grep -E "^rest|^serialization|^views_ui"
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: enable REST and Views UI modules for migration"
```

---

## CONVENZIONI PER TUTTE LE VIEWS

**IMPORTANTE — Output Views pre/post wrapper:**
Le Views REST di Drupal ritornano un **array piatto** `[{...}, {...}]` per default. Il frontend si aspetta `{ items: [...], total, page, pageSize }`. Il wrapping viene implementato nel Task 12 (modulo custom `sicis_rest`). Questo significa che:
- **Tasks 1-11:** le curl di validazione vedranno array piatti `[{...}]`. Verificare la struttura dei singoli oggetti, non il wrapper.
- **Task 12:** il wrapper viene applicato retroattivamente a tutte le Views.
- **Dopo Task 12:** ri-validare tutti gli endpoint per verificare il formato wrappato.

Ogni View REST segue queste convenzioni:

- **Format:** Serializer (JSON)
- **Path prefix:** `/api/v1/`
- **Paginazione:** Mini pager, page size configurabile via query param (default 48 per prodotti, 24 per contenuti)
- **Locale:** Il path della View e prefissato con locale (Drupal lo gestisce nativamente con Content Translation)
- **Risposta:** JSON con struttura `{ items: [...], total: N, page: N, pageSize: N }` — configurare il serializer o un hook per wrappare la risposta
- **Campi:** Output come "fields" (non "rendered entity"), con row style "Data field" se serve aliasing
- **Immagini:** I campi immagine devono restituire URL assoluto, alt text, width, height. Usare il campo Image con formatter "URL" e verificare che l'output includa le dimensioni.

**Nota sulla risposta wrappata:** Views REST di default ritorna un array piatto `[...]`. Il frontend si aspetta `{ items: [...], total: N, page: N, pageSize: N }`. Ci sono due approcci:
1. **Hook `hook_rest_resource_response_alter()`** nel modulo custom `sicis_rest` per wrappare tutte le risposte Views con prefisso `/api/v1/`
2. **Custom serializer** che estende il serializer di Views

L'approccio 1 (hook) e piu semplice e centralizzato. Implementarlo come parte del Task 13 (modulo custom).

---

## Task 1: V7 — Environments Listing

La View piu semplice. Usala come template per tutte le successive.

**Endpoint:** `GET /api/v1/environments?locale={locale}&page={n}&pageSize={n}`

**Response shape:**
```json
{
  "items": [
    {
      "id": "123",
      "title": "Ambiente Bagno Classico",
      "imageUrl": "https://drupal.example.com/sites/default/files/ambiente-bagno.jpg",
      "path": "/it/ambienti/bagno-classico"
    }
  ],
  "total": 42,
  "page": 0,
  "pageSize": 24
}
```

**Configurazione View:**
- Machine name: `api_environments`
- Content type: `ambiente`
- Display: REST export
- Path: `/api/v1/environments`
- Campi:
  - `nid` (aliasato come `id`, output come stringa)
  - `title` oppure `field_titolo_main` (con fallback a title se vuoto)
  - `field_immagine` (URL assoluto — formatter URL to image, include alt/width/height)
  - `path` (alias del path del nodo, con prefisso locale)
- Filtro: `status = 1` (pubblicato)
- Sort: `title ASC`
- Pager: Mini pager, items per page = 24

- [ ] **Step 1: Creare la View**

Crea la View con la configurazione sopra usando la UI o drush/config.

- [ ] **Step 2: Validare la risposta**

```bash
curl -s "http://localhost/it/api/v1/environments" | python3 -m json.tool | head -30
```

Verificare che:
- La risposta contiene un array di oggetti
- Ogni oggetto ha `id`, `title`, `imageUrl`, `path`
- `imageUrl` e un URL assoluto (non relativo)
- `path` inizia con `/{locale}/`

- [ ] **Step 3: Testare paginazione**

```bash
curl -s "http://localhost/it/api/v1/environments?page=1" | python3 -m json.tool | head -5
```

- [ ] **Step 4: Commit**

```bash
drush cex -y
git add config/sync/
git commit -m "feat: add V7 environments REST endpoint"
```

---

## Task 2: V8 — Showrooms Listing

**Endpoint:** `GET /api/v1/showrooms?locale={locale}`

**Response shape:**
```json
{
  "items": [
    {
      "id": "456",
      "title": "Sicis Showroom Milano",
      "imageUrl": "https://drupal.example.com/sites/default/files/showroom-milano.jpg",
      "path": "/it/showroom/milano",
      "address": "Via Montenapoleone 12",
      "city": "Milano",
      "area": "Lombardia",
      "phone": "+39 02 123456",
      "email": "milano@sicis.com",
      "gmapsUrl": "https://maps.google.com/...",
      "externalUrl": "https://..."
    }
  ],
  "total": 8
}
```

**Configurazione View:**
- Machine name: `api_showrooms`
- Content type: `showroom`
- Display: REST export
- Path: `/api/v1/showrooms`
- Campi:
  - `nid` (id)
  - `title` o `field_titolo_main`
  - `field_gallery` (primo elemento, URL assoluto — usare come imageUrl)
  - `path`
  - `field_indirizzo` (address)
  - `field_citta` (city)
  - `field_area` (area)
  - `field_telefono` (phone)
  - `field_indirizzo_email` (email)
  - `field_collegamento_gmaps` (gmapsUrl — campo link, estrarre URL)
  - `field_collegamento_esterno` (externalUrl — campo link, estrarre URL)
- Filtro: `status = 1`
- Sort: `title ASC`
- Pager: nessuno (pochi showroom, tutti in una pagina)

- [ ] **Step 1: Creare la View**
- [ ] **Step 2: Validare la risposta**

```bash
curl -s "http://localhost/it/api/v1/showrooms" | python3 -m json.tool | head -30
```

Verificare tutti i campi presenti e non null dove ci sono dati.

- [ ] **Step 3: Commit**

```bash
drush cex -y && git add config/sync/ && git commit -m "feat: add V8 showrooms REST endpoint"
```

---

## Task 3: V6 — Projects Listing

**Endpoint:** `GET /api/v1/projects?locale={locale}&page={n}&pageSize={n}`

**Response shape:**
```json
{
  "items": [
    {
      "id": "789",
      "title": "Hotel Burj Al Arab",
      "imageUrl": "https://drupal.example.com/sites/default/files/burj.jpg",
      "path": "/it/progetti/hotel-burj-al-arab",
      "category": "Hospitality"
    }
  ],
  "total": 56,
  "page": 0,
  "pageSize": 24
}
```

**Configurazione View:**
- Machine name: `api_projects`
- Content type: `progetto`
- Display: REST export
- Path: `/api/v1/projects`
- Campi:
  - `nid` (id)
  - `title` o `field_titolo_main`
  - `field_immagine` (URL assoluto)
  - `path`
  - `field_categoria_progetto` (nome del termine taxonomy — category)
- Relationship: `field_categoria_progetto` (taxonomy term reference)
- Filtro: `status = 1`
- Sort: `title ASC`
- Pager: Mini pager, 24 items

- [ ] **Step 1: Creare la View**
- [ ] **Step 2: Validare**

```bash
curl -s "http://localhost/it/api/v1/projects" | python3 -m json.tool | head -30
```

- [ ] **Step 3: Commit**

```bash
drush cex -y && git add config/sync/ && git commit -m "feat: add V6 projects REST endpoint"
```

---

## Task 4: V9 — Documents Listing

**Endpoint:** `GET /api/v1/documents?locale={locale}&type={tipo}`

**Response shape:**
```json
{
  "items": [
    {
      "id": "101",
      "title": "Catalogo Mosaico 2025",
      "imageUrl": "https://drupal.example.com/sites/default/files/catalogo-cover.jpg",
      "path": "/it/documenti/catalogo-mosaico-2025",
      "fileUrl": "https://drupal.example.com/sites/default/files/catalogo.pdf",
      "externalUrl": null,
      "documentType": "catalogo",
      "category": "mosaico"
    }
  ],
  "total": 35
}
```

**Configurazione View:**
- Machine name: `api_documents`
- Content type: `documento`
- Display: REST export
- Path: `/api/v1/documents`
- Campi:
  - `nid` (id)
  - `title` o `field_titolo_main`
  - `field_immagine` (URL assoluto)
  - `path`
  - `field_allegato` (URL assoluto del file — fileUrl)
  - `field_collegamento_esterno` (URL — externalUrl)
  - `field_tipologia_documento` (documentType)
  - `field_categoria_documento` (category)
- Filtro: `status = 1`
- Filtro esposto: `field_tipologia_documento` (come query param `type`)
- Sort: `title ASC`

- [ ] **Step 1: Creare la View**
- [ ] **Step 2: Validare**

```bash
curl -s "http://localhost/it/api/v1/documents" | python3 -m json.tool | head -30
curl -s "http://localhost/it/api/v1/documents?type=catalogo" | python3 -m json.tool | head -30
```

- [ ] **Step 3: Commit**

```bash
drush cex -y && git add config/sync/ && git commit -m "feat: add V9 documents REST endpoint"
```

---

## Task 5: V5 — Blog Listing (unificato)

**Endpoint:** `GET /api/v1/blog?locale={locale}&page={n}&pageSize={n}&type={articolo|news|tutorial}`

Questa View unifica 3 content type che prima richiedevano 3 chiamate parallele.

**Response shape:**
```json
{
  "items": [
    {
      "id": "201",
      "type": "articolo",
      "title": "L'arte del mosaico",
      "imageUrl": "https://drupal.example.com/sites/default/files/arte-mosaico.jpg",
      "path": "/it/articoli/arte-del-mosaico",
      "created": "2025-11-15T10:30:00+01:00"
    }
  ],
  "total": 128,
  "page": 0,
  "pageSize": 24
}
```

**Configurazione View:**
- Machine name: `api_blog`
- Content type: `articolo`, `news`, `tutorial` (tutti e tre)
- Display: REST export
- Path: `/api/v1/blog`
- Campi:
  - `nid` (id)
  - `type` (machine name del content type — articolo, news, tutorial)
  - `title` o `field_titolo_main`
  - `field_immagine` (URL assoluto)
  - `path`
  - `created` (data creazione in ISO 8601)
- Filtro: `status = 1`
- Filtro esposto: `type` (content type — come query param `type`, opzionale)
- Sort: `created DESC` (piu recenti prima)
- Pager: Mini pager, 24 items

- [ ] **Step 1: Creare la View**
- [ ] **Step 2: Validare**

```bash
curl -s "http://localhost/it/api/v1/blog" | python3 -m json.tool | head -30
curl -s "http://localhost/it/api/v1/blog?type=tutorial" | python3 -m json.tool | head -10
```

Verificare che `type` sia il machine name (`articolo`, non `Articolo`).

- [ ] **Step 3: Commit**

```bash
drush cex -y && git add config/sync/ && git commit -m "feat: add V5 unified blog REST endpoint"
```

---

## Task 6: V10 — Subcategories

**Endpoint:** `GET /api/v1/subcategories/{parentUuid}?locale={locale}`

**Response shape:**
```json
{
  "items": [
    {
      "id": "301",
      "uuid": "a1b2c3d4-...",
      "title": "Poltrone",
      "imageUrl": "https://drupal.example.com/sites/default/files/poltrone.jpg",
      "path": "/it/arredo/poltrone"
    }
  ]
}
```

**Configurazione View:**
- Machine name: `api_subcategories`
- Content type: `categoria`
- Display: REST export
- Path: `/api/v1/subcategories/%`
- Campi:
  - `nid` (id)
  - `uuid`
  - `title` o `field_titolo_main`
  - `field_immagine` (URL assoluto)
  - `path`
- Contextual filter: `field_categoria` (entity reference — parent UUID dall'URL)
- Filtro: `status = 1`
- Sort: `title ASC`

- [ ] **Step 1: Creare la View**
- [ ] **Step 2: Validare**

Trovare un UUID di un nodo `categoria` con figli:
```bash
drush sql:query "SELECT n.uuid FROM node n JOIN node__field_categoria fc ON fc.entity_id = n.nid WHERE n.type = 'categoria' LIMIT 1"
```

Poi testare:
```bash
curl -s "http://localhost/it/api/v1/subcategories/{UUID}" | python3 -m json.tool
```

- [ ] **Step 3: Commit**

```bash
drush cex -y && git add config/sync/ && git commit -m "feat: add V10 subcategories REST endpoint"
```

---

## Task 7: V11 — Pages by Category

**Endpoint:** `GET /api/v1/pages-by-category/{categoryUuid}?locale={locale}`

**Response shape:**
```json
{
  "items": [
    {
      "id": "401",
      "title": "Mosaico Artistico",
      "imageUrl": "https://drupal.example.com/sites/default/files/mosaico-artistico.jpg",
      "path": "/it/mosaico-artistico"
    }
  ]
}
```

**Configurazione View:**
- Machine name: `api_pages_by_category`
- Content type: `page`
- Display: REST export
- Path: `/api/v1/pages-by-category/%`
- Campi:
  - `nid` (id)
  - `title` o `field_titolo_main`
  - `field_immagine` (URL assoluto)
  - `path`
- Contextual filter: `field_categoria` (entity reference — category UUID dall'URL)
- Filtro: `status = 1`
- Sort: `title ASC`

- [ ] **Step 1: Creare la View**
- [ ] **Step 2: Validare**

```bash
curl -s "http://localhost/it/api/v1/pages-by-category/{UUID}" | python3 -m json.tool
```

- [ ] **Step 3: Commit**

```bash
drush cex -y && git add config/sync/ && git commit -m "feat: add V11 pages-by-category REST endpoint"
```

---

## Task 8: V3 — Taxonomy Filter Options

**Endpoint:** `GET /api/v1/taxonomy/{vocabulary}?locale={locale}&include_image=true`

Usato per popolare i filtri nella sidebar dei listing prodotti.

**Response shape:**
```json
{
  "items": [
    {
      "id": "501",
      "name": "Murano Smalto",
      "slug": "murano-smalto",
      "imageUrl": "https://drupal.example.com/sites/default/files/murano-smalto.jpg",
      "weight": 0
    }
  ]
}
```

**Vocabularies supportati:** `mosaico_collezioni`, `mosaico_colori`, `vetrite_collezioni`, `vetrite_colori`, `vetrite_finiture`, `vetrite_textures`, `arredo_finiture`, `tessuto_colori`, `tessuto_finiture`, `tessuto_tipologie`, `tessuto_manutenzione`

**Configurazione View:**
- Machine name: `api_taxonomy_options`
- Entity type: Taxonomy term
- Display: REST export
- Path: `/api/v1/taxonomy/%`
- Campi:
  - `tid` (id)
  - `name`
  - Path alias del termine (slug — estrarre l'ultimo segmento del path)
  - `field_immagine` (URL assoluto, opzionale — solo se `include_image=true`)
  - `weight`
- Contextual filter: `vid` (vocabulary ID dall'URL)
- Sort: `weight ASC`, `name ASC`
- Pager: nessuno (tutti i termini, max ~200)

**Nota su slug:** Il slug deve essere derivato dal path alias del termine. Se il path e `/it/mosaico-collezioni/murano-smalto`, lo slug e `murano-smalto` (ultimo segmento). Se il termine non ha path alias, usare un slugify del name.

- [ ] **Step 1: Creare la View**
- [ ] **Step 2: Validare**

```bash
curl -s "http://localhost/it/api/v1/taxonomy/mosaico_collezioni" | python3 -m json.tool
curl -s "http://localhost/it/api/v1/taxonomy/mosaico_colori?include_image=true" | python3 -m json.tool
```

Verificare che ogni termine abbia `slug` non vuoto.

- [ ] **Step 3: Testare tutte le vocabulary**

```bash
for v in mosaico_collezioni mosaico_colori vetrite_collezioni vetrite_colori vetrite_finiture vetrite_textures arredo_finiture tessuto_colori tessuto_finiture tessuto_tipologie tessuto_manutenzione; do
  echo "=== $v ==="
  curl -s "http://localhost/it/api/v1/taxonomy/$v" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Terms: {len(d) if isinstance(d,list) else len(d.get(\"items\",[]))}')"
done
```

- [ ] **Step 4: Commit**

```bash
drush cex -y && git add config/sync/ && git commit -m "feat: add V3 taxonomy filter options REST endpoint"
```

---

## Task 9: V4 — Category Options (Node-Based)

**Endpoint:** `GET /api/v1/category-options/{productType}?locale={locale}`

Per arredo e illuminazione, i filtri di categoria sono nodi `categoria` (non taxonomy). Questo endpoint ritorna le categorie che hanno almeno un prodotto del tipo richiesto.

**Response shape:**
```json
{
  "items": [
    {
      "id": "601",
      "name": "Poltrone",
      "slug": "poltrone",
      "imageUrl": "https://drupal.example.com/sites/default/files/poltrone.jpg",
      "weight": 0
    }
  ]
}
```

**Configurazione View:**
- Machine name: `api_category_options`
- Content type: `categoria`
- Display: REST export
- Path: `/api/v1/category-options/%`
- Campi:
  - `nid` (id)
  - `title` (name)
  - Path alias (slug — ultimo segmento)
  - `field_immagine` (URL assoluto)
  - Weight (se disponibile) o 0
- Contextual filter: argomento dall'URL — mappa al tipo prodotto (es. `prodotto_arredo`)
- Relationship inversa: nodi di tipo `{productType}` che referenziano questa categoria via `field_categoria`
- Filtro: `status = 1` (sia la categoria che il prodotto referenziante)
- Aggregation: DISTINCT (ogni categoria appare una sola volta)
- Sort: `title ASC`

**Nota:** Questa View e piu complessa perche richiede un join inverso. Se Views non riesce a esprimere il join, creare un custom views filter plugin o gestire nel modulo custom.

- [ ] **Step 1: Creare la View**
- [ ] **Step 2: Validare**

```bash
curl -s "http://localhost/it/api/v1/category-options/prodotto_arredo" | python3 -m json.tool
curl -s "http://localhost/it/api/v1/category-options/prodotto_illuminazione" | python3 -m json.tool
```

Verificare: solo categorie con almeno un prodotto pubblicato del tipo richiesto.

- [ ] **Step 3: Commit**

```bash
drush cex -y && git add config/sync/ && git commit -m "feat: add V4 category options REST endpoint"
```

---

## Task 10: V1 — Product Listing

La View piu complessa. Supporta filtri multipli, sort, paginazione.

**Endpoint:** `GET /api/v1/products/{type}?locale={locale}&page={n}&pageSize={n}&sort={field}&collection={slug}&color={slug}&shape={slug}&finish={slug}&texture={slug}&fabric={slug}&category={slug}&grout={slug}`

**Product types supportati:** `prodotto_mosaico`, `prodotto_vetrite`, `prodotto_arredo`, `prodotto_tessuto`, `prodotto_pixall`, `prodotto_illuminazione`

**Response shape:**
```json
{
  "items": [
    {
      "id": "701",
      "type": "node--prodotto_mosaico",
      "title": "Murano Smalto 10.01",
      "subtitle": "Murano Smalto",
      "imageUrl": "https://drupal.example.com/sites/default/files/murano-10-01.jpg",
      "price": "150.00",
      "priceOnDemand": false,
      "path": "/it/mosaico/murano-smalto-10-01"
    }
  ],
  "total": 234,
  "page": 0,
  "pageSize": 48
}
```

**Filtri per product type:**

| Product Type | Filtri supportati | Campo subtitle |
|---|---|---|
| `prodotto_mosaico` | collection (field_collezione), color (field_colori), shape (field_forma), finish (field_finitura), grout (field_stucco) | field_collezione.name |
| `prodotto_vetrite` | collection (field_collezione), color (field_colori), finish (field_finiture), texture (field_texture) | field_collezione.name |
| `prodotto_arredo` | category (field_categoria), finish (field_finiture), fabric (field_tessuti) | field_categoria.title |
| `prodotto_tessuto` | category (field_categoria), type (field_tipologia_tessuto), color (field_colori), finish (field_finiture_tessuto) | field_categoria.title |
| `prodotto_pixall` | color (field_colori), shape (field_forma), grout (field_stucco) | null |
| `prodotto_illuminazione` | category (field_categoria) | field_categoria.title |

**Nota su slug resolution:** I filtri arrivano come slug (es. `murano-smalto`). La View deve risolvere lo slug al nome del termine/nodo. Approcci:
1. **Path alias match:** se il termine ha path alias contenente lo slug, usare quello
2. **Custom views filter plugin:** accetta slug, risolve internamente al tid/nid
3. **Il frontend potrebbe passare il term name diretto** — in quel caso, filtrare per name con operatore `=` o `CONTAINS`

L'approccio 2 (custom plugin) e il piu robusto. Implementarlo nel modulo `sicis_rest`.

**Configurazione View:**
- Machine name: `api_products`
- Content type: argomento contestuale (prodotto_mosaico, prodotto_vetrite, etc.)
- Display: REST export
- Path: `/api/v1/products/%`
- Campi:
  - `nid` (id)
  - Content type machine name prefisso con `node--` (type)
  - `title` o `field_titolo_main`
  - Subtitle: nome della collezione/categoria padre (vedi tabella sopra)
  - `field_immagine` (URL assoluto)
  - `field_prezzo_eu` (price — ATTENZIONE: per vetrite/arredo/illuminazione e `{ value }`, per mosaico/tessuto/pixall e stringa piatta)
  - `field_prezzo_on_demand` (boolean)
  - `path`
- Relationships:
  - `field_collezione` (per mosaico, vetrite)
  - `field_categoria` (per arredo, tessuto, illuminazione)
  - `field_colori`, `field_forma`, `field_finitura`, etc. (per filtraggio)
- Filtri esposti: tutti i filtri della tabella sopra
- Sort: `title ASC` (default), supporto per `created`, `field_prezzo_eu`
- Pager: Mini pager, 48 items

- [ ] **Step 1: Creare la View base**

Iniziare con `prodotto_mosaico` senza filtri. Verificare i campi base.

- [ ] **Step 2: Aggiungere filtri**

Aggiungere i filtri esposti uno alla volta, testando dopo ogni aggiunta.

- [ ] **Step 3: Validare mosaico**

```bash
curl -s "http://localhost/it/api/v1/products/prodotto_mosaico" | python3 -m json.tool | head -30
curl -s "http://localhost/it/api/v1/products/prodotto_mosaico?collection=murano-smalto" | python3 -m json.tool | head -10
```

- [ ] **Step 4: Estendere a tutti i product type**

Verificare ogni tipo:
```bash
for t in prodotto_mosaico prodotto_vetrite prodotto_arredo prodotto_tessuto prodotto_pixall prodotto_illuminazione; do
  echo "=== $t ==="
  curl -s "http://localhost/it/api/v1/products/$t" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Products: {len(d) if isinstance(d,list) else d.get(\"total\",\"?\")}');"
done
```

- [ ] **Step 5: Testare sort**

```bash
curl -s "http://localhost/it/api/v1/products/prodotto_mosaico?sort=title" | python3 -m json.tool | head -10
curl -s "http://localhost/it/api/v1/products/prodotto_mosaico?sort=-created" | python3 -m json.tool | head -10
```

- [ ] **Step 6: Commit**

```bash
drush cex -y && git add config/sync/ && git commit -m "feat: add V1 product listing REST endpoint with filters"
```

---

## Task 11: V2 — Filter Counts (Aggregation)

**Endpoint:** `GET /api/v1/products/{type}/counts/{field}?locale={locale}&collection={slug}&color={slug}...`

Ritorna il conteggio prodotti per ogni valore di un campo filtro. Usa Views aggregation (GROUP BY + COUNT).

**Esempio:** "Quanti prodotti mosaico ci sono per ogni colore, dato che il filtro collection=murano-smalto e attivo?"

`GET /api/v1/products/prodotto_mosaico/counts/color?collection=murano-smalto`

**Response shape:**
```json
{
  "counts": {
    "Rosso": 12,
    "Blu": 8,
    "Verde": 3,
    "Oro": 1
  }
}
```

**Configurazione View:**
- Machine name: `api_product_counts`
- Content type: argomento contestuale (tipo prodotto)
- Display: REST export
- Path: `/api/v1/products/%/counts/%`
- **Aggregation: YES**
- Campi:
  - Nome del termine (GROUP BY)
  - `nid` (COUNT)
- Contextual filters:
  - Argomento 1: content type
  - Argomento 2: field name da aggregare (es. `color` -> `field_colori`)
- Filtri esposti: stessi di V1 (escluso il campo aggregato)
- Sort: nessuno (i conteggi non hanno ordine)

**Nota:** Questa View e la piu complessa. L'aggregazione GROUP BY su campi relazione taxonomy richiede un join + group by sulla tabella del termine. Se Views non supporta aggregazione su campi relazione, implementare come endpoint custom nel modulo `sicis_rest` usando Entity Query con `->groupBy()` e `->addExpression('COUNT(...)')`.

- [ ] **Step 1: Tentare con Views aggregation**

Creare la View con aggregation mode abilitato. Se funziona, perfetto.

- [ ] **Step 2: Se Views non supporta, implementare nel modulo custom**

Aggiungere un controller in `sicis_rest` che:
1. Riceve tipo prodotto, campo da contare, filtri attivi
2. Esegue una Entity Query con aggregazione
3. Ritorna i conteggi

- [ ] **Step 3: Validare**

```bash
curl -s "http://localhost/it/api/v1/products/prodotto_mosaico/counts/color" | python3 -m json.tool
curl -s "http://localhost/it/api/v1/products/prodotto_mosaico/counts/color?collection=murano-smalto" | python3 -m json.tool
```

Verificare che i conteggi siano numeri interi positivi e che i filtri riducano i conteggi.

- [ ] **Step 4: Commit**

```bash
drush cex -y && git add -A && git commit -m "feat: add V2 filter counts endpoint with aggregation"
```

---

## Task 12: Modulo Custom `sicis_rest` — Struttura Base

**Creare il modulo custom che ospitera C1, C2, e il hook per wrappare le risposte Views.**

- [ ] **Step 1: Scaffold del modulo**

```
modules/custom/sicis_rest/
  sicis_rest.info.yml
  sicis_rest.routing.yml
  sicis_rest.module          (hook per wrapping response Views)
  sicis_rest.services.yml
  src/
    Controller/
      EntityController.php   (C1)
      TranslatePathController.php (C2)
    Service/
      EntityResolver.php     (logica risoluzione ricorsiva entity)
```

- [ ] **Step 2: sicis_rest.info.yml**

```yaml
name: 'Sicis REST API'
type: module
description: 'Custom REST endpoints for Next.js frontend'
core_version_requirement: ^10
package: Sicis
dependencies:
  - drupal:rest
  - drupal:serialization
  - drupal:path_alias
```

- [ ] **Step 3: Implementare hook per wrapping response Views**

In `sicis_rest.module`, implementare `hook_rest_resource_response_alter()` (o il hook appropriato) per wrappare le risposte delle Views con prefisso `/api/v1/` nella struttura `{ items, total, page, pageSize }`.

**IMPORTANTE:** Verificare quale hook e disponibile per intercettare le risposte REST delle Views. Se `hook_rest_resource_response_alter` non funziona per le Views REST export, valutare alternative:
- Event subscriber su `KernelEvents::RESPONSE`
- Custom serializer che estende `\Drupal\rest\Plugin\views\style\Serializer`

La soluzione deve essere pulita. Se nessun hook standard funziona, creare un custom views style plugin.

- [ ] **Step 4: Commit**

```bash
drush en sicis_rest -y && drush cr
git add modules/custom/sicis_rest/ && git commit -m "feat: scaffold sicis_rest module with response wrapper"
```

---

## Task 13: Modulo Custom `sicis_rest` — C1 Entity Endpoint

**Endpoint:** `GET /api/v1/entity?path={path}&locale={locale}`

Questo e l'endpoint piu complesso. Riceve un path alias, risolve l'entity, carica tutti i campi con relazioni e paragrafi risolti ricorsivamente, e ritorna un JSON pre-shaped.

**Response shape:**
```json
{
  "meta": {
    "type": "node",
    "bundle": "prodotto_mosaico",
    "id": 123,
    "uuid": "a1b2c3d4-...",
    "locale": "it",
    "path": "/it/mosaico/murano-smalto-10-01"
  },
  "data": {
    "title": "Murano Smalto 10.01",
    "field_titolo_main": "...",
    "field_testo_main": { "value": "...", "processed": "..." },
    "field_immagine": {
      "type": "file--file",
      "uri": { "url": "https://drupal.example.com/sites/default/files/image.jpg" },
      "meta": { "alt": "Alt text", "width": 800, "height": 600 }
    },
    "field_collezione": {
      "type": "taxonomy_term--mosaico_collezioni",
      "name": "Murano Smalto",
      "field_immagine": { "...": "..." },
      "field_documenti": [{ "...": "..." }]
    },
    "field_blocchi": [
      {
        "type": "paragraph--blocco_gallery",
        "field_titolo_formattato": "...",
        "field_slide": [
          {
            "type": "paragraph--blocco_gallery_slide",
            "field_immagine": { "...": "..." }
          }
        ]
      }
    ]
  }
}
```

**REQUISITI CRITICI per la struttura `data`:**

1. **La shape deve essere compatibile con l'output del deserializer JSON:API attuale.** Il frontend ha template che accedono a `field_immagine.meta.alt`, `field_immagine.uri.url`, `field_testo_main.processed`, etc. Se la shape cambia, i template si rompono.

2. **Immagini:** Ogni campo immagine deve essere serializzato come:
   ```json
   {
     "type": "file--file",
     "uri": { "url": "https://absolute-url/image.jpg" },
     "meta": { "alt": "Alt text", "width": 800, "height": 600 }
   }
   ```
   L'URL in `uri.url` DEVE essere assoluto (non relativo).

3. **Testo formattato:** `{ "value": "raw markup", "processed": "filtered HTML" }`

4. **Entity reference (taxonomy, node):** Oggetto completo inline con tutti i campi, mai solo `{ type, id }`.

5. **Paragrafi:** Array in `field_blocchi`, ogni paragrafo con `type` (es. `paragraph--blocco_gallery`) e tutti i campi risolti ricorsivamente. I paragrafi con figli (es. `blocco_gallery` ha `field_slide[]` che sono altri paragrafi con `field_immagine`) devono avere i figli risolti.

6. **Paragrafi che richiedono risoluzione profonda:**
   - `blocco_gallery` -> `field_slide[]` -> ogni slide ha `field_immagine`
   - `blocco_gallery_intro` -> `field_slide[]` -> ogni slide ha `field_immagine`
   - `blocco_slider_home` -> `field_elementi[]` -> ogni elemento ha `field_immagine`
   - `blocco_correlati` -> `field_elementi[]` -> ogni elemento ha `field_immagine`
   - `blocco_anni` -> `field_anni[]` -> ogni anno ha `field_immagine`
   - `blocco_documenti` -> `field_documenti[]` -> ogni documento ha `field_immagine` e `field_allegato`

7. **Tessuti con fallback EN:** Per `prodotto_arredo` e `prodotto_illuminazione`, il campo `field_tessuti` puo contenere termini taxonomy senza traduzione nella lingua corrente. In quel caso, caricare il termine in inglese come fallback e usare il nome EN.

8. **Bundle-specific include:** Non tutti i bundle hanno gli stessi campi. In particolare:
   - `showroom` e `documento`: NON hanno `field_blocchi`. Non tentare di caricarli.
   - `prodotto_arredo` e `prodotto_illuminazione`: hanno `field_finiture.field_immagine` da includere.
   - `mosaico_collezioni` e `vetrite_collezioni` (taxonomy): hanno `field_documenti` con catena `field_immagine` + `field_allegato`.

- [ ] **Step 1: Implementare EntityResolver service**

Il service deve:
1. Accettare un path alias e un locale
2. Risolvere il path alias all'entity (nodo o termine taxonomy) usando `\Drupal\path_alias\AliasManagerInterface`
3. Caricare l'entity nella lingua corretta
4. Serializzare ricorsivamente tutti i campi dell'entity:
   - Campi scalari: valore diretto
   - Campi testo: `{ value, processed }`
   - Campi immagine/file: `{ type, uri: { url }, meta: { alt, width, height } }` con URL assoluto
   - Campi entity reference: caricare l'entity referenziata e serializzarla ricorsivamente
   - Campi paragraph reference: caricare il paragrafo e serializzare ricorsivamente (inclusi i figli)
5. Gestire il fallback EN per tessuti
6. Rispettare un limite di profondita ricorsiva (max 5 livelli) per evitare loop

- [ ] **Step 2: Implementare EntityController**

Route: `GET /api/v1/entity`
Parametri: `path` (required), `locale` (required)
Usa EntityResolver per ottenere i dati e ritorna JsonResponse.

- [ ] **Step 3: Definire routing**

```yaml
sicis_rest.entity:
  path: '/api/v1/entity'
  defaults:
    _controller: '\Drupal\sicis_rest\Controller\EntityController::get'
  requirements:
    _access: 'TRUE'
  options:
    no_cache: FALSE
```

- [ ] **Step 4: Testare con prodotto mosaico**

```bash
curl -s "http://localhost/api/v1/entity?path=/mosaico/murano-smalto-10-01&locale=it" | python3 -m json.tool | head -50
```

Verificare:
- `meta.type` = "node", `meta.bundle` = "prodotto_mosaico"
- `data.field_immagine.uri.url` e un URL assoluto
- `data.field_immagine.meta.alt` esiste
- `data.field_collezione` e un oggetto completo con `name`, `field_immagine`, etc.

- [ ] **Step 5: Testare paragrafi**

Trovare un articolo con paragrafi:
```bash
curl -s "http://localhost/api/v1/entity?path=/articoli/nome-articolo&locale=it" | python3 -m json.tool | grep -A 5 "field_blocchi"
```

Verificare:
- `field_blocchi` e un array
- Ogni paragrafo ha `type` (es. `paragraph--blocco_gallery`)
- I paragrafi con figli (gallery -> slide) hanno i figli risolti

- [ ] **Step 6: Testare tutti i content type**

Testare almeno un'entity per ogni content type:
- `prodotto_mosaico`, `prodotto_vetrite`, `prodotto_arredo`, `prodotto_tessuto`, `prodotto_pixall`, `prodotto_illuminazione`
- `page`, `landing_page`, `articolo`, `news`, `tutorial`
- `progetto`, `ambiente`, `showroom`, `documento`
- `categoria`, `categoria_blog`, `tag`
- `mosaico_collezioni`, `mosaico_colori`, `vetrite_collezioni`, `vetrite_colori` (taxonomy)

Per ognuno verificare che i campi rilevanti siano presenti e ben formattati.

- [ ] **Step 7: Testare fallback EN tessuti**

```bash
curl -s "http://localhost/api/v1/entity?path=/arredo/nome-prodotto&locale=it" | python3 -m json.tool | grep -A 3 "field_tessuti"
```

Verificare che `field_tessuti` contenga oggetti con `name` non vuoto.

- [ ] **Step 8: Testare entity inesistente**

```bash
curl -s "http://localhost/api/v1/entity?path=/path-inesistente&locale=it" -w "\n%{http_code}"
```

Deve ritornare 404 con corpo JSON: `{ "error": "Entity not found" }`.

- [ ] **Step 9: Commit**

```bash
git add modules/custom/sicis_rest/ && git commit -m "feat: add C1 entity endpoint with recursive resolution"
```

---

## Task 14: Modulo Custom `sicis_rest` — C2 Translate Path

**Endpoint:** `GET /api/v1/translate-path?path={path}&from={locale}&to={locale}`

**Response shape:**
```json
{
  "translatedPath": "/en/mosaic/murano-smalto-10-01"
}
```

Oppure se non esiste traduzione:
```json
{
  "translatedPath": null
}
```

- [ ] **Step 1: Implementare TranslatePathController**

Logica:
1. Risolvere il path alias nell'entity (usando AliasManager nella lingua `from`)
2. Caricare l'entity
3. Verificare se ha una traduzione nella lingua `to`
4. Se si, ottenere il path alias nella lingua `to`
5. Ritornare il path completo con prefisso locale: `/{to}/{alias}`

- [ ] **Step 2: Definire routing**

```yaml
sicis_rest.translate_path:
  path: '/api/v1/translate-path'
  defaults:
    _controller: '\Drupal\sicis_rest\Controller\TranslatePathController::get'
  requirements:
    _access: 'TRUE'
```

- [ ] **Step 3: Validare**

```bash
curl -s "http://localhost/api/v1/translate-path?path=/mosaico/murano-smalto&from=it&to=en" | python3 -m json.tool
curl -s "http://localhost/api/v1/translate-path?path=/path-inesistente&from=it&to=en" | python3 -m json.tool
```

- [ ] **Step 4: Testare con tutte le lingue**

```bash
for lang in en fr de es ru; do
  echo "=== it -> $lang ==="
  curl -s "http://localhost/api/v1/translate-path?path=/mosaico&from=it&to=$lang" | python3 -m json.tool
done
```

- [ ] **Step 5: Commit**

```bash
git add modules/custom/sicis_rest/ && git commit -m "feat: add C2 translate-path endpoint"
```

---

## Task 15: Validazione Finale

- [ ] **Step 1: Test completo di tutti gli endpoint**

```bash
echo "=== V1: Products ==="
curl -s "http://localhost/it/api/v1/products/prodotto_mosaico?pageSize=2" | python3 -m json.tool | head -20

echo "=== V2: Counts ==="
curl -s "http://localhost/it/api/v1/products/prodotto_mosaico/counts/color" | python3 -m json.tool

echo "=== V3: Taxonomy ==="
curl -s "http://localhost/it/api/v1/taxonomy/mosaico_collezioni" | python3 -m json.tool | head -20

echo "=== V4: Category Options ==="
curl -s "http://localhost/it/api/v1/category-options/prodotto_arredo" | python3 -m json.tool | head -20

echo "=== V5: Blog ==="
curl -s "http://localhost/it/api/v1/blog?pageSize=2" | python3 -m json.tool | head -20

echo "=== V6: Projects ==="
curl -s "http://localhost/it/api/v1/projects?pageSize=2" | python3 -m json.tool | head -20

echo "=== V7: Environments ==="
curl -s "http://localhost/it/api/v1/environments?pageSize=2" | python3 -m json.tool | head -20

echo "=== V8: Showrooms ==="
curl -s "http://localhost/it/api/v1/showrooms" | python3 -m json.tool | head -20

echo "=== V9: Documents ==="
curl -s "http://localhost/it/api/v1/documents" | python3 -m json.tool | head -20

echo "=== C1: Entity ==="
curl -s "http://localhost/api/v1/entity?path=/&locale=it" | python3 -m json.tool | head -20

echo "=== C2: Translate Path ==="
curl -s "http://localhost/api/v1/translate-path?path=/mosaico&from=it&to=en" | python3 -m json.tool
```

- [ ] **Step 2: Verificare che JSON:API funziona ancora**

```bash
curl -s "http://localhost/it/jsonapi/node/prodotto_mosaico?page[limit]=1" | python3 -m json.tool | head -10
```

JSON:API deve continuare a funzionare (il frontend lo usa ancora).

- [ ] **Step 3: Export config e commit finale**

```bash
drush cex -y
git add -A
git commit -m "feat: complete REST API migration - all endpoints validated"
```

- [ ] **Step 4: Comunicare completamento**

Comunicare al team frontend che tutti gli endpoint sono pronti e validati. Fornire l'URL base per i test (es. `https://staging.drupal.example.com/api/v1/`).

---

## Appendice: Cleanup Post-Migrazione (Phase 4)

**NON eseguire questi step finche il team frontend non ha confermato che il cutover e completo.**

- [ ] **Step 1: Disabilitare JSON:API**

```bash
drush pm:uninstall jsonapi -y
```

- [ ] **Step 2: Disabilitare decoupled_router**

```bash
drush pm:uninstall decoupled_router -y
```

- [ ] **Step 3: Disabilitare jsonapi_menu_items (se presente)**

```bash
drush pm:uninstall jsonapi_menu_items -y 2>/dev/null || echo "Modulo non presente"
```

- [ ] **Step 4: Cache rebuild e verifica**

```bash
drush cr
curl -s "http://localhost/it/api/v1/products/prodotto_mosaico?pageSize=1" | python3 -m json.tool | head -10
curl -s "http://localhost/it/api/menu/main" | python3 -m json.tool | head -10
```

Verificare che gli endpoint REST e menu funzionano ancora.

- [ ] **Step 5: Export e commit**

```bash
drush cex -y
git add -A
git commit -m "chore: remove JSON:API and decoupled_router modules"
git tag post-rest-migration
```
