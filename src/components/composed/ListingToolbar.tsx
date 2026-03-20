'use client'

import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Typography } from '@/components/composed/Typography'

import type { SortOptionDef } from '@/domain/filters/registry'

interface ListingToolbarProps {
  totalCount: number
  sortOptions: SortOptionDef[]
  currentSort: string
  onSortChange: (value: string) => void
}

export function ListingToolbar({
  totalCount,
  sortOptions,
  currentSort,
  onSortChange,
}: ListingToolbarProps) {
  const tListing = useTranslations('listing')
  const tSort = useTranslations('sort')

  return (
    <div className="flex items-center justify-between">
      <Typography textRole="caption" className="text-muted-foreground">
        {tListing('productCount', { count: totalCount })}
      </Typography>

      <Select
        value={currentSort}
        onValueChange={(value) => {
          if (value) onSortChange(value)
        }}
      >
        <SelectTrigger className="w-auto min-w-[140px]">
          <SelectValue placeholder={tSort('label')} />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => {
            const value = `${option.field}:${option.direction}`
            // labelKey is "sort.name", "sort.collection", etc.
            const key = option.labelKey.split('.')[1] ?? option.labelKey
            return (
              <SelectItem key={value} value={value}>
                {tSort(key)}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
