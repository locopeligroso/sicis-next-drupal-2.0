# SICIS — Drupal Content Map
> Generato: 2026-03-19 via swarm burst (7 agenti paralleli)  
> Fonte: https://www.sicis-stage.com JSON:API + menu API

---

## 1. Node Types (17 content type)

| Bundle | Label | Relationships chiave | Template Next.js | Include fields |
|--------|-------|----------------------|-----------------|----------------|
| `page` | Basic page | field_blocchi, field_immagine, field_categoria | `Page.tsx` | field_blocchi, field_blocchi.field_immagine |
| `landing_page` | Landing Page | field_blocchi | `LandingPage.tsx` | field_blocchi, field_blocchi.field_immagine |
| `progetto` | Progetto | field_immagine, **field_categoria_progetto** | `Progetto.tsx` | field_immagine |
| `articolo` | Articolo | field_immagine, field_immagine_anteprima, field_blocchi, field_categoria_blog, field_tags | `Articolo.tsx` | field_immagine, field_blocchi, field_blocchi.field_immagine |
| `news` | News | field_immagine, field_immagine_anteprima, field_blocchi, field_news_correlate | `News.tsx` | field_immagine, field_blocchi, field_blocchi.field_immagine |
| `tutorial` | Tutorial | field_immagine, field_blocchi | `Tutorial.tsx` | field_immagine, field_blocchi, field_blocchi.field_immagine |
| `showroom` | Showroom | field_gallery | `Showroom.tsx` | field_immagine, field_blocchi, field_blocchi.field_immagine |
| `ambiente` | Ambiente | field_blocchi, field_immagine, **field_categoria_ambiente** | `Ambiente.tsx` | field_immagine, field_blocchi, field_blocchi.field_immagine |
| `categoria` | Categoria | field_immagine, field_categoria (→ node--page) | `Categoria.tsx` | _(nessuno)_ |
| `categoria_blog` | Categoria Blog | _(nessuna relationship custom)_ | `CategoriaBlog.tsx` | field_immagine, field_blocchi, field_blocchi.field_immagine |
| `documento` | Documento | field_immagine, field_allegato | `Documento.tsx` | field_immagine, field_blocchi, field_blocchi.field_immagine |
| `tag` | Tag | _(nessuna relationship custom)_ | `Tag.tsx` | field_immagine, field_blocchi, field_blocchi.field_immagine |
| `prodotto_mosaico` | Prodotto Mosaico | field_immagine, field_immagine_campione, field_gallery, field_collezione (→ mosaico_collezioni), field_colori, field_forma, field_finitura, field_stucco, field_categoria | `ProdottoMosaico.tsx` | _(vedi node-resolver.ts)_ |
| `prodotto_arredo` | Prodotto Arredo | field_immagine, field_gallery, field_categoria, field_finiture, field_documenti, field_immagine_anteprima, field_gallery_intro | `ProdottoArredo.tsx` | _(vedi node-resolver.ts)_ |
| `prodotto_vetrite` | Prodotto Vetrite | field_immagine, field_gallery, field_collezione (→ vetrite_collezioni), field_colori, field_finiture | `ProdottoVetrite.tsx` | _(vedi node-resolver.ts)_ |
| `prodotto_tessuto` | Prodotto Tessuto | field_immagine_anteprima, field_gallery, field_colori, field_categoria, field_finiture_tessuto, field_tipologia_tessuto, field_indicazioni_manutenzione, field_documenti, field_gallery_intro | `ProdottoTessuto.tsx` | _(vedi node-resolver.ts)_ |
| `prodotto_pixall` | Prodotto Pixall | field_immagine, field_gallery, field_colori, field_forma, field_stucco, field_immagine_anteprima, field_immagine_moduli, field_documenti | `ProdottoPixall.tsx` | _(vedi node-resolver.ts)_ |

---

## 2. Taxonomy Vocabularies (15 vocabolari)

