# Navbar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy Header with a floating glassmorphism navbar featuring 4 distinct mega-menu panels, hide-on-scroll behavior, and a fullscreen mobile overlay.

**Architecture:** Layout components (`src/components/layout/`) own the navbar shell and responsive switching. Mega-menu panels are Composed components. A frontend menu-mapper transforms the flat Drupal menu into structured sections. All text is translated via `messages/{locale}.json`.

**Tech Stack:** Next.js 16 (App Router, RSC), Tailwind CSS 4, shadcn/ui (base-vega), next-themes, next-intl, Drupal JSON:API menu

**Spec:** `docs/superpowers/specs/2026-03-23-navbar-redesign-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/lib/navbar/menu-mapper.ts` | Transform Drupal `MenuItem[]` → typed `NavbarMenu` with 4 sections |
| `src/lib/navbar/types.ts` | `NavbarMenu`, `ExploreSection`, `FilterFindSection`, `ProjectsSection`, `InfoSection` interfaces |
| `src/components/layout/Navbar.tsx` | Floating container shell, scroll hide/show, responsive breakpoint switch |
| `src/components/layout/NavbarDesktop.tsx` | Desktop: logo + nav items + actions + mega-menu panels |
| `src/components/layout/NavbarMobile.tsx` | Mobile: logo + hamburger + fullscreen overlay + sub-nav |
| `src/components/composed/MegaMenuExplore.tsx` | Explore panel: text columns + video edge-to-edge |
| `src/components/composed/MegaMenuFilterFind.tsx` | Filter & Find panel: thumbnail columns + primary/secondary links |
| `src/components/composed/MegaMenuProjects.tsx` | Projects panel: descriptive list + image crossfade |
| `src/components/composed/MegaMenuInfo.tsx` | Info panel: strategic + corporate + professional |
| `src/components/composed/NavLanguageSwitcher.tsx` | Locale dropdown with pending state |
| `src/components/composed/NavDarkModeToggle.tsx` | Theme toggle with hydration guard |
| `src/hooks/useScrollDirection.ts` | Custom hook: tracks scroll direction + delta threshold |

### Modified Files
| File | Change |
|------|--------|
| `src/app/[locale]/layout.tsx` | Replace `Header` import with `Navbar`, add padding-top to main |
| `src/styles/globals.css` | Use `--radius-4xl` for navbar border-radius (only introduce new token if visually insufficient) |
| `messages/it.json` | Add ~30 new nav keys |
| `messages/en.json` | Add ~30 new nav keys |
| `messages/fr.json` | Add ~30 new nav keys |
| `messages/de.json` | Add ~30 new nav keys |
| `messages/es.json` | Add ~30 new nav keys |
| `messages/ru.json` | Add ~30 new nav keys |

### Static Assets (placeholder initially)
| Path | Content |
|------|---------|
| `public/images/navbar/mosaico.jpg` | Mosaico category thumbnail (Filter & Find) |
| `public/images/navbar/vetrite.jpg` | Vetrite category thumbnail |
| `public/images/navbar/arredo.jpg` | Arredo category thumbnail |
| `public/images/navbar/illuminazione.jpg` | Illuminazione category thumbnail |
| `public/images/navbar/tessili.jpg` | Tessili category thumbnail |
| `public/images/navbar/projects-*.jpg` | 4 images for Projects mega-menu |
| `public/images/navbar/logo.svg` | SICIS logo (dark variant for light mode) |
| `public/images/navbar/logo-white.svg` | SICIS logo (white variant for dark mode + mobile overlay) |

Videos for Explore are TBD — use placeholder images with a play icon overlay until video assets are provided. When ready, place in `public/videos/navbar/` (H.264 MP4, max 2MB, ~5-10s loop).

---

## Task 1: NavbarMenu Types + Menu Mapper

**Files:**
- Create: `src/lib/navbar/types.ts`
- Create: `src/lib/navbar/menu-mapper.ts`
- Test: `src/lib/navbar/__tests__/menu-mapper.test.ts`

- [ ] **Step 1: Write the types**

Define `NavbarMenu` and section interfaces in `types.ts`. Import `MenuItem` from `@/lib/drupal`.

