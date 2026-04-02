import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  fetchHubCategories,
  ARREDO_INDOOR_PARENT_NID,
  ARREDO_DESCRIPTIVE_PARENT_NID,
} from '@/lib/api/category-hub';
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
  productType?: string;
}

export async function SpecHubArredo({
  parentNid,
  basePath,
  locale,
  categoryCardRatio = '4/3',
  categoryImageFit = 'cover',
  productType,
}: SpecHubArredoProps) {
  const tHub = await getTranslations('hub');

  const isArredo = productType === 'prodotto_arredo';

  // Arredo indoor: hardcoded NID 4261 (Freddi DB change 2026-03-31)
  // Other types (illuminazione, tessuto): use the hub page NID passed via parentNid
  const indoorNid = isArredo ? ARREDO_INDOOR_PARENT_NID : parentNid;
  // Fetch both category lists in parallel — they are independent endpoints.
  // Arredo descriptive categories: NID 3522 — rendered as block pages, not product listings
  const [categories, descriptiveCategories] = await Promise.all([
    fetchHubCategories(indoorNid, locale),
    isArredo
      ? fetchHubCategories(ARREDO_DESCRIPTIVE_PARENT_NID, locale)
      : Promise.resolve([]),
  ]);

  // ── 1. Typology cards ────────────────────────────────────────────────
  const typologySection =
    categories.length > 0 ? (
      <HubSection title={isArredo ? 'Indoor' : tHub('exploreByTypology')} titleRole="overline">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.nid}
              href={`${basePath}/${slugifyName(cat.name)}`}
              className="flex items-center gap-3 rounded-lg border border-border p-2 transition-colors hover:bg-muted"
            >
              {cat.imageUrl ? (
                <Image
                  src={cat.imageUrl}
                  alt={cat.name}
                  width={48}
                  height={48}
                  className="size-12 shrink-0 rounded-sm object-cover"
                />
              ) : (
                <span className="size-12 shrink-0 rounded-sm bg-muted" />
              )}
              <Typography textRole="body-sm" as="span" className="line-clamp-2">
                {cat.name}
              </Typography>
            </Link>
          ))}
        </div>
      </HubSection>
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

  // ── 1c. Arredo-only: DESCRIPTIVE categories (NID 3522) — render blocks, not listings ──
  const descriptiveCategoriesSection =
    isArredo && descriptiveCategories.length > 0 ? (
      <HubSection title={tHub('exploreByTypology')} titleRole="overline">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {descriptiveCategories.map((cat) => (
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
      </HubSection>
    ) : null;

  // ── 1d. Arredo-only: "Discover also" — links to Illuminazione + Tappeti ──
  let discoverAlsoSection: React.ReactNode = null;

  if (isArredo) {
    // Resolve illuminazione (NID 337) and carpets/tappeti (NID 350) paths + images
    const illuminazionePath =
      FILTER_REGISTRY['prodotto_illuminazione']?.basePaths[locale] ??
      'illuminazione';

    // All three calls are independent — fetch in parallel.
    // Carpets path is locale-dependent (aliases from resolve-path).
    const [carpetsResolved, illuminazioneContent, carpetsContent] =
      await Promise.all([
        resolvePath('/prodotti-tessili/tappeti', locale).catch(() => null),
        fetchContent(337, locale).catch(() => null),
        fetchContent(350, locale).catch(() => null),
      ]);
    const carpetsAlias =
      carpetsResolved?.aliases?.[locale] ?? '/textiles/carpets';

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
      <HubSection title={tHub('discoverAlso')} titleRole="overline">
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
      </HubSection>
    );
  }

  return (
    <div className="max-w-main mx-auto px-(--spacing-page) flex flex-col gap-(--spacing-section)">
      {typologySection}
      {outdoorSection}
      {nextArtSection}
      {descriptiveCategoriesSection}
      {discoverAlsoSection}
    </div>
  );
}
