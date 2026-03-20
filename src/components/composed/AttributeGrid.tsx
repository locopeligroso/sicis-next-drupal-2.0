import { Typography } from "@/components/composed/Typography"
import { cn } from "@/lib/utils"

export interface AttributeItem {
  label: string
  value: string
}

interface AttributeGridProps {
  items: AttributeItem[]
  className?: string
}

export function AttributeGrid({ items, className }: AttributeGridProps) {
  if (items.length === 0) return null

  return (
    <div className={cn("flex flex-wrap items-stretch", className)}>
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1 px-6 py-2 border-l border-border">
          <Typography textRole="overline" className="text-muted-foreground">
            {item.label}
          </Typography>
          <Typography textRole="body-md" as="span" className="font-medium whitespace-nowrap">
            {item.value}
          </Typography>
        </div>
      ))}
    </div>
  )
}
