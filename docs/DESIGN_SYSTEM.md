# Components — Design System

> Extracted from CLAUDE.md. See CLAUDE.md for project overview.

## Composed (`src/components/composed/`)

Scan with: `node /Users/nicolagasco/.claude/skills/ds/scripts/inventory.js composed`

**Non-obvious components:**

- **VimeoPlayer** — Client component wrapping `@vimeo/player` SDK. Poster image overlay; on play, Vimeo iframe with custom controls. Native controls disabled (`controls=0`).
- **GalleryCarousel** — Horizontal scroll carousel with snap alignment, prev/next arrows, optional `header` slot. Used by `GenGallery` and `GenGalleryIntro`.
- **DocumentCard** — Auto-detects label+icon from href URL pattern (PDF/video/catalog/fallback). Supports `vertical` and `horizontal` layout variants.
- **MobileFilterTrigger** — Fixed FAB (below `md`) opening Sheet drawer with filter tree. Shows active filter count + result count.
- **GenTestoImmagineBody** — Shared text column used inside `GenTestoImmagine` and `GenTestoImmagineBig`.

---

## Blocks (`src/components/blocks/`)

**Naming convention:**

- `Spec*` — Product and listing page blocks, tightly coupled to specific data shapes (product fields, filter registries). Used directly in templates.
- `Gen*` — General-purpose paragraph blocks driven by Drupal `paragraph--blocco_*` data. Wired through `ParagraphResolver` and reusable across all content types.

Scan with: `node /Users/nicolagasco/.claude/skills/ds/scripts/inventory.js blocks`

**Gen blocks built (12) — `blocco_*` → `Gen*` mapping:**

| Drupal paragraph type                   | Gen block              |
| --------------------------------------- | ---------------------- |
| `paragraph--blocco_intro`               | `GenIntro`             |
| `paragraph--blocco_quote`               | `GenQuote`             |
| `paragraph--blocco_video`               | `GenVideo`             |
| `paragraph--blocco_testo_immagine`      | `GenTestoImmagine`     |
| `paragraph--blocco_testo_immagine_big`  | `GenTestoImmagineBig`  |
| `paragraph--blocco_testo_immagine_blog` | `GenTestoImmagineBlog` |
| `paragraph--blocco_gallery`             | `GenGallery`           |
| `paragraph--blocco_gallery_intro`       | `GenGalleryIntro`      |
| `paragraph--blocco_documenti`           | `GenDocumenti`         |
| `paragraph--blocco_a`                   | `GenA`                 |
| `paragraph--blocco_b`                   | `GenB`                 |
| `paragraph--blocco_c`                   | `GenC`                 |

**Gen blocks remaining to build** (still using legacy `Blocco*` in LEGACY_MAP):

`GenCorrelati`, `GenNewsletter`, `GenFormBlog`, `GenSliderHome`, `GenAnni`, `GenTutorial`

**Deleted legacy Blocco\* files** (replaced by Gen\* equivalents): BloccoIntro, BloccoQuote, BloccoVideo, BloccoGallery, BloccoTestoImmagine, BloccoTestoImmagineBig, BloccoTestoImmagineBlog, BloccoGalleryIntro, BloccoDocumenti

---

### ParagraphResolver

**Location:** `src/components_legacy/blocks_legacy/ParagraphResolver.tsx`

Async server component. Maps incoming `paragraph--{type}` data to either a DS `Gen*` block or a legacy `Blocco*` fallback component.

**Dispatch flow:**

1. Checks if the paragraph type requires a secondary Drupal fetch via `needsSecondaryFetch(type)` (used for paragraphs with nested children, e.g. gallery slides).
2. If yes, calls `fetchParagraph()` to hydrate nested data before rendering.
3. Attempts Gen adapter functions (`adaptGenIntro`, `adaptGenVideo`, etc.) in order of type match.
4. Falls back to `LEGACY_MAP[type]` for types not yet migrated.
5. In development, renders a yellow dashed warning box for unknown paragraph types; in production, returns `null`.

**Templates using ParagraphResolver:**
Page, LandingPage, Articolo, News, Tutorial, Ambiente, Progetto, CategoriaBlog, Tag, ProdottoArredo, Categoria

**Current wiring status:** Gen adapters active for all 12 built Gen blocks; BloccoSliderHome, BloccoCorrelati, BloccoNewsletter, BloccoFormBlog, BloccoAnni, BloccoTutorial remain in `LEGACY_MAP`.

---

## Primitives (`src/components/ui/`)

shadcn/ui primitives (base-vega preset, base-ui). NEVER modify directly.

---

## Layout (`src/components/layout/`)

| Component       | Purpose                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `Navbar`        | Client wrapper — manages `openMenu` state and scroll-direction visibility, renders `NavbarDesktop` and `NavbarMobile` |
| `NavbarDesktop` | Full desktop navigation bar with mega-menu panels                                                                     |
| `NavbarMobile`  | Mobile hamburger navigation with sheet drawer                                                                         |

---

## Legacy (`src/components_legacy/`)

Being replaced progressively. Check directory contents for current state.

Notes:

- Header, MegaMenu, LanguageSwitcher superseded by `src/components/layout/` — kept for reference only
- Footer still actively used (not yet migrated)
- DrupalImage still used in all legacy product templates
- `blocks_legacy/`: `Blocco*` paragraph components + `ParagraphResolver`. Migration status tracked in ParagraphResolver's `LEGACY_MAP` — source of truth for what's still legacy
