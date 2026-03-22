import { Typography } from '@/components/composed/Typography';
import { GalleryCarousel } from '@/components/composed/GalleryCarousel';
import type { GalleryCarouselSlide } from '@/components/composed/GalleryCarousel';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

export type GenGalleryIntroSlide = GalleryCarouselSlide;

export interface GenGalleryIntroProps {
  title: string;
  bodyHtml: string;
  slides: GenGalleryIntroSlide[];
  overline?: string | null;
  className?: string;
}

export function GenGalleryIntro({
  title,
  bodyHtml,
  slides,
  overline,
  className,
}: GenGalleryIntroProps) {
  if (slides.length === 0) return null;

  return (
    <section className={cn(className)}>
      <GalleryCarousel
        slides={slides}
        slideClassName="w-[85vw] aspect-[3/4] sm:w-[70vw] sm:aspect-square md:w-auto md:aspect-[var(--slide-ratio)] md:h-92 lg:h-128 xl:h-144 2xl:h-156"
        header={
          <div className="flex flex-col gap-(--spacing-element)">
            {overline && (
              <Typography textRole="overline" as="span" className="text-muted-foreground">
                {overline}
              </Typography>
            )}

            <Typography textRole="h1" as="h1" className="max-w-[40ch]">
              {title}
            </Typography>

            <div
              className="max-w-prose text-muted-foreground prose prose-lg"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
            />
          </div>
        }
      />
    </section>
  );
}
