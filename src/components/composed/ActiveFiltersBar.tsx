"use client"

import { useFilterSync } from "@/hooks/use-filter-sync"
import { ActiveFilters } from "@/components/composed/ActiveFilters"
import type { ActiveFilter } from "@/domain/filters/registry"

interface ActiveFiltersBarProps {
  activeFilters: ActiveFilter[]
  basePath: string
  locale: string
  primaryKey?: string
}

/** Client wrapper: renders active filter chips with URL sync. */
export function ActiveFiltersBar({
  activeFilters,
  basePath,
  locale,
  primaryKey,
}: ActiveFiltersBarProps) {
  const { clearFilter } = useFilterSync({
    basePath,
    locale,
    activeFilters,
  })

  return (
    <ActiveFilters
      filters={activeFilters}
      onRemove={(key) => clearFilter(key)}
      primaryKey={primaryKey}
    />
  )
}
