import Image from 'next/image';
import Link from 'next/link';
import { Typography } from '@/components/composed/Typography';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  title: string;
  subtitle?: string | null;
  image?: { url: string; width: number | null; height: number | null } | null;
  href: string;
  aspectRatio?: string; // e.g. "1/1", "3/4" — defaults to "1/1"
  imageFit?: 'cover' | 'contain';
  className?: string;
}

export function ProductCard({
  title,
  subtitle,
  image,
  href,
  aspectRatio = '1/1',
  imageFit = 'cover',
  className,
}: ProductCardProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn('group flex flex-col gap-2 rounded-lg', className)}
    >
      <div
        className="relative overflow-hidden rounded-md bg-muted"
        style={{ aspectRatio }}
      >
        {image?.url ? (
          <Image
            src={image.url}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              'transition-opacity duration-300 group-hover:opacity-80',
              imageFit === 'contain' ? 'object-contain p-4' : 'object-cover',
            )}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-0.5">
        <Typography textRole="body-sm" className="truncate text-foreground">
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            textRole="caption"
            className="truncate text-muted-foreground"
          >
            {subtitle}
          </Typography>
        ) : null}
      </div>
    </Link>
  );
}
