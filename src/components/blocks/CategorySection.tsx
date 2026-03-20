import { getTranslations } from "next-intl/server"

import type {
  CategoryGroupDef,
  FilterGroupConfig,
  FilterOption,
} from "@/domain/filters/registry"
import { CategoryCardGrid } from "@/components/composed/CategoryCardGrid"

interface CategorySectionProps {
  categoryGroups: CategoryGroupDef[]
  filterOptions: Record<string, FilterOption[]>
  filters: Record<string, FilterGroupConfig>
  aspectRatio: string
  basePath: string
  locale: string
}

export async function CategorySection({
  categoryGroups,
  filterOptions,
  filters,
  aspectRatio,
  basePath,
  locale,
}: CategorySectionProps) {
  const t = await getTranslations("filters")

  return (
    <div className="flex flex-col gap-8">
      {categoryGroups.map((group) => {
        const cards = filterOptions[group.filterKey] ?? []
        if (cards.length === 0) return null

        // Strip 'filters.' prefix from labelKey (e.g. 'filters.colors' -> 'colors')
        const translationKey = group.labelKey.replace(/^filters\./, "")

        const filterConfig = filters[group.filterKey]
        const pathPrefix = filterConfig?.pathPrefix?.[locale]

        const buildHref = pathPrefix
          ? (slug: string) => `${basePath}/${pathPrefix}/${slug}`
          : (slug: string) => `${basePath}/${slug}`

        return (
          <CategoryCardGrid
            key={group.filterKey}
            title={t(translationKey)}
            cards={cards}
            aspectRatio={aspectRatio}
            hasColorSwatch={group.hasColorSwatch}
            buildHref={buildHref}
          />
        )
      })}
    </div>
  )
}
