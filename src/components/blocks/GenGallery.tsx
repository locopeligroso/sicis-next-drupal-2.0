import { Typography } from '@/components/composed/Typography';
import { GalleryCarousel } from '@/components/composed/GalleryCarousel';
import type { GalleryCarouselSlide } from '@/components/composed/GalleryCarousel';
import { cn } from '@/lib/utils';

export type GenGallerySlide = GalleryCarouselSlide;

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
    <section className={cn(className)}>
      <GalleryCarousel
        slides={slides}
        slideClassName="w-[85vw] aspect-[3/4] sm:w-[70vw] sm:aspect-square md:w-auto md:aspect-[var(--slide-ratio)] md:h-92 lg:h-128 xl:h-144 2xl:h-156"
        header={
          <Typography textRole="h2" as="h2">
            {title || 'Gallery'}
          </Typography>
        }
      />
    </section>
  );
}
