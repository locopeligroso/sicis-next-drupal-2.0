# Drupal Field Inventory

## node--progetto

### Attributes
| Campo | Tipo | Esempio valore | Usato nel template? |
|-------|------|----------------|---------------------|
| title | string | "Club Room, Debrecen" | ✅ (fallback) |
| field_titolo_main | string | "Club Room, Debrecen" | ✅ |
| field_testo_main | text (HTML) | null | ❌ non usato |
| field_collegamento_esterno | string | null | ❌ non usato |
| field_location | string | null | ❌ non usato |
| field_meta_tags | JSON | null | ❌ non usato |
| field_tipologia | string | null | ❌ non usato |
| drupal_internal__nid | integer | 3285 | ❌ (internal) |
| drupal_internal__vid | integer | 3285 | ❌ (internal) |
| langcode | string | "it" | ❌ (internal) |
| revision_timestamp | ISO8601 | "2026-02-27T16:38:32+00:00" | ❌ (internal) |
| status | boolean | true | ❌ (internal) |
| created | ISO8601 | "2026-02-27T16:38:32+00:00" | ❌ (internal) |
| changed | ISO8601 | "2026-02-27T16:38:32+00:00" | ❌ (internal) |
| promote | boolean | true | ❌ (internal) |
| sticky | boolean | false | ❌ (internal) |
| default_langcode | boolean | false | ❌ (internal) |
| revision_translation_affected | boolean | true | ❌ (internal) |
| metatag | array | [{tag: "meta", attributes: {...}}] | ❌ (internal) |
| content_translation_source | string | "und" | ❌ (internal) |
| content_translation_outdated | boolean | false | ❌ (internal) |
| path | object | {alias: "/progetti/club-room-debrecen", ...} | ❌ (internal) |

### Relationships
| Campo | Tipo target | Cardinalità | Usato? | Note |
|-------|-------------|-------------|--------|------|
| field_immagine | file--file | singolo | ✅ | Meta: alt, title, width (600), height (600) |
| field_categoria_progetto | taxonomy_term--progetto_categorie | singolo | ❌ non usato | Categoria del progetto |
| node_type | node_type--node_type | singolo | ❌ (internal) | Tipo di nodo |
| revision_uid | user--user | singolo | ❌ (internal) | Autore revisione |
| uid | user--user | singolo | ❌ (internal) | Autore |

---

## node--page

### Attributes
| Campo | Tipo | Esempio valore | Usato nel template? |
|-------|------|----------------|---------------------|
| title | string | "Homepage" | ✅ (fallback) |
| field_titolo_main | string | "Homepage" | ✅ |
| field_testo_main | text (HTML) | null | ❌ non usato |
| field_page_id | string | "homepage" | ✅ (routing) |
| field_meta_tags | JSON | "{\"abstract\":\"...\",\"description\":\"...\",\"keywords\":\"...\"}" | ✅ (SEO) |
| drupal_internal__nid | integer | 1 | ❌ (internal) |
| drupal_internal__vid | integer | 1 | ❌ (internal) |
| langcode | string | "it" | ❌ (internal) |
| revision_timestamp | ISO8601 | "2026-02-18T10:41:54+00:00" | ❌ (internal) |
| status | boolean | true | ❌ (internal) |
| created | ISO8601 | "2026-02-18T10:41:38+00:00" | ❌ (internal) |
| changed | ISO8601 | "2026-03-02T13:48:27+00:00" | ❌ (internal) |
| promote | boolean | false | ❌ (internal) |
| sticky | boolean | false | ❌ (internal) |
| default_langcode | boolean | false | ❌ (internal) |
| revision_translation_affected | boolean | true | ❌ (internal) |
| metatag | array | [{tag: "meta", attributes: {...}}] | ❌ (internal) |
| content_translation_source | string | "und" | ❌ (internal) |
| content_translation_outdated | boolean | false | ❌ (internal) |
| path | object | {alias: "/homepage", ...} | ❌ (internal) |