| Vocabulary | Label | Usato in | Template Next.js |
|------------|-------|----------|-----------------|
| `mosaico_collezioni` | Collezioni Mosaico | prodotto_mosaico.field_collezione | `MosaicoCollezione.tsx` |
| `mosaico_colori` | Colori Mosaico | prodotto_mosaico.field_colori | `MosaicoColore.tsx` |
| `mosaico_finiture` | Finiture Mosaico | prodotto_mosaico.field_finitura | _(nessuno — usa TaxonomyTerm fallback)_ |
| `mosaico_forme` | Forme Mosaico | prodotto_mosaico.field_forma | _(nessuno)_ |
| `mosaico_stucchi` | Stucchi Mosaico | prodotto_mosaico.field_stucco | _(nessuno)_ |
| `vetrite_collezioni` | Collezioni Vetrite | prodotto_vetrite.field_collezione | `VetriteCollezione.tsx` |
| `vetrite_colori` | Colori Vetrite | prodotto_vetrite.field_colori | `VetriteColore.tsx` |
| `vetrite_finiture` | Finiture Vetrite | prodotto_vetrite.field_finiture | _(nessuno)_ |
| `vetrite_textures` | Texture Vetrite | prodotto_vetrite | _(nessuno)_ |
| `arredo_finiture` | Finiture Arredo | prodotto_arredo.field_finiture | _(nessuno)_ |
| `tessuto_colori` | Colori Tessuto | prodotto_tessuto.field_colori | _(nessuno)_ |
| `tessuto_finiture` | Finiture Tessuto | prodotto_tessuto.field_finiture_tessuto | _(nessuno)_ |
| `tessuto_manutenzione` | Manutenzione Tessuto | prodotto_tessuto.field_indicazioni_manutenzione | _(nessuno)_ |
| `tessuto_tipologie` | Tipologie Tessuto | prodotto_tessuto.field_tipologia_tessuto | _(nessuno)_ |
| `ambienti_categorie` | Categorie Ambienti | ambiente.field_categoria_ambiente | _(nessuno)_ |
| `progetto_categorie` | Categorie Progetti | progetto.field_categoria_progetto | _(nessuno)_ |

---

## 3. Paragraph Types (19 tipi)

### Blocchi padre (usati in field_blocchi dei nodi)

| Paragraph Type | Label | Nested include | Componente Next.js | PARAGRAPH_INCLUDE |
|----------------|-------|----------------|--------------------|-------------------|
| `blocco_slider_home` | Blocco Slider Home | field_elementi → elemento_blocco_slider_home | `BloccoSliderHome.tsx` | ✅ field_elementi,field_elementi.field_immagine |
| `blocco_intro` | Blocco Intro | _(nessuno)_ | `BloccoIntro.tsx` | _(non necessario)_ |
| `blocco_testo_immagine` | Blocco Testo Immagine | _(nessuno)_ | `BloccoTestoImmagine.tsx` | _(non necessario)_ |
| `blocco_testo_immagine_big` | Blocco Testo Immagine Big | _(nessuno)_ | `BloccoTestoImmagineBig.tsx` | _(non necessario)_ |
| `blocco_testo_immagine_blog` | Blocco Testo Immagine Blog | _(nessuno)_ | `BloccoTestoImmagineBlog.tsx` | _(non necessario)_ |
| `blocco_gallery` | Blocco Gallery | field_slide → elemento_blocco_gallery | `BloccoGallery.tsx` | ✅ field_slide,field_slide.field_immagine |
| `blocco_gallery_intro` | Blocco Gallery Intro | field_slide → elemento_blocco_gallery | `BloccoGalleryIntro.tsx` | ✅ field_slide,field_slide.field_immagine |
| `blocco_video` | Blocco Video | _(nessuno)_ | `BloccoVideo.tsx` | _(non necessario)_ |
| `blocco_quote` | Blocco Quote | _(nessuno)_ | `BloccoQuote.tsx` | _(non necessario)_ |
| `blocco_correlati` | Blocco Correlati | field_elementi → elemento_blocco_correlati | `BloccoCorrelati.tsx` | ✅ field_elementi,field_elementi.field_immagine |
| `blocco_documenti` | Blocco Documenti | _(nessuno)_ | `BloccoDocumenti.tsx` | _(non necessario)_ |
| `blocco_newsletter` | Blocco Newsletter | _(nessuno)_ | `BloccoNewsletter.tsx` | _(non necessario)_ |
| `blocco_form_blog` | Blocco Form Blog | _(nessuno)_ | `BloccoFormBlog.tsx` | _(non necessario)_ |
| `blocco_anni` | Blocco Anni | field_anni → elemento_blocco_anni | `BloccoAnni.tsx` | _(non necessario — no immagini)_ |
| `blocco_tutorial` | Blocco Tutorial | _(nessuno)_ | `BloccoTutorial.tsx` | _(non necessario)_ |

