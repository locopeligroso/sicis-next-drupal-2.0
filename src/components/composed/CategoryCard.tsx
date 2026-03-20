import Link from "next/link"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { cn } from "@/lib/utils"

interface CategoryCardProps {
  title: string
  imageUrl?: string | null
  cssColor?: string | null
  href: string
  aspectRatio: string
  hasColorSwatch?: boolean
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
  hasColorSwatch = false,
  className,
}: CategoryCardProps) {
  const ratio = parseAspectRatio(aspectRatio)

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-3 rounded-lg bg-card p-3 transition-opacity hover:opacity-80",
        className,
      )}
    >
      <AspectRatio ratio={ratio} className="overflow-hidden rounded-md bg-muted">
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
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
      </AspectRatio>

      <span className="truncate text-sm text-foreground">{title}</span>
    </Link>
  )
}
