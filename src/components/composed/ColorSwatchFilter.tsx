"use client"

import { X } from "lucide-react"
import { Typography } from "@/components/composed/Typography"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ColorSwatchFilterProps {
  options: {
    slug: string
    label: string
    imageUrl?: string | null
    cssColor?: string | null
    count?: number
    baseCount?: number
  }[]
  activeValue?: string
  onChange: (slug: string) => void
}

export function ColorSwatchFilter({
  options,
  activeValue,
  onChange,
}: ColorSwatchFilterProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.filter((o) => {
        // Hide if not available in collection (baseCount=0 or count=0 when no P1 filters active)
        const base = o.baseCount ?? o.count ?? 0
        return base > 0 || activeValue === o.slug
      }).map((option) => {
        const isActive = activeValue === option.slug
        const isEmpty = !isActive && option.count === 0

        const backgroundStyle: React.CSSProperties = option.imageUrl
          ? {
              backgroundImage: `url(${option.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : option.cssColor
            ? { backgroundColor: option.cssColor }
            : {}

        return (
          <Tooltip key={option.slug}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => onChange(option.slug)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-md p-1.5 cursor-pointer transition-colors hover:bg-muted",
                    isActive && "bg-accent",
                    isEmpty && "opacity-30",
                  )}
                />
              }
            >
              <span
                className={cn(
                  "relative block size-12 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(128,128,128,0.25),0_0_0_1px_rgba(128,128,128,0.15)]",
                  !option.imageUrl && !option.cssColor && "bg-muted",
                  isActive && "ring-2 ring-primary ring-offset-2",
                )}
                style={backgroundStyle}
              >
                {isActive && (
                  <span className="absolute -top-1 right-[-4px] flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <X className="size-2.5" />
                  </span>
                )}
              </span>
              <Typography textRole="caption" as="span" className="truncate w-full text-center text-muted-foreground">
                {option.label}
              </Typography>
            </TooltipTrigger>
            <TooltipContent>
              {option.label}
              {option.count != null && ` (${option.count})`}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