### Relationships
| Campo | Tipo target | Cardinalità | Usato? | Note |
|-------|-------------|-------------|--------|------|
| field_blocchi | paragraph--* | multiplo (array) | ✅ | 7 blocchi: slider_home, testo_immagine, video, quote, gallery, testo_immagine_big |
| field_categoria | taxonomy_term--* | singolo | ❌ non usato | null nel campione |
| field_immagine | file--file | singolo | ❌ non usato | null nel campione |
| node_type | node_type--node_type | singolo | ❌ (internal) | Tipo di nodo |
| revision_uid | user--user | singolo | ❌ (internal) | Autore revisione |
| uid | user--user | singolo | ❌ (internal) | Autore |

---

## node--landing_page

### Attributes
| Campo | Tipo | Esempio valore | Usato nel template? |
|-------|------|----------------|---------------------|
| title | string | "Lead Capture" | ✅ (fallback) |
| field_titolo_main | string | "Lead Capture" | ✅ |
| field_meta_tags | JSON | null | ❌ non usato |
| drupal_internal__nid | integer | 3480 | ❌ (internal) |
| drupal_internal__vid | integer | 3480 | ❌ (internal) |
| langcode | string | "it" | ❌ (internal) |
| revision_timestamp | ISO8601 | "2026-03-02T11:10:14+00:00" | ❌ (internal) |
| status | boolean | true | ❌ (internal) |
| created | ISO8601 | "2026-03-02T11:10:14+00:00" | ❌ (internal) |
| changed | ISO8601 | "2026-03-02T11:10:14+00:00" | ❌ (internal) |
| promote | boolean | true | ❌ (internal) |
| sticky | boolean | false | ❌ (internal) |
| default_langcode | boolean | false | ❌ (internal) |
| revision_translation_affected | boolean | true | ❌ (internal) |
| metatag | array | [{tag: "meta", attributes: {...}}] | ❌ (internal) |
| content_translation_source | string | "und" | ❌ (internal) |
| content_translation_outdated | boolean | false | ❌ (internal) |
| path | object | {alias: "/lead-capture", ...} | ❌ (internal) |

### Relationships
| Campo | Tipo target | Cardinalità | Usato? | Note |
|-------|-------------|-------------|--------|------|
| field_blocchi | paragraph--* | multiplo (array) | ✅ | Array vuoto nel campione, ma struttura supporta blocchi |
| node_type | node_type--node_type | singolo | ❌ (internal) | Tipo di nodo |
| revision_uid | user--user | singolo | ❌ (internal) | Autore revisione |
| uid | user--user | singolo | ❌ (internal) | Autore |

---

## node--articolo

### Attributes
| Campo | Tipo | Esempio valore | Usato nel template? |
|-------|------|----------------|---------------------|
| title | string | "Arredamento lounge bar: 7 idee..." | ✅ (fallback) |
| field_titolo_main | string | "Arredamento lounge bar: 7 idee..." | ✅ |
| field_testo_main | text (HTML) | "<p>Idee e consigli per arredare...</p>" | ✅ |
| field_data | date | "2024-06-28" | ✅ (data pubblicazione) |
| field_meta_tags | JSON | null | ❌ non usato |
| drupal_internal__nid | integer | 3492 | ❌ (internal) |
| drupal_internal__vid | integer | 3492 | ❌ (internal) |
| langcode | string | "it" | ❌ (internal) |
| revision_timestamp | ISO8601 | "2026-03-02T11:39:11+00:00" | ❌ (internal) |
| status | boolean | true | ❌ (internal) |
| created | ISO8601 | "2026-03-02T11:39:11+00:00" | ❌ (internal) |
| changed | ISO8601 | "2026-03-02T11:53:48+00:00" | ❌ (internal) |
| promote | boolean | true | ❌ (internal) |
| sticky | boolean | false | ❌ (internal) |
| default_langcode | boolean | false | ❌ (internal) |
| revision_translation_affected | boolean | true | ❌ (internal) |
| metatag | array | [{tag: "meta", attributes: {...}}] | ❌ (internal) |
| content_translation_source | string | "und" | ❌ (internal) |
| content_translation_outdated | boolean | false | ❌ (internal) |
| path | object | {alias: "/blog/arredamento-lounge-bar...", ...} | ❌ (internal) |

