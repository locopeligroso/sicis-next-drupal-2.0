import { Typography } from '@/components/composed/Typography';
import { GalleryCarousel } from '@/components/composed/GalleryCarousel';
import { cn } from '@/lib/utils';

export interface GenGallerySlide {
  src: string;
  alt: string;
  caption?: string | null;
  width?: number;
  height?: number;
}

export interface GenGalleryProps {
  slides: GenGallerySlide[];
  title?: string | null;
  className?: string;
}

export function GenGallery({
  slides,
  title,
  className,
}: GenGalleryProps) {
  if (slides.length === 0) return null;

  return (
    <section className={cn('flex flex-col gap-(--spacing-content)', className)}>
      <div className="max-w-7xl mx-auto px-(--spacing-page) w-full">
        <Typography textRole="h2" as="h2">
          {title || 'Gallery'}
        </Typography>
      </div>
      <GalleryCarousel slides={slides} />
    </section>
  );
}