- [ ] **Step 2: Write failing tests for the mapper**

Test that `mapMenuToNavbar(menuItems)` correctly categorizes already-transformed `MenuItem[]` (output of `transformMenuToNavItems`, with locale-prefixed URLs) into the 4 sections. Use a fixture of realistic data from the Drupal main menu.

Run: `npx vitest run src/lib/navbar/__tests__/menu-mapper.test.ts`
Expected: FAIL — mapper not implemented

- [ ] **Step 3: Implement the mapper**

Match Drupal menu items by URL pattern to assign to sections. Handle missing items gracefully (empty arrays).

- [ ] **Step 4: Run tests to verify**

Run: `npx vitest run src/lib/navbar/__tests__/menu-mapper.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```
feat: add navbar menu mapper with types and tests
```

---

## Task 2: Translation Keys

**Files:**
- Modify: `messages/it.json`
- Modify: `messages/en.json`
- Modify: `messages/fr.json`
- Modify: `messages/de.json`
- Modify: `messages/es.json`
- Modify: `messages/ru.json`

- [ ] **Step 1: Define the key structure**

Add keys under `nav` section for:
- 4 top-level items (label + description)
- Projects sub-items (4 titles + 4 descriptions)
- Info sub-items (strategic descriptions)
- Filter & Find descriptions and secondary link labels
- Mobile menu labels (close, back)

- [ ] **Step 2: Add IT keys** (primary locale, complete translations)

- [ ] **Step 3: Add EN keys** (complete translations)

- [ ] **Step 4: Add FR/DE/ES/RU keys** (use EN as placeholder where translation unknown, mark with TODO)

- [ ] **Step 5: Verify TypeScript** — run `npx tsc --noEmit` to ensure no missing key errors

- [ ] **Step 6: Commit**

```
feat: add navbar translation keys for all 6 locales
```

---

## Task 3: useScrollDirection Hook

**Files:**
- Create: `src/hooks/useScrollDirection.ts`

- [ ] **Step 1: Implement the hook**

Returns `{ isVisible: boolean }`. Tracks `lastScrollY` via ref. Hides after 50px downward delta. Shows on any upward scroll. Always visible at page top. Uses `passive` scroll listener. Accepts optional `forceVisible` param — when true (e.g. mega-menu open), always returns visible. Caller is responsible for closing mega-menu on scroll before allowing hide.

- [ ] **Step 2: Test manually** in dev (will be used by Navbar shell)

- [ ] **Step 3: Commit**

```
feat: add useScrollDirection hook for navbar hide/show
```

---

## Task 4: Navbar Shell (Layout Component)

**Files:**
- Create: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Create the floating container**

`'use client'` component. Renders the glassmorphism floating bar with:
- `position: fixed`, offset from edges, `max-w-main`, `mx-auto`
- `backdrop-filter: blur(20px)`, light: `bg-white/90`, dark: `bg-surface-1/85`
- `border-radius` using `rounded-4xl` (existing `--radius-4xl` token)
- `z-50` (Tailwind default, consistent with shadcn overlay components)
- Uses `useScrollDirection` for hide/show with `transform: translateY` transition (300ms ease)
- When mega-menu is open: close mega-menu on scroll, then allow navbar to hide on continued scroll
- Responsive: renders `NavbarDesktop` at lg+, `NavbarMobile` below lg
- Props: `locale: string`, `menu: NavbarMenu`

- [ ] **Step 2: Create placeholder NavbarDesktop and NavbarMobile**

Minimal components that render "Desktop" / "Mobile" text, enough to verify the shell works.

- [ ] **Step 3: Add padding-top to layout**

Modify `src/app/[locale]/layout.tsx`:
- Import `Navbar` instead of legacy `Header`
- Pass `mapMenuToNavbar(menuItems)` result
- Add `pt-[92px]` or equivalent to `<main>`

- [ ] **Step 4: Verify in browser** — floating bar visible, hides on scroll, responsive switch works

- [ ] **Step 5: Commit**

```
feat: add Navbar shell with floating glassmorphism container
```

---

## Task 5: NavDarkModeToggle + NavLanguageSwitcher

**Files:**
- Create: `src/components/composed/NavDarkModeToggle.tsx`
- Create: `src/components/composed/NavLanguageSwitcher.tsx`

- [ ] **Step 1: Implement NavDarkModeToggle**

`'use client'`. Uses `useTheme()` from next-themes. Renders `Button` variant="ghost" size="icon" with sun/moon icon from lucide. Hydration guard: render null until mounted.

- [ ] **Step 2: Implement NavLanguageSwitcher**

`'use client'`. Dropdown with current locale button → list of 6 locales. Uses `getTranslatedPath()` for path resolution. Shows pending state (opacity) during navigation via `useTransition`. Accessibility: `role="listbox"` on dropdown, `role="option"` + `aria-selected` on each locale.

- [ ] **Step 3: Verify both in browser**

- [ ] **Step 4: Commit**

```
feat: add NavDarkModeToggle and NavLanguageSwitcher composed components
```

---

## Task 6: NavbarDesktop — Nav Items + Actions

**Files:**
- Modify: `src/components/layout/NavbarDesktop.tsx`

- [ ] **Step 1: Implement the desktop bar layout**

Logo (SVG from `public/images/navbar/logo.svg`) left, 4 nav items center (label + description, two-line), actions right (search icon button disabled/no-op for now + dark mode toggle + language switcher). All nav items: `aria-haspopup="true"`, `aria-expanded`. Touch detection via `matchMedia('(pointer: fine)')` once at mount.

- [ ] **Step 2: Add active state**

Use `usePathname()` to determine active item. Bold label + dim other items when mega-menu open.

- [ ] **Step 3: Add mega-menu trigger state**

`openMenu` state. Hover opens with 150ms debounce on leave. Touch: click to toggle. Escape closes.

- [ ] **Step 4: Add mega-menu panel container**

Animated panel that opens below the nav bar, inside the same floating container. Uses `grid-template-rows: 0fr → 1fr` for height animation (250ms ease-out). Content fades in with 150ms delay. Panel has `max-height: 70vh` with `overflow-y: auto` for overflow safety. Mega-menu panels: `role="region"` with `aria-label`. On open: focus moves to first link. Tab past last link closes panel and moves focus to next nav item.

- [ ] **Step 5: Wire placeholder content** for each mega-menu (text only, to verify animation)

- [ ] **Step 6: Verify in browser** — hover opens/closes panels, animation smooth, touch works

- [ ] **Step 7: Commit**

```
feat: implement NavbarDesktop with nav items, actions, and mega-menu animation
```

---

## Task 7: MegaMenuInfo (simplest panel)

**Files:**
- Create: `src/components/composed/MegaMenuInfo.tsx`

- [ ] **Step 1: Implement the panel layout**

Left: strategic links with title + description (Showroom, Contacts, Download Catalogues). Separator. Right: corporate links (Heritage, About us, Sicis Village) + professional defilato at bottom with separator.

All text via `useTranslations('nav')`.

- [ ] **Step 2: Wire into NavbarDesktop** — replace placeholder for Info panel

- [ ] **Step 3: Verify in browser**

- [ ] **Step 4: Commit**

```
feat: add MegaMenuInfo composed component
```

---

## Task 8: MegaMenuExplore (columns + video/image)

**Files:**
- Create: `src/components/composed/MegaMenuExplore.tsx`

- [ ] **Step 1: Implement column layout**

5 columns (Mosaico, Vetrite, Living, Tessile, Jewels) with links from `NavbarMenu.explore`. Active column has 2px border-bottom. All columns always visible.

- [ ] **Step 2: Add media area**

Right side, edge-to-edge (touches container border). Initially use placeholder images per category (videos TBD). Crossfade on hover (opacity transition 400ms). Lazy load: only default shown initially, others on first hover. Media area: `aria-hidden="true"` (decorative).

- [ ] **Step 3: Wire into NavbarDesktop**

- [ ] **Step 4: Verify in browser** — columns, hover crossfade, edge-to-edge media

- [ ] **Step 5: Commit**

```
feat: add MegaMenuExplore with columns and media crossfade
```

---

## Task 9: MegaMenuFilterFind (thumbnail columns)

**Files:**
- Create: `src/components/composed/MegaMenuFilterFind.tsx`

- [ ] **Step 1: Add placeholder thumbnail images**

Create `public/images/navbar/` with placeholder images (can use picsum or solid color initially).

- [ ] **Step 2: Implement the 5-column layout**

Each column: thumbnail (80px, rounded) → primary link (bold, uppercase, arrow) → description → separator → secondary links (smaller, muted). Links from `NavbarMenu.filterFind`.

- [ ] **Step 3: Wire into NavbarDesktop**

- [ ] **Step 4: Verify in browser**

- [ ] **Step 5: Commit**

```
feat: add MegaMenuFilterFind with thumbnail columns
```

---

## Task 10: MegaMenuProjects (list + image)

**Files:**
- Create: `src/components/composed/MegaMenuProjects.tsx`

- [ ] **Step 1: Implement descriptive list**

4 items vertical: title (bold, arrow) + description. Text from `NavbarMenu.projects` via translations.

- [ ] **Step 2: Add image area**

Right side edge-to-edge. Crossfade on hover (same pattern as Explore). Placeholder images initially.

- [ ] **Step 3: Wire into NavbarDesktop**

- [ ] **Step 4: Verify in browser**

- [ ] **Step 5: Commit**

```
feat: add MegaMenuProjects with descriptive list and image crossfade
```

---

## Task 11: NavbarMobile — Fullscreen Overlay

**Files:**
- Modify: `src/components/layout/NavbarMobile.tsx`

- [ ] **Step 1: Implement hamburger trigger**

Logo left + hamburger button right. Opens fullscreen overlay.

- [ ] **Step 2: Implement fullscreen overlay**

Fixed, dark background (`#111`), fade-in animation. Logo (white) + close button at top. Large menu items (28px, weight 300) stacked vertically with stagger animation.

