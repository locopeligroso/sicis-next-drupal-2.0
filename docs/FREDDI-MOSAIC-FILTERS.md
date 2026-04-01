# Mosaic Filters — Requisiti API Drupal

## Stato attuale

Il frontend ha già integrato gli endpoint:

- `/{locale}/api/v1/mosaic-shapes` — 8 forme (Clover, Flower, Irregular, Lozenge, Oval, Romboidal, Round, Square)
- `/{locale}/api/v1/mosaic-finishes` — 10 finiture (Ancient, Brilliant, Bush Hammered, Iridescent, Metallic, Quartz Aventurine, Satin, Solid, Tide, Transparent)
- `/{locale}/api/v1/mosaic-collections` — collezioni (già funzionante)
- `/{locale}/api/v1/mosaic-colors` — colori (già funzionante)

La sidebar mostra i checkbox per forma e finitura, ma l'endpoint prodotti **non filtra ancora** per questi campi.

---

## 1. Filtraggio prodotti per forma e finitura

**Endpoint:** `/{locale}/api/v1/mosaic-products/{collection_tid}/{color_tid}`

**Attualmente:** accetta solo `collection_tid` e `color_tid` come parametri path. I query params `shape` e `finish` vengono ignorati.

**Richiesta:** aggiungere supporto per due query params opzionali:

```
/{locale}/api/v1/mosaic-products/{collection_tid}/{color_tid}?shape={shape_tid}&finish={finish_tid}
```

| Param    | Tipo          | Obbligatorio | Descrizione                                                            |
| -------- | ------------- | ------------ | ---------------------------------------------------------------------- |
| `shape`  | integer (TID) | No           | Filtra per `field_forma` — un solo valore, es. `?shape=44` (Clover)    |
| `finish` | integer (TID) | No           | Filtra per `field_finitura` — un solo valore, es. `?finish=11` (Solid) |

**Entrambi sono single-select** — il frontend invia al massimo un TID per campo.

**Combinazioni possibili:**

```
/en/api/v1/mosaic-products/all/all                           → tutti i prodotti
/en/api/v1/mosaic-products/72/all                            → solo collezione 72
/en/api/v1/mosaic-products/all/42                             → solo colore 42
/en/api/v1/mosaic-products/72/42                              → collezione 72 + colore 42
/en/api/v1/mosaic-products/72/42?shape=44                     → + forma Clover
/en/api/v1/mosaic-products/72/42?finish=11                    → + finitura Solid
/en/api/v1/mosaic-products/72/42?shape=44&finish=11           → + forma Clover + finitura Solid
/en/api/v1/mosaic-products/all/all?shape=44                   → solo forma Clover (senza coll/colore)
```

---

## 2. Conteggi per cross-filtering

Quando l'utente seleziona un colore (es. Navy Blu), la sidebar deve mostrare **quanti prodotti** ci sono per ogni forma e finitura disponibile con quel colore. Le opzioni con conteggio 0 vengono nascoste o disabilitate.

