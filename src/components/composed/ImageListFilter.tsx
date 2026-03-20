"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface ImageListFilterProps {
  options: {
    slug: string
    label: string
    imageUrl?: string | null
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

        return (
          <button
            key={option.slug}
            type="button"
            onClick={() => onChange(option.slug)}
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors",
              isActive ? "bg-accent" : "hover:bg-muted"
            )}
          >
            {option.imageUrl ? (
              <Image
                src={option.imageUrl}
                alt={option.label}
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-sm object-cover"
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
