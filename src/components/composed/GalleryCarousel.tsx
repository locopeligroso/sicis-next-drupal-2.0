'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/composed/Typography';
import { cn } from '@/lib/utils';

export interface GalleryCarouselSlide {
  src: string;
  alt: string;
  caption?: string | null;
  width?: number;
  height?: number;
}

interface GalleryCarouselProps {
  slides: GalleryCarouselSlide[];
  slideClassName?: string;
  className?: string;
  header?: React.ReactNode;
}

export function GalleryCarousel({ slides, slideClassName, className, header }: GalleryCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    return () => el.removeEventListener('scroll', updateArrows);
  }, [updateArrows]);

  function scrollBySlide(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>('[data-gallery-slide]');
    if (!slide) return;
    const gap = parseFloat(getComputedStyle(slide.parentElement!).gap) || 0;
    el.scrollBy({ left: direction * (slide.offsetWidth + gap), behavior: 'smooth' });
  }

  return (
    <div className={cn('relative flex flex-col gap-(--spacing-content)', className)}>
      {/* Header row: title + arrows */}
      {header && (
        <div className="flex items-center justify-between max-w-main mx-auto w-full px-(--spacing-page)">
          {header}
          <div className="flex gap-(--spacing-element)">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollBySlide(-1)}
              disabled={!canScrollLeft}
              aria-label="Previous slide"
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollBySlide(1)}
              disabled={!canScrollRight}
              aria-label="Next slide"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}

      {/* Scroll container */}
      <div
        ref={scrollerRef}
        className="flex overflow-x-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]"
        style={{
          scrollSnapType: 'x mandatory',
          scrollPadding: '0 max(var(--spacing-page), calc((100vw - var(--container-main)) / 2 + var(--spacing-page)))',
        }}
      >
        {/* Track — padding aligns slides to max-w-main container edge */}
        <div
          className="flex gap-(--spacing-element) min-w-fit"
          style={{ padding: '0 max(var(--spacing-page), calc((100vw - var(--container-main)) / 2 + var(--spacing-page)))' }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              data-gallery-slide
              className={cn(
                'shrink-0',
                i === slides.length - 1
                  ? '[scroll-snap-align:start_end]'
                  : 'snap-start',
              )}
            >
              <div
                className={cn('rounded-xl overflow-hidden', slideClassName)}
                style={slide.width && slide.height ? { '--slide-ratio': `${slide.width / slide.height}` } as React.CSSProperties : undefined}
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="size-full object-cover"
                />
              </div>
              {slide.caption && (
                <div className="pt-(--spacing-element)">
                  <Typography textRole="body-sm" as="p" className="text-muted-foreground">
                    {slide.caption}
                  </Typography>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
