# SpecHubMosaico Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `SpecHubMosaico` to show colors and collections side-by-side on desktop, with collections as a compact list instead of large cards. Mobile uses a `Collapsible` for collections.

**Architecture:** Modify the single Block file `SpecHubMosaico.tsx`. Replace the stacked vertical layout with a responsive grid. Remove `CategoryCard` import, add `Collapsible` primitives. No new Composed components — collection list items are inline markup.

**Tech Stack:** React 19, Next.js 16, Tailwind 4, shadcn/ui (base-vega), next-intl, next/image

---

## File Structure

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/components/blocks/SpecHubMosaico.tsx` | Layout change: side-by-side + mobile Collapsible |
| Modify | `CHANGELOG.md` | Document the change |

---

### Task 1: Rewrite SpecHubMosaico layout

**Files:**
- Modify: `src/components/blocks/SpecHubMosaico.tsx`

- [ ] **Step 1: Read the current file to confirm state**

Read `src/components/blocks/SpecHubMosaico.tsx` in full.

- [ ] **Step 2: Rewrite the file**

Replace the entire contents of `src/components/blocks/SpecHubMosaico.tsx` with:

```tsx
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import type {
  FilterGroupConfig,
  ListingConfig,
} from "@/domain/filters/registry"
import type { SecondaryLink } from "@/lib/navbar/types"
import {
  fetchMosaicColors,
  fetchMosaicCollections,
} from "@/lib/api/mosaic-hub"
import {
  fetchVetriteColors,
  fetchVetriteCollections,
} from "@/lib/api/vetrite-hub"
import { HubSection } from "@/components/composed/HubSection"
import { ColorSwatchLink } from "@/components/composed/ColorSwatchLink"
import { Typography } from "@/components/composed/Typography"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"

interface SpecHubMosaicoProps {
  filterOptions: Record<string, unknown[]>
  filters: Record<string, FilterGroupConfig>
  listingConfig: ListingConfig
  basePath: string
  locale: string
  productType: string
  deepDiveLinks?: SecondaryLink[]
}

export async function SpecHubMosaico({
  locale,
  productType,
}: SpecHubMosaicoProps) {
  const tHub = await getTranslations("hub")

  const [colors, rawCollections] = await Promise.all(
    productType === "prodotto_vetrite"
      ? [fetchVetriteColors(locale), fetchVetriteCollections(locale)]
      : [fetchMosaicColors(locale), fetchMosaicCollections(locale)],
  )

  const collections = rawCollections.filter(
    (c) => !c.name.includes(" – ") && !c.name.includes(" - "),
  )

  const collectionList = (
    <div className="flex flex-col gap-1">
      {collections.map((collection) => (
        <Link
          key={collection.name}
          href={collection.href}
          className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
        >
          {collection.imageUrl ? (
            <Image
              src={collection.imageUrl}
              alt={collection.name}
              width={32}
              height={32}
              className="size-8 shrink-0 rounded-sm object-cover"
            />
          ) : (
            <span className="size-8 shrink-0 rounded-sm bg-muted" />
          )}
          <Typography textRole="body-sm" as="span">
            {collection.name}
          </Typography>
        </Link>
      ))}
    </div>
  )

  return (
    <div className="max-w-main mx-auto px-(--spacing-page) flex flex-col gap-(--spacing-section)">
      {/* ── Desktop: side-by-side ──────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_280px] lg:gap-(--spacing-content)">
        {/* Colors — main area */}
        {colors.length > 0 && (
          <HubSection title={tHub("exploreByColor")}>
            <div className="flex flex-wrap gap-4">
              {colors.map((color) => (
                <ColorSwatchLink
                  key={color.name}
                  label={color.name}
                  imageUrl={color.imageUrl}
                  href={color.href}
                />
              ))}
            </div>
          </HubSection>
        )}

        {/* Collections — compact sidebar */}
        {collections.length > 0 && (
          <HubSection title={tHub("exploreByCollection")}>
            {collectionList}
          </HubSection>
        )}
      </div>

      {/* ── Mobile: stacked with Collapsible ──────────────────────────── */}
      <div className="flex flex-col gap-(--spacing-section) lg:hidden">
        {/* Colors — full width */}
        {colors.length > 0 && (
          <HubSection title={tHub("exploreByColor")}>
            <div className="flex flex-wrap gap-4">
              {colors.map((color) => (
                <ColorSwatchLink
                  key={color.name}
                  label={color.name}
                  imageUrl={color.imageUrl}
                  href={color.href}
                />
              ))}
            </div>
          </HubSection>
        )}

        {/* Collections — collapsible */}
        {collections.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center gap-2 py-2 cursor-pointer transition-colors hover:text-foreground">
              <Typography textRole="overline" as="span">
                {tHub("exploreByCollection")}
              </Typography>
              <ChevronRight className="size-4 text-muted-foreground transition-transform data-[panel-open]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              {collectionList}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  )
}
```

Key changes from original:
- Removed `CategoryCard` import
- Added `Image`, `Link`, `ChevronRight`, `Typography`, `Collapsible*` imports
- Desktop: `grid-cols-[1fr_280px]` side-by-side layout with `hidden lg:grid`
- Mobile: stacked with `Collapsible` for collections, `lg:hidden`
- Collection items: inline `<Link>` with `next/image` thumbnail 32px + `Typography body-sm`
- `collectionList` variable shared between desktop and mobile to avoid duplication
- `data-[panel-open]:rotate-90` on chevron for rotation when Collapsible opens (base-ui exposes `data-panel-open` on the trigger's parent)

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v resend`
Expected: no errors

- [ ] **Step 4: Visual verification**

Open in browser:
- `/it/mosaico` — verify colors side-by-side with compact collection list on desktop
- `/it/lastre-vetro-vetrite` — same layout (uses same component)
- Resize to mobile — verify colors full width, collections in closed Collapsible
- Click Collapsible trigger — verify it opens and shows collection list
- Click a collection link — verify navigation works

- [ ] **Step 5: Commit**

```bash
git add src/components/blocks/SpecHubMosaico.tsx
git commit -m "feat: redesign SpecHubMosaico — side-by-side colors + compact collections"
```

---

### Task 2: Update CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add entry under today's date**

Add after existing 2026-04-02 entries:

```markdown
#### SpecHubMosaico redesign — side-by-side colors + compact collections

- Colori e collezioni affiancati su desktop (grid 75%/25%) invece che impilati verticalmente.
- Collezioni da CategoryCard grandi a lista compatta (thumbnail 32px + label), stile sidebar.
- Mobile: colori full width, collezioni in Collapsible chiuso di default.
- Applicato a mosaico e vetrite (entrambi usano SpecHubMosaico).
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add SpecHubMosaico redesign to CHANGELOG"
```
