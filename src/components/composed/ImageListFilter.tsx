'use client';

import Image from 'next/image';
import { Check, X } from 'lucide-react';
import { Typography } from '@/components/composed/Typography';
import { cn } from '@/lib/utils';

interface ImageListFilterProps {
  options: {
    slug: string;
    label: string;
    imageUrl?: string | null;
    count?: number;
    baseCount?: number;
  }[];
  activeValue?: string;
  onChange: (slug: string) => void;
}

export function ImageListFilter({
  options,
  activeValue,
  onChange,
}: ImageListFilterProps) {
  const visible = options.filter((o) => {
    // If count is not provided (e.g. category nav lists), always show the option.
    // Count filtering only applies when product counts are available.
    const base = o.baseCount ?? o.count;
    return base == null || base > 0 || activeValue === o.slug;
  });

  return (
    <div className="flex flex-col gap-1">
      {visible.map((option) => {
        const isActive = activeValue === option.slug;
        const isZeroCount =
          !isActive &&
          (option.count === 0 || option.baseCount === 0) &&
          (option.count != null || option.baseCount != null);

        return (
          <div key={option.slug} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange(option.slug)}
              disabled={isZeroCount}
              aria-disabled={isZeroCount}
              className={cn(
                'flex flex-1 items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted',
                isActive && 'bg-muted ring-2 ring-primary',
                isZeroCount && 'opacity-40 pointer-events-none',
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
              <Typography textRole="body-sm" as="span">
                {option.label}
              </Typography>
              {isActive && <Check className="ml-auto size-4 text-primary" />}
            </button>
            {isActive && (
              <button
                type="button"
                onClick={() => onChange(option.slug)}
                className="shrink-0 cursor-pointer rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={`Remove ${option.label}`}
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
