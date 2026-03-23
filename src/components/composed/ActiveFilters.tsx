"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export interface ActiveFilterDisplay {
  key: string
  value: string
  label: string
  swatchColor?: string
}

interface ActiveFiltersProps {
  filters: ActiveFilterDisplay[]
  onRemove: (key: string, value: string) => void
  onClearAll: () => void
}

export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
}: ActiveFiltersProps) {
  const t = useTranslations("filters")

  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <Badge key={`${filter.key}-${filter.value}`} variant="secondary">
          {filter.swatchColor && (
            <span
              className="size-3 rounded-full border border-border"
              style={{ background: filter.swatchColor }}
            />
          )}
          {filter.label}
          <button
            type="button"
            onClick={() => onRemove(filter.key, filter.value)}
            className="ml-1 rounded-full outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={`Remove ${filter.label}`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll}>
        {t("clearAll")}
      </Button>
    </div>
  )
}
