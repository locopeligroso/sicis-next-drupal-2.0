"use client"

import { cn } from "@/lib/utils"

interface ColorSwatchFilterProps {
  options: {
    slug: string
    label: string
    imageUrl?: string | null
    cssColor?: string | null
    count?: number
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

        const isDisabled = !isActive && option.count === 0

        return (
          <button
            key={option.slug}
            type="button"
            onClick={() => !isDisabled && onChange(option.slug)}
            disabled={isDisabled}
            className={cn(
              "size-8 rounded-full border border-border transition-shadow",
              !option.imageUrl && !option.cssColor && "bg-muted",
              isActive && "ring-2 ring-primary ring-offset-2",
              isDisabled && "cursor-not-allowed opacity-40 grayscale"
            )}
            style={backgroundStyle}
            aria-label={option.label}
            title={option.label}
          />
        )
      })}
    </div>
  )
}
