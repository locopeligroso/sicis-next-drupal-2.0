import Link from "next/link"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Typography } from "@/components/composed/Typography"
import { cn } from "@/lib/utils"

interface CategoryCardProps {
  title: string
  imageUrl?: string | null
  cssColor?: string | null
  href: string
  aspectRatio: string
  imageFit?: "cover" | "contain"
  hasColorSwatch?: boolean
  disabled?: boolean
  className?: string
}

function parseAspectRatio(ratio: string): number {
  const [w, h] = ratio.split("/").map(Number)
  return w && h ? w / h : 1
}

export function CategoryCard({
  title,
  imageUrl,
  cssColor,
  href,
  aspectRatio,
  imageFit = "cover",
  hasColorSwatch = false,
  disabled = false,
  className,
}: CategoryCardProps) {
  const ratio = parseAspectRatio(aspectRatio)

  const content = (
    <>
      <AspectRatio ratio={ratio} className={cn("overflow-hidden rounded-md bg-muted", disabled && "grayscale")}>
        {hasColorSwatch ? (
          <div className="flex size-full items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="size-16 rounded-full object-cover border border-border"
              />
            ) : cssColor ? (
              <span
                className="size-16 rounded-full border border-border"
                style={{ background: cssColor }}
              />
            ) : null}
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className={cn(
              "transition-transform duration-300 group-hover:scale-105",
              imageFit === "contain"
                ? "absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] object-contain"
                : "size-full object-cover"
            )}
          />
        ) : null}
      </AspectRatio>

      <Typography textRole="body-sm" className="truncate text-foreground">{title}</Typography>
    </>
  )

  if (disabled) {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 opacity-40 cursor-not-allowed",
          className,
        )}
        aria-disabled="true"
      >
        {content}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-2 transition-opacity hover:opacity-80",
        className,
      )}
    >
      {content}
    </Link>
  )
}