### Elementi figlio (usati come nested in blocchi padre)

| Paragraph Type | Label | Usato in | Campi chiave |
|----------------|-------|----------|--------------|
| `elemento_blocco_slider_home` | Elemento Slider Home | blocco_slider_home.field_elementi | field_immagine, field_testo, field_collegamento |
| `elemento_blocco_gallery` | Elemento Gallery | blocco_gallery.field_slide, blocco_gallery_intro.field_slide | field_immagine |
| `elemento_blocco_correlati` | Elemento Correlati | blocco_correlati.field_elementi | field_immagine, field_titolo, field_collegamento |
| `elemento_blocco_anni` | Elemento Anni | blocco_anni.field_anni | field_anno, field_testo |

---

## 4. Menu Structure — Tutte le lingue

> ⚠️ **CRITICO**: Il menu IT usa `/it/progetti-0` (non `/it/progetti`).  
> Il path alias reale del nodo "Progetti" in Drupal è `/progetti-0`.  
> Il frontend usa `/progetti` come route dedicata — i link nel menu puntano a `/it` (voce senza URL).

### Sezione "Filter and Find" (prodotti filtrabili)

| UUID | IT | EN | FR | DE | ES | RU |
|------|----|----|----|----|----|----|
| 26ff9d0c | mosaico | mosaic | mosaïque | mosaik | mosaico | мозаика |
| d54e0c44 | lastre-vetro-vetrite | vetrite-glass-slabs | plaque-en-verre-vetrite | glasscheibe-vetrite | láminas-de-vidrio-vetrite | стеклянные-листы-vetrite |
| ad6e7ede | arredo | furniture-and-accessories | ameublement | einrichtung | mueble | обстановка |
| 6e97c924 | arredo/illuminazione | furniture-and-accessories/lighting | ameublement/éclairage | einrichtung/leuchten | mueble/iluminación | обстановка/освещение |
| 49b6c285 | prodotti-tessili | textiles | produits-textiles | textilien | textiles | текстильные-изделия |

### Sezione "Projects"

| UUID | IT | EN | FR | DE | ES | RU |
|------|----|----|----|----|----|----|
| 42560132 | **progetti-0** ⚠️ | projects | projets | projekte | proyectos | проекты |
| 42560b28 | ambienti | environments | environments | environments | environments | environments |
| 42560e2a | blog-sicis | blog | blog | blog | blog | blog |
| 42561028 | interior-design-service | interior-design-service | interior-design-service | interior-design-service | interior-design-service | дизайнерские-услуги |

### Sezione "Info & Services"

| UUID | IT | EN | FR | DE | ES | RU |
|------|----|----|----|----|----|----|
| 42562030 | heritage | heritage | heritage | heritage | heritage | наследие |
| 42562b2a | chi-siamo | who-we-are | qui-sommes-nous | wer-wir-sind | quiénes-somos | кто-мы |
| 42562e2c | sicis-village | sicis-village | sicis-village | sicis-village | sicis-village | sicis-village |
| 4256302e | showroom | showroom | showroom | showroom | showroom | showroom |
| 42563230 | contatti | contacts | contacts | kontakte | contactos | контакты |
| 42563634 | download-catalogues | download-catalogues | download-catalogues | download-catalogues | node/4244 ⚠️ | download-catalogues |

### Sezione "Explore" (slug localizzati)

