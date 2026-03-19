# Drupal JSON:API Endpoints - SICIS Stage

**Base URL**: https://www.sicis-stage.com/it/jsonapi

---

## Resource Types Disponibili

### node--* (Content Types)
- `node--ambiente` — Ambienti
- `node--articolo` — Articoli
- `node--categoria` — Categorie
- `node--categoria_blog` — Categorie Blog
- `node--documento` — Documenti
- `node--landing_page` — Landing Pages
- `node--news` — News
- `node--page` — Pagine
- `node--prodotto_arredo` — Prodotti Arredo
- `node--prodotto_mosaico` — Prodotti Mosaico
- `node--prodotto_pixall` — Prodotti Pixall
- `node--prodotto_tessuto` — Prodotti Tessuto
- `node--prodotto_vetrite` — Prodotti Vetrite
- `node--progetto` — Progetti
- `node--showroom` — Showroom
- `node--tag` — Tag
- `node--tutorial` — Tutorial

### taxonomy_term--* (Taxonomy Vocabularies)
- `taxonomy_term--ambienti_categorie` — Categorie Ambienti
- `taxonomy_term--arredo_finiture` — Finiture Arredo
- `taxonomy_term--mosaico_collezioni` — Collezioni Mosaico
- `taxonomy_term--mosaico_colori` — Colori Mosaico
- `taxonomy_term--mosaico_finiture` — Finiture Mosaico
- `taxonomy_term--mosaico_forme` — Forme Mosaico
- `taxonomy_term--mosaico_stucchi` — Stucchi Mosaico
- `taxonomy_term--progetto_categorie` — Categorie Progetti
- `taxonomy_term--tessuto_colori` — Colori Tessuto
- `taxonomy_term--tessuto_finiture` — Finiture Tessuto
- `taxonomy_term--tessuto_manutenzione` — Manutenzione Tessuto
- `taxonomy_term--tessuto_tipologie` — Tipologie Tessuto
- `taxonomy_term--vetrite_collezioni` — Collezioni Vetrite
- `taxonomy_term--vetrite_colori` — Colori Vetrite
- `taxonomy_term--vetrite_finiture` — Finiture Vetrite
- `taxonomy_term--vetrite_textures` — Texture Vetrite

### paragraph--* (Paragraph Types)
**Blocchi Contenuto**:
- `paragraph--blocco_anni` — Blocco Anni
- `paragraph--blocco_correlati` — Blocco Correlati
- `paragraph--blocco_documenti` — Blocco Documenti
- `paragraph--blocco_form_blog` — Blocco Form Blog
- `paragraph--blocco_gallery` — Blocco Gallery
- `paragraph--blocco_gallery_intro` — Blocco Gallery Intro
- `paragraph--blocco_intro` — Blocco Intro
- `paragraph--blocco_newsletter` — Blocco Newsletter
- `paragraph--blocco_quote` — Blocco Quote
- `paragraph--blocco_slider_home` — Blocco Slider Home
- `paragraph--blocco_testo_immagine` — Blocco Testo Immagine
- `paragraph--blocco_testo_immagine_big` — Blocco Testo Immagine Big
- `paragraph--blocco_testo_immagine_blog` — Blocco Testo Immagine Blog
- `paragraph--blocco_tutorial` — Blocco Tutorial
- `paragraph--blocco_video` — Blocco Video

**Elementi Blocco**:
- `paragraph--elemento_blocco_anni` — Elemento Blocco Anni
- `paragraph--elemento_blocco_correlati` — Elemento Blocco Correlati
- `paragraph--elemento_blocco_gallery` — Elemento Blocco Gallery
- `paragraph--elemento_blocco_slider_home` — Elemento Blocco Slider Home

### file--* (File Resources)
- `file--file` — File generico (immagini, video, documenti)

### user--* (User Resources)
- `user--user` — Utenti

### block_content--* (Block Content)
- `block_content--basic` — Blocchi di Contenuto Base

### contact_message--* (Contact Forms)
- `contact_message--feedback` — Messaggi Feedback
- `contact_message--personal` — Messaggi Personali

### webform_submission--* (Webform Submissions)
- `webform_submission--contact` — Sottomissioni Form Contatti

