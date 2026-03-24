import type { FilterOption } from "@/domain/filters/registry"
import { CategoryCard } from "@/components/composed/CategoryCard"
import { Typography } from "@/components/composed/Typography"

interface CategoryCardGridProps {
  title: string
  subtitle?: string
  cards: FilterOption[]
  aspectRatio: string
  hasColorSwatch?: boolean
  buildHref: (slug: string) => string
}

export function CategoryCardGrid({
  title,
  subtitle,
  cards,
  aspectRatio,
  hasColorSwatch,
  buildHref,
}: CategoryCardGridProps) {
  return (
    <section className="flex flex-col gap-(--spacing-element)">
      <div className="flex items-baseline justify-between">
        <Typography textRole="h2" as="h2">
          {title}
        </Typography>
        {subtitle && (
          <Typography textRole="overline" as="span" className="text-muted-foreground">
            {subtitle}
          </Typography>
        )}
      </div>
      <hr className="border-t border-border" />

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
            disabled={card.count === 0}
          />
        ))}
      </div>
    </section>
  )
}