| UUID | IT | EN | FR | DE | ES | RU |
|------|----|----|----|----|----|----|
| f29231b4 | tinte-unite | mosaic/solid-colours | couleurs | farben | colores | цвета |
| 7060bba4 | mosaico-marmo | marble | marble | marmormosaik | marble | marble |
| cef52105 | mosaico-metallo | metal-mosaic | mosaïque-en-métal | metallmosaik | mosaico-metálico | металлическая-мозаика |
| 43367a1f | mosaico/pixel | mosaic/pixel | mosaïque/pixel | mosaik/pixel | mosaico/píxeles | мозаика/pixel |
| 543c8d98 | mosaico-artistico | artistic-mosaic | mosaïque-artistique | künstlerisches-mosaik | mosaico-artístico | художественная-мозаика |
| bb32de68 | ambienti/cucina | interiors/kitchen | interieurs/cuisine | raeume/küche | ambientes/cocina | интерьеры/кухня |
| 502e6f4c | ambienti/arredo-bagno | interiors/bathroom | interieurs/salle-de-bain | raeume/badezimmer | ambientes/cuarto-de-baño | интерьеры/ванная-комната |

---

## 5. Slug Progetti per locale (routing Next.js)

> Il nodo Drupal "Progetti" ha path alias `/progetti-0` in IT.  
> Il frontend espone la listing su `/[locale]/progetti` (pagina dedicata).  
> I link nel menu devono puntare alla pagina Next.js, non al nodo Drupal.

| Locale | Slug menu Drupal | Route Next.js | Note |
|--------|-----------------|---------------|------|
| IT | `/progetti-0` | `/it/progetti` | ⚠️ Drupal alias diverso dalla route Next.js |
| EN | `/projects` | `/en/projects` | ✅ Coincide |
| FR | `/projets` | `/fr/projets` | ⚠️ Manca route Next.js per `/projets` |
| DE | `/projekte` | `/de/projekte` | ⚠️ Manca route Next.js per `/projekte` |
| ES | `/proyectos` | `/es/proyectos` | ⚠️ Manca route Next.js per `/proyectos` |
| RU | `/проекты` | `/ru/проекты` | ⚠️ Manca route Next.js per `/проекты` |

---

## 6. Gap Analysis — Routing

### Slug mancanti in LISTING_SLUG_OVERRIDES / section-config

I seguenti slug del menu **non sono gestiti** dal routing Next.js:

| Slug | Locale | Sezione | Problema |
|------|--------|---------|---------|
| `projets` | FR | Projects | Nessuna route dedicata |
| `projekte` | DE | Projects | Nessuna route dedicata |
| `proyectos` | ES | Projects | Nessuna route dedicata |
| `проекты` | RU | Projects | Nessuna route dedicata |
| `ambienti` | IT | Projects | Nessun template listing |
| `environments` | EN/FR/DE/ES/RU | Projects | Nessun template listing |
| `blog-sicis` | IT | Projects | Nessun template listing |
| `blog` | EN/FR/DE/ES/RU | Projects | Nessun template listing |
| `interior-design-service` | tutti | Projects | Nessun template listing |
| `heritage` | IT/EN/FR/DE/ES | Info | Nessun template |
| `chi-siamo` | IT | Info | Nessun template |
| `download-catalogues` | tutti | Info | Nessun template |

### Slug Explore non gestiti

| Slug | Locale | Problema |
|------|--------|---------|
| `tinte-unite` | IT | Nessun routing |
| `mosaico-marmo` | IT | Nessun routing |
| `mosaico-metallo` | IT | Nessun routing |
| `mosaico-artistico` | IT | Nessun routing |
| `vetrite-explore` | tutti | Nessun routing |
| `furniture-explore` | tutti | Nessun routing |
| `lighting-explore` | tutti | Nessun routing |
| `textiles-explore` | tutti | Nessun routing |

---

## 7. Gap Analysis — Template e Campi

### Campi Drupal non usati nel frontend (priorità alta)

