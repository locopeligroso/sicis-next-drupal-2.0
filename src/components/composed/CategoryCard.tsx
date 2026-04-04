import Image from 'next/image';
import Link from 'next/link';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Typography } from '@/components/composed/Typography';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  title: string;
  image?: { url: string; width: number | null; height: number | null } | null;
  cssColor?: string | null;
  href: string;
  aspectRatio: string;
  imageFit?: 'cover' | 'contain';
  hasColorSwatch?: boolean;
  disabled?: boolean;
  className?: string;
}

function parseAspectRatio(ratio: string): number {
  const [w, h] = ratio.split('/').map(Number);
  return w && h ? w / h : 1;
}

export function CategoryCard({
  title,
  image,
  cssColor,
  href,
  aspectRatio,
  imageFit = 'cover',
  hasColorSwatch = false,
  disabled = false,
  className,
}: CategoryCardProps) {
  const ratio = parseAspectRatio(aspectRatio);

  const content = (
    <>
      <AspectRatio
        ratio={ratio}
        className={cn(
          'relative overflow-hidden rounded-md bg-muted',
          disabled && 'grayscale',
        )}
      >
        {hasColorSwatch ? (
          <div className="flex size-full items-center justify-center">
            {image?.url ? (
              // Fixed 64px swatch — not fill, explicit dimensions to avoid oversized srcset
              <Image
                src={image.url}
                alt={title}
                width={64}
                height={64}
                sizes="64px"
                className="rounded-full object-cover border border-border"
              />
            ) : cssColor ? (
              <span
                className="size-16 rounded-full border border-border"
                style={{ background: cssColor }}
              />
            ) : null}
          </div>
        ) : image?.url ? (
          <Image
            src={image.url}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              'transition-transform duration-300 group-hover:scale-105',
              imageFit === 'contain' ? 'object-contain p-4' : 'object-cover',
            )}
          />
        ) : null}
      </AspectRatio>

      <Typography textRole="body-sm" className="truncate text-foreground">
        {title}
      </Typography>
    </>
  );

  if (disabled) {
    return (
      <div
        className={cn(
          'flex flex-col gap-2 opacity-40 cursor-not-allowed',
          className,
        )}
        aria-disabled="true"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        'group flex flex-col gap-2 transition-opacity hover:opacity-80',
        className,
      )}
    >
      {content}
    </Link>
  );
}
