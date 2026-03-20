import Link from "next/link"
import { Typography } from "@/components/composed/Typography"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  title: string
  subtitle?: string | null
  imageUrl?: string | null
  href: string
  aspectRatio?: string  // e.g. "1/1", "3/4" — defaults to "1/1"
  className?: string
}

export function ProductCard({
  title,
  subtitle,
  imageUrl,
  href,
  aspectRatio = "1/1",
  className,
}: ProductCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-2 rounded-lg bg-card",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-md bg-muted" style={{ aspectRatio }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 size-full object-cover transition-opacity duration-300 group-hover:opacity-80"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-0.5">
        <Typography textRole="body-sm" className="truncate text-foreground">
          {title}
        </Typography>
        {subtitle ? (
          <Typography textRole="caption" className="truncate text-muted-foreground">
            {subtitle}
          </Typography>
        ) : null}
      </div>
    </Link>
  )
}
