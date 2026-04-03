'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import type { NavSection } from '@/lib/navbar/types';
import { Separator } from '@/components/ui/separator';
import { Typography } from '@/components/composed/Typography';
import { cn } from '@/lib/utils';

interface MegaMenuSectionProps {
  section: NavSection;
}

// ════════════════════════════════════════════════════════════════════════════
// Video / thumbnail helpers (product variant)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Video sources for product thumbnails.
 * Keyed by URL path fragment — NOT title — for locale-independent matching.
 */
const THUMB_VIDEOS: [string[], string][] = [
  [['mosaico', 'mosaic', 'mosaïque', 'mosaik'], '/video/filter-mosaico.mp4'],
  [['vetrite'], '/video/filter-vetrite.mp4'],
  [
    ['arredo', 'furniture', 'ameublement', 'einrichtung', 'mueble'],
    '/video/filter-arredo.mp4',
  ],
  [
    ['illuminazione', 'lighting', 'eclairage', 'leuchten', 'iluminacion'],
    '/video/filter-illuminazione.mp4',
  ],
  [
    ['tessili', 'textiles', 'tessuto', 'textilien'],
    '/video/filter-tessili.mp4',
  ],
  [['jewels'], '/video/jewels-nav.mp4'],
];

/** Resolve video from item URL or title (case-insensitive). */
function resolveVideo(url: string, title: string): string | null {
  const haystack = `${url} ${title}`.toLowerCase();
  for (const [keys, src] of THUMB_VIDEOS) {
    if (keys.some((k) => haystack.includes(k))) return src;
  }
  return null;
}

const FALLBACK_GRADIENT = 'linear-gradient(145deg, #444, #222)';

/**
 * Video that plays on hover, pauses on leave, fades to first frame.
 */