### Configurazione & Metadata
- `action--action` — Azioni
- `asset_injector_css--asset_injector_css` — CSS Iniettati
- `asset_injector_js--asset_injector_js` — JS Iniettati
- `backup_migrate_destination--backup_migrate_destination` — Destinazioni Backup
- `backup_migrate_schedule--backup_migrate_schedule` — Schedule Backup
- `backup_migrate_settings--backup_migrate_settings` — Impostazioni Backup
- `backup_migrate_source--backup_migrate_source` — Sorgenti Backup
- `base_field_override--base_field_override` — Override Campi Base
- `block--block` — Blocchi
- `block_content_type--block_content_type` — Tipi Blocco Contenuto
- `comment--comment` — Commenti
- `comment_type--comment_type` — Tipi Commento
- `configurable_language--configurable_language` — Lingue Configurabili
- `contact_form--contact_form` — Form Contatti
- `date_format--date_format` — Formati Data
- `editor--editor` — Editor
- `entity_form_display--entity_form_display` — Display Form Entità
- `entity_form_mode--entity_form_mode` — Modalità Form Entità
- `entity_view_display--entity_view_display` — Display View Entità
- `entity_view_mode--entity_view_mode` — Modalità View Entità
- `field_config--field_config` — Configurazione Campi
- `field_storage_config--field_storage_config` — Configurazione Storage Campi
- `filter_format--filter_format` — Formati Filtro
- `image_style--image_style` — Stili Immagine
- `language_content_settings--language_content_settings` — Impostazioni Contenuto Lingua
- `menu--menu` — Menu
- `menu_link_content--menu_link_content` — Contenuto Link Menu
- `metatag_defaults--metatag_defaults` — Metatag Predefiniti
- `node_type--node_type` — Tipi Nodo
- `paragraphs_type--paragraphs_type` — Tipi Paragrafo
- `path_alias--path_alias` — Alias Percorso
- `pathauto_pattern--pathauto_pattern` — Pattern Pathauto
- `redirect--redirect` — Redirect
- `search_page--search_page` — Pagine Ricerca
- `shortcut--default` — Scorciatoie
- `shortcut_set--shortcut_set` — Set Scorciatoie
- `taxonomy_vocabulary--taxonomy_vocabulary` — Vocabolari Tassonomia
- `user_role--user_role` — Ruoli Utente
- `view--view` — View
- `webform--webform` — Webform
- `webform_options--webform_options` — Opzioni Webform

---

## File Structure (file--file)

### Endpoint
```
GET /it/jsonapi/file/file?page[limit]=1
```

### Attributi Disponibili
```json
{
  "type": "file--file",
  "id": "c5fa1985-9a5e-48d8-9ad8-e0b99d0f74e5",
  "attributes": {
    "drupal_internal__fid": 1,
    "langcode": "en",
    "filename": "light.png",
    "uri": {
      "value": "public://mosaico-colori/img/light.png",
      "url": "/sites/default/files/mosaico-colori/img/light.png"
    },
    "filemime": "image/png",
    "filesize": 2989,
    "status": true,
    "created": "2026-02-18T14:22:00+00:00",
    "changed": "2026-02-18T14:22:00+00:00"
  },
  "relationships": {
    "uid": {
      "data": null
    }
  }
}
```