- [ ] **Step 3: Implement sub-navigation**

Items with children show arrow (→). Tap: push transition (current list slides left, sub-items slide in from right, 200ms ease). Back button (← label) at top of sub-level to return to parent. Only one level deep at a time (replaces, does not expand). Sub-level uses smaller typography (20px). Close button: `aria-label="Close menu"`.

- [ ] **Step 4: Add language switcher at bottom**

Row of locale codes, current highlighted, fixed at bottom of overlay.

- [ ] **Step 5: Verify on mobile viewport** — open/close, sub-nav push, language switch

- [ ] **Step 6: Commit**

```
feat: implement NavbarMobile with fullscreen overlay and sub-navigation
```

---

## Task 12: Integration + Cleanup

**Files:**
- Modify: `src/app/[locale]/layout.tsx`
- Legacy files: `src/components_legacy/Header.tsx`, `MegaMenu.tsx`, `LanguageSwitcher.tsx`

- [ ] **Step 1: Final layout integration**

Ensure `Navbar` receives correct props. Verify `mapMenuToNavbar` is called server-side in layout. Check padding-top on main content.

- [ ] **Step 2: Test all mega-menus** on real pages with Drupal data

- [ ] **Step 3: Test mobile overlay** on real pages

- [ ] **Step 4: Test dark mode** — glassmorphism, mega-menu panels, mobile overlay

- [ ] **Step 5: Test all 6 locales** — translations, language switching with path resolution

- [ ] **Step 6: Test accessibility** — keyboard navigation (Tab through mega-menu, Escape closes), focus management (first link focused on open), aria attributes, screen reader announcement

- [ ] **Step 7: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 8: Remove legacy Header import from layout** (keep legacy files for reference, don't delete yet)

- [ ] **Step 9: Commit**

```
feat: integrate new Navbar, remove legacy Header from layout
```

---

## Task 13: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update Current State section**

Add: Navbar fully migrated to design system (floating glassmorphism, 4 mega-menus, mobile fullscreen overlay). Legacy Header/MegaMenu/LanguageSwitcher no longer used in layout.

- [ ] **Step 2: Update Component sections**

Add layout components directory. List new composed components.

- [ ] **Step 3: Commit**

```
docs: update CLAUDE.md with navbar migration status
```
