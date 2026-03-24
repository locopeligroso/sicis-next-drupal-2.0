"use client"

import { Badge } from "@/components/ui/badge"
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
  primaryKey?: string
}

export function ActiveFilters({
  filters,
  onRemove,
  primaryKey,
}: ActiveFiltersProps) {
  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const isPrimary = filter.key === primaryKey

        return (
          <Badge
            key={`${filter.key}-${filter.value}`}
            variant={isPrimary ? "default" : "secondary"}
          >
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
              className="ml-1 rounded-full outline-none hover:opacity-80 focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={`Remove ${filter.label}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        )
      })}
    </div>
  )
}
