# Templates — Migration Matrix

> Extracted from CLAUDE.md. See CLAUDE.md for project overview.

## Node Templates (`src/templates/nodes/`)

| Template               | Drupal Type                  | Status      | Uses ParagraphResolver | Notes                                                                                                                                                                                                                                              |
| ---------------------- | ---------------------------- | ----------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ProdottoMosaico        | node--prodotto_mosaico       | DS          | No                     | 5 blocks (Spec\*), 9 composed; collection-level fallback for body/specs                                                                                                                                                                            |
| MosaicProductPreview   | (mosaic product — typed)     | DS          | No                     | Same 5 Spec\* blocks as ProdottoMosaico; accepts typed `MosaicProduct` (not raw node)                                                                                                                                                              |
| ProductListingTemplate | (unified listing)            | DS          | No                     | Hub mode (SpecCategory) + Grid mode (SpecProductListing); accepts all 6 product types                                                                                                                                                              |
| ProductsMasterPage     | (products index)             | DS          | No                     | Tailwind grid of 5 category cards; locale-aware hrefs via FILTER_REGISTRY                                                                                                                                                                          |
| ProdottoArredoFiniture | (arredo finishes sub-page)   | Partial DS  | No                     | Tailwind layout + FinitureGallery composed; accepts typed `ArredoProduct`; breadcrumb removed (now injected by page.tsx via PageBreadcrumb)                                                                                                        |
| Page                   | node--page                   | Minimal DS  | Yes                    | title + body + ParagraphResolver                                                                                                                                                                                                                   |
| LandingPage            | node--landing_page           | Minimal DS  | Yes                    | ParagraphResolver only, no title/body                                                                                                                                                                                                              |
| ProdottoVetrite        | node--prodotto_vetrite       | Legacy      | No                     | DrupalImage + product.module.css; inline styles; VetriteCanvasLoader (WebGL)                                                                                                                                                                       |
| ProdottoArredo         | node--prodotto_arredo        | Legacy      | Yes                    | DrupalImage + product.module.css; async tessuti secondary fetch                                                                                                                                                                                    |
| ProdottoTessuto        | node--prodotto_tessuto       | Legacy      | No                     | DrupalImage + product.module.css; breadcrumb removed (now injected by page.tsx via PageBreadcrumb)                                                                                                                                                 |
| ProdottoPixall         | node--prodotto_pixall        | Legacy      | No                     | DrupalImage + product.module.css; `/mosaico/pixall` intercepted in page.tsx and rendered as product listing (not Categoria)                                                                                                                        |
| ProdottoIlluminazione  | node--prodotto_illuminazione | Legacy      | No                     | DrupalImage + product.module.css; async secondary fetch; breadcrumb removed (now injected by page.tsx via PageBreadcrumb)                                                                                                                          |
| Contatti               | node--page (contatti)        | DS          | Yes                    | Two-column Tailwind layout; i18n via `getTranslations('contacts')`; `ContattaciForm` composed component; ParagraphResolver for `field_blocchi`; no legacy imports                                                                                  |
| Articolo               | node--articolo               | Legacy+Para | Yes                    | title + DrupalImage + body + ParagraphResolver; tags footer via `fetchBlogTags` + pill links; getTitle()/getBody() helpers                                                                                                                         |
| News                   | node--news                   | Legacy+Para | Yes                    | title + DrupalImage + body + ParagraphResolver; getTitle()/getBody() helpers                                                                                                                                                                       |
| Tutorial               | node--tutorial               | Legacy+Para | Yes                    | title + DrupalImage + body + ParagraphResolver; getTitle()/getBody() helpers                                                                                                                                                                       |
| Ambiente               | node--ambiente               | Partial DS  | Yes                    | title + resolveImageUrl + next/image (fill) + body + ParagraphResolver; getTitle()/getBody() helpers; DrupalImage removed                                                                                                                          |
| Progetto               | node--progetto               | Legacy+Para | Yes                    | field_categoria_progetto link; Tailwind flex layout (maxWidth inline style removed); getTitle()/getBody() helpers                                                                                                                                  |
| Showroom               | node--showroom               | Legacy      | No                     | NO field_blocchi — Drupal returns 400 if included; getTitle()/getBody() helpers                                                                                                                                                                    |
| Documento              | node--documento              | Legacy      | No                     | NO field_blocchi — Drupal returns 400 if included; getTitle()/getBody() helpers                                                                                                                                                                    |
| Categoria              | node--categoria              | Partial DS  | Yes                    | Active path: title + optional `SpecMosaicCategoryGrid` (NIDs 319/320/321) + ParagraphResolver; hero image removed; legacy 3-branch code dead (unreachable); mosaic sub-category routing via `MOSAIC_CATEGORY_NID_SET` + `fetchMosaicCategoryPages` |
| CategoriaBlog          | node--categoria_blog         | Legacy+Para | Yes                    | getTitle()/getBody() helpers                                                                                                                                                                                                                       |
| Tag                    | node--tag                    | DS          | No                     | `Typography` composed component; title + sanitized body; related articles placeholder; no legacy imports; no ParagraphResolver                                                                                                                     |

