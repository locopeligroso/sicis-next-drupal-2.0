import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';

import type { SecondaryLink } from '@/lib/navbar/types';
import { fetchEntity } from '@/lib/api/entity';
import { getDrupalImageUrl } from '@/lib/drupal';
import { HubSection } from '@/components/composed/HubSection';
import { PixallHubCard } from '@/components/composed/PixallHubCard';
import { CategoryCard } from '@/components/composed/CategoryCard';
import { Typography } from '@/components/composed/Typography';

interface SpecHubArredoCategory {
  slug: string;
  label: string;
  imageUrl?: string | null;
  href: string;
  subtitle?: string;
  count?: number;
}

interface SpecHubArredoProps {
  categories: SpecHubArredoCategory[];
  basePath: string;
  locale: string;
  categoryCardRatio?: string; // default "4/3"
  categoryImageFit?: 'cover' | 'contain'; // default "cover"
  deepDiveLinks?: SecondaryLink[];
}

export async function SpecHubArredo({
  categories,
  basePath,
  locale,
  categoryCardRatio = '4/3',
  categoryImageFit = 'cover',
  deepDiveLinks = [],
}: SpecHubArredoProps) {
  const tHub = await getTranslations('hub');
  const tFilters = await getTranslations('filters');

  // ── 1. Typology cards ────────────────────────────────────────────────
  const typologySection =
    categories.length > 0 ? (
      <section className="flex flex-col gap-(--spacing-element)">
        <Typography textRole="h2" as="h2">
          {tHub('exploreByTypology')}
        </Typography>
        <hr className="border-t border-border" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.slug}
              title={cat.label}
              imageUrl={cat.imageUrl}
              href={cat.href}
              aspectRatio={categoryCardRatio}
              imageFit={categoryImageFit}
            />
          ))}
        </div>
      </section>
    ) : null;

  // ── 2. Next Art section — data from entity (legacy) node--page NID 3545 ──────────
  const nextArtEntity = await fetchEntity('/node/3545', locale);
  const nextArtImageUrl = nextArtEntity?.data
    ? getDrupalImageUrl(nextArtEntity.data.field_immagine)
    : null;
  const nextArtTitle =
    (nextArtEntity?.data?.field_titolo_main as string) ??
    (nextArtEntity?.data?.title as string) ??
    'Next Art';
  // Use the entity's own path if it has an alias, otherwise fall back to /arredo/next-art
  const nextArtPath = nextArtEntity?.meta?.path;
  const nextArtHref =
    nextArtPath && !nextArtPath.includes('/node/')
      ? nextArtPath
      : `/${locale}/arredo/next-art`;

  const nextArtSection = nextArtEntity ? (
    <PixallHubCard
      title={nextArtTitle}
      imageUrl={nextArtImageUrl}
      colorSwatches={[]}
      exploreHref={nextArtHref}
      exploreLabel={tHub('explore')}
    />
  ) : null;

  // ── 3. Scopri anche ──────────────────────────────────────────────────
  const discoverCards = [
    { slug: 'custom-projects', label: 'Custom Projects' },
    { slug: 'showroom-visit', label: 'Visit a Showroom' },
    { slug: 'design-consultation', label: 'Design Consultation' },
  ];

  const discoverSection = (
    <HubSection title={tHub('discoverAlso')}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {discoverCards.map((card) => (
          <CategoryCard
            key={card.slug}
            title={card.label}
            href="#"
            aspectRatio="3/2"
          />
        ))}
      </div>
    </HubSection>
  );

  // ── 3. Approfondimenti (from Filter & Find mega-menu secondary links) ──
  const deepDiveSection =
    deepDiveLinks.length > 0 ? (
      <HubSection title={tHub('deepDives')}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {deepDiveLinks.map((link) => (
            <Link
              key={link.url}
              href={link.url}
              className="flex items-center gap-3 rounded-lg border border-border p-(--spacing-element) transition-colors hover:bg-accent"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <ArrowUpRight className="size-5 text-muted-foreground" />
              </div>
              <Typography
                textRole="body-sm"
                as="span"
                className="truncate font-medium text-foreground"
              >
                {link.title}
              </Typography>
            </Link>
          ))}
        </div>
      </HubSection>
    ) : null;

  return (
    <div className="flex flex-col gap-(--spacing-section)">
      {typologySection}
      {nextArtSection}
      {discoverSection}
      {deepDiveSection}
    </div>
  );
}
