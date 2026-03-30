import Image from 'next/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  ratio?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function ResponsiveImage({
  src,
  alt,
  ratio = 1,
  className,
  sizes = '100vw',
  priority = false,
}: ResponsiveImageProps) {
  return (
    <AspectRatio
      ratio={ratio}
      className={cn('overflow-hidden rounded-lg bg-muted', className)}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        priority={priority}
      />
    </AspectRatio>
  );
}