### Relationships
| Campo | Tipo target | Cardinalità | Usato? | Note |
|-------|-------------|-------------|--------|------|
| field_blocchi | paragraph--* | multiplo (array) | ✅ | 13 blocchi: testo_immagine_blog, gallery, form_blog |
| field_categoria_blog | node--categoria_blog | singolo | ❌ non usato | Categoria blog |
| field_immagine | file--file | singolo | ✅ | Immagine principale (1502x964) |
| field_immagine_anteprima | file--file | singolo | ✅ | Immagine anteprima (1616x1077) |
| field_tags | node--tag | multiplo (array) | ❌ non usato | 1 tag nel campione |
| node_type | node_type--node_type | singolo | ❌ (internal) | Tipo di nodo |
| revision_uid | user--user | singolo | ❌ (internal) | Autore revisione |
| uid | user--user | singolo | ❌ (internal) | Autore |

---

## node--news

### Attributes
| Campo | Tipo | Esempio valore | Usato nel template? |
|-------|------|----------------|---------------------|
| title | string | "SICIS veste d'oro il Teatro della Memoria" | ✅ (fallback) |
| field_titolo_main | string | "SICIS veste d'oro il Teatro della Memoria" | ✅ |
| field_testo_main | text (HTML) | "<p>Si vestirà di un incantevole manto d'oro...</p>" | ✅ |
| field_data | date | "2021-05-10" | ✅ (data pubblicazione) |
| field_autore | string | null | ❌ non usato |
| field_meta_tags | JSON | null | ❌ non usato |
| drupal_internal__nid | integer | 3460 | ❌ (internal) |
| drupal_internal__vid | integer | 3460 | ❌ (internal) |
| langcode | string | "it" | ❌ (internal) |
| revision_timestamp | ISO8601 | "2026-03-02T09:37:34+00:00" | ❌ (internal) |
| status | boolean | true | ❌ (internal) |
| created | ISO8601 | "2026-03-02T09:37:34+00:00" | ❌ (internal) |
| changed | ISO8601 | "2026-03-02T09:56:59+00:00" | ❌ (internal) |
| promote | boolean | true | ❌ (internal) |
| sticky | boolean | false | ❌ (internal) |
| default_langcode | boolean | false | ❌ (internal) |
| revision_translation_affected | boolean | true | ❌ (internal) |
| metatag | array | [{tag: "meta", attributes: {...}}] | ❌ (internal) |
| content_translation_source | string | "und" | ❌ (internal) |
| content_translation_outdated | boolean | false | ❌ (internal) |
| path | object | {alias: "/news/sicis-veste-doro...", ...} | ❌ (internal) |

### Relationships
| Campo | Tipo target | Cardinalità | Usato? | Note |
|-------|-------------|-------------|--------|------|
| field_blocchi | paragraph--* | multiplo (array) | ✅ | 3 blocchi: testo_immagine_big, testo_immagine |
| field_immagine | file--file | singolo | ✅ | Immagine principale (2500x970) |
| field_immagine_anteprima | file--file | singolo | ✅ | Immagine anteprima (500x500) |
| field_news_correlate | node--news | multiplo (array) | ❌ non usato | Array vuoto nel campione |
| node_type | node_type--node_type | singolo | ❌ (internal) | Tipo di nodo |
| revision_uid | user--user | singolo | ❌ (internal) | Autore revisione |
| uid | user--user | singolo | ❌ (internal) | Autore |

---

## node--showroom