function HoverPlayVideo({
  src,
  isHovered,
}: {
  src: string;
  isHovered: boolean;
}) {
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
      <video
        src={src}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />
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

// ════════════════════════════════════════════════════════════════════════════
// Product variant — card grid with thumbnails, secondary links, cross-links
// ════════════════════════════════════════════════════════════════════════════

function ProductLayout({ section }: { section: NavSection }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="flex px-10 py-9 gap-7">
      {section.items.map((category) => {
        const { item } = category;
        const videoSrc = resolveVideo(item.url, item.title);
        const isHovered = hoveredId === item.id;

        return (
          <div
            key={item.id}
            className="flex-1 flex flex-col min-w-0"
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <a href={item.url} className="block group/card">
              <div
                className="h-20 rounded-[10px] overflow-hidden w-full relative"
                style={{ background: videoSrc ? undefined : FALLBACK_GRADIENT }}
                aria-hidden="true"
              >
                {videoSrc && (
                  <HoverPlayVideo src={videoSrc} isHovered={isHovered} />
                )}
              </div>

              <Typography
                textRole="overline"
                as="span"
                className="text-[13px] tracking-[2px] uppercase font-bold text-foreground mt-4 block"
              >
                {item.title}{' '}
                <span className="inline-block transition-transform duration-200 group-hover/card:translate-x-[3px]">
                  &rarr;
                </span>
              </Typography>

              {item.description && (
                <Typography
                  textRole="body-sm"
                  as="p"
                  className="text-[10px] text-muted-foreground mt-1.5"
                >
                  {item.description}
                </Typography>
              )}
            </a>

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

// ════════════════════════════════════════════════════════════════════════════
// List variant — link list with descriptions + hover images
// ════════════════════════════════════════════════════════════════════════════

/**
 * Hover images for list items, keyed by URL path fragment.
 * Locale-independent: matches on the path, not the title.
 */
const LIST_HOVER_IMAGES: [string[], string][] = [
  [
    ['progetti', 'projects', 'projets', 'projekte', 'proyectos'],
    '/images/nav/progetti/progetti.jpg',
  ],
  [
    ['ambienti', 'environments', 'ambiances', 'ambiente', 'ambientes'],
    '/images/nav/progetti/ambienti.jpg',
  ],
  [['blog', 'inspiration'], '/images/nav/progetti/inspiration.jpg'],
  [['interior-design'], '/images/nav/progetti/interior-design.jpg'],
];

function resolveHoverImage(url: string): string | null {
  const haystack = url.toLowerCase();
  for (const [keys, src] of LIST_HOVER_IMAGES) {
    if (keys.some((k) => haystack.includes(k))) return src;
  }
  return null;
}

function ListLayout({ section }: { section: NavSection }) {
  const [hoveredIndex, setHoveredIndex] = useState(0);

  // Collect images for items that have them
  const itemImages = section.items.map((entry) =>
    resolveHoverImage(entry.item.url),
  );
  const hasAnyImage = itemImages.some(Boolean);

  return (
    <div className="flex">
      {/* Left: Descriptive list */}
      <div
        className={cn(
          'flex flex-col gap-6 py-10 px-11',
          hasAnyImage ? 'w-[360px] flex-shrink-0' : 'flex-1',
        )}
        onMouseLeave={() => setHoveredIndex(0)}
      >
        {section.items.map((entry, index) => {
          const { item } = entry;
          const isHovered = hoveredIndex === index;
          const isLast = index === section.items.length - 1;

          return (
            <a
              key={item.id}
              href={item.url}
              className={cn(
                'group/link',
                !isLast && 'border-b border-border/60 pb-4',
              )}
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <Typography
                textRole="body-sm"
                as="div"
                className={cn(
                  'text-sm transition-colors',
                  isHovered
                    ? 'font-bold text-foreground'
                    : 'font-semibold text-muted-foreground',
                )}
              >
                {item.title}{' '}
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-200 group-hover/link:translate-x-[3px]"
                >
                  &rarr;
                </span>
              </Typography>
              {item.description && (
                <Typography
                  textRole="caption"
                  as="div"
                  className="text-xs text-muted-foreground leading-[1.5] mt-1"
                >
                  {item.description}
                </Typography>
              )}
            </a>
          );
        })}
      </div>

      {/* Right: Image area (only if hover images exist) */}
      {hasAnyImage && (
        <div className="flex-1 relative overflow-hidden" aria-hidden="true">
          {section.items.map((entry, index) => {
            const isActive = hoveredIndex === index;
            const imgSrc = itemImages[index];
            if (!imgSrc) return null;

            return (
              <div
                key={entry.item.id}
                className={cn(
                  'absolute inset-0 transition-opacity duration-[400ms]',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
              >
                <Image
                  src={imgSrc}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 60vw, 50vw"
                  className="object-cover"
                  priority={index === 0}
                />
                <Typography
                  textRole="overline"
                  as="span"
                  className="absolute bottom-4 left-4 text-[10px] tracking-[3px] uppercase text-white/35"
                >
                  {entry.item.title}
                </Typography>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Split variant — 2-column layout for mixed described/undescribed items
// Items WITH description go left (featured), items WITHOUT go right (compact).
// Used automatically for 'list' sections that have a mix of both.
// ════════════════════════════════════════════════════════════════════════════

function SplitLayout({ section }: { section: NavSection }) {
  const withDesc = section.items.filter((e) => !!e.item.description);
  const withoutDesc = section.items.filter((e) => !e.item.description);

  return (
    <div className="flex px-10 py-9 gap-9">
      {/* Left column — featured items with descriptions */}
      <div className="flex flex-col gap-6">
        {withDesc.map((entry) => (
          <a
            key={entry.item.id}
            href={entry.item.url}
            className="group/link block"
          >
            <Typography
              textRole="body-sm"
              as="span"
              className="text-sm font-bold text-foreground"
            >
              {entry.item.title}{' '}
              <span className="inline-block transition-transform duration-200 group-hover/link:translate-x-[3px]">
                &rarr;
              </span>
            </Typography>
            <Typography
              textRole="body-sm"
              as="p"
              className="text-[11px] text-muted-foreground leading-[1.4] mt-1"
            >
              {entry.item.description}
            </Typography>
          </a>
        ))}
      </div>

      {/* Vertical separator */}
      {withoutDesc.length > 0 && <Separator orientation="vertical" />}

      {/* Right column — compact links without descriptions */}
      {withoutDesc.length > 0 && (
        <div className="flex flex-col gap-3.5">
          {withoutDesc.map((entry) => (
            <a
              key={entry.item.id}
              href={entry.item.url}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {entry.item.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MegaMenuSection — dispatches to the correct variant layout
// ════════════════════════════════════════════════════════════════════════════

export function MegaMenuSection({ section }: MegaMenuSectionProps) {
  if (section.variant === 'product') {
    return <ProductLayout section={section} />;
  }

  // Check if this list section has a mix of described/undescribed items
  // → use the 2-column split layout (like the old Info & Services)
  const hasDesc = section.items.some((e) => !!e.item.description);
  const hasNoDesc = section.items.some((e) => !e.item.description);
  if (hasDesc && hasNoDesc) {
    return <SplitLayout section={section} />;
  }

  return <ListLayout section={section} />;
}
