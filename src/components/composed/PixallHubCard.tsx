import Link from "next/link"
import { Typography } from "@/components/composed/Typography"
import { cn } from "@/lib/utils"

interface PixallHubCardProps {
  title: string
  description?: string | null
  imageUrl?: string | null
  colorSwatches: { slug: string; cssColor?: string; href: string }[]
  exploreHref: string
  exploreLabel: string
  className?: string
}

export function PixallHubCard({
  title,
  description,
  imageUrl,
  colorSwatches,
  exploreHref,
  exploreLabel,
  className,
}: PixallHubCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-xl border border-border p-4 md:flex-row",
        className,
      )}
    >
      {/* Image column */}
      <div className="w-full shrink-0 md:w-1/2">
        <div className="overflow-hidden rounded-lg bg-muted" style={{ aspectRatio: "4/3" }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="size-full object-cover"
            />
          ) : null}
        </div>
      </div>

      {/* Text column */}
      <div className="flex flex-col justify-center gap-2">
        <Typography textRole="h3">{title}</Typography>

        {description ? (
          <Typography textRole="body-md" className="text-muted-foreground">
            {description}
          </Typography>
        ) : null}

        {colorSwatches.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {colorSwatches.map((swatch) => (
              <Link
                key={swatch.slug}
                href={swatch.href}
                className="size-6 rounded-full border border-border transition-opacity hover:opacity-80"
                style={{ background: swatch.cssColor }}
                aria-label={swatch.slug}
              />
            ))}
          </div>
        ) : null}

        <Link
          href={exploreHref}
          className="mt-2 inline-flex w-fit items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {exploreLabel}
        </Link>
      </div>
    </div>
  )
}
