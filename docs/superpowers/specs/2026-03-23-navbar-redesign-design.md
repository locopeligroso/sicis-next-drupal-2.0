# Navbar Redesign — Design Spec

## Overview

Complete replacement of the legacy Header component with a new design-system navbar. Floating glassmorphism bar with 4 mega-menu panels, each with a distinct layout tailored to its content type. Mobile uses a fullscreen dark overlay.

## Navbar Bar

### Structure
- **Container**: floating, glassmorphism (`backdrop-filter: blur`, semi-transparent), offset from viewport edges (~16px top/sides), overlays page content
- **Border radius**: use design token `--radius-4xl` (~16px). If insufficient, introduce `--radius-navbar` token
- **Max-width**: `--container-main` (same as blocks), centered with `mx-auto`
- **Height**: ~72-76px to accommodate two-line nav items
- **Layout**: logo left | nav items center | actions right
- **Light mode**: `rgba(255,255,255,0.90)` background, blur 20px
- **Dark mode**: `rgba(var(--surface-1), 0.85)` background, blur 20px, adjusted border opacity
- **Content spacing**: page `<main>` needs `padding-top` equal to navbar height + top offset (~92px) to prevent content hidden behind the floating bar

### Logo
- SVG image asset (not text)
- Links to homepage (`/{locale}`)

### Nav Items (4 items, no Home)
Each item has two lines:
1. **Label** — uppercase, letter-spacing, semibold
2. **Description** — small, muted

Items (translation keys in `messages/{locale}.json` under `nav` section):
| Key | Label (EN) | Description (EN) |
|-----|-----------|-------------------|
| `nav.explore` | Explore | The Universe of Sicis |
| `nav.filterFind` | Filter & Find | Surfaces & Products |
| `nav.projects` | Projects | Portfolio & Inspiration |
| `nav.info` | Info | Corporate & Services |

All labels and descriptions are translated via `useTranslations('nav')`. New keys to add to all 6 locale files.

Active state: label bold, other items dimmed when mega-menu is open.

### Actions (right side)
- **Search** — icon button, opens search (implementation TBD)
- **Dark mode toggle** — icon button, uses next-themes. Shows after mount only (hydration safety)
- **Language switcher** — current locale code (e.g. "IT"), dropdown with 6 locales. Shows pending state (opacity fade) during path resolution via `getTranslatedPath()`

### Scroll Behavior
- **Hide on scroll down**: navbar slides up via `transform: translateY(-100%)` after a minimum scroll delta of 50px downward
- **Show on scroll up**: navbar slides back down on any upward scroll
- **Transition**: `transform 300ms ease`
- **At page top**: always visible, never hidden
- **When mega-menu is open**: mega-menu closes first on scroll, then navbar hides on continued scroll
- **When mega-menu content overflows**: mega-menu panel gets `overflow-y: auto` with `max-height: 70vh`

## Mega-menus

All mega-menus open inside the floating container (below the navbar bar, same rounded container). The container grows in height to accommodate the panel — this is an overlay, page content does NOT shift.

**Open/close animation**: panel height animates from 0 to auto using `grid-rows` technique (CSS `grid-template-rows: 0fr → 1fr`), duration 250ms ease-out. Content fades in with 150ms delay.

**Z-index**: the floating navbar container uses the existing shadcn `--layer-popover` token (or equivalent). No custom z-index values.

Triggered by hover on desktop (150ms debounce on leave), tap on touch devices.

### Menu Data Mapping

The Drupal main menu returns a flat list of top-level items with children. The navbar reorganizes these into 4 conceptual groups via a **frontend mapping layer** (`src/lib/navbar/menu-mapper.ts`). This mapper receives `MenuItem[]` from Drupal and returns a structured `NavbarMenu` object with typed sections for each mega-menu. During initial implementation, the mapping is hardcoded by menu item title/URL matching. Future: Drupal menu structure could be reorganized to match.

### Explore — The Universe of Sicis

**Layout**: text columns left + video edge-to-edge right