**Serve un endpoint (o estensione dell'endpoint esistente) che restituisca i conteggi.**

### Opzione A — Endpoint dedicato conteggi

```
/{locale}/api/v1/mosaic-filter-counts?collection={tid}&color={tid}&shape={tid}&finish={tid}
```

**Risposta attesa:**

```json
{
  "shapes": [
    { "tid": 44, "name": "Clover", "count": 12 },
    { "tid": 41, "name": "Flower", "count": 0 },
    { "tid": 39, "name": "Irregular", "count": 8 },
    ...
  ],
  "finishes": [
    { "tid": 13, "name": "Ancient", "count": 3 },
    { "tid": 12, "name": "Brilliant", "count": 15 },
    ...
  ],
  "collections": [
    { "tid": 72, "name": "NeoColibrì", "count": 5 },
    ...
  ],
  "colors": [
    { "tid": 42, "name": "Navy Blu", "count": 18 },
    ...
  ]
}
```

I conteggi devono riflettere i filtri attivi **escludendo la dimensione corrente**. Esempio:

- Se l'utente ha selezionato colore=Navy Blu e forma=Clover:
  - `shapes[].count` = conteggio prodotti con colore=Navy Blu (ignora il filtro forma attivo)
  - `finishes[].count` = conteggio prodotti con colore=Navy Blu + forma=Clover
  - `colors[].count` = conteggio prodotti con forma=Clover (ignora il filtro colore attivo)
  - `collections[].count` = conteggio prodotti con colore=Navy Blu + forma=Clover

Questo pattern si chiama **"faceted count"** — ogni dimensione mostra i conteggi come se il filtro di quella dimensione non fosse attivo.

### Opzione B — Aggiungere i conteggi alla risposta prodotti

In alternativa, includere i conteggi direttamente nella risposta di `mosaic-products`:

```json
{
  "products": [...],
  "facets": {
    "shapes": [{ "tid": 44, "count": 12 }, ...],
    "finishes": [{ "tid": 11, "count": 15 }, ...],
    "collections": [{ "tid": 72, "count": 5 }, ...],
    "colors": [{ "tid": 42, "count": 18 }, ...]
  }
}
```

**Preferenza frontend:** Opzione A (endpoint separato) è più flessibile perché possiamo cachare i conteggi indipendentemente dai prodotti. Ma entrambe funzionano.

---

## 3. Riepilogo campi Drupal coinvolti

| Campo Drupal       | Tipo             | Vocabolario tassonomia | Endpoint opzioni     |
| ------------------ | ---------------- | ---------------------- | -------------------- |
| `field_collezione` | Entity reference | `mosaico_collezioni`   | `mosaic-collections` |
| `field_colori`     | Entity reference | `mosaico_colori`       | `mosaic-colors`      |
| `field_forma`      | Entity reference | `mosaico_forme`        | `mosaic-shapes`      |
| `field_finitura`   | Entity reference | `mosaico_finiture`     | `mosaic-finishes`    |

---

## 4. Aggiornamento endpoint conteggi (mosaic-product-counts)

L'endpoint attuale `mosaic-product-counts` restituisce solo `forme` e `finiture`. Servono due modifiche:

### 4a. Aggiungere `collezioni` e `colori` alla risposta

```json
{
  "forme": [{ "tid": 44, "name": "Clover", "count": 15 }, ...],
  "finiture": [{ "tid": 11, "name": "Solid", "count": 206 }, ...],
  "collezioni": [{ "tid": 72, "name": "NeoColibrì", "count": 5 }, ...],
  "colori": [{ "tid": 42, "name": "Navy Blu", "count": 18 }, ...]
}
```

### 4b. Accettare `shape` e `finish` come query params

Attualmente l'endpoint accetta `?collection={tid}&color={tid}`. Aggiungere:

```
/{locale}/api/v1/mosaic-product-counts?collection={tid}&color={tid}&shape={tid}&finish={tid}
```

Tutti e 4 i parametri sono opzionali. I conteggi di ogni dimensione riflettono i filtri attivi **escludendo la propria dimensione** (faceted counts):

- `forme[].count` = prodotti con collection + color + finish attivi (NO shape)
- `finiture[].count` = prodotti con collection + color + shape attivi (NO finish)
- `collezioni[].count` = prodotti con color + shape + finish attivi (NO collection)
- `colori[].count` = prodotti con collection + shape + finish attivi (NO color)

---

## 5. Priorità

1. ~~**Filtraggio prodotti** (punto 1)~~ — **FATTO** ✅
2. **Conteggi completi** (punto 4) — aggiungere collezioni/colori + accettare shape/finish

---

## Note tecniche

- Tutti i filtri sono **single-select** (un solo TID per parametro)
- Gli endpoint opzioni (`mosaic-shapes`, `mosaic-finishes`) funzionano già e restituiscono nomi tradotti per locale
- Il frontend passa TID numerici (non nomi) — stessa logica di `collection_tid` e `color_tid`
- Formato risposta prodotti: mantenere lo stesso formato attuale (array di oggetti prodotto)
- Le opzioni con count=0 vengono mostrate a opacità ridotta (dimmed) e non cliccabili
