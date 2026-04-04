'use client';

import * as React from 'react';
import { Typography } from '@/components/composed/Typography';
import Image from 'next/image';
import { ProductCta } from '@/components/composed/ProductCta';
import { cn } from '@/lib/utils';

export interface SpecArredoHeroProps {
  title: string;
  breadcrumb?: React.ReactNode;
  category?: string;
  categoryHref?: string;
  description?: string;
  imageSrc?: string | null;
  imageAlt?: string;
  priceEu?: string | null;
  priceUsa?: string | null;
  isUs?: boolean;
}

export function SpecArredoHero({
  title,
  breadcrumb,
  category,
  categoryHref,
  description,
  imageSrc,
  imageAlt,
  priceEu,
  priceUsa,
  isUs = false,
}: SpecArredoHeroProps) {
  const inFlowCtaRef = React.useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = React.useState(false);

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

  const price = isUs ? priceUsa : priceEu;
  const priceFormatted = price
    ? isUs
      ? `$${price}`
      : `€${price}`
    : null;

  const categoryLabel = category && (
    categoryHref ? (
      <a href={categoryHref} className="hover:underline decoration-primary-text underline-offset-(--underline-offset)">
        <Typography textRole="subtitle-2" as="span" className="text-primary-text">
          {category}
        </Typography>
      </a>
    ) : (
      <Typography textRole="subtitle-2" className="text-muted-foreground">
        {category}
      </Typography>
    )
  );

  return (
    <>
      <section className="max-w-main mx-auto px-(--spacing-page) pt-(--spacing-navbar) flex flex-col gap-2">
        {breadcrumb}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-(--spacing-content) md:gap-(--spacing-section)">
          {/* Title + Category — first on mobile */}
          <div className="flex flex-col gap-1 md:hidden">
            <Typography textRole="h1">{title}</Typography>
            {categoryLabel}
          </div>

          {/* Left: Content (5 cols) */}
          <div className={cn('flex flex-col gap-(--spacing-element)', imageSrc ? 'md:col-span-5' : 'md:col-span-12')}>
            {/* Title + Category — shown on md+ */}
            <div className="hidden md:flex flex-col gap-1">
              <Typography textRole="h1">{title}</Typography>
              {categoryLabel}
            </div>

            {/* Description */}
            {description && (
              <div
                className="text-muted-foreground text-base leading-relaxed text-pretty"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}

            {/* Price */}
            {priceFormatted && (
              <Typography textRole="subtitle-1" className="text-foreground">
                {priceFormatted}
              </Typography>
            )}

            {/* CTAs (in-flow) */}
            <div ref={inFlowCtaRef}>
              <ProductCta />
            </div>
          </div>

          {/* Right: Image (7 cols) */}
          {imageSrc && (
            <div className="md:col-span-7 relative aspect-square bg-background rounded-xl overflow-hidden">
              <Image
                src={imageSrc}
                alt={imageAlt ?? title}
                fill
                sizes="(max-width: 768px) 100vw, 58vw"
                className="object-contain object-center"
                priority
              />
            </div>
          )}
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
