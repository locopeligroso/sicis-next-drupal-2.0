# Brief Tecnico — Nuovo Endpoint REST: `resolve-path`

**Data:** 2026-03-26
**Priorità:** ALTA — blocca lo sviluppo di tutte le pagine di dettaglio prodotto
**Destinatari:** Team backend Drupal
**Mittente:** Team frontend Next.js

---

## Sommario

Il frontend Next.js ha bisogno di un nuovo endpoint REST personalizzato che risolva un alias di percorso Drupal ai metadati dell'entità corrispondente (NID, tipo, bundle). Questo endpoint è il fondamento del sistema di routing frontend: senza di esso non è possibile recuperare dati per nessuna pagina di dettaglio.

---

## Contesto: perché serve questo endpoint

Il frontend utilizza un pattern a due stadi per il rendering delle pagine:

1. **Stadio 1 — Routing**: dato un URL (es. `/mosaico/pluma/01-bora`), capire a quale entità Drupal corrisponde e di che tipo è.
2. **Stadio 2 — Dati**: recuperare i dati completi dell'entità usando un endpoint dedicato per quel content type (es. `mosaic-product/{nid}`, `arredo-product/{nid}`, ecc.).

Attualmente questi due passi sono gestiti da un unico endpoint (`entity`) che fa sia il routing che il fetch dei dati. La nuova architettura separa le responsabilità: `resolve-path` gestisce il routing, e gli endpoint dedicati per content type gestiranno i dati.

`resolve-path` deve essere implementato prima di qualsiasi endpoint di dettaglio: è il punto di ingresso condiviso per tutti i content type.

---

## Specifica dell'Endpoint

### URL

```
GET /{locale}/api/v1/resolve-path?path={pathSenzaLocale}
```

Il parametro `path` **non** deve includere il prefisso di locale. Il locale è già presente nel pattern URL (es. `/it/`, `/en/`).

### Esempi di Richiesta e Risposta

**Prodotto mosaico (IT):**

```
GET /it/api/v1/resolve-path?path=/mosaico/neocolibrì-barrels/515-barrels

HTTP 200 OK
{
  "nid": 2256,
  "type": "node",
  "bundle": "prodotto_mosaico",
  "locale": "it"
}
```

**Stesso prodotto, versione inglese:**

```
GET /en/api/v1/resolve-path?path=/mosaic/pluma/01-bora

HTTP 200 OK
{
  "nid": 1667,
  "type": "node",
  "bundle": "prodotto_mosaico",
  "locale": "en"
}
```

**Prodotto arredo:**

```
GET /it/api/v1/resolve-path?path=/arredo/sedie/poltrona-luna

HTTP 200 OK
{
  "nid": 3421,
  "type": "node",
  "bundle": "prodotto_arredo",
  "locale": "it"
}
```

**Articolo blog:**

```
GET /it/api/v1/resolve-path?path=/blog/titolo-articolo

HTTP 200 OK
{
  "nid": 892,
  "type": "node",
  "bundle": "articolo",
  "locale": "it"
}
```

**Percorso inesistente:**

```
GET /it/api/v1/resolve-path?path=/path-inesistente

HTTP 404 Not Found
{
  "error": "not_found",
  "message": "No entity found for path: /path-inesistente"
}
```

---

## Formato delle Risposte

### Successo — HTTP 200

```json
{
  "nid": 2256,
  "type": "node",
  "bundle": "prodotto_mosaico",
  "locale": "it"
}
```

