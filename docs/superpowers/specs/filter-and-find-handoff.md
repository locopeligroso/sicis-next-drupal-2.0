# Filter & Find — Handoff per sessione successiva

## Documenti di riferimento

| Documento | Path |
|---|---|
| **Spec completa** | `docs/superpowers/specs/2026-03-24-filter-and-find-redesign.md` |
| **Mockup finali HTML** | `docs/superpowers/specs/filter-and-find-final-mockups.html` (aprire in browser) |
| **Piano implementazione** | `docs/superpowers/plans/2026-03-24-filter-and-find-redesign.md` |
| **Task Drupal** | `docs/drupal-content-tasks.md` (gitignored, potrebbe non essere presente) |

## Stato implementazione

27 commit su main. Struttura funzionante ma con problemi di compliance DS.

### Cosa è stato fatto (funzionante)

- Token `--container-listing` (96rem) in globals.css
- i18n keys in tutte e 6 le lingue
- Registry ripulito (rimossi filtri P1/P2 non voluti)
- Routing Pixall (`/mosaico/pixall` → `prodotto_pixall`)
- 8 nuovi composed: FilterPanel, ListingBreadcrumb, ContextBar, AiryHeader, TypologyNav, PixallHubCard, HubSection, ShareButton, CollectionPopoverContent
- 5 composed modificati: ActiveFilters (swatch chips), FilterGroup (no collapse), ColorSwatchFilter (no labels), MobileFilterTrigger (custom label), ProductGrid (5-col)
- 2 block rewrite: SpecFilterSidebar (pannello laterale), SpecFilterSidebarContent (always expanded + typology nav + active path filter exclusion)
- 2 nuovi block: SpecHubMosaico, SpecHubArredo
- Template riscritto (3 variant: hub/context-bar/airy-header)
- Master page `/prodotti`
- Bug fix count=0
- Neoglass/Neocolibrì: slug override rimossi, TODO documentato
- Popover "Cambia" con lista collezioni/swatches colori
- Pannello laterale ancorato al bordo sinistro (non glassmorphism)
- Titoli risolti da `deslugify`/`activeP0.label` (non più slug raw)

### Cosa NON funziona / da fixare

#### CRITICO: Compliance DS (Design System)

**Tutti i componenti nuovi devono essere rivisti per compliance con `/ds` e `/shadcn`.**

I subagenti che hanno creato i componenti NON avevano il contesto DS. Risultato: spacing hardcoded, Typography usata in modo inconsistente, primitivi shadcn non usati dove dovrebbero.

**Procedura per la revisione:**
1. Invocare `/ds` e `/shadcn` per avere le regole in contesto
2. Leggere i Gen* blocks come riferimento (NON i legacy Blocco*):
   - `src/components/blocks/GenIntro.tsx` — pattern overline + h1 + body
   - `src/components/blocks/GenGalleryIntro.tsx` — pattern overline + h1 + body
   - `src/components/blocks/SpecListingHeader.tsx` — pattern h1 + description
3. Per ogni componente nuovo, confrontare: spacing tokens, Typography textRoles, colori semantici, uso primitivi shadcn
4. Fix in-place

**Componenti da rivedere (priorità):**
- `src/templates/nodes/ProductsMasterPage.tsx` — spacing, Typography, card con raw HTML
- `src/components/composed/AiryHeader.tsx` — spacing (migliorato ma da verificare)
- `src/components/composed/ContextBar.tsx` — spacing (migliorato), verificare uso primitivi
- `src/components/composed/CollectionPopoverContent.tsx` — raw Link con Tailwind, dovrebbe usare primitivi shadcn
- `src/components/blocks/SpecHubMosaico.tsx` — verificare Typography e spacing
- `src/components/blocks/SpecHubArredo.tsx` — verificare Typography e spacing

#### Bug noti

1. **Hub Mosaico**: titolo "Mosaico" minuscolo dal slug (viene da `deslugify("mosaico")` che dà "Mosaico" — verificare)
2. **Hub Mosaico**: sezione Pixall manca o non renderizza correttamente
3. **Hub Mosaico**: FAB filtro mobile appare su hub (non dovrebbe)
4. **Arredo**: tutti i conteggi tipologie a 0 (probabile problema API staging — 0 prodotti arredo su staging)
5. **Neoglass/Neocolibrì**: ancora voci separate nell'API (attende Drupal)
6. **Vetrite**: non testata (stessa struttura Mosaico)
7. **Tessile/Illuminazione**: non testati

#### Scelte di design cambiate durante visual review

- **Pannello filtro**: da glassmorphism floating → pannello laterale ancorato al bordo sinistro (`FilterPanel.tsx` con `border-r bg-surface-1`)
- **Context bar**: titolo h3, immagine 64px tonda, "Cambia" e "✕" sotto al titolo (non a fianco)
- **Container**: hub + master page usano `max-w-main`, solo listing usa `max-w-listing`

### Pagine da testare visivamente

| Pagina | URL | Stato |
|---|---|---|
| Master page | `/it/prodotti` | Parziale — da rivedere DS |
| Mosaico hub | `/it/mosaico` | Parziale — Pixall section, FAB, titolo |
| Mosaico collezione | `/it/mosaico/murano-smalto` | Funzionante — da rivedere DS |
| Mosaico colore | `/it/mosaico/colori/rosso` | Non testato |
| Pixall | `/it/mosaico/pixall` | Parziale — filtri non renderizzano |
| Vetrite hub | `/it/lastre-vetro-vetrite` | Non testato |
| Arredo hub | `/it/arredo` | Parziale — conteggi a 0 |
| Arredo seats | `/it/arredo/seats` | Parziale — conteggi a 0 |
| Arredo armchairs | `/it/arredo/armchairs` | Funzionante (36 prodotti) |
| Illuminazione | `/it/illuminazione` | Non testato |
| Tessile | `/it/prodotti-tessili` | Non testato |

### Dipendenze Drupal (bloccanti)

- `field_testo_main` vuoto su tutte le `node--categoria` arredo (descrizioni non migrate)
- `prodotto_pixall`: 0 prodotti su staging (non migrati)
- Neoglass/Neocolibrì: tassonomia da ristrutturare
- Immagini mancanti per alcune categorie (Seats, Bedroom, Accessories, Next Art)
- V10 endpoint restituisce solo 10/13 categorie arredo
