# Drupal Node Types Mapping

**Base URL**: https://www.sicis-stage.com/it/jsonapi  
**Locale**: it (Italian)  
**Generated**: 2026-03-19

## Summary

| Bundle | Label | Count | Attributes | Relationships |
|--------|-------|-------|------------|----------------|
| `ambiente` | Ambiente | 0 | 20 | 6 |
| `articolo` | Articolo | 0 | 20 | 8 |
| `categoria` | Categoria | 0 | 19 | 5 |
| `categoria_blog` | Categoria Blog | 0 | 19 | 4 |
| `documento` | Documento | 0 | 22 | 5 |
| `landing_page` | Landing Page | 0 | 18 | 4 |
| `news` | News | 0 | 21 | 7 |
| `page` | Basic page | 0 | 20 | 6 |
| `prodotto_arredo` | Prodotto Arredo | 0 | 30 | 12 |
| `prodotto_mosaico` | Prodotto Mosaico | 0 | 26 | 13 |
| `prodotto_pixall` | Prodotto Pixall | 0 | 31 | 12 |
| `prodotto_tessuto` | Prodotto Tessuto | 0 | 30 | 12 |
| `prodotto_vetrite` | Prodotto Vetrite | 0 | 29 | 10 |
| `progetto` | Progetto | 0 | 21 | 5 |
| `showroom` | Showroom | 0 | 28 | 4 |
| `tag` | Tag | 0 | 19 | 3 |
| `tutorial` | Tutorial | 0 | 20 | 4 |

---

## Detailed Mapping


### node--ambiente

- **Label**: Ambiente
- **Count**: 0 nodes
- **Endpoint**: `GET /node/ambiente`

#### Attributes (      20 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_in_evidenza
- field_meta_tags
- field_testo_main
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`

---


### node--articolo

- **Label**: Articolo
- **Count**: 0 nodes
- **Endpoint**: `GET /node/articolo`

#### Attributes (      20 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_data
- field_meta_tags
- field_testo_main
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`

---


### node--categoria

- **Label**: Categoria
- **Count**: 0 nodes
- **Endpoint**: `GET /node/categoria`

#### Attributes (      19 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_meta_tags
- field_testo_main
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`
- `field_categoria` → `node--page`
- `field_immagine` → `file--file`

---


### node--categoria_blog

- **Label**: Categoria Blog
- **Count**: 0 nodes
- **Endpoint**: `GET /node/categoria_blog`

#### Attributes (      19 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_meta_tags
- field_testo_main
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`

---


### node--documento

- **Label**: Documento
- **Count**: 0 nodes
- **Endpoint**: `GET /node/documento`

#### Attributes (      22 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_categoria_documento
- field_collegamento_esterno
- field_id_video
- field_no_form
- field_tipologia_documento
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`
- `field_allegato` → `N/A`
- `field_immagine` → `file--file`

---


### node--landing_page

- **Label**: Landing Page
- **Count**: 0 nodes
- **Endpoint**: `GET /node/landing_page`

#### Attributes (      18 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_meta_tags
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`

---


### node--news

- **Label**: News
- **Count**: 0 nodes
- **Endpoint**: `GET /node/news`

#### Attributes (      21 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_autore
- field_data
- field_meta_tags
- field_testo_main
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`

---


### node--page

- **Label**: Basic page
- **Count**: 0 nodes
- **Endpoint**: `GET /node/page`

#### Attributes (      20 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_meta_tags
- field_page_id
- field_testo_main
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`

---


### node--prodotto_arredo

- **Label**: Prodotto Arredo
- **Count**: 0 nodes
- **Endpoint**: `GET /node/prodotto_arredo`

