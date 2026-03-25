'use client';

import { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { FilterFindSection } from '@/lib/navbar/types';
import { Separator } from '@/components/ui/separator';

interface MegaMenuFilterFindProps {
  menu: FilterFindSection;
}

/**
 * Placeholder gradient backgrounds for each product category thumbnail.
 * Used as fallback when no video is available.
 */
const THUMB_COLORS: Record<string, string> = {
  Mosaico: 'linear-gradient(145deg, #3a6b7c, #1a3a4a)',
  Vetrite: 'linear-gradient(145deg, #7c6b3a, #4a3a1a)',
  Arredo: 'linear-gradient(145deg, #8a7560, #c4b69c)',
  Illuminazione: 'linear-gradient(145deg, #6b5a3a, #3a2a1a)',
  Tessili: 'linear-gradient(145deg, #6b7c3a, #3a4a1a)',
};

/**
 * Video sources for Filter & Find thumbnails.
 * Keyed by lowercase category name fragment for flexible matching.
 */
const THUMB_VIDEOS: [string[], string][] = [
  [['mosaico', 'mosaic'], '/video/filter-mosaico.mp4'],
  [['vetrite'], '/video/filter-vetrite.mp4'],
  [['arredo', 'furniture'], '/video/filter-arredo.mp4'],
  [['illuminazione', 'lighting'], '/video/filter-illuminazione.mp4'],
  [['tessili', 'textiles', 'tessuto'], '/video/filter-tessili.mp4'],
];

/** Resolve video source from category title (case-insensitive). */
function resolveThumbVideo(title: string): string | null {
  const lower = title.toLowerCase().trim();
  for (const [keys, src] of THUMB_VIDEOS) {
    if (keys.some((k) => lower.includes(k))) return src;
  }
  return null;
}

/**
 * Video that plays on hover, stops at end. Fades to first frame on leave.
 * The forward video is always rendered (shows first frame at rest).
 * On leave: pause, fade out to reveal the static first frame underneath, then reset.
 */
function HoverPlayVideo({ src, isHovered }: { src: string; isHovered: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [faded, setFaded] = useState(false);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (resetRef.current) {
      clearTimeout(resetRef.current);
      resetRef.current = null;
    }

    if (isHovered) {
      setFaded(false);
      el.play().catch(() => {});
    } else if (el.currentTime > 0) {
      // Fade out, then reset to first frame
      el.pause();
      setFaded(true);
      resetRef.current = setTimeout(() => {
        el.currentTime = 0;
        setFaded(false);
      }, 700);
    }

    return () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, [isHovered]);

  return (
    <>
      {/* Static first-frame layer (always visible behind) */}
      <video
        src={src}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Playable layer on top */}
      <video
        ref={ref}
        src={src}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        style={{ opacity: faded ? 0 : 1 }}
      />
    </>
  );
}

/**
 * Maps category title (lowercase) to the description translation key.
 */
const DESC_KEYS: Record<string, string> = {
  mosaico: 'filterMosaicoDesc',
  vetrite: 'filterVetriteDesc',
  'lastre vetro vetrite': 'filterVetriteDesc',
  arredo: 'filterArredoDesc',
  illuminazione: 'filterIlluminazioneDesc',
  tessili: 'filterTessiliDesc',
  'prodotti tessili': 'filterTessiliDesc',
};

/**
 * Resolves the placeholder gradient for a category title (case-insensitive match).
 */
function resolveThumbColor(title: string): string {
  const lower = title.toLowerCase().trim();
  for (const [key, value] of Object.entries(THUMB_COLORS)) {
    if (lower.includes(key.toLowerCase())) {
      return value;
    }
  }
  return 'linear-gradient(145deg, #444, #222)';
}

export function MegaMenuFilterFind({ menu }: MegaMenuFilterFindProps) {
  const t = useTranslations('nav');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="flex px-10 py-9 gap-7">
      {menu.items.map((category) => {
        const title = category.item.title;
        const titleLower = title.toLowerCase().trim();
        const descKey = DESC_KEYS[titleLower];
        const background = resolveThumbColor(title);
        const videoSrc = resolveThumbVideo(title);
        const isHovered = hoveredId === category.item.id;

        return (
          <div
            key={category.item.id}
            className="flex-1 flex flex-col min-w-0"
            onMouseEnter={() => setHoveredId(category.item.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Primary link — wraps thumbnail + title + description */}
            <a
              href={category.item.url}
              className="block group/card"
            >
              <div
                className="h-20 rounded-[10px] overflow-hidden w-full relative"
                style={{ background: videoSrc ? undefined : background }}
                aria-hidden="true"
              >
                {videoSrc && <HoverPlayVideo src={videoSrc} isHovered={isHovered} />}
              </div>

              <span className="text-[13px] tracking-[2px] uppercase font-bold text-foreground mt-4 block">
                {title} <span className="inline-block transition-transform duration-200 group-hover/card:translate-x-[3px]">&rarr;</span>
              </span>

              {descKey && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {t(descKey)}
                </p>
              )}
            </a>

            {/* Secondary links */}
            {category.secondaryLinks.length > 0 && (
              <>
                <Separator className="mt-3.5" />
                <div className="flex flex-col gap-2 mt-3.5">
                  {category.secondaryLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.title}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
