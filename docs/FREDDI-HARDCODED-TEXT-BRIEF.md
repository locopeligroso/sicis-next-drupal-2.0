# Brief per Freddi — Testi Hardcoded da Spostare in CMS / i18n

> **Data:** 2026-04-02 | **Autore:** Zeus (audit automatico)
>
> Questo documento elenca TUTTI i testi hardcoded nel frontend Next.js che devono essere gestiti tramite CMS Drupal o tradotti via `messages/*.json`. Organizzato per priorita.

---

## Legenda

| Destinazione | Significato                                                                     |
| ------------ | ------------------------------------------------------------------------------- |
| **i18n**     | Va in `messages/{locale}.json` — tradotto frontend-side via `useTranslations()` |
| **cms**      | Va in Drupal come campo entity o config — gestito dagli editor                  |

---

## P0 — CRITICI (visibili in produzione, italiano hardcoded)

### QuoteFormSheet.tsx (Form "Richiedi Preventivo")

Tutto il form e hardcoded in italiano. **14 stringhe** da esternalizzare:

| Riga  | Stringa                                              | Dest |
| ----- | ---------------------------------------------------- | ---- |
| 32    | `Devi accettare la privacy policy`                   | i18n |
| 61,66 | `Errore invio`                                       | i18n |
| 85    | `Richiedi un preventivo`                             | i18n |
| 87    | `Compila il form e ti ricontatteremo al piu presto.` | i18n |
| 93    | `Richiesta inviata!`                                 | i18n |
| 94    | `Ti risponderemo al piu presto.`                     | i18n |
| 96    | `Chiudi`                                             | i18n |
| 102   | `Email *`                                            | i18n |
| 108   | `Nome *`                                             | i18n |
| 112   | `Cognome *`                                          | i18n |
| 119   | `Nazione`                                            | i18n |
| 123   | `Professione`                                        | i18n |
| 129   | `Nome prodotto`                                      | i18n |
| 140   | `La tua richiesta`                                   | i18n |
| 151   | `Acconsento al trattamento dei dati personali *`     | i18n |
| 158   | `Invio in corso...` / `Invia richiesta`              | i18n |

**Chiave i18n suggerita:** namespace `quote` in messages/\*.json

### ProdottoMosaico.tsx + MosaicProductPreview.tsx (Dettaglio Mosaico)

Etichette attributi e sezioni in inglese hardcoded:

| Riga (Mosaico) | Riga (Preview) | Stringa                         | Dest    |
| -------------- | -------------- | ------------------------------- | ------- |
| 118            | 91             | `Sheet size`                    | i18n    |
| 126            | 93             | `Chip size`                     | i18n    |
| 134            | 98             | `Thickness`                     | i18n    |
| 161            | —              | `Shape`                         | i18n    |
| 162            | —              | `Finishing`                     | i18n    |
| 360            | 234            | `Maintenance and installation`  | i18n    |
| 362            | 236            | `View guide`                    | i18n    |
| 367            | 243            | `Get inspired through catalogs` | i18n    |
| 369            | 245            | `Scopri` (italiano!)            | i18n    |
| 86             | 62             | `Quality certification` (alt)   | i18n    |
| 320            | —              | `North America Warehouse`       | **cms** |
| 321            | —              | `2-3 weeks`                     | **cms** |

**Chiave i18n suggerita:** namespace `products` (gia esistente, aggiungere chiavi)

### Showroom.tsx (Dettaglio Showroom)

Tutto italiano hardcoded:

| Riga | Stringa               | Dest |
| ---- | --------------------- | ---- |
| 88   | `Indirizzo:`          | i18n |
| 99   | `Citta:`              | i18n |
| 110  | `Tel:`                | i18n |
| 127  | `Email:`              | i18n |
| 148  | `Ottieni indicazioni` | i18n |
| 162  | `Anteprima`           | i18n |

**Chiave i18n suggerita:** namespace `showroom`

### FinitureGallery.tsx (Galleria Finiture)