#### Attributes (      30 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_collegamento_esterno
- field_componibile
- field_materiali
- field_meta_tags
- field_more_varianti
- field_next_art
- field_no_form_scheda_tecnica
- field_path_file_ftp
- field_path_file_ftp_img_hd
- field_prezzo_eu
- field_prezzo_usa
- field_specifiche_tecniche
- field_testo_main
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`
- `field_categoria` → `node--categoria`

---


### node--prodotto_mosaico

- **Label**: Prodotto Mosaico
- **Count**: 0 nodes
- **Endpoint**: `GET /node/prodotto_mosaico`

#### Attributes (      26 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_campione
- field_composizione
- field_meta_tags
- field_no_usa_stock
- field_prezzo_eu
- field_prezzo_on_demand
- field_prezzo_usa_sheet
- field_prezzo_usa_sqft
- field_testo_main
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `field_immagine` → `file--file`
- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`
- `field_categoria` → `node--categoria`
- `field_collezione` → `taxonomy_term--mosaico_collezioni`

---


### node--prodotto_pixall

- **Label**: Prodotto Pixall
- **Count**: 0 nodes
- **Endpoint**: `GET /node/prodotto_pixall`

#### Attributes (      31 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_composizione
- field_consumo_stucco_m2
- field_consumo_stucco_sqft
- field_dimensione_foglio_inch
- field_dimensione_foglio_mm
- field_dimensione_moduli
- field_dimensione_tessera_inch
- field_dimensione_tessera_mm
- field_manutenzione
- field_meta_tags
- field_numero_moduli
- field_retinatura
- field_testo_main
- field_titolo_main
- field_utilizzi
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`

---


### node--prodotto_tessuto

- **Label**: Prodotto Tessuto
- **Count**: 0 nodes
- **Endpoint**: `GET /node/prodotto_tessuto`

#### Attributes (      30 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_altezza_cm
- field_altezza_inch
- field_composizione
- field_densita_annodatura
- field_dimensioni_cm
- field_dimensioni_inch
- field_meta_tags
- field_peso
- field_prezzo_eu
- field_prezzo_usa
- field_spessore
- field_testo_main
- field_titolo_main
- field_utilizzo
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`
- `field_categoria` → `node--categoria`

---


### node--prodotto_vetrite

- **Label**: Prodotto Vetrite
- **Count**: 0 nodes
- **Endpoint**: `GET /node/prodotto_vetrite`

#### Attributes (      29 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_campione
- field_dimensione_pattern_cm
- field_dimensione_pattern_inch
- field_dimensioni_cm
- field_dimensioni_inch
- field_formato_campione
- field_meta_tags
- field_no_usa_stock
- field_prezzo_eu
- field_prezzo_on_demand
- field_prezzo_usa
- field_testo_main
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `field_immagine` → `file--file`
- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`
- `field_collezione` → `taxonomy_term--vetrite_collezioni`

---


### node--progetto

- **Label**: Progetto
- **Count**: 0 nodes
- **Endpoint**: `GET /node/progetto`

#### Attributes (      21 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_collegamento_esterno
- field_location
- field_meta_tags
- field_tipologia
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `field_immagine` → `file--file`
- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`
- `field_categoria_progetto` → `taxonomy_term--progetto_categorie`

---


### node--showroom

- **Label**: Showroom
- **Count**: 0 nodes
- **Endpoint**: `GET /node/showroom`

#### Attributes (      28 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_area
- field_citta
- field_collegamento_esterno
- field_collegamento_gmaps
- field_fax
- field_indirizzo
- field_indirizzo_email
- field_latitudine
- field_longitudine
- field_meta_tags
- field_telefono
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`

---


### node--tag

- **Label**: Tag
- **Count**: 0 nodes
- **Endpoint**: `GET /node/tag`

#### Attributes (      19 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_meta_tags
- field_testo_main
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`

---


### node--tutorial

- **Label**: Tutorial
- **Count**: 0 nodes
- **Endpoint**: `GET /node/tutorial`

#### Attributes (      20 fields)

```
- changed
- content_translation_outdated
- content_translation_source
- created
- default_langcode
- drupal_internal__nid
- drupal_internal__vid
- field_categoria_video
- field_id_video
- field_meta_tags
- field_titolo_main
- langcode
- metatag
- path
- promote
- revision_timestamp
- revision_translation_affected
- status
- sticky
- title
```

#### Relationships

- `node_type` → `node_type--node_type`
- `revision_uid` → `user--user`
- `uid` → `user--user`
- `field_immagine` → `file--file`

---

