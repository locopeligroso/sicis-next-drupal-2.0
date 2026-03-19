# Mega-menu Design Spec
**Data**: 2026-03-18  
**Stato**: Approvato dall'utente  

---

## Contesto

La navbar attuale (`Header.tsx`) ha già la logica per un dropdown a un livello, ma:
1. `transformMenuToNavItems` mappa solo il primo livello di children — i nipoti (collezioni) vengono persi
2. I link padre nel menu Drupal puntano a path sbagliati (es. `/it/vetrite` invece di `/it/lastre-vetro-vetrite`)
3. Non esiste un mega-menu a colonne

Il menu Drupal ha questa struttura a 3 livelli:
- **EXPLORE** (`<nolink>`) → Mosaico (23 col.), Vetrite (10 col.), Furniture (41 cat.), Lighting (4), Textile (5), Pixall
- **FILTER & FIND** (`<nolink>`) → Mosaico, Vetrite, Furniture, Textile, Lighting
- **PROJECTS** (`<nolink>`) → Progetti, Ambienti, Inspiration, Design Service
- **Home** → `/it`

---

## Design scelto

### Layout: Colonne orizzontali (variante A)

Pannello full-width sotto la navbar con le categorie principali affiancate come colonne. Ogni colonna ha:
- Titolo categoria (uppercase, grigio, con border-bottom)
- Lista link collezioni/categorie
- Per Furniture: solo le 8-10 principali + link "Vedi tutte →"

### Apertura: Hover su desktop, click/tap su mobile (variante C)

- **Desktop** (`pointer: fine`): hover sulla voce → pannello appare; mouse leave con debounce 150ms → pannello si chiude
- **Mobile/touch** (`pointer: coarse`): tap sulla voce → pannello toggle; tap fuori → chiude
- Rilevamento via `window.matchMedia('(pointer: fine)')`

---

## Architettura

### File da modificare

| File | Modifica |
|------|----------|
| `src/lib/fetch-menu.ts` | `transformMenuToNavItems` — mappare ricorsivamente i children (3 livelli) |
| `src/components/layout/Header.tsx` | Refactor completo: aggiungere `MegaMenu` panel, logica hover/click adattiva |

### File da creare

| File | Scopo |
|------|-------|
| `src/components/layout/MegaMenu.tsx` | Componente pannello mega-menu (colonne + link) |

### Struttura dati

`MenuItem` già esistente è sufficiente — basta che `transformMenuToNavItems` popoli correttamente i `children` a tutti i livelli:

```typescript
interface MenuItem {
  id: string;
  title: string;
  url: string;
  weight: number;
  children: MenuItem[]; // ora popolato ricorsivamente
}
```

---

## Comportamento dettagliato

### Apertura pannello

```
Desktop (pointer: fine):
  onMouseEnter(voce) → setOpenIndex(i), clearCloseTimer()
  onMouseLeave(voce o pannello) → startCloseTimer(150ms) → setOpenIndex(null)
  onMouseEnter(pannello) → clearCloseTimer()

Mobile (pointer: coarse):
  onClick(voce) → toggle openIndex (apri se chiuso, chiudi se aperto)
  onClick(fuori pannello) → setOpenIndex(null)  [via useEffect + document listener]
```

### Struttura colonne

```
EXPLORE panel:
  [Mosaico]          [Vetrite]         [Furniture]        [Lighting]    [Textile]    [Pixall]
  Antigua            Gem Glass         Sofas              Ceiling lamps Fabrics      Tutti i Pixall →
  Blends             Gem Stone         Armchairs          Floor lamps   Tapestries
  Crystal            Electric Marble   Tables             Table lamps   Cushions
  Diamond            Onigem            Beds               Wall sconces  Carpets
  Firefly            Spathula          Lighting                         Bedcover
  Glimmer            Vetrite Art       Mirrors
  Iridium            Vetrite Sight     Carpets
  Murano Smalto      Vetrite Tile      Outdoor
  Natural            Vetrite Deco      + Vedi tutte →
  NeoColibrì         Vetrite
  Neoglass
  Petites fleurs
  Pluma
  Tephra
  Waterglass
  + altri 8 →

FILTER & FIND panel:
  [Mosaico]  [Vetrite]  [Furniture]  [Textile]  [Lighting]
  (link diretto alla sezione listing, no sottovoci)

PROJECTS panel:
  [Progetti]  [Ambienti]  [Inspiration]  [Design Service]
  (link diretti)
```

### Fix URL (da applicare in Drupal o via normalizeUrl)

I seguenti path nel menu Drupal sono sbagliati e vanno corretti:

| Voce | URL attuale | URL corretto |
|------|------------|--------------|
| Vetrite (padre) | `/it/vetrite` | `/it/lastre-vetro-vetrite` |
| Furniture (padre) | `/it/mobili` | `/it/arredo` |
| Lighting (padre) | `/it/lighting` | `/it/categoria/illuminazione` |
| Textile (padre) | `/textile` | `/it/tessile/tessuti` |
| Progetti | `/it/progetti-0` | `/it/progetti` |
| Ambienti | `/ambienti` | `/it/ambienti` |
| Mosaico (FILTER&FIND) | `/mosaico` | `/it/mosaico` |

**Strategia**: correggere in Drupal (admin menu). Non aggiungere logica di fix nel frontend — `normalizeUrl` non deve conoscere i path sbagliati.

---

## Componente MegaMenu.tsx

```typescript
interface MegaMenuProps {
  items: MenuItem[];           // children della voce attiva (es. children di EXPLORE)
  onClose: () => void;         // chiamato su click fuori o mouse leave con debounce
  onMouseEnter: () => void;    // clearCloseTimer — mantiene il pannello aperto
  onMouseLeave: () => void;    // startCloseTimer — avvia debounce chiusura
  locale: string;
}
```

Responsabilità:
- Renderizza le colonne
- Gestisce il limite di 8 link per Furniture + "Vedi tutte →"
- `onMouseEnter` → chiama `clearCloseTimer` (passato come prop da Header)
- `onMouseLeave` → chiama `startCloseTimer`

---

## Refactor Header.tsx

Responsabilità che rimangono in Header:
- Fetch menu (già presente)
- State `openIndex` + timer ref per debounce
- Rilevamento `isTouch` via `matchMedia('(pointer: fine)')` — una sola volta al mount via `useEffect`
- Render navbar items
- Render `<MegaMenu>` condizionale sotto la navbar

Responsabilità che si spostano in MegaMenu:
- Layout colonne
- Logica "vedi tutte"
- Mouse events del pannello

---

## Acceptance Criteria

- [ ] Hover su EXPLORE (desktop) → pannello appare con colonne Mosaico, Vetrite, Furniture, Lighting, Textile, Pixall
- [ ] Mouse leave con debounce 150ms → pannello si chiude
- [ ] Mouse su pannello → pannello rimane aperto
- [ ] Tap su EXPLORE (mobile) → pannello toggle
- [ ] Tap fuori → pannello si chiude
- [ ] Furniture mostra max 8 link + "Vedi tutte →" che porta a `/it/arredo`
- [ ] Tutti i link sono corretti (no `/it/vetrite`, no `/it/mobili`)
- [ ] `transformMenuToNavItems` popola children a tutti i livelli
- [ ] TypeScript strict: zero errori
- [ ] Nessun pixel value nei CSS (solo rem/em/%/vw/vh)
- [ ] Voce attiva evidenziata: usare `usePathname()` da `next/navigation`, confronto prefix-match (`pathname.startsWith(item.url)`) per evidenziare la voce padre anche su pagine figlie
