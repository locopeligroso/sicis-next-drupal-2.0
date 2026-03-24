import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowUpRight } from "lucide-react"

import type {
  FilterOption,
  FilterGroupConfig,
  ListingConfig,
} from "@/domain/filters/registry"
import type { SecondaryLink } from "@/lib/navbar/types"
import { fetchEntity } from "@/lib/api/entity"
import { fetchFilterOptions } from "@/lib/api/filters"
import { getDrupalImageUrl } from "@/lib/drupal"
import { CategoryCardGrid } from "@/components/composed/CategoryCardGrid"
import { HubSection } from "@/components/composed/HubSection"
import { PixallHubCard } from "@/components/composed/PixallHubCard"
import { CategoryCard } from "@/components/composed/CategoryCard"
import { ColorSwatchLink } from "@/components/composed/ColorSwatchLink"
import { Typography } from "@/components/composed/Typography"

interface SpecHubMosaicoProps {
  filterOptions: Record<string, FilterOption[]>
  filters: Record<string, FilterGroupConfig>
  listingConfig: ListingConfig
  basePath: string
  locale: string
  deepDiveLinks?: SecondaryLink[]
}

export async function SpecHubMosaico({
  filterOptions,
  filters,
  listingConfig,
  basePath,
  locale,
  deepDiveLinks = [],
}: SpecHubMosaicoProps) {
  const tFilters = await getTranslations("filters")
  const tHub = await getTranslations("hub")

  const colorOptions = filterOptions.color ?? []
  const collectionOptions = filterOptions.collection ?? []
  const colorConfig = filters.color
  const colorPathPrefix = colorConfig?.pathPrefix?.[locale]

  // ── 1. Color swatches ────────────────────────────────────────────────
  const colorSwatchSection = colorOptions.length > 0 ? (
    <section className="flex flex-col gap-(--spacing-element)">
      <div className="flex items-baseline justify-between">
        <Typography textRole="h2" as="h2">
          {tHub("exploreByColor")}
        </Typography>
        <Typography textRole="overline" as="span" className="text-muted-foreground">
          {tHub("solidColours")}
        </Typography>
      </div>
      <hr className="border-t border-border" />
      <div className="flex flex-wrap gap-4">
        {colorOptions.map((color) => {
          const href = colorPathPrefix
            ? `${basePath}/${colorPathPrefix}/${color.slug}`
            : `${basePath}/${color.slug}`
          return (
            <ColorSwatchLink
              key={color.slug}
              href={href}
              label={color.label}
              imageUrl={color.imageUrl}
              cssColor={color.cssColor}
            />
          )
        })}
      </div>
    </section>
  ) : null

  // ── 2. Collection cards ──────────────────────────────────────────────
  const collectionSection = collectionOptions.length > 0 ? (
    <CategoryCardGrid
      title={tHub("exploreByCollection")}
      subtitle={tHub("solidColours")}
      cards={collectionOptions}
      aspectRatio={listingConfig.categoryCardRatio}
      hasColorSwatch={false}
      buildHref={(slug) => `${basePath}/${slug}`}
    />
  ) : null

  // ── 3. Pixall section — data from C1 entity + V3 taxonomy ───────────
  const pixallBasePath = `/${locale}/pixall`
  const [pixallEntity, pixallColors] = await Promise.all([
    fetchEntity('/pixall', locale),
    fetchFilterOptions('taxonomy_term--mosaico_colori', locale),
  ])

  const pixallImageUrl = pixallEntity?.data
    ? getDrupalImageUrl(pixallEntity.data.field_immagine)
    : null
  const pixallDescription = pixallEntity?.data?.body
    ? (pixallEntity.data.body as { value?: string })?.value ?? null
    : null

  const pixallColorSwatches = pixallColors.slice(0, 8).map((c) => ({
    slug: c.slug,
    cssColor: c.cssColor,
    href: `${pixallBasePath}?color=${c.slug}`,
  }))

  const pixallSection = (
    <PixallHubCard
      title="Pixall"
      description={pixallDescription}
      imageUrl={pixallImageUrl}
      colorSwatches={pixallColorSwatches}
      exploreHref={pixallBasePath}
      exploreLabel={tHub("explore")}
    />
  )

  // ── 4. Scopri anche ──────────────────────────────────────────────────
  const discoverCards = [
    { slug: "artistic-mosaic", label: "Artistic Mosaic" },
    { slug: "marble-mosaic", label: "Marble Mosaic" },
    { slug: "metal-mosaic", label: "Metal Mosaic" },
  ]

  const discoverSection = (
    <HubSection title={tHub("discoverAlso")}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {discoverCards.map((card) => (
          <CategoryCard
            key={card.slug}
            title={card.label}
            href="#"
            aspectRatio="3/2"
          />
        ))}
      </div>
    </HubSection>
  )

  // ── 5. Approfondimenti (from Filter & Find mega-menu secondary links) ──
  const deepDiveSection = deepDiveLinks.length > 0 ? (
    <HubSection title={tHub("deepDives")}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {deepDiveLinks.map((link) => (
          <Link
            key={link.url}
            href={link.url}
            className="flex items-center gap-3 rounded-lg border border-border p-(--spacing-element) transition-colors hover:bg-accent"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <ArrowUpRight className="size-5 text-muted-foreground" />
            </div>
            <Typography textRole="body-sm" as="span" className="truncate font-medium text-foreground">
              {link.title}
            </Typography>
          </Link>
        ))}
      </div>
    </HubSection>
  ) : null

  return (
    <div className="flex flex-col gap-(--spacing-section)">
      {colorSwatchSection}
      {collectionSection}
      {pixallSection}
      {discoverSection}
      {deepDiveSection}
    </div>
  )
}
