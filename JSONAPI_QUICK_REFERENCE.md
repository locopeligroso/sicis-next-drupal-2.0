# JSON:API Quick Reference

**Base URL**: `https://www.sicis-stage.com/it/jsonapi`

## Content Types (node--)

| Type | Endpoint | Description |
|------|----------|-------------|
| `node--ambiente` | `/node/ambiente` | Ambienti |
| `node--articolo` | `/node/articolo` | Articoli |
| `node--categoria` | `/node/categoria` | Categorie |
| `node--categoria_blog` | `/node/categoria_blog` | Categorie Blog |
| `node--documento` | `/node/documento` | Documenti |
| `node--landing_page` | `/node/landing_page` | Landing Pages |
| `node--news` | `/node/news` | News |
| `node--page` | `/node/page` | Pagine |
| `node--prodotto_arredo` | `/node/prodotto_arredo` | Prodotti Arredo |
| `node--prodotto_mosaico` | `/node/prodotto_mosaico` | Prodotti Mosaico |
| `node--prodotto_pixall` | `/node/prodotto_pixall` | Prodotti Pixall |
| `node--prodotto_tessuto` | `/node/prodotto_tessuto` | Prodotti Tessuto |
| `node--prodotto_vetrite` | `/node/prodotto_vetrite` | Prodotti Vetrite |
| `node--progetto` | `/node/progetto` | Progetti |
| `node--showroom` | `/node/showroom` | Showroom |
| `node--tag` | `/node/tag` | Tag |
| `node--tutorial` | `/node/tutorial` | Tutorial |

## Taxonomies (taxonomy_term--)

| Type | Endpoint | Description |
|------|----------|-------------|
| `taxonomy_term--ambienti_categorie` | `/taxonomy_term/ambienti_categorie` | Categorie Ambienti |
| `taxonomy_term--arredo_finiture` | `/taxonomy_term/arredo_finiture` | Finiture Arredo |
| `taxonomy_term--mosaico_collezioni` | `/taxonomy_term/mosaico_collezioni` | Collezioni Mosaico |
| `taxonomy_term--mosaico_colori` | `/taxonomy_term/mosaico_colori` | Colori Mosaico |
| `taxonomy_term--mosaico_finiture` | `/taxonomy_term/mosaico_finiture` | Finiture Mosaico |
| `taxonomy_term--mosaico_forme` | `/taxonomy_term/mosaico_forme` | Forme Mosaico |
| `taxonomy_term--mosaico_stucchi` | `/taxonomy_term/mosaico_stucchi` | Stucchi Mosaico |
| `taxonomy_term--progetto_categorie` | `/taxonomy_term/progetto_categorie` | Categorie Progetti |
| `taxonomy_term--tessuto_colori` | `/taxonomy_term/tessuto_colori` | Colori Tessuto |
| `taxonomy_term--tessuto_finiture` | `/taxonomy_term/tessuto_finiture` | Finiture Tessuto |
| `taxonomy_term--tessuto_manutenzione` | `/taxonomy_term/tessuto_manutenzione` | Manutenzione Tessuto |
| `taxonomy_term--tessuto_tipologie` | `/taxonomy_term/tessuto_tipologie` | Tipologie Tessuto |
| `taxonomy_term--vetrite_collezioni` | `/taxonomy_term/vetrite_collezioni` | Collezioni Vetrite |
| `taxonomy_term--vetrite_colori` | `/taxonomy_term/vetrite_colori` | Colori Vetrite |
| `taxonomy_term--vetrite_finiture` | `/taxonomy_term/vetrite_finiture` | Finiture Vetrite |
| `taxonomy_term--vetrite_textures` | `/taxonomy_term/vetrite_textures` | Texture Vetrite |

## Paragraphs (paragraph--)

| Type | Endpoint | Description |
|------|----------|-------------|
| `paragraph--blocco_anni` | `/paragraph/blocco_anni` | Blocco Anni |
| `paragraph--blocco_correlati` | `/paragraph/blocco_correlati` | Blocco Correlati |
| `paragraph--blocco_documenti` | `/paragraph/blocco_documenti` | Blocco Documenti |
| `paragraph--blocco_form_blog` | `/paragraph/blocco_form_blog` | Blocco Form Blog |
| `paragraph--blocco_gallery` | `/paragraph/blocco_gallery` | Blocco Gallery |
| `paragraph--blocco_gallery_intro` | `/paragraph/blocco_gallery_intro` | Blocco Gallery Intro |
| `paragraph--blocco_intro` | `/paragraph/blocco_intro` | Blocco Intro |
| `paragraph--blocco_newsletter` | `/paragraph/blocco_newsletter` | Blocco Newsletter |
| `paragraph--blocco_quote` | `/paragraph/blocco_quote` | Blocco Quote |
| `paragraph--blocco_slider_home` | `/paragraph/blocco_slider_home` | Blocco Slider Home |
| `paragraph--blocco_testo_immagine` | `/paragraph/blocco_testo_immagine` | Blocco Testo Immagine |
| `paragraph--blocco_testo_immagine_big` | `/paragraph/blocco_testo_immagine_big` | Blocco Testo Immagine Big |
| `paragraph--blocco_testo_immagine_blog` | `/paragraph/blocco_testo_immagine_blog` | Blocco Testo Immagine Blog |
| `paragraph--blocco_tutorial` | `/paragraph/blocco_tutorial` | Blocco Tutorial |
| `paragraph--blocco_video` | `/paragraph/blocco_video` | Blocco Video |
| `paragraph--elemento_blocco_anni` | `/paragraph/elemento_blocco_anni` | Elemento Blocco Anni |
| `paragraph--elemento_blocco_correlati` | `/paragraph/elemento_blocco_correlati` | Elemento Blocco Correlati |
| `paragraph--elemento_blocco_gallery` | `/paragraph/elemento_blocco_gallery` | Elemento Blocco Gallery |
| `paragraph--elemento_blocco_slider_home` | `/paragraph/elemento_blocco_slider_home` | Elemento Blocco Slider Home |

