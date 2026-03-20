"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

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
      {options.map((option) => {
        const isActive = activeValues.includes(option.slug)
        const isDisabled = !isActive && option.count === 0

        return (
          <div key={option.slug} className={cn("flex items-center gap-2", isDisabled && "opacity-40")}>
            <Checkbox
              id={`filter-${option.slug}`}
              checked={isActive}
              onCheckedChange={() => !isDisabled && onChange(option.slug)}
              disabled={isDisabled}
            />
            <Label
              htmlFor={`filter-${option.slug}`}
              className={isDisabled ? "cursor-not-allowed" : "cursor-pointer"}
            >
              {option.label}
              {option.count != null && (
                <span className="text-muted-foreground">
                  {" "}({option.count})
                </span>
              )}
            </Label>
          </div>
        )
      })}
    </div>
  )
}
