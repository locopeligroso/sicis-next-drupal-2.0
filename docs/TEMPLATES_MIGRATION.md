# Templates — Migration Matrix

> Extracted from CLAUDE.md. See CLAUDE.md for project overview.

## Node Templates (`src/templates/nodes/`)

| Template               | Drupal Type                  | Status      | Uses ParagraphResolver | Notes                                                                                 |
| ---------------------- | ---------------------------- | ----------- | ---------------------- | ------------------------------------------------------------------------------------- |
| ProdottoMosaico        | node--prodotto_mosaico       | DS          | No                     | 5 blocks (Spec\*), 9 composed; collection-level fallback for body/specs               |
| ProductListingTemplate | (unified listing)            | DS          | No                     | Hub mode (SpecCategory) + Grid mode (SpecProductListing); accepts all 6 product types |
| Page                   | node--page                   | Minimal DS  | Yes                    | title + body + ParagraphResolver                                                      |
| LandingPage            | node--landing_page           | Minimal DS  | Yes                    | ParagraphResolver only, no title/body                                                 |
| ProdottoVetrite        | node--prodotto_vetrite       | Legacy      | No                     | DrupalImage + product.module.css; inline styles throughout                            |
| ProdottoArredo         | node--prodotto_arredo        | Legacy      | Yes                    | DrupalImage + product.module.css; async tessuti secondary fetch                       |
| ProdottoTessuto        | node--prodotto_tessuto       | Legacy      | No                     | DrupalImage + product.module.css                                                      |
| ProdottoPixall         | node--prodotto_pixall        | Legacy      | No                     | DrupalImage + product.module.css                                                      |
| ProdottoIlluminazione  | node--prodotto_illuminazione | Legacy      | No                     | DrupalImage + product.module.css; async secondary fetch                               |
| Articolo               | node--articolo               | Legacy+Para | Yes                    | title + DrupalImage + body + ParagraphResolver                                        |
| News                   | node--news                   | Legacy+Para | Yes                    | title + DrupalImage + body + ParagraphResolver                                        |
| Tutorial               | node--tutorial               | Legacy+Para | Yes                    | title + DrupalImage + body + ParagraphResolver                                        |
| Ambiente               | node--ambiente               | Legacy+Para | Yes                    | title + DrupalImage + body + ParagraphResolver                                        |
| Progetto               | node--progetto               | Legacy+Para | Yes                    | + field_categoria_progetto link                                                       |
| Showroom               | node--showroom               | Legacy      | No                     | NO field_blocchi — Drupal returns 400 if included                                     |
| Documento              | node--documento              | Legacy      | No                     | NO field_blocchi — Drupal returns 400 if included                                     |
| Categoria              | node--categoria              | Legacy      | Yes                    | 3-branch: products / subcategories / pages; getCategoriaProductType()                 |
| CategoriaBlog          | node--categoria_blog         | Legacy+Para | Yes                    |                                                                                       |
| Tag                    | node--tag                    | Legacy+Para | Yes                    |                                                                                       |

**Status key:** DS = design system blocks (Spec*/Gen* composed components, Tailwind only). Legacy = DrupalImage + `product.module.css` + inline styles. Minimal DS = Tailwind layout, legacy ParagraphResolver inside. Legacy+Para = legacy render with ParagraphResolver for `field_blocchi`. Hybrid = legacy structure + Tailwind sections.

**Common rule:** All templates receive `node` as `Record<string, unknown>`, cast to a typed interface from `src/types/drupal/entities.ts`.

Only `ProdottoMosaico` and `ProductListingTemplate` use the design system (Spec\* blocks, no legacy imports).

---

## Taxonomy Templates (`src/templates/taxonomy/`)

| Template          | Drupal Type                       | Status         | Notes                                                                         |
| ----------------- | --------------------------------- | -------------- | ----------------------------------------------------------------------------- |
| MosaicoCollezione | taxonomy_term--mosaico_collezioni | Legacy listing | Legacy FilterSidebar + legacy ProductListing                                  |
| MosaicoColore     | taxonomy_term--mosaico_colori     | Legacy listing | Legacy FilterSidebar + legacy ProductListing                                  |
| VetriteCollezione | taxonomy_term--vetrite_collezioni | Hybrid         | Legacy listing + FilterSidebar + Tailwind documents section + getTranslations |
| VetriteColore     | taxonomy_term--vetrite_colori     | Legacy listing | Legacy FilterSidebar + legacy ProductListing                                  |
| TaxonomyTerm      | (generic fallback)                | Wireframe      | name + description only                                                       |