| Node Type | Campo | Tipo | Valore esempio | Raccomandazione |
|-----------|-------|------|----------------|-----------------|
| `progetto` | `field_categoria_progetto` | taxonomy_term--progetto_categorie | singolo | Aggiungere filtro per categoria nella listing |
| `progetto` | `field_location` | string | null | Mostrare nella pagina singola |
| `progetto` | `field_tipologia` | string | null | Mostrare nella pagina singola |
| `articolo` | `field_categoria_blog` | node--categoria_blog | singolo | Navigazione per categoria |
| `articolo` | `field_tags` | node--tag | multiplo | Tag cloud / correlati |
| `news` | `field_news_correlate` | node--news | multiplo | Sezione "Leggi anche" |
| `ambiente` | `field_categoria_ambiente` | taxonomy_term--ambienti_categorie | singolo | Filtro ambienti |
| `ambiente` | `field_in_evidenza` | boolean | true | Evidenziare in listing |
| `showroom` | `field_gallery` | file--file | multiplo | Galleria showroom |

### Taxonomy senza template Next.js

| Vocabulary | Usato in | Priorità |
|------------|----------|---------|
| `progetto_categorie` | progetto.field_categoria_progetto | Alta — serve per filtri listing |
| `ambienti_categorie` | ambiente.field_categoria_ambiente | Media |
| `mosaico_finiture` | prodotto_mosaico.field_finitura | Media |
| `mosaico_forme` | prodotto_mosaico.field_forma | Media |
| `mosaico_stucchi` | prodotto_mosaico.field_stucco | Bassa |
| `arredo_finiture` | prodotto_arredo.field_finiture | Media |
| `tessuto_colori` | prodotto_tessuto.field_colori | Media |
| `tessuto_finiture` | prodotto_tessuto.field_finiture_tessuto | Bassa |
| `tessuto_manutenzione` | prodotto_tessuto.field_indicazioni_manutenzione | Bassa |
| `tessuto_tipologie` | prodotto_tessuto.field_tipologia_tessuto | Media |
| `vetrite_finiture` | prodotto_vetrite.field_finiture | Media |
| `vetrite_textures` | prodotto_vetrite | Bassa |

---

## 8. Anomalie rilevate

| # | Anomalia | Impatto | Fix |
|---|----------|---------|-----|
| 1 | Menu IT: slug `progetti-0` ≠ route Next.js `/progetti` | Link menu rotto | Redirect Drupal o aggiornare alias nodo |
| 2 | Menu ES: Download Catalogues → `node/4244` (no alias) | URL non SEO-friendly | Aggiungere path alias in Drupal |
| 3 | `node--articolo` ha `field_immagine_anteprima` non in INCLUDE_MAP | Anteprima mancante in listing | Aggiungere a INCLUDE_MAP |
| 4 | `node--news` ha `field_immagine_anteprima` non in INCLUDE_MAP | Anteprima mancante in listing | Aggiungere a INCLUDE_MAP |
| 5 | Route `/fr/projets`, `/de/projekte`, `/es/proyectos`, `/ru/проекты` non esistono | 404 per utenti non-IT/EN | Creare route alias o redirect |
| 6 | `node--ambiente` ha `field_blocchi` ma INCLUDE_MAP include solo `field_immagine` | Blocchi non renderizzati | Verificare se field_blocchi esiste su ambiente |
| 7 | `node--showroom` ha `field_gallery` ma non è in INCLUDE_MAP | Gallery non caricata | Aggiungere a INCLUDE_MAP |

---

## 9. File generati dallo swarm

| File | Contenuto |
|------|-----------|
| `DRUPAL_NODE_TYPES.md` | Mapping dettagliato 17 node type con attributes e relationships |
| `DRUPAL_NODE_TYPES.json` | Stesso in formato machine-readable |
| `DRUPAL_JSONAPI_MAP.md` | Tutti gli endpoint JSON:API disponibili + struttura file |
| `JSONAPI_QUICK_REFERENCE.md` | Quick reference con esempi curl |
| `docs/DRUPAL_FIELD_INVENTORY.md` | Inventario campi per 7 node type prioritari |
| `docs/DRUPAL_CONTENT_MAP.md` | **Questo file** — mappa master consolidata |
