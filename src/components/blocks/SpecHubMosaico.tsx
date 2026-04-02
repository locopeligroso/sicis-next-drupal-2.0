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
import { Separator } from "@/components/ui/separator"
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
    <div className="grid grid-cols-2 gap-2">
      {collections.map((collection) => (
        <Link
          key={collection.name}
          href={collection.href}
          className="flex items-center gap-3 rounded-lg border border-border p-2 transition-colors hover:bg-muted"
        >
          {collection.imageUrl ? (
            <Image
              src={collection.imageUrl}
              alt={collection.name}
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-sm object-cover"
            />
          ) : (
            <span className="size-12 shrink-0 rounded-sm bg-muted" />
          )}
          <Typography textRole="body-sm" as="span" className="line-clamp-2">
            {collection.name}
          </Typography>
        </Link>
      ))}
    </div>
  )

  return (
    <div className="max-w-main mx-auto px-(--spacing-page) flex flex-col gap-(--spacing-section)">
      {/* ── Desktop: side-by-side ──────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[3fr_auto_2fr] lg:gap-(--spacing-content)">
        {/* Colors — main area */}
        {colors.length > 0 && (
          <HubSection title={tHub("exploreByColor")} titleRole="overline">
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

        <Separator orientation="vertical" />

        {/* Collections — compact sidebar */}
        {collections.length > 0 && (
          <HubSection title={tHub("exploreByCollection")} titleRole="overline">
            {collectionList}
          </HubSection>
        )}
      </div>

      {/* ── Mobile: stacked with Collapsible ──────────────────────────── */}
      <div className="flex flex-col gap-(--spacing-section) lg:hidden">
        {/* Colors — full width */}
        {colors.length > 0 && (
          <HubSection title={tHub("exploreByColor")} titleRole="overline">
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