**Status key:** DS = design system blocks (Spec*/Gen* composed components, Tailwind only). Partial DS = Tailwind layout + at least one composed component, no Spec\* blocks. Legacy = DrupalImage + `product.module.css` + inline styles. Minimal DS = Tailwind layout, legacy ParagraphResolver inside. Legacy+Para = legacy render with ParagraphResolver for `field_blocchi`.

**Common rule:** All templates that take a raw Drupal node receive `node` as `Record<string, unknown>`, cast to a typed interface from `src/types/drupal/entities.ts`. Exceptions: `MosaicProductPreview` and `ProdottoArredoFiniture` receive typed structs from their respective fetcher APIs.

Templates using the design system exclusively (no legacy imports): `ProdottoMosaico`, `MosaicProductPreview`, `ProductListingTemplate`, `ProductsMasterPage`, `Contatti`, `Tag`.

---

## Taxonomy Templates (`src/templates/taxonomy/`)

The 4 specialised taxonomy templates (MosaicoCollezione, MosaicoColore, VetriteCollezione, VetriteColore) have been removed. The generic fallback handles all taxonomy term routes.

| Template     | Drupal Type        | Status    | Notes                   |
| ------------ | ------------------ | --------- | ----------------------- |
| TaxonomyTerm | (generic fallback) | Wireframe | name + description only |

---

## ParagraphResolver — Block Migration Status

File: `src/components_legacy/blocks_legacy/ParagraphResolver.tsx`

| Paragraph Type                        | Component            | Status |
| ------------------------------------- | -------------------- | ------ |
| paragraph--blocco_intro               | GenIntro             | DS     |
| paragraph--blocco_quote               | GenQuote             | DS     |
| paragraph--blocco_video               | GenVideo             | DS     |
| paragraph--blocco_testo_immagine      | GenTestoImmagine     | DS     |
| paragraph--blocco_gallery             | GenGallery           | DS     |
| paragraph--blocco_testo_immagine_big  | GenTestoImmagineBig  | DS     |
| paragraph--blocco_testo_immagine_blog | GenTestoImmagineBlog | DS     |
| paragraph--blocco_gallery_intro       | GenGalleryIntro      | DS     |
| paragraph--blocco_documenti           | GenDocumenti         | DS     |
| paragraph--blocco_a                   | GenA                 | DS     |
| paragraph--blocco_b                   | GenB                 | DS     |
| paragraph--blocco_c                   | GenC                 | DS     |
| paragraph--blocco_slider_home         | BloccoSliderHome     | Legacy |
| paragraph--blocco_correlati           | BloccoCorrelati      | Legacy |
| paragraph--blocco_newsletter          | BloccoNewsletter     | Legacy |
| paragraph--blocco_form_blog           | BloccoFormBlog       | Legacy |
| paragraph--blocco_anni                | BloccoAnni           | Legacy |
| paragraph--blocco_tutorial            | BloccoTutorial       | Legacy |

12 of 18 paragraph types are DS. 6 legacy blocks remain to be migrated (GenCorrelati, GenNewsletter, GenFormBlog, GenSliderHome, GenAnni, GenTutorial).