**Columns** (5):
| Column | Links |
|--------|-------|
| Mosaico | Tinte unite, Marmo, Metallo, Pixel, Artistico |
| Vetrite | Lastre vetro |
| Living | Arredo, Cucina, Bagno, Illuminazione |
| Tessile | Prodotti Tessili |
| Jewels | Sicis Jewels |

**Video**:
- Edge-to-edge on right side (touches right and bottom border of floating container)
- Autoplay, muted, no controls, no links
- Subtle category label in bottom-left corner
- Changes with crossfade (opacity transition 400ms) when hovering different columns
- Active column indicated by 2px solid border-bottom on title (vs 1px light for others)
- All columns remain fully visible (no dimming)
- **Preloading strategy**: only the default video loads on mega-menu open. Other videos load on first hover (lazy). Format: MP4 (H.264), max 2MB per clip, ~5-10 seconds loop. Fallback: static image if video fails to load
- Videos sourced from `public/videos/navbar/` as static assets initially

### Filter & Find — Surfaces & Products

**Layout**: 5 equal columns, each with thumbnail + primary link + secondary links

**Each column structure**:
1. **Thumbnail** — category image, rounded corners, ~80px height. Static assets in `public/images/navbar/`
2. **Primary link** — bold, uppercase, with arrow (→), links to product listing page
3. **Brief description** — muted, one line (translated via `nav` keys)
4. **Separator** — thin line
5. **Secondary links** — smaller, muted, variable per category (translated via `nav` keys)

| Column | Primary | Secondary links |
|--------|---------|-----------------|
| Mosaico | → /mosaico | Libreria cataloghi, Certificazioni e manuali, Video tutorial, Soluzioni espositive |
| Vetrite | → /lastre-vetro-vetrite | Libreria cataloghi, Certificazioni e manuali, Video tutorial, Soluzioni espositive |
| Arredo | → /arredo | Libreria cataloghi, Certificazioni e manuali, Soluzioni espositive |
| Illuminazione | → /illuminazione | Libreria cataloghi, Certificazioni e manuali |
| Tessili | → /prodotti-tessili | Libreria cataloghi, Certificazioni e manuali, Soluzioni espositive, Approfondimento tessuti |

Secondary links: hardcoded in the menu mapper initially, with destination URLs from page nodes. These are not currently in the Drupal menu.

### Projects — Portfolio & Inspiration

**Layout**: descriptive list left + image edge-to-edge right

**List items** (4, vertical, with title + description — all translated via `nav` keys):
| Key | Title | Description |
|-----|-------|-------------|
| `nav.projects.progetti` | Progetti → | Realizzazioni SICIS nel mondo |
| `nav.projects.ambienti` | Ambienti → | Ispirazioni per ogni spazio |
| `nav.projects.inspiration` | Inspiration → | Tendenze e idee dal blog |
| `nav.projects.interiorDesign` | Interior Design → | Progettazione personalizzata |

**Image**:
- Edge-to-edge on right side (same pattern as Explore video)
- Changes with crossfade (opacity 400ms) when hovering different list items
- Each item has an associated image. Static assets in `public/images/navbar/`
- Fallback: muted background color if image missing

### Info — Corporate & Services

**Layout**: strategic links with description | separator | corporate links + professional defilato

**Left — Strategic (with description, translated via `nav` keys)**:
| Title | Description |
|-------|-------------|
| Showroom → | Spazi espositivi nel mondo |
| Contacts → | Scrivici o trova il rivenditore |
| Download Catalogues → | Sfoglia e scarica i cataloghi |

**Right — Secondary**:
- Heritage (link only)
- About us (link only)
- Sicis Village (link only)
- _(separator line)_
- Professional → (smaller, muted, defilato)

No images or media in this panel.

## Mobile Navigation

### Trigger
- Hamburger icon replaces nav items at breakpoint < lg (1024px)
- Logo remains visible

