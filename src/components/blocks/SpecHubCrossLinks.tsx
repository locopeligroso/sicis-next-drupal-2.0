import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { HubSection } from '@/components/composed/HubSection';
import { Typography } from '@/components/composed/Typography';
import type { SecondaryLink } from '@/lib/navbar/types';

interface SpecHubCrossLinksProps {
  links: SecondaryLink[];
}

export async function SpecHubCrossLinks({ links }: SpecHubCrossLinksProps) {
  if (links.length === 0) return null;

  const tHub = await getTranslations('hub');

  return (
    <div className="max-w-main mx-auto px-(--spacing-page)">
      <HubSection title={tHub('discoverAlso')} separator={false}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {links.map((link, i) => (
            <Link
              key={`${link.url}-${i}`}
              href={link.url}
              className="flex items-stretch overflow-hidden rounded-lg border border-border transition-colors hover:bg-muted"
            >
              <div className="relative w-16 shrink-0 bg-muted" />
              <div className="flex items-center p-(--spacing-element)">
                <Typography
                  textRole="body-sm"
                  as="span"
                  className="line-clamp-2 font-medium"
                >
                  {link.title}
                </Typography>
              </div>
            </Link>
          ))}
        </div>
      </HubSection>
    </div>
  );
}
