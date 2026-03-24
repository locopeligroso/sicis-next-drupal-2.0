import Link from "next/link"
import { getTranslations } from "next-intl/server"

import type {
  FilterOption,
  FilterGroupConfig,
  ListingConfig,
} from "@/domain/filters/registry"
import { CategoryCardGrid } from "@/components/composed/CategoryCardGrid"
import { HubSection } from "@/components/composed/HubSection"
import { PixallHubCard } from "@/components/composed/PixallHubCard"
import { CategoryCard } from "@/components/composed/CategoryCard"
import { Typography } from "@/components/composed/Typography"

interface SpecHubMosaicoProps {
  filterOptions: Record<string, FilterOption[]>
  filters: Record<string, FilterGroupConfig>
  listingConfig: ListingConfig
  basePath: string
  locale: string
}

export async function SpecHubMosaico({
  filterOptions,
  filters,
  listingConfig,
  basePath,
  locale,
}: SpecHubMosaicoProps) {
  const tFilters = await getTranslations("filters")
  const tHub = await getTranslations("hub")

  const colorOptions = filterOptions.color ?? []
  const collectionOptions = filterOptions.collection ?? []
  const colorConfig = filters.color
  const colorPathPrefix = colorConfig?.pathPrefix?.[locale]

  // ── 1. Color swatches ────────────────────────────────────────────────
  const colorSwatchSection = colorOptions.length > 0 ? (
    <section className="flex flex-col gap-4">
      <Typography textRole="overline" as="h2">
        {tFilters("colors")}
      </Typography>
      <div className="flex flex-wrap gap-3">
        {colorOptions.map((color) => {
          const href = colorPathPrefix
            ? `${basePath}/${colorPathPrefix}/${color.slug}`
            : `${basePath}/${color.slug}`
          return (
            <Link
              key={color.slug}
              href={href}
              className="size-11 rounded-full border border-border transition-opacity hover:opacity-80"
              style={{ background: color.cssColor }}
              aria-label={color.label}
              title={color.label}
            />
          )
        })}
      </div>
    </section>
  ) : null

  // ── 2. Collection cards ──────────────────────────────────────────────
  const collectionSection = collectionOptions.length > 0 ? (
    <CategoryCardGrid
      title={tFilters("collections")}
      cards={collectionOptions}
      aspectRatio={listingConfig.categoryCardRatio}
      hasColorSwatch={false}
      buildHref={(slug) => `${basePath}/${slug}`}
    />
  ) : null

  // ── 3. Pixall section ────────────────────────────────────────────────
  const pixallColorSwatches = (filterOptions.color ?? []).slice(0, 8).map((c) => ({
    slug: c.slug,
    cssColor: c.cssColor,
    href: `${basePath}/pixall?color=${c.slug}`,
  }))

  const pixallSection = (
    <PixallHubCard
      title="Pixall"
      description={null}
      imageUrl={null}
      colorSwatches={pixallColorSwatches}
      exploreHref={`${basePath}/pixall`}
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

  // ── 5. Approfondimenti ───────────────────────────────────────────────
  const deepDiveLinks = [
    { slug: "mosaic-installation", title: "Mosaic Installation", subtitle: "Guides and best practices" },
    { slug: "mosaic-maintenance", title: "Mosaic Maintenance", subtitle: "Care instructions" },
    { slug: "mosaic-history", title: "History of Mosaic", subtitle: "From antiquity to today" },
  ]

  const deepDiveSection = (
    <HubSection title={tHub("deepDives")}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {deepDiveLinks.map((link) => (
          <Link
            key={link.slug}
            href="#"
            className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <svg
                className="size-5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {link.title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {link.subtitle}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </HubSection>
  )

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
