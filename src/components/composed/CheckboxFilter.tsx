"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface CheckboxFilterProps {
  options: { slug: string; label: string; count?: number }[]
  activeValues: string[]
  onChange: (slug: string) => void
}

export function CheckboxFilter({
  options,
  activeValues,
  onChange,
}: CheckboxFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <div key={option.slug} className="flex items-center gap-2">
          <Checkbox
            id={`filter-${option.slug}`}
            checked={activeValues.includes(option.slug)}
            onCheckedChange={() => onChange(option.slug)}
          />
          <Label htmlFor={`filter-${option.slug}`} className="cursor-pointer">
            {option.label}
            {option.count != null && (
              <span className="text-muted-foreground">
                ({option.count})
              </span>
            )}
          </Label>
        </div>
      ))}
    </div>
  )
}
