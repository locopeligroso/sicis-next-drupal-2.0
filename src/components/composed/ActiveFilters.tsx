"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ActiveFiltersProps {
  filters: { key: string; value: string; label: string }[]
  onRemove: (key: string, value: string) => void
  onClearAll: () => void
}

export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
}: ActiveFiltersProps) {
  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <Badge key={`${filter.key}-${filter.value}`} variant="secondary">
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
        Clear all
      </Button>
    </div>
  )
}
