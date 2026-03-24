import Link from 'next/link';

import { Typography } from '@/components/composed/Typography';
import { cn } from '@/lib/utils';

export interface TypologyNavItem {
  slug: string;
  label: string;
  imageUrl?: string | null;
  href: string;
  count?: number;
}

interface TypologyNavProps {
  items: TypologyNavItem[];
  activeSlug?: string;
}

export function TypologyNav({ items, activeSlug }: TypologyNavProps) {
  const sorted = [...items].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <nav className="flex flex-col gap-0.5">
      {sorted.map((item) => {
        const isActive = item.slug === activeSlug;
        const isDisabled = !isActive && item.count === 0;

        if (isDisabled) {
          return (
            <span
              key={item.slug}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm opacity-40 cursor-not-allowed"
              aria-disabled="true"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="size-6 shrink-0 rounded object-cover grayscale"
                />
              ) : (
                <div className="bg-muted size-6 shrink-0 rounded" />
              )}
              <Typography textRole="body-sm" as="span">{item.label}</Typography>
            </span>
          );
        }

        return (
          <Link
            key={item.slug}
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
              isActive
                ? 'bg-accent font-semibold text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="size-6 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="bg-muted size-6 shrink-0 rounded" />
            )}
            <Typography textRole="body-sm" as="span">{item.label}</Typography>
          </Link>
        );
      })}
    </nav>
  );
}
