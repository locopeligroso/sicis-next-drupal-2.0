import { getTranslations } from "next-intl/server"

import type {
  FilterGroupConfig,
  ListingConfig,
} from "@/domain/filters/registry"
import type { SecondaryLink } from "@/lib/navbar/types"
import { fetchMosaicColors, fetchMosaicCollections } from "@/lib/api/mosaic-hub"
import { HubSection } from "@/components/composed/HubSection"
import { CategoryCard } from "@/components/composed/CategoryCard"

interface SpecHubMosaicoProps {
  filterOptions: Record<string, unknown[]>
  filters: Record<string, FilterGroupConfig>
  listingConfig: ListingConfig
  basePath: string
  locale: string
  deepDiveLinks?: SecondaryLink[]
}

export async function SpecHubMosaico({
  listingConfig,
  locale,
}: SpecHubMosaicoProps) {
  const tHub = await getTranslations("hub")

  const [colors, collections] = await Promise.all([
    fetchMosaicColors(locale),
    fetchMosaicCollections(locale),
  ])

  return (
    <div className="flex flex-col gap-(--spacing-section)">
      {/* ── Listing 1: Colori (from mosaico_colori view) ──────────────── */}
      {colors.length > 0 && (
        <HubSection title={tHub("exploreByColor")}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {colors.map((color) => (
              <CategoryCard
                key={color.name}
                title={color.name}
                imageUrl={color.imageUrl}
                href={color.href}
                aspectRatio={listingConfig.categoryCardRatio}
                hasColorSwatch
              />
            ))}
          </div>
        </HubSection>
      )}

      {/* ── Listing 2: Collezioni (from mosaico_collezioni view) ──────── */}
      {collections.length > 0 && (
        <HubSection title={tHub("exploreByCollection")}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {collections.map((collection) => (
              <CategoryCard
                key={collection.name}
                title={collection.name}
                imageUrl={collection.imageUrl}
                href={collection.href}
                aspectRatio={listingConfig.categoryCardRatio}
              />
            ))}
          </div>
        </HubSection>
      )}
    </div>
  )
}
