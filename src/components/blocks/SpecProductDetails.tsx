import { Typography } from "@/components/composed/Typography"
import { AttributeGrid, type AttributeItem } from "@/components/composed/AttributeGrid"
import { SwatchList, type SwatchItem } from "@/components/composed/SwatchList"
import { Badge } from "@/components/ui/badge"

export interface SpecProductDetailsProps {
  performsOn?: string[]
  performsOnLabel?: string
  attributes?: AttributeItem[]
  colors?: SwatchItem[]
  grouts?: SwatchItem[]
  colorsLabel?: string
  groutsLabel?: string
}

export function SpecProductDetails({
  performsOn = [],
  performsOnLabel = "Performs best on",
  attributes = [],
  colors = [],
  grouts = [],
  colorsLabel = "Colors",
  groutsLabel = "Grout",
}: SpecProductDetailsProps) {
  const hasContent = performsOn.length > 0 || attributes.length > 0 || colors.length > 0 || grouts.length > 0
  if (!hasContent) return null

  return (
    <section className="max-w-main mx-auto px-(--spacing-page)">
      <div className="flex flex-col gap-(--spacing-element)">
        {/* Performs best on */}
        {performsOn.length > 0 && (
          <div className="flex flex-col gap-2 border-l-2 border-border pl-4">
            <Typography textRole="overline" className="text-muted-foreground">
              {performsOnLabel}
            </Typography>
            <div className="flex flex-wrap gap-2">
              {performsOn.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Attributes row */}
        {attributes.length > 0 && <AttributeGrid items={attributes} />}

        {/* Swatches */}
        {colors.length > 0 && <SwatchList label={colorsLabel} items={colors} />}
        {grouts.length > 0 && <SwatchList label={groutsLabel} items={grouts} />}
      </div>
    </section>
  )
}