| Campo    | Tipo    | Descrizione                                                                                                                                                                                                 |
| -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nid`    | integer | ID numerico dell'entità (NID per i nodi, TID per i termini di tassonomia). Il frontend usa il campo `nid` per entrambi i casi — usare un nome generico `id` è accettabile se preferito, purché documentato. |
| `type`   | string  | Tipo di entità Drupal: `"node"` oppure `"taxonomy_term"`                                                                                                                                                    |
| `bundle` | string  | Bundle dell'entità (es. `"prodotto_mosaico"`, `"articolo"`, `"mosaico_collezioni"`)                                                                                                                         |
| `locale` | string  | Codice lingua corrente (es. `"it"`, `"en"`, `"fr"`)                                                                                                                                                         |

### Errore — HTTP 404

```json
{
  "error": "not_found",
  "message": "No entity found for path: /path-inesistente"
}
```

### Errore — HTTP 400 (tipo entità non supportato)

```json
{
  "error": "unsupported_type",
  "message": "Unsupported entity type for path: /path-del-problema"
}
```

Questo caso si verifica se l'alias esiste ma non punta a un nodo o a un termine di tassonomia (es. un path di sistema Drupal). Non è atteso in produzione normale, ma deve essere gestito correttamente.

---

## Logica Implementativa (Pseudocodice PHP)

```php
public function get(Request $request): JsonResponse {

  // 1. Legge il parametro path dalla query string
  $alias = $request->query->get('path');
  if (empty($alias)) {
    return new JsonResponse([
      'error' => 'missing_parameter',
      'message' => 'The "path" query parameter is required.',
    ], 400);
  }

  // 2. Recupera il langcode dalla negoziazione di lingua di Drupal
  // (il locale nel pattern URL, es. /it/, /en/, determina questo valore)
  $langcode = \Drupal::languageManager()->getCurrentLanguage()->getId();

  // 3. Risolve l'alias all'interno Drupal (es. /mosaico/pluma/01-bora → /node/1667)
  $internal_path = \Drupal::service('path_alias.manager')
    ->getPathByAlias('/' . ltrim($alias, '/'), $langcode);

  // 4. Se l'alias non è stato risolto, il path_alias.manager restituisce
  //    l'alias stesso invariato. In quel caso: 404.
  if ($internal_path === '/' . ltrim($alias, '/')) {
    return new JsonResponse([
      'error' => 'not_found',
      'message' => "No entity found for path: $alias",
    ], 404);
  }

  // 5. Estrae il tipo entità e l'ID dal path interno
  if (preg_match('/^\/node\/(\d+)$/', $internal_path, $matches)) {
    $entity_type = 'node';
    $entity_id = (int) $matches[1];
  }
  elseif (preg_match('/^\/taxonomy\/term\/(\d+)$/', $internal_path, $matches)) {
    $entity_type = 'taxonomy_term';
    $entity_id = (int) $matches[1];
  }
  else {
    return new JsonResponse([
      'error' => 'unsupported_type',
      'message' => "Unsupported entity type for path: $alias",
    ], 400);
  }

  // 6. Carica l'entità per ottenere il bundle
  $entity = \Drupal::entityTypeManager()
    ->getStorage($entity_type)
    ->load($entity_id);

  if (!$entity) {
    return new JsonResponse([
      'error' => 'not_found',
      'message' => "No entity found for path: $alias",
    ], 404);
  }

  // 7. Restituisce i metadati
  return new JsonResponse([
    'nid'    => $entity_id,
    'type'   => $entity_type,
    'bundle' => $entity->bundle(),
    'locale' => $langcode,
  ]);
}
```

> **Nota sul passo 4**: `path_alias.manager::getPathByAlias()` restituisce il percorso passato invariato se non trova una corrispondenza — non lancia eccezioni. Controllare questa condizione esplicitamente.

---

## Requisiti Non Funzionali

| Requisito                 | Specifica                                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Autenticazione**        | Nessuna — accessibile anonimamente                                                                                                                                  |
| **Content-Type risposta** | `application/json` per tutte le risposte (200, 400, 404)                                                                                                            |
| **Cache**                 | `Cache-Control: public, max-age=3600` — gli alias Drupal cambiano raramente                                                                                         |
| **Negoziazione lingua**   | Deve rispettare la negoziazione lingua nativa di Drupal; il locale nel pattern URL (`/it/`, `/en/`, ecc.) determina il langcode usato per la risoluzione dell'alias |
| **Parametro `path`**      | NON deve includere il prefisso di locale (es. `/mosaico/pluma` non `/it/mosaico/pluma`)                                                                             |
| **Pattern URL**           | Conforme agli altri endpoint custom: `/{locale}/api/v1/resolve-path`                                                                                                |

---

## Scope: Content Type Supportati

L'endpoint è completamente generico — non contiene logica specifica per content type. Deve funzionare per tutti i bundle Drupal presenti nel sito:

**Nodi — Prodotti (6):**

- `prodotto_mosaico`, `prodotto_vetrite`, `prodotto_arredo`, `prodotto_tessuto`, `prodotto_pixall`, `prodotto_illuminazione`

**Nodi — Editoriale (8):**

- `page`, `landing_page`, `articolo`, `news`, `tutorial`, `progetto`, `ambiente`, `showroom`

**Nodi — Metadati (4):**

- `categoria`, `categoria_blog`, `documento`, `tag`

**Termini di tassonomia (11 vocabolari):**

- `mosaico_collezioni`, `mosaico_colori`, `vetrite_collezioni`, `vetrite_colori`, `vetrite_finiture`, `vetrite_textures`, `arredo_finiture`, `tessuto_colori`, `tessuto_finiture`, `tessuto_tipologie`, `tessuto_manutenzione`

Non è necessario alcun trattamento speciale per nessuno di questi tipi — la logica è identica per tutti.

---

## Integrazione con gli Endpoint Esistenti

Questo endpoint si integra nel catalogo API esistente come segue:

| Endpoint                                             | Ruolo                                           |
| ---------------------------------------------------- | ----------------------------------------------- |
| `GET /{locale}/api/v1/resolve-path?path=...` (nuovo) | Risolve un alias → metadati entità              |
| `GET /{locale}/api/v1/entity?path=...` (esistente)   | Restituisce l'entità completa con tutti i campi |

Il frontend chiamerà prima `resolve-path` per scoprire il bundle, poi sceglierà l'endpoint di dettaglio appropriato (da definire) in base al bundle restituito.

**Flusso frontend previsto:**

```
URL: /mosaico/pluma/01-bora
  │
  ▼
