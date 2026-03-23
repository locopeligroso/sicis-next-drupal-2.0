'use client';

import { useTranslations } from 'next-intl';
import type { InfoSection } from '@/lib/navbar/types';
import { Separator } from '@/components/ui/separator';

interface MegaMenuInfoProps {
  menu: InfoSection;
}

/**
 * Maps strategic item titles (lowercase) to translation keys
 * for the description text shown below each strategic link.
 */
const STRATEGIC_DESC_KEYS: Record<string, string> = {
  showroom: 'infoShowroomDesc',
  contacts: 'infoContactsDesc',
  'download catalogues': 'infoCataloguesDesc',
};

export function MegaMenuInfo({ menu }: MegaMenuInfoProps) {
  const t = useTranslations('nav');

  return (
    <div className="flex px-10 py-9 gap-9">
      {/* Left column — Strategic links */}
      <div className="flex flex-col gap-6">
        {menu.strategic.map((item) => {
          const descKey = STRATEGIC_DESC_KEYS[item.title.toLowerCase().trim()];
          return (
            <a key={item.id} href={item.url} className="group block">
              <span className="text-sm font-bold text-foreground">
                {item.title} &rarr;
              </span>
              {descKey && (
                <p className="text-[11px] text-muted-foreground leading-[1.4] mt-1">
                  {t(descKey)}
                </p>
              )}
            </a>
          );
        })}
      </div>

      {/* Vertical separator */}
      <Separator orientation="vertical" />

      {/* Right column — Corporate + Professional */}
      <div className="flex flex-col">
        {/* Corporate links */}
        <div className="flex flex-col gap-3.5">
          {menu.corporate.map((item) => (
            <a
              key={item.id}
              href={item.url}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.title}
            </a>
          ))}
        </div>

        {/* Professional link */}
        {menu.professional.length > 0 && (
          <>
            <Separator className="my-4" />
            {menu.professional.map((item) => (
              <a
                key={item.id}
                href={item.url}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.title} &rarr;
              </a>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