| Riga | Stringa                         | Dest |
| ---- | ------------------------------- | ---- |
| 138  | `Mostra meno`                   | i18n |
| 139  | `Vedi tutti (${count})`         | i18n |
| 173  | `Nessuna finitura disponibile.` | i18n |

---

## P1 — LEGACY LISTINGS (italiano hardcoded, pattern ripetuto)

Tutte le listing legacy hanno lo stesso pattern di stringhe hardcoded. **~40 stringhe** distribuite su 6 file.

### Pattern comune in TUTTI i listing legacy

| Stringa                    | File coinvolti                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `No image`                 | ProductListing, BlogListing, DocumentListing, ProjectListing, ShowroomListing, EnvironmentListing |
| `Paginazione` (aria)       | Tutti i listing                                                                                   |
| `Pagina precedente` (aria) | Tutti i listing                                                                                   |
| `Pagina successiva` (aria) | Tutti i listing                                                                                   |
| `Nessun {tipo} trovato.`   | Tutti i listing (prodotto/articolo/documento/progetto/showroom/ambiente)                          |
| `{n} {tipo}` (conteggio)   | Tutti i listing (prodotti/articoli/documenti/etc)                                                 |

### Stringhe specifiche per listing

| File                | Riga  | Stringa                                      | Dest |
| ------------------- | ----- | -------------------------------------------- | ---- |
| ProductListing.tsx  | 76    | `Su richiesta`                               | i18n |
| BlogListing.tsx     | 15-17 | `Articolo`, `News`, `Tutorial` (type labels) | i18n |
| DocumentListing.tsx | 26    | `Scarica` / `Apri`                           | i18n |

### FilterSidebar.tsx (Legacy)

| Riga    | Stringa                | Dest |
| ------- | ---------------------- | ---- |
| 129     | `Rimuovi tutti`        | i18n |
| 379,457 | `Filtri`               | i18n |
| 461     | `Chiudi filtri` (aria) | i18n |
| 502     | `Applica`              | i18n |

### Footer.tsx

| Riga | Stringa                                  | Dest |
| ---- | ---------------------------------------- | ---- |
| 222  | `The Art of Mosaic` (tagline)            | i18n |
| 299  | `(C) {year} Sicis. All rights reserved.` | i18n |

---

## P2 — CATEGORIA e wireframe

### Categoria.tsx

| Riga    | Stringa                               | Dest |
| ------- | ------------------------------------- | ---- |
| 106     | `Su richiesta`                        | i18n |
| 226,323 | `{total} prodotti`                    | i18n |
| 255,352 | `Nessun prodotto trovato.`            | i18n |
| 267     | `Mostrando 24 di {total} prodotti`    | i18n |
| 374     | `pagina` / `pagine` (singular/plural) | i18n |

### ProdottoArredoFiniture.tsx

| Riga | Stringa                                             | Dest |
| ---- | --------------------------------------------------- | ---- |
| 82   | `Nessuna finitura disponibile per questo prodotto.` | i18n |

### ProdottoVetrite.tsx

| Riga | Stringa                               | Dest |
| ---- | ------------------------------------- | ---- |
| 193  | `Descrizione della collezione {name}` | i18n |

### Wireframe templates (bassa priorita)

| File                 | Stringa          |
| -------------------- | ---------------- |
| CategoriaBlog.tsx:15 | `Categoria Blog` |
| TaxonomyTerm.tsx:8   | `Taxonomy Term`  |

---

## P3 — ARIA LABELS / Accessibility

Aria labels in inglese o italiano hardcoded. Bassa priorita ma necessari per a11y completa.

