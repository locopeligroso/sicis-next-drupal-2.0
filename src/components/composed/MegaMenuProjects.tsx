'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ProjectsSection } from '@/lib/navbar/types';
import { cn } from '@/lib/utils';

interface MegaMenuProjectsProps {
  menu: ProjectsSection;
}

const HOVER_IMAGES = [
  '/images/nav/progetti/progetti.jpg',
  '/images/nav/progetti/ambienti.jpg',
  '/images/nav/progetti/inspiration.jpg',
  '/images/nav/progetti/interior-design.jpg',
];

const TITLE_KEYS = [
  'projectsProgetti',
  'projectsAmbienti',
  'projectsInspiration',
  'projectsInteriorDesign',
] as const;

const DESC_KEYS = [
  'projectsProgettiDesc',
  'projectsAmbientiDesc',
  'projectsInspirationDesc',
  'projectsInteriorDesignDesc',
] as const;

export function MegaMenuProjects({ menu }: MegaMenuProjectsProps) {
  const t = useTranslations('nav');
  const [hoveredIndex, setHoveredIndex] = useState(0);

  return (
    <div className="flex">
      {/* Left: Descriptive List */}
      <div
        className="w-[360px] flex-shrink-0 py-10 px-11 flex flex-col gap-6"
        onMouseLeave={() => setHoveredIndex(0)}
      >
        {menu.items.slice(0, 4).map((item, index) => {
          const isHovered = hoveredIndex === index;
          const isLast = index === Math.min(menu.items.length, 4) - 1;

          return (
            <a
              key={item.id}
              href={item.url}
              className={cn('group/link', !isLast && 'border-b border-border/60 pb-4')}
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <div
                className={cn(
                  'text-sm transition-colors',
                  isHovered
                    ? 'font-bold text-foreground'
                    : 'font-semibold text-muted-foreground',
                )}
              >
                {t(TITLE_KEYS[index])} <span aria-hidden="true" className="inline-block transition-transform duration-200 group-hover/link:translate-x-[3px]">&rarr;</span>
              </div>
              <div className="text-xs text-muted-foreground leading-[1.5] mt-1">
                {t(DESC_KEYS[index])}
              </div>
            </a>
          );
        })}
      </div>

      {/* Right: Image Area — edge-to-edge, decorative */}
      <div className="flex-1 relative overflow-hidden" aria-hidden="true">
        {menu.items.slice(0, 4).map((item, index) => {
          const isActive = hoveredIndex === index;

          return (
            <div
              key={item.id}
              className={cn(
                'absolute inset-0 transition-opacity duration-[400ms]',
                isActive ? 'opacity-100' : 'opacity-0',
              )}
            >
              <Image
                src={HOVER_IMAGES[index]}
                alt=""
                fill
                sizes="(min-width: 1024px) 60vw, 50vw"
                className="object-cover"
                priority={index === 0}
              />
              {/* Caption overlay */}
              <span className="absolute bottom-4 left-4 text-[10px] tracking-[3px] uppercase text-white/35">
                {t(TITLE_KEYS[index])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
