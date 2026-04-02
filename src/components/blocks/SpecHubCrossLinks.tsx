import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { fetchContent } from '@/lib/api/content';
import { resolvePath } from '@/lib/api/resolve-path';
import { emptyToNull } from '@/lib/api/client';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import { HubSection } from '@/components/composed/HubSection';
import { Typography } from '@/components/composed/Typography';

interface SpecHubCrossLinksProps {
  productType: string;
  locale: string;
}

export async function SpecHubCrossLinks({
  productType,
  locale,
}: SpecHubCrossLinksProps) {
  if (productType !== 'prodotto_arredo') return null;

  const tHub = await getTranslations('hub');

  const illuminazionePath =
    FILTER_REGISTRY['prodotto_illuminazione']?.basePaths[locale] ?? 'illuminazione';

  const [carpetsResolved, illuminazioneContent, carpetsContent] =
    await Promise.all([
      resolvePath('/prodotti-tessili/tappeti', locale).catch(() => null),
      fetchContent(337, locale).catch(() => null),
      fetchContent(350, locale).catch(() => null),
    ]);

  const carpetsAlias =
    carpetsResolved?.aliases?.[locale] ?? '/textiles/carpets';

  const links = [
    {
      title:
        (illuminazioneContent?.field_titolo_main as string) ?? 'Illuminazione',
      imageUrl: emptyToNull(
        illuminazioneContent?.field_immagine as string | null | undefined,
      ),
      url: `/${locale}/${illuminazionePath}`,
    },
    {
      title: (carpetsContent?.field_titolo_main as string) ?? 'Carpets',
      imageUrl: emptyToNull(
        carpetsContent?.field_immagine as string | null | undefined,
      ),
      url: `/${locale}${carpetsAlias}`,
    },
  ];

  return (
    <div className="max-w-main mx-auto px-(--spacing-page)">
      <HubSection title={tHub('discoverAlso')} separator={false}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {links.map((link) => (
            <Link
              key={link.url}
              href={link.url}
              className="flex items-stretch overflow-hidden rounded-lg border border-border transition-colors hover:bg-muted"
            >
              <div className="relative w-16 shrink-0">
                {link.imageUrl ? (
                  <Image
                    src={link.imageUrl}
                    alt={link.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="size-full bg-muted" />
                )}
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
