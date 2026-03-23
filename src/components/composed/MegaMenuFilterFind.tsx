'use client';

import { useTranslations } from 'next-intl';
import type { FilterFindSection } from '@/lib/navbar/types';
import { Separator } from '@/components/ui/separator';

interface MegaMenuFilterFindProps {
  menu: FilterFindSection;
}

/**
 * Placeholder gradient backgrounds for each product category thumbnail.
 * Will be replaced with real images later.
 */
const THUMB_COLORS: Record<string, string> = {
  Mosaico: 'linear-gradient(145deg, #3a6b7c, #1a3a4a)',
  Vetrite: 'linear-gradient(145deg, #7c6b3a, #4a3a1a)',
  Arredo: 'linear-gradient(145deg, #8a7560, #c4b69c)',
  Illuminazione: 'linear-gradient(145deg, #6b5a3a, #3a2a1a)',
  Tessili: 'linear-gradient(145deg, #6b7c3a, #3a4a1a)',
};

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

  return (
    <div className="flex px-10 py-9 gap-7">
      {menu.items.map((category) => {
        const title = category.item.title;
        const titleLower = title.toLowerCase().trim();
        const descKey = DESC_KEYS[titleLower];
        const background = resolveThumbColor(title);

        return (
          <div key={category.item.id} className="flex-1 flex flex-col min-w-0">
            {/* Thumbnail */}
            <div
              className="h-20 rounded-[10px] overflow-hidden w-full"
              style={{ background }}
              aria-hidden="true"
            />

            {/* Primary link */}
            <a
              href={category.item.url}
              className="text-[13px] tracking-[2px] uppercase font-bold text-foreground mt-4 block"
            >
              {title} &rarr;
            </a>

            {/* Description */}
            {descKey && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {t(descKey)}
              </p>
            )}

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