## Files & Media

| Type | Endpoint | Description |
|------|----------|-------------|
| `file--file` | `/file/file` | File (images, videos, documents) |

**Note**: No `media--*` entities. Files are managed via field relationships in nodes.

## Users & Contacts

| Type | Endpoint | Description |
|------|----------|-------------|
| `user--user` | `/user/user` | Users |
| `contact_message--feedback` | `/contact_message/feedback` | Feedback Messages |
| `contact_message--personal` | `/contact_message/personal` | Personal Messages |
| `webform_submission--contact` | `/webform_submission/contact` | Contact Form Submissions |

## Common Query Patterns

### Pagination
```
?page[limit]=20&page[offset]=0
```

### Filtering
```
?filter[field_name]=value
?filter[status]=1
?filter[langcode]=it
```

### Include Relations
```
?include=field_immagine,field_categoria,uid
```

### Sorting
```
?sort=-created
?sort=title
?sort=-changed,title
```

### Combined
```
?page[limit]=10&filter[langcode]=it&include=uid&sort=-created
```

## Example Requests

### Get all mosaic products
```bash
curl -H "Accept: application/vnd.api+json" \
  "https://www.sicis-stage.com/it/jsonapi/node/prodotto_mosaico?page[limit]=50"
```

### Get single product with relations
```bash
curl -H "Accept: application/vnd.api+json" \
  "https://www.sicis-stage.com/it/jsonapi/node/prodotto_mosaico/{id}?include=field_immagine,field_categoria,field_collezione"
```

### Get all mosaic colors
```bash
curl -H "Accept: application/vnd.api+json" \
  "https://www.sicis-stage.com/it/jsonapi/taxonomy_term/mosaico_colori?page[limit]=100"
```

### Get files by MIME type
```bash
curl -H "Accept: application/vnd.api+json" \
  "https://www.sicis-stage.com/it/jsonapi/file/file?filter[filemime]=image/png"
```

### Get all users
```bash
curl -H "Accept: application/vnd.api+json" \
  "https://www.sicis-stage.com/it/jsonapi/user/user?page[limit]=50"
```

## File Structure

### Attributes
- `filename` — File name
- `uri.value` — Internal URI (public://...)
- `uri.url` — Relative URL (/sites/default/files/...)
- `filemime` — MIME type (image/png, video/mp4, etc.)
- `filesize` — Size in bytes
- `status` — Active/inactive
- `created` — Creation date (ISO 8601)
- `changed` — Last modified date (ISO 8601)

### Example
```json
{
  "type": "file--file",
  "id": "c5fa1985-9a5e-48d8-9ad8-e0b99d0f74e5",
  "attributes": {
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
  }
}
```

## Node Structure Example (prodotto_mosaico)

### Key Attributes
- `title` — Product title
- `path.alias` — URL alias
- `field_prezzo_eu` — EU price
- `field_prezzo_on_demand` — On-demand pricing flag
- `langcode` — Language code
- `status` — Published status
- `created` — Creation date
- `changed` — Last modified date

### Key Relations
- `field_immagine` → `file--file` — Main image
- `field_video` → `file--file` — Product video
- `field_categoria` → `node--categoria` — Product category
- `field_collezione` → `taxonomy_term--mosaico_collezioni` — Collection
- `field_colori` → `taxonomy_term--mosaico_colori` — Colors (multiple)
- `field_finitura` → `taxonomy_term--mosaico_finiture` — Finish
- `field_forma` → `taxonomy_term--mosaico_forme` — Shape
- `field_gallery` → `file--file` — Gallery images (array)
- `uid` → `user--user` — Author

## Statistics

- **Total Resource Types**: ~100+
- **Content Types**: 17 (node--)
- **Taxonomies**: 15 (taxonomy_term--)
- **Paragraphs**: 19 (paragraph--)
- **Files**: 1 (file--)
- **Users**: 1 (user--)
- **Contacts**: 3 (contact_message--, webform_submission--)
- **Configuration**: ~40+ (config, metadata, system)