### Campi Principali
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `drupal_internal__fid` | integer | ID file interno Drupal |
| `filename` | string | Nome file |
| `uri.value` | string | URI interno (public://...) |
| `uri.url` | string | URL relativo al server (/sites/default/files/...) |
| `filemime` | string | Tipo MIME (image/png, video/mp4, etc.) |
| `filesize` | integer | Dimensione in bytes |
| `status` | boolean | File attivo/inattivo |
| `created` | string | Data creazione (ISO 8601) |
| `changed` | string | Data ultima modifica (ISO 8601) |
| `langcode` | string | Codice lingua |

### Relazioni
- `uid` — Utente che ha caricato il file (nullable)

---

## Node Structure - Esempio: node--prodotto_mosaico

### Endpoint
```
GET /it/jsonapi/node/prodotto_mosaico?page[limit]=1
```

### Attributi Principali
```json
{
  "type": "node--prodotto_mosaico",
  "id": "74ee51be-c59f-43e2-8955-b3d2376d2c96",
  "attributes": {
    "title": "Sun 3",
    "path": {
      "alias": "/mosaico/murano-smalto/sun-3",
      "pid": 214,
      "langcode": "it"
    },
    "field_prezzo_eu": "204.00",
    "field_prezzo_on_demand": false,
    "field_titolo_main": "Sun 3",
    "drupal_internal__nid": 1441,
    "drupal_internal__vid": 1441,
    "langcode": "it",
    "revision_timestamp": "2026-02-25T14:10:25+00:00",
    "status": true,
    "created": "2021-02-12T09:15:20+00:00",
    "changed": "2026-02-25T14:10:25+00:00",
    "promote": true,
    "sticky": false,
    "default_langcode": false,
    "revision_translation_affected": true,
    "metatag": [
      {
        "tag": "meta",
        "attributes": {
          "name": "title",
          "content": "Sun 3 | Sicis"
        }
      }
    ]
  }
}
```

### Relazioni Disponibili
| Relazione | Tipo | Descrizione |
|-----------|------|-------------|
| `field_immagine` | file--file | Immagine principale |
| `field_video` | file--file | Video prodotto |
| `field_categoria` | node--categoria | Categoria prodotto |
| `field_collezione` | taxonomy_term--mosaico_collezioni | Collezione |
| `field_colori` | taxonomy_term--mosaico_colori | Colori (multipli) |
| `field_finitura` | taxonomy_term--mosaico_finiture | Finitura |
| `field_forma` | taxonomy_term--mosaico_forme | Forma |
| `field_gallery` | file--file | Gallery immagini (array) |
| `field_immagine_campione` | file--file | Immagine campione |
| `field_stucco` | taxonomy_term--mosaico_stucchi | Stucchi (array) |
| `node_type` | node_type--node_type | Tipo nodo |
| `revision_uid` | user--user | Utente ultima revisione |
| `uid` | user--user | Autore |

---

## Media Types

**Nota**: Questo Drupal NON utilizza l'entità `media` standard. I file sono gestiti direttamente tramite:
- `file--file` per file grezzi
- Relazioni di campo nei nodi (es. `field_immagine`, `field_video`)

I tipi di file supportati includono:
- **Immagini**: image/png, image/jpeg, image/gif, image/webp
- **Video**: video/mp4, video/webm
- **Documenti**: application/pdf, application/msword, etc.

---

## Query Comuni

### Fetch tutti i prodotti mosaico
```
GET /it/jsonapi/node/prodotto_mosaico?page[limit]=50
```

### Fetch un prodotto specifico con relazioni
```
GET /it/jsonapi/node/prodotto_mosaico/{id}?include=field_immagine,field_categoria,field_collezione
```

### Fetch file con filtro per tipo MIME
```
GET /it/jsonapi/file/file?filter[filemime]=image/png
```

### Fetch tassonomia colori mosaico
```
GET /it/jsonapi/taxonomy_term/mosaico_colori?page[limit]=100
```

### Fetch paragrafi di un nodo
```
GET /it/jsonapi/node/{id}?include=field_paragraphs
```

---

## Paginazione

Tutti gli endpoint supportano paginazione:
```
?page[limit]=20&page[offset]=0
```

Risposta include link `next` per pagina successiva:
```json
{
  "links": {
    "next": {
      "href": "https://www.sicis-stage.com/it/jsonapi/node/prodotto_mosaico?page%5Boffset%5D=1&page%5Blimit%5D=1"
    }
  }
}
```

---

## Filtri Disponibili

Supportati su tutti gli endpoint:
```
?filter[field_name]=value
?filter[status]=1
?filter[langcode]=it
```

---

## Include (Relazioni)

Fetch relazioni annidate:
```
?include=field_immagine,field_categoria,uid
```

---

## Sort

Ordinamento:
```
?sort=-created
?sort=title
```

---

## Totale Endpoint Disponibili

- **17 node types** (contenuti)
- **15 taxonomy vocabularies** (tassonomie)
- **15 paragraph types** (paragrafi)
- **1 file type** (file)
- **1 user type** (utenti)
- **1 block_content type** (blocchi)
- **2 contact_message types** (messaggi contatti)
- **1 webform_submission type** (sottomissioni form)
- **~40 config/metadata types** (configurazione)

**TOTALE: ~100+ resource types disponibili**

