# Piano Migrazione i18n — 109 Stringhe Hardcoded

> **Data:** 2026-04-02 | **Status:** DA ESEGUIRE
> **Prerequisito:** Fase 0 (chiavi JSON) prima di tutto il resto.
> **Brief Freddi:** `docs/FREDDI-HARDCODED-TEXT-BRIEF.md`

## Riepilogo

| Fase    | File                 | Stringhe | Parallelizzabile            |
| ------- | -------------------- | -------- | --------------------------- |
| 0       | 6 (messages/\*.json) | prep     | No (prerequisito)           |
| 1       | 5 componenti P0      | ~35      | Parziale                    |
| 2       | 8 componenti P1      | ~40      | Si (6 listing paralleli)    |
| 3       | ~12 componenti P2+P3 | ~32      | Si (8 aria-label paralleli) |
| 4       | verifica             | 0        | No                          |
| **TOT** | **~25 file**         | **~107** |                             |

## Dipendenze

```
Fase 0 (JSON) ──┬──> Fase 1 (P0)
                 ├──> Fase 2 (P1)  [parallelo con 1]
                 └──> Fase 3 (P2+P3) [parallelo con 1,2]
Fase 1+2+3 ──> Fase 4 (verifica sentinel)
```

## Namespace design

### Esistenti — chiavi da aggiungere

**common:** noImage, noFinishesAvailable, onRequest, subscribe, showLess, emailPlaceholder
**products:** chipSize, maintenanceAndInstallation, viewGuide, getInspiredCatalogs, qualityCertification, collectionDescription
**listing:** countProducts, countArticles, countDocuments, countProjects, countShowrooms, countEnvironments, countPages, noArticles, noDocuments, noProjects, noShowrooms, noEnvironments, noProductsInSection, showingOf, pageOfTotal, download, open, typeArticle, typeNews, typeTutorial
**pagination:** ariaLabel, ariaPrev, ariaNext

### Nuovi namespace

**quote (14):** title, description, sentTitle, sentMessage, email, firstName, lastName, country, profession, productName, yourRequest, privacyConsent, privacyError, sending, submit, sendError
**showroom (6):** address, city, phone, email, getDirections, preview
**footer (4):** tagline, copyright, products, company
**aria (20+):** switchToLight, switchToDark, previousSlide, nextSlide, video, pause, play, mute, unmute, fullscreen, exitFullscreen, videoProgress, slideN, removeFilter, search, closeMenu, openMenu, prevLegacySlide, nextLegacySlide, goToSlide, finishSections

## Fase 0 — Aggiunta chiavi JSON

6 file messages/\*.json. IT/EN completi, FR/DE/ES placeholder EN con TODO, RU placeholder EN.

## Fase 1 — P0 (35 stringhe, 5 file)

- **1.1** QuoteFormSheet.tsx (client) — 14 stringhe IT → useTranslations('quote')
- **1.2** ProdottoMosaico.tsx (server) — gia ha getTranslations('products'), aggiungere chiavi
- **1.3** MosaicProductPreview.tsx (server) — stesse sostituzioni di 1.2
- **1.4** Showroom.tsx (server) — convertire async, getTranslations('showroom')
- **1.5** FinitureGallery.tsx (client) — useTranslations('common'+'products'+'aria')

## Fase 2 — P1 (40 stringhe, 8 file)

- **2.1a-f** 6 Legacy Listing (server) — pattern identico: getTranslations('listing'+'pagination'+'common'), convertire async
  - ProductListing, BlogListing, DocumentListing, ProjectListing, ShowroomListing, EnvironmentListing
- **2.2** FilterSidebar.tsx (client) — useTranslations('filters') — 4 chiavi GIA PRESENTI
- **2.3** Footer.tsx (server) — convertire async, getTranslations('footer')

## Fase 3 — P2+P3 (32 stringhe, ~12 file)

- **3.1** Categoria.tsx — listing/common
- **3.2** ProdottoArredoFiniture.tsx — 1 stringa
- **3.3** ProdottoVetrite.tsx — 1 stringa
- **3.4** 8 componenti aria labels — useTranslations('aria'):
  NavDarkModeToggle, GalleryCarousel, VimeoPlayer, ProductCarousel, ActiveFilters, NavbarDesktop, NavbarMobile, SliderClient, BloccoNewsletter, CheckboxFilter, ImageListFilter

## Fase 4 — Verifica

- Grep globale stringhe IT/EN residue
- Sync chiavi mancanti (resistant, absent → DE/FR/ES/RU)
- npm run build + npx vitest run
- Sentinel quality gate

## CMS (per Freddi, NON parte di questo piano)

- `North America Warehouse` — campo Drupal o config per regione
- `2-3 weeks` — campo Drupal o config per regione
