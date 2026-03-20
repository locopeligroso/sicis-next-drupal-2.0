"use client"

import { cn } from "@/lib/utils"

interface ImageListFilterProps {
  options: {
    slug: string
    label: string
    imageUrl?: string | null
    count?: number
  }[]
  activeValue?: string
  onChange: (slug: string) => void
}

export function ImageListFilter({
  options,
  activeValue,
  onChange,
}: ImageListFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      {options.map((option) => {
        const isActive = activeValue === option.slug
        const isDisabled = !isActive && option.count === 0

        return (
          <button
            key={option.slug}
            type="button"
            onClick={() => !isDisabled && onChange(option.slug)}
            disabled={isDisabled}
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors",
              isActive ? "bg-accent" : isDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"
            )}
          >
            {option.imageUrl ? (
              <img
                src={option.imageUrl}
                alt={option.label}
                className={cn("size-8 shrink-0 rounded-sm object-cover", isDisabled && "grayscale")}
              />
            ) : (
              <span className="size-8 shrink-0 rounded-sm bg-muted" />
            )}
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