### Fullscreen Overlay
- **Background**: dark (#111 or `--surface-5`), covers entire viewport with `position: fixed; inset: 0`
- **Header**: logo (white variant) left + close (✕) button right
- **Menu items**: large typography (~28px), light weight (300), vertically stacked with generous gap
- **Animation**: overlay fades in (opacity 200ms), items stagger slide-up (50ms delay each)

### Sub-navigation (mobile)
- Items with children show arrow (→)
- On tap: current list slides left, sub-items slide in from right (push transition)
- Back button at top of sub-level to return to parent
- Only one level open at a time (replaces, not expands)
- Sub-items use smaller typography (~20px)

### Language switcher (mobile)
- Row of locale codes at bottom of overlay, fixed position
- Current locale highlighted (white, bold), others muted (rgba white 0.4)

## Component Architecture

The Navbar is a **layout component** — not a Block or Composed. It lives in `src/components/layout/` since it's a singleton used once in the app layout, not a reusable design system element.

### Layout Components (`src/components/layout/`)
- **Navbar** — main shell: floating container, scroll behavior, responsive breakpoint switch
- **NavbarDesktop** — desktop layout: logo + nav items + actions + mega-menu panels
- **NavbarMobile** — mobile: logo + hamburger + fullscreen overlay with sub-nav

### Composed Components (`src/components/composed/`)
- **MegaMenuExplore** — Explore-specific layout (columns + video)
- **MegaMenuFilterFind** — Filter & Find layout (thumbnail columns)
- **MegaMenuProjects** — Projects layout (list + image)
- **MegaMenuInfo** — Info layout (strategic + secondary + professional)
- **NavLanguageSwitcher** — locale dropdown with pending state
- **NavDarkModeToggle** — theme toggle with hydration guard

### Primitives Used
- `Button` (icon buttons for search, dark mode, hamburger, close)
- `Separator` (mega-menu dividers)

### Data Layer (`src/lib/navbar/`)
- **menu-mapper.ts** — transforms Drupal `MenuItem[]` into structured `NavbarMenu` with typed sections

### State
- `openMenu: string | null` — which mega-menu is open (by nav item key)
- `isVisible: boolean` — navbar visibility based on scroll direction
- `lastScrollY: number` — for scroll delta calculation
- `isMobileMenuOpen: boolean` — fullscreen overlay state
- `isTouch: boolean` — detected once at mount via `matchMedia('(pointer: fine)')`

## Accessibility

- `<header>` + `<nav>` semantic elements
- `aria-haspopup="true"`, `aria-expanded` on nav items with mega-menus
- `Escape` closes open mega-menu or mobile overlay
- Mega-menu panels: `role="region"` with `aria-label` matching the nav item label
- On mega-menu open: focus moves to first link in the panel
- Tab navigates through links sequentially within the panel
- Tab past last link closes the mega-menu and moves focus to next nav item
- Arrow keys: not implemented initially (Tab navigation sufficient for the link-based layout)
- Mobile close button: `aria-label="Close menu"`, visible focus ring
- Language switcher: `role="listbox"` with `role="option"` and `aria-selected`
- Videos: `aria-hidden="true"` (decorative, no audio)

## Responsive Breakpoints

- **base (mobile)**: hamburger + fullscreen overlay, no mega-menus
- **lg (1024px)**: switch to desktop navbar with mega-menus
- Nav items may need font-size adjustment between lg and xl for fit

## Integration

- Replaces `src/components_legacy/Header.tsx`, `MegaMenu.tsx`, `LanguageSwitcher.tsx`
- One-shot replacement (no progressive migration — the new navbar replaces the old one entirely)
- Layout (`src/app/[locale]/layout.tsx`) passes same props: `locale`, `initialMenu`
- Data shape: continues using existing `MenuItem[]` interface
- Dark mode: continues using `next-themes`
- Routing: `usePathname()` for active state, `useRouter()` for language switching
- Translations: `useTranslations('nav')` — new keys added to all 6 locale files

## Open Questions

- Search: what does it open? (Command palette, sheet, inline expand?)
- Should the floating navbar become solid (non-transparent) after scrolling past the hero area?
- Exact video clips for Explore: who provides them?
- Exact images for Projects and Filter & Find thumbnails: who provides them?
