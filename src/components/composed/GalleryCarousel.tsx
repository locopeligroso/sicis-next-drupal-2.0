import { Typography } from '@/components/composed/Typography';
import type { GenGallerySlide } from '@/components/blocks/GenGallery';

interface GalleryCarouselProps {
  slides: GenGallerySlide[];
}

// TODO: Replace with Apple-style scroll-snap carousel in next session
export function GalleryCarousel({ slides }: GalleryCarouselProps) {
  return (
    <div className="max-w-7xl mx-auto px-(--spacing-page) w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {slides.map((slide, i) => (
          <div key={i} className="flex flex-col gap-(--spacing-element)">
            <div className="overflow-hidden rounded-lg">
              <img
                src={slide.src}
                alt={slide.alt}
                className="w-full object-cover"
              />
            </div>
            {slide.caption && (
              <Typography textRole="body-sm" as="p" className="text-muted-foreground">
                {slide.caption}
              </Typography>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
