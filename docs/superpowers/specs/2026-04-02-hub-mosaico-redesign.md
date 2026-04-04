# SpecHubMosaico Redesign — Side-by-Side Colors + Compact Collections

> **Date:** 2026-04-02 | **Status:** Approved

## Problem

The current `SpecHubMosaico` stacks colors and collections vertically as two full-width sections. Collections use large `CategoryCard` components taking significant space despite being less important for navigation. Colors should be the protagonist, with collections as a compact sidebar-style list.

## Decision

Redesign `SpecHubMosaico` to place colors and collections side-by-side on desktop, with colors taking ~75% width and collections rendered as a compact list (~25%). On mobile, collections collapse into a `Collapsible` below the colors.

## Layout

### Desktop (lg+)

```
grid-cols-[1fr_280px] gap-(--spacing-content)

┌────────────────────────────────┬─────────────────┐
│ ESPLORA PER COLORE             │ COLLEZIONI      │
│                                │                 │
│ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤               │ ■ Waterglass    │
│ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤               │ ■ Murano Smalto │
│ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤               │ ■ Blends        │
│                                │ ■ Neocolibrì    │
│                                │ ...             │
└────────────────────────────────┴─────────────────┘
```

### Mobile (< lg)

```
┌────────────────────────────────┐
│ ESPLORA PER COLORE             │
│ ⬤ ⬤ ⬤ ⬤ ⬤                    │
│ ⬤ ⬤ ⬤ ⬤ ⬤                    │
├────────────────────────────────┤
│ ▸ Collezioni    (Collapsible)  │
│   ■ Waterglass                 │
│   ■ Murano Smalto              │
│   ...                          │
└────────────────────────────────┘
```

## Components

### No new Composed components

Everything is handled inside `SpecHubMosaico` (Block layer).

### Reused Composed

- `ColorSwatchLink` — unchanged, for color swatches (`size-20` + tooltip)
- `HubSection` — wraps the "Explore by color" title

### Primitives used

- `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` — mobile accordion for collections
- `Typography` — `overline` for collection section title, `body-sm` for collection item labels

### Removed

- `CategoryCard` — no longer used in this block (still used by `SpecHubArredo`)

## Collection List Item

Inline markup in the Block (not a new Composed — hub-specific, not reusable):

```tsx
<Link
  href={collection.href}
  className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
>
  <Image
    src={collection.imageUrl}
    alt={collection.name}
    width={32}
    height={32}
    className="size-8 shrink-0 rounded-sm object-cover"
  />
  <Typography textRole="body-sm" as="span">
    {collection.name}
  </Typography>
</Link>
```

Style matches `ImageListFilter` sidebar pattern (thumbnail 32px + label).

## Responsive Strategy

Two renderings of the same collection data, one per breakpoint. No JS for responsive toggle.

- **Desktop collection list:** `hidden lg:block` — always visible as sidebar column
- **Mobile Collapsible:** `lg:hidden` — closed by default, trigger shows "Collezioni" with rotating chevron

## Collapsible Details

- Closed by default (`open={false}`)
- Trigger: `Typography overline` + `ChevronRight` icon that rotates 90deg when open
- Content: same collection list as desktop

## Scope

- **Modified:** `src/components/blocks/SpecHubMosaico.tsx` — layout change only
- **Unchanged:** Props interface, data fetching, `SpecHubArredo`, `ProductListingTemplate`, `ColorSwatchLink`
- **No longer imported by this block:** `CategoryCard`

## Verification

- TypeScript compile (`npx tsc --noEmit`)
- Visual check: `/it/mosaico`, `/it/lastre-vetro-vetrite` — both use `SpecHubMosaico`
- Mobile: verify Collapsible opens/closes, collections visible
- Desktop: verify side-by-side layout, collection links navigate correctly
