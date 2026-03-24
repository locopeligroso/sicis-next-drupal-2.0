import Link from 'next/link'
import { Check } from 'lucide-react'

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
      <div className="grid grid-cols-4 gap-2 p-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 rounded-md p-1.5 transition-colors hover:bg-muted',
              item.isActive && 'bg-accent',
            )}
          >
            <span
              className={cn(
                'size-8 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(128,128,128,0.25),0_0_0_1px_rgba(128,128,128,0.15)]',
                !item.imageUrl && !item.cssColor && 'bg-muted',
                item.isActive && 'ring-2 ring-primary ring-offset-2',
              )}
              style={
                item.imageUrl
                  ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : item.cssColor
                    ? { backgroundColor: item.cssColor }
                    : undefined
              }
            />
            <Typography textRole="caption" as="span" className="truncate w-full text-center text-muted-foreground">
              {item.label}
            </Typography>
          </Link>
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
            item.isActive && 'bg-accent font-medium',
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
          {item.isActive && <Check className="ml-auto size-4 text-muted-foreground" />}
        </Link>
      ))}
    </div>
  )
}
