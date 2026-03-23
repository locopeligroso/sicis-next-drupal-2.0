'use client';

import { useState } from 'react';
import type { ExploreSection } from '@/lib/navbar/types';

interface MegaMenuExploreProps {
  menu: ExploreSection;
}

/**
 * Placeholder gradient backgrounds for each category group.
 * Will be replaced with real images/videos later.
 */
const PLACEHOLDER_COLORS: Record<string, string> = {
  Mosaico: 'linear-gradient(145deg, #2a5a6a, #1a3a4a)',
  Vetrite: 'linear-gradient(145deg, #5a4a3a, #3a2a1a)',
  Living: 'linear-gradient(145deg, #4a5a3a, #2a3a1a)',
  Tessile: 'linear-gradient(145deg, #3a4a5a, #1a2a3a)',
  Jewels: 'linear-gradient(145deg, #5a3a5a, #3a1a3a)',
};

export function MegaMenuExplore({ menu }: MegaMenuExploreProps) {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  // Resolve which group image to show: hovered group, or first group as default
  const activeGroup = hoveredGroup ?? menu.items[0]?.label ?? null;

  return (
    <div className="flex">
      {/* Left: Text Columns */}
      <div
        className="flex gap-9 py-9 px-10 flex-1 min-w-0"
        onMouseLeave={() => setHoveredGroup(null)}
      >
        {menu.items.map((group) => {
          const isHovered = hoveredGroup === group.label;

          return (
            <div
              key={group.label}
              className="flex flex-col min-w-0"
              onMouseEnter={() => setHoveredGroup(group.label)}
            >
              {/* Column header */}
              <div
                className="pb-3 mb-4"
                style={{
                  borderBottom: isHovered
                    ? '2px solid hsl(var(--foreground))'
                    : '1px solid hsl(var(--muted-foreground) / 0.25)',
                }}
              >
                <span className="text-[10px] tracking-[2.5px] uppercase font-bold text-foreground">
                  {group.label}
                </span>
              </div>

              {/* Links */}
              <div className="flex flex-col gap-[10px]">
                {group.items.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.title}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: Media Area — edge-to-edge, decorative */}
      <div
        className="w-[320px] flex-shrink-0 relative overflow-hidden"
        aria-hidden="true"
      >
        {menu.items.map((group) => {
          const isActive = activeGroup === group.label;
          const background =
            PLACEHOLDER_COLORS[group.label] ??
            'linear-gradient(145deg, #444, #222)';

          return (
            <div
              key={group.label}
              className="absolute inset-0 transition-opacity duration-[400ms]"
              style={{
                background,
                opacity: isActive ? 1 : 0,
              }}
            >
              {/* Category label overlay */}
              <span className="absolute bottom-4 left-4 text-[10px] tracking-[3px] uppercase text-white/40">
                {group.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
