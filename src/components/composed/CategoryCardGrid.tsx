import type { FilterOption } from "@/domain/filters/registry"
import { CategoryCard } from "@/components/composed/CategoryCard"
import { Typography } from "@/components/composed/Typography"

interface CategoryCardGridProps {
  title: string
  cards: FilterOption[]
  aspectRatio: string
  hasColorSwatch?: boolean
  buildHref: (slug: string) => string
}

export function CategoryCardGrid({
  title,
  cards,
  aspectRatio,
  hasColorSwatch,
  buildHref,
}: CategoryCardGridProps) {
  return (
    <section className="flex flex-col gap-4">
      <Typography textRole="overline" as="h2">
        {title}
      </Typography>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {cards.map((card) => (
          <CategoryCard
            key={card.slug}
            title={card.label}
            imageUrl={card.imageUrl}
            cssColor={card.cssColor}
            href={buildHref(card.slug)}
            aspectRatio={aspectRatio}
            hasColorSwatch={hasColorSwatch}
          />
        ))}
      </div>
    </section>
  )
}
