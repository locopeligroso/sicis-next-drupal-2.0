import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';

import type { SecondaryLink } from '@/lib/navbar/types';
import { fetchHubCategories } from '@/lib/api/category-hub';
import { resolvePath } from '@/lib/api/resolve-path';
import { fetchContent } from '@/lib/api/content';
import { emptyToNull } from '@/lib/api/client';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import { HubSection } from '@/components/composed/HubSection';
import { CategoryCard } from '@/components/composed/CategoryCard';
import { PixallHubCard } from '@/components/composed/PixallHubCard';
import { Typography } from '@/components/composed/Typography';

/**
 * NFC-normalize + lowercase + slugify a category name.
 * Mirrors deriveSlug's fallback path in src/lib/api/filters.ts.
 * Preserves accented Latin (U+00C0–U+024F) and Cyrillic (U+0400–U+04FF) chars.
 */
function slugifyName(name: string): string {
  return name
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u00C0-\u024F\u0400-\u04FF-]/g, '');
}

interface SpecHubArredoProps {
  parentNid: number;
  basePath: string;
  locale: string;
  categoryCardRatio?: string; // default "4/3"
  categoryImageFit?: 'cover' | 'contain'; // default "cover"
  deepDiveLinks?: SecondaryLink[];
  productType?: string;
}

export async function SpecHubArredo({
  parentNid,
  basePath,
  locale,
  categoryCardRatio = '4/3',
  categoryImageFit = 'cover',
  deepDiveLinks = [],
  productType,
}: SpecHubArredoProps) {
  const tHub = await getTranslations('hub');

  // Fetch categories from the new categories/{nid} endpoint
  const categories = await fetchHubCategories(parentNid, locale);

  const isArredo = productType === 'prodotto_arredo';

  // ── 1. Typology cards ────────────────────────────────────────────────
  const typologySection =
    categories.length > 0 ? (
      <section className="flex flex-col gap-(--spacing-element)">
        <Typography textRole="h2" as="h2">
          {isArredo ? 'Indoor' : tHub('exploreByTypology')}
        </Typography>
        <hr className="border-t border-border" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.nid}
              title={cat.name}
              imageUrl={cat.imageUrl}
              href={`${basePath}/${slugifyName(cat.name)}`}
              aspectRatio={categoryCardRatio}
              imageFit={categoryImageFit}
            />
          ))}
        </div>
      </section>
    ) : null;

  // ── 1b. Arredo-only: OUTDOOR + NEXT ART hero cards (PixallHubCard layout) ──
  // Fetch images by NID directly (resolvePath fails cross-locale: /arredo/outdoor is IT alias only)
  // Outdoor = NID 348, Next Art = NID 3545
  let outdoorImageUrl: string | null = null;
  let nextArtImageUrl: string | null = null;

  if (isArredo) {
    const [outdoorContent, nextArtContent] = await Promise.all([
      fetchContent(348, locale).catch(() => null),
      fetchContent(3545, locale).catch(() => null),
    ]);

    outdoorImageUrl = emptyToNull(
      outdoorContent?.field_immagine as string | null | undefined,
    );
    nextArtImageUrl = emptyToNull(
      nextArtContent?.field_immagine as string | null | undefined,
    );
  }

  const outdoorSection = isArredo ? (
    <PixallHubCard
      title="Outdoor"
      imageUrl={outdoorImageUrl}
      exploreHref={`${basePath}/outdoor`}
      exploreLabel={tHub('explore')}
      colorSwatches={[]}
    />
  ) : null;

  const nextArtSection = isArredo ? (
    <PixallHubCard
      title="Next Art"
      imageUrl={nextArtImageUrl}
      exploreHref={`/${locale}/next-art`}
      exploreLabel={tHub('explore')}
      colorSwatches={[]}
    />
  ) : null;

  // ── 1c. Arredo-only: "Discover also" — links to Illuminazione + Tappeti ──
  let discoverAlsoSection: React.ReactNode = null;

  if (isArredo) {
    // Resolve illuminazione (NID 337) and carpets/tappeti (NID 350) paths + images
    const illuminazionePath =
      FILTER_REGISTRY['prodotto_illuminazione']?.basePaths[locale] ??
      'illuminazione';

    // Carpets path is locale-dependent (aliases from resolve-path)
    const carpetsResolved = await resolvePath(
      '/prodotti-tessili/tappeti',
      locale,
    ).catch(() => null);
    const carpetsAlias =
      carpetsResolved?.aliases?.[locale] ?? '/textiles/carpets';

    // Fetch images in parallel
    const [illuminazioneContent, carpetsContent] = await Promise.all([
      fetchContent(337, locale).catch(() => null),
      fetchContent(350, locale).catch(() => null),
    ]);

    const illuminazioneImageUrl = emptyToNull(
      illuminazioneContent?.field_immagine as string | null | undefined,
    );
    const carpetsImageUrl = emptyToNull(
      carpetsContent?.field_immagine as string | null | undefined,
    );
    const illuminazioneTitle =
      (illuminazioneContent?.field_titolo_main as string) ?? 'Illuminazione';
    const carpetsTitle =
      (carpetsContent?.field_titolo_main as string) ?? 'Carpets';

    discoverAlsoSection = (
      <section className="flex flex-col gap-(--spacing-element)">
        <Typography textRole="h2" as="h2">
          {tHub('discoverAlso')}
        </Typography>
        <hr className="border-t border-border" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <CategoryCard
            title={illuminazioneTitle}
            imageUrl={illuminazioneImageUrl}
            href={`/${locale}/${illuminazionePath}`}
            aspectRatio={categoryCardRatio}
            imageFit={categoryImageFit}
          />
          <CategoryCard
            title={carpetsTitle}
            imageUrl={carpetsImageUrl}
            href={`/${locale}${carpetsAlias}`}
            aspectRatio={categoryCardRatio}
            imageFit={categoryImageFit}
          />
        </div>
      </section>
    );
  }

  // ── 2. Approfondimenti (from Filter & Find mega-menu secondary links) ──
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
      {outdoorSection}
      {nextArtSection}
      {discoverAlsoSection}
      {deepDiveSection}
    </div>
  );
}