resolve-path: GET /it/api/v1/resolve-path?path=/mosaico/pluma/01-bora
  → { nid: 1667, type: "node", bundle: "prodotto_mosaico", locale: "it" }
  │
  ▼
[endpoint dedicato per prodotto_mosaico, da costruire]
GET /it/api/v1/mosaic-product/1667
  → { tutti i campi del prodotto }
```

---

## Priorità e Dipendenze

**Questo endpoint è bloccante.** Nessuna pagina di dettaglio prodotto può essere costruita senza di esso. È la prima cosa che il team backend deve consegnare nella nuova architettura.

**Non ci sono dipendenze da altri endpoint nuovi** — `resolve-path` usa solo funzionalità native di Drupal (`path_alias.manager`, `entityTypeManager`).

**Test minimi richiesti prima della consegna:**

1. Alias valido → risposta 200 con NID, type, bundle, locale corretti
2. Alias valido in inglese → bundle corretto, `locale: "en"`
3. Alias inesistente → risposta 404 con body JSON (non HTML)
4. Nodo con alias che include caratteri accentati (es. `/mosaico/neocolibrì-barrels/515-barrels`) → risposta 200 corretta
5. Termine di tassonomia con alias → `type: "taxonomy_term"`, bundle = nome vocabolario
6. Risposta con `Content-Type: application/json` verificato negli header

---

## Domande Aperte

1. **Nome campo ID**: il brief usa `nid` come campo per l'ID numerico anche per i termini di tassonomia (per semplicità lato frontend). Se il team backend preferisce usare `id` come nome generico (valido sia per nodi che per termini), è accettabile — comunicarcelo prima dell'implementazione per aggiornare il frontend di conseguenza.

2. **Entità non pubblicate**: se un nodo esiste ma non è pubblicato, l'endpoint deve restituire 404 o i metadati comunque? La nostra preferenza è **404 per entità non pubblicate**, coerentemente con il comportamento del frontend (le pagine non pubblicate non devono essere accessibili).

3. **Redirect Drupal**: se un alias è stato rinominato e Drupal ha un redirect configurato, l'endpoint deve seguire il redirect o restituire 404? Preferenza: **restituire 404** e lasciare che il redirect venga gestito a livello HTTP normale.

---

_Documento generato dal team frontend — riferirsi a `docs/DRUPAL_API_CATALOG.md` nel repository Next.js per il catalogo completo degli endpoint esistenti._
