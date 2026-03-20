"use client"

import { cn } from "@/lib/utils"

interface ColorSwatchFilterProps {
  options: {
    slug: string
    label: string
    imageUrl?: string | null
    cssColor?: string | null
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
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const isActive = activeValue === option.slug
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
          <div key={option.slug} className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => onChange(option.slug)}
              className={cn(
                "size-8 rounded-full border border-border transition-shadow",
                !option.imageUrl && !option.cssColor && "bg-muted",
                isActive && "ring-2 ring-primary ring-offset-2"
              )}
              style={backgroundStyle}
              aria-label={option.label}
              title={option.label}
            />
            <span className="max-w-8 truncate text-center text-xs text-muted-foreground">
              {option.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