### Attributes
| Campo | Tipo | Esempio valore | Usato nel template? |
|-------|------|----------------|---------------------|
| title | string | "Showroom Milano" | ✅ (fallback) |
| field_titolo_main | string | "Showroom Milano" | ✅ |
| field_area | string | "europa" | ✅ (filtro/raggruppamento) |
| field_citta | string | "Milano" | ✅ (display) |
| field_indirizzo | string | "Via Fatebenefratelli 8, 20121 Milano (ITALY)" | ✅ (display) |
| field_indirizzo_email | string | "info@sicis.com" | ✅ (display) |
| field_telefono | string | "+39 02 87 6099" | ✅ (display) |
| field_fax | string | null | ❌ non usato |
| field_latitudine | string | "45.4729669" | ✅ (mappa) |
| field_longitudine | string | "9.1871372" | ✅ (mappa) |
| field_collegamento_esterno | string | "https://www.sicis-library.com/resources/pdf-sicis/SICIS_Showroom-Milan_22_ENG.pdf" | ✅ (link PDF) |
| field_collegamento_gmaps | string | "https://goo.gl/maps/1ogeG91miYMjzayo8" | ✅ (link Google Maps) |
| field_meta_tags | JSON | null | ❌ non usato |
| drupal_internal__nid | integer | 3210 | ❌ (internal) |
| drupal_internal__vid | integer | 3210 | ❌ (internal) |
| langcode | string | "it" | ❌ (internal) |
| revision_timestamp | ISO8601 | "2026-02-27T16:07:28+00:00" | ❌ (internal) |
| status | boolean | true | ❌ (internal) |
| created | ISO8601 | "2026-02-27T16:07:28+00:00" | ❌ (internal) |
| changed | ISO8601 | "2026-02-27T16:07:28+00:00" | ❌ (internal) |
| promote | boolean | true | ❌ (internal) |
| sticky | boolean | false | ❌ (internal) |
| default_langcode | boolean | false | ❌ (internal) |
| revision_translation_affected | boolean | true | ❌ (internal) |
| metatag | array | [{tag: "meta", attributes: {...}}] | ❌ (internal) |
| content_translation_source | string | "und" | ❌ (internal) |
| content_translation_outdated | boolean | false | ❌ (internal) |
| path | object | {alias: "/showroom/showroom-milano", ...} | ❌ (internal) |

### Relationships
| Campo | Tipo target | Cardinalità | Usato? | Note |
|-------|-------------|-------------|--------|------|
| field_gallery | file--file | multiplo (array) | ❌ non usato | Array vuoto nel campione |
| node_type | node_type--node_type | singolo | ❌ (internal) | Tipo di nodo |
| revision_uid | user--user | singolo | ❌ (internal) | Autore revisione |
| uid | user--user | singolo | ❌ (internal) | Autore |

---

## node--ambiente

### Attributes
| Campo | Tipo | Esempio valore | Usato nel template? |
|-------|------|----------------|---------------------|
| title | string | "Rivestimenti di classe per un bagno Made in Italy \| SICIS" | ✅ (fallback) |
| field_titolo_main | string | "Mosaico bagno" | ✅ |
| field_testo_main | text (HTML) | null | ❌ non usato |
| field_in_evidenza | boolean | true | ❌ non usato (ma potrebbe essere usato per filtri) |
| field_meta_tags | JSON | "{\"abstract\":\"Dona al tuo bagno...\",\"description\":\"Dona al tuo bagno...\"}" | ✅ (SEO) |
| drupal_internal__nid | integer | 3473 | ❌ (internal) |
| drupal_internal__vid | integer | 3473 | ❌ (internal) |
| langcode | string | "it" | ❌ (internal) |
| revision_timestamp | ISO8601 | "2026-03-02T10:36:28+00:00" | ❌ (internal) |
| status | boolean | true | ❌ (internal) |
| created | ISO8601 | "2026-03-02T10:36:28+00:00" | ❌ (internal) |
| changed | ISO8601 | "2026-03-02T10:59:35+00:00" | ❌ (internal) |
| promote | boolean | true | ❌ (internal) |
| sticky | boolean | false | ❌ (internal) |
| default_langcode | boolean | false | ❌ (internal) |
| revision_translation_affected | boolean | true | ❌ (internal) |
| metatag | array | [{tag: "meta", attributes: {...}}] | ❌ (internal) |
| content_translation_source | string | "und" | ❌ (internal) |
| content_translation_outdated | boolean | false | ❌ (internal) |
| path | object | {alias: "/ambienti/mosaico-bagno", ...} | ❌ (internal) |