| File                  | Stringa                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| NavDarkModeToggle.tsx | `Switch to light/dark mode`                                              |
| GalleryCarousel.tsx   | `Previous slide`, `Next slide`                                           |
| VimeoPlayer.tsx       | `Video`, `Pause`/`Play`, `Mute`/`Unmute`, `Fullscreen`, `Video progress` |
| ProductCarousel.tsx   | `Slide {n}`                                                              |
| ActiveFilters.tsx     | `Remove {label}`                                                         |
| CheckboxFilter.tsx    | `Remove {label}`                                                         |
| ImageListFilter.tsx   | `Remove {label}`                                                         |
| NavbarDesktop.tsx     | `Search`                                                                 |
| NavbarMobile.tsx      | `Close menu`, `Open menu`                                                |
| BloccoCorrelati.tsx   | `Img`, `Elemento {n}`                                                    |
| BloccoNewsletter.tsx  | `Email` (placeholder), `Iscriviti`                                       |
| SliderClient.tsx      | `Slide precedente/successiva`, `Vai alla slide {n}`                      |

---

## Per Freddi — Cosa serve lato Drupal CMS

Solo **2 stringhe** devono andare in Drupal come campi entity:

1. **`North America Warehouse`** — nome del magazzino per la spedizione US. Dovrebbe essere un campo su `prodotto_mosaico` o una config globale "warehouse name" per locale/regione.
2. **`2-3 weeks`** — tempo di spedizione. Stesso discorso, campo o config per locale/regione.

Tutto il resto (100+ stringhe) va in `messages/{locale}.json` e tradotto per tutte le 6+1 lingue (IT, EN, FR, DE, ES, RU, US=EN).

### Namespace i18n suggeriti

```json
{
  "quote": {
    "title": "Get a Quote",
    "description": "Fill out the form...",
    "email": "Email *",
    "firstName": "First Name *",
    "lastName": "Last Name *",
    "country": "Country",
    "profession": "Profession",
    "productName": "Product Name",
    "message": "Your Request",
    "privacy": "I consent to personal data processing *",
    "submit": "Submit Request",
    "submitting": "Submitting...",
    "successTitle": "Request Sent!",
    "successMessage": "We will get back to you shortly.",
    "close": "Close",
    "privacyError": "You must accept the privacy policy",
    "sendError": "Send Error"
  },
  "showroom": {
    "address": "Address:",
    "city": "City:",
    "phone": "Phone:",
    "email": "Email:",
    "getDirections": "Get Directions",
    "preview": "Preview"
  },
  "products": {
    "sheetSize": "Sheet size",
    "chipSize": "Chip size",
    "thickness": "Thickness",
    "shape": "Shape",
    "finishing": "Finishing",
    "qualityCert": "Quality certification",
    "maintenance": "Maintenance and installation",
    "viewGuide": "View guide",
    "catalogs": "Get inspired through catalogs",
    "discover": "Discover",
    "onDemand": "Price on request",
    "noProducts": "No products found.",
    "noFinishes": "No finishes available for this product.",
    "showLess": "Show less",
    "showAll": "Show all ({count})",
    "noFinishesAvailable": "No finishes available."
  },
  "pagination": {
    "label": "Pagination",
    "previous": "Previous page",
    "next": "Next page",
    "showing": "Showing {shown} of {total}"
  },
  "a11y": {
    "search": "Search",
    "openMenu": "Open menu",
    "closeMenu": "Close menu",
    "switchToLight": "Switch to light mode",
    "switchToDark": "Switch to dark mode",
    "previousSlide": "Previous slide",
    "nextSlide": "Next slide",
    "removeFilter": "Remove {label}"
  }
}
```

---

## Riepilogo

| Priorita   | Stringhe | Area                                                         |
| ---------- | -------- | ------------------------------------------------------------ |
| **P0**     | ~35      | QuoteForm, ProdottoMosaico, Showroom, FinitureGallery        |
| **P1**     | ~40      | Legacy listings (pattern ripetuto x6), FilterSidebar, Footer |
| **P2**     | ~12      | Categoria, ArredoFiniture, Vetrite, wireframes               |
| **P3**     | ~20      | Aria labels / accessibility                                  |
| **CMS**    | 2        | Warehouse name + shipping time                               |
| **Totale** | **~109** |                                                              |
