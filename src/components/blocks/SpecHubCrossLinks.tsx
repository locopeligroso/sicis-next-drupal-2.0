import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { HubSection } from '@/components/composed/HubSection';
import { Typography } from '@/components/composed/Typography';
import type { SecondaryLink } from '@/lib/navbar/types';
import { resolvePath } from '@/lib/api/resolve-path';
import { fetchContent } from '@/lib/api/content';
import { resolveImageUrl } from '@/lib/api/client';

interface SpecHubCrossLinksProps {
  links: SecondaryLink[];
}

/** Resolve a cross-link URL to its Drupal image */
async function getCrossLinkImage(
  url: string,
  locale: string,
): Promise<string | null> {
  try {
    // Strip locale prefix to get Drupal path
    const path = url.replace(new RegExp(`^/${locale}`), '') || '/';
    const resolved = await resolvePath(path, locale);
    if (!resolved?.nid) return null;
    const content = await fetchContent(resolved.nid, locale);
    if (!content) return null;
    return resolveImageUrl(content.field_immagine);
  } catch {
    return null;
  }
}

export async function SpecHubCrossLinks({ links }: SpecHubCrossLinksProps) {
  if (links.length === 0) return null;

  const locale = await getLocale();
  const tHub = await getTranslations('hub');

  // Fetch images for all cross-links in parallel
  const images = await Promise.all(
    links.map((link) => getCrossLinkImage(link.url, locale)),
  );

  return (
    <div className="max-w-main mx-auto px-(--spacing-page)">
      <HubSection title={tHub('discoverAlso')} separator={false}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {links.map((link, i) => (
            <Link
              key={`${link.url}-${i}`}
              href={link.url}
              className="group flex items-stretch overflow-hidden rounded-lg border border-border transition-colors hover:bg-muted"
            >
              <div className="relative w-20 shrink-0 bg-muted overflow-hidden">
                {images[i] ? (
                  <Image
                    src={images[i]}
                    alt={link.title}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
              </div>
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