### Relationships
| Campo | Tipo target | Cardinalità | Usato? | Note |
|-------|-------------|-------------|--------|------|
| field_blocchi | paragraph--* | multiplo (array) | ✅ | 13 blocchi: intro, gallery, testo_immagine, testo_immagine_big |
| field_categoria_ambiente | taxonomy_term--ambienti_categorie | singolo | ❌ non usato | Categoria ambiente |
| field_immagine | file--file | singolo | ❌ non usato | null nel campione |
| node_type | node_type--node_type | singolo | ❌ (internal) | Tipo di nodo |
| revision_uid | user--user | singolo | ❌ (internal) | Autore revisione |
| uid | user--user | singolo | ❌ (internal) | Autore |

---

## Field Usage Summary

### Campi Usati nel Frontend
- **Comuni a tutti**: `title`, `field_titolo_main`, `field_blocchi` (dove presente)
- **Immagini**: `field_immagine`, `field_immagine_anteprima`
- **Contenuto**: `field_testo_main`, `field_data`
- **Routing/SEO**: `field_page_id`, `field_meta_tags`, `metatag`
- **Showroom specifici**: `field_area`, `field_citta`, `field_indirizzo`, `field_indirizzo_email`, `field_telefono`, `field_latitudine`, `field_longitudine`, `field_collegamento_esterno`, `field_collegamento_gmaps`

### Campi NON Usati (Gap)
- **Progetto**: `field_testo_main`, `field_collegamento_esterno`, `field_location`, `field_tipologia`, `field_categoria_progetto`
- **Page**: `field_testo_main`, `field_categoria`, `field_immagine`
- **Landing Page**: `field_meta_tags`
- **Articolo**: `field_categoria_blog`, `field_tags`
- **News**: `field_autore`, `field_news_correlate`
- **Showroom**: `field_fax`, `field_gallery`
- **Ambiente**: `field_testo_main`, `field_in_evidenza`, `field_categoria_ambiente`, `field_immagine`

### Campi Interni (Drupal Metadata)
- `drupal_internal__nid`, `drupal_internal__vid`
- `langcode`, `revision_timestamp`, `status`, `created`, `changed`
- `promote`, `sticky`, `default_langcode`, `revision_translation_affected`
- `metatag` (array), `content_translation_source`, `content_translation_outdated`
- `path` (object con alias)
- `node_type`, `revision_uid`, `uid` (relationships)

---

## File Structure for Images

### Singolo File (field_immagine)
```json
{
  "type": "file--file",
  "id": "21e8953b-2d47-48a8-8739-bf7823395507",
  "meta": {
    "alt": "",
    "title": "",
    "width": 600,
    "height": 600,
    "drupal_internal__target_id": 4760
  }
}
```

### Array di File (field_gallery)
```json
{
  "data": [],
  "links": {
    "related": { "href": "..." },
    "self": { "href": "..." }
  }
}
```

---

## Recommendations

1. **Progetto**: Implementare `field_categoria_progetto` per filtri/categorizzazione
2. **Articolo**: Implementare `field_categoria_blog` e `field_tags` per navigazione e correlazioni
3. **News**: Implementare `field_news_correlate` per suggerimenti correlati
4. **Ambiente**: Implementare `field_categoria_ambiente` per filtri
5. **Showroom**: Implementare `field_gallery` per gallerie fotografiche
6. **Tutti**: Valutare uso di `field_meta_tags` per SEO avanzato (attualmente usato solo in page e ambiente)

