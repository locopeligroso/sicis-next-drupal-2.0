'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Typography } from '@/components/composed/Typography';
import { ProductCta } from '@/components/composed/ProductCta';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TextileHeroVariant {
  name: string;
  colorCode: string | null;
  colorName: string | null;
  image: { url: string; width: number | null; height: number | null } | null;
  composition: string | null;
}

export interface SpecTextileHeroProps {
  title: string;
  breadcrumb?: React.ReactNode;
  category?: string;
  categoryHref?: string;
  description?: string;
  variants: TextileHeroVariant[];
}

// ── Component ────────────────────────────────────────────────────────────────

export function SpecTextileHero({
  title,
  breadcrumb,
  category,
  categoryHref,
  description,
  variants,
}: SpecTextileHeroProps) {
  const inFlowCtaRef = React.useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = React.useState(false);
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  // Track current slide to sync swatches + variant label
  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  // Sticky mobile CTA observer
  React.useEffect(() => {
    const el = inFlowCtaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry.isIntersecting),
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Aspect-ratio from first variant image (consistent across all variants of same product)
  const firstImg = variants[0]?.image;
  const aspectStyle: React.CSSProperties =
    firstImg?.width && firstImg?.height
      ? { aspectRatio: `${firstImg.width} / ${firstImg.height}` }
      : { aspectRatio: '1 / 1' };

  const currentVariant = variants[current];

  const categoryLabel = category && (
    categoryHref ? (
      <Link
        href={categoryHref}
        className="hover:underline decoration-primary-text underline-offset-(--underline-offset)"
      >
        <Typography textRole="subtitle-2" as="span" className="text-primary-text">
          {category}
        </Typography>
      </Link>
    ) : (
      <Typography textRole="subtitle-2" className="text-muted-foreground">
        {category}
      </Typography>
    )
  );

  return (
    <>
      <section className="max-w-main mx-auto px-(--spacing-page) pt-(--spacing-navbar) flex flex-col gap-2">
        {/* Breadcrumb — neutralize PageBreadcrumb's internal max-w container
            to avoid double padding nesting inside the constrained section. */}
        {breadcrumb && (
          <div className="[&>div]:m-0! [&>div]:p-0! [&>div]:max-w-none!">
            {breadcrumb}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-(--spacing-content) md:gap-(--spacing-section)">
          {/* Title + Category — first on mobile */}
          <div className="flex flex-col gap-1 md:hidden">
            <Typography textRole="h1">{title}</Typography>
            {categoryLabel}
          </div>

          {/* Left: Carousel only (image per variant, dynamic aspect-ratio) */}
          <Carousel
            setApi={setApi}
            opts={{ loop: variants.length > 1 }}
            className="w-full"
          >
            <CarouselContent>
              {variants.map((v, i) => (
                <CarouselItem key={i}>
                  <div
                    className="relative w-full overflow-hidden rounded-xl bg-surface-2"
                    style={aspectStyle}
                  >
                    {v.image?.url && (
                      <Image
                        src={v.image.url}
                        alt={v.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        priority={i === 0}
                      />
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Right: Content (incl. variant name + swatches) */}
          <div className="flex flex-col gap-(--spacing-element)">
            {/* Title + Category — shown on md+ */}
            <div className="hidden md:flex flex-col gap-1">
              <Typography textRole="h1">{title}</Typography>
              {categoryLabel}
            </div>

            {/* Variant picker: current name + swatches (only if >1 variant) */}
            {variants.length > 1 && currentVariant && (
              <div className="flex flex-col gap-2">
                <Typography
                  textRole="subtitle-2"
                  className="text-foreground"
                  {...{ 'aria-live': 'polite' }}
                >
                  {currentVariant.name}
                </Typography>
                <ul className="flex flex-wrap gap-2">
                  {variants.map((v, i) => (
                    <li key={i}>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button
                              type="button"
                              onClick={() => api?.scrollTo(i)}
                              aria-label={v.name}
                              aria-current={i === current ? 'true' : undefined}
                              className={cn(
                                'size-8 shrink-0 rounded-md ring-2 ring-offset-2 ring-offset-background transition-all focus-visible:outline-none',
                                i === current
                                  ? 'ring-primary'
                                  : 'ring-border/50 opacity-60 hover:opacity-100 focus-visible:ring-primary focus-visible:opacity-100',
                              )}
                              style={{
                                backgroundColor: v.colorCode ?? 'var(--color-surface-2)',
                              }}
                            />
                          }
                        />
                        <TooltipContent>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold">{v.name}</span>
                            {v.composition && (
                              <span
                                className="text-xs opacity-80 [&_p]:m-0"
                                dangerouslySetInnerHTML={{ __html: v.composition }}
                              />
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description */}
            {description && (
              <div
                className="text-muted-foreground text-base leading-relaxed text-pretty"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}

            {/* CTAs (in-flow) */}
            <div ref={inFlowCtaRef}>
              <ProductCta />
            </div>
          </div>
        </div>
      </section>

      {/* Sticky CTA bar — mobile only, hides when in-flow CTAs are visible */}
      <div
        className={cn(
          'fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-sm border-t px-(--spacing-page) py-3 md:hidden transition-transform duration-300',
          ctaVisible ? 'translate-y-full' : 'translate-y-0',
        )}
      >
        <ProductCta />
      </div>
    </>
  );
}
