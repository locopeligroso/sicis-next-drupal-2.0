import Link from 'next/link';

import { cn } from '@/lib/utils';

export interface TypologyNavItem {
  slug: string;
  label: string;
  imageUrl?: string | null;
  href: string;
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
