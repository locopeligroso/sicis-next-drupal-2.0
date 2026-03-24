"use client"

import { Check, X } from "lucide-react"
import { Typography } from "@/components/composed/Typography"
import { cn } from "@/lib/utils"

interface CheckboxFilterProps {
  options: { slug: string; label: string; count?: number; baseCount?: number }[]
  activeValues: string[]
  onChange: (slug: string) => void
}

export function CheckboxFilter({
  options,
  activeValues,
  onChange,
}: CheckboxFilterProps) {
  const visible = options.filter((o) => {
    const base = o.baseCount ?? o.count ?? 0
    return base > 0 || activeValues.includes(o.slug)
  })

  if (visible.length <= 1) return null

  return (
    <div className="flex flex-col gap-0.5">
      {visible.map((option) => {
        const isActive = activeValues.includes(option.slug)

        return (
          <div key={option.slug} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange(option.slug)}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left cursor-pointer transition-colors hover:bg-muted",
                isActive && "bg-muted ring-1 ring-border",
              )}
            >
              <Typography textRole="body-sm" as="span">
                {option.label}
              </Typography>
              {option.count != null && (
                <Typography textRole="caption" as="span" className="text-muted-foreground">
                  ({option.count})
                </Typography>
              )}
              {isActive && <Check className="ml-auto size-4 text-muted-foreground" />}
            </button>
            {isActive && (
              <button
                type="button"
                onClick={() => onChange(option.slug)}
                className="shrink-0 cursor-pointer rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={`Remove ${option.label}`}
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
