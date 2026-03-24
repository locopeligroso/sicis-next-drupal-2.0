import Link from 'next/link'
import { Typography } from '@/components/composed/Typography'
import { cn } from '@/lib/utils'

interface CollectionPopoverItem {
  slug: string
  label: string
  imageUrl?: string | null
  cssColor?: string | null
  href: string
  isActive?: boolean
}

interface CollectionPopoverContentProps {
  items: CollectionPopoverItem[]
  /** 'list' = vertical list with thumbnails (collections), 'swatches' = grid of color circles */
  mode: 'list' | 'swatches'
}

export function CollectionPopoverContent({ items, mode }: CollectionPopoverContentProps) {
  if (mode === 'swatches') {
    return (
      <div className="flex flex-wrap gap-2 p-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={item.href}
            className={cn(
              'size-8 shrink-0 rounded-full border border-border transition-shadow',
              item.isActive && 'ring-2 ring-primary ring-offset-2',
            )}
            style={{ backgroundColor: item.cssColor ?? undefined }}
            title={item.label}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5 p-1">
      {items.map((item) => (
        <Link
          key={item.slug}
          href={item.href}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted',
            item.isActive && 'bg-accent font-semibold',
          )}
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.label}
              className="size-7 shrink-0 rounded object-cover"
            />
          ) : (
            <span className="size-7 shrink-0 rounded bg-muted" />
          )}
          <Typography textRole="body-sm" as="span">{item.label}</Typography>
          {item.isActive && <span className="ml-auto text-muted-foreground">✓</span>}
        </Link>
      ))}
    </div>
  )
}
