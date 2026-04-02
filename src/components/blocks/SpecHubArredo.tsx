import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  fetchHubCategories,
  ARREDO_INDOOR_PARENT_NID,
  ARREDO_DESCRIPTIVE_PARENT_NID,
} from '@/lib/api/category-hub';
import { fetchContent } from '@/lib/api/content';
import { resolvePath } from '@/lib/api/resolve-path';
import { emptyToNull } from '@/lib/api/client';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import { SpecDeepDiveLinks } from './SpecDeepDiveLinks';
import { HubSection } from '@/components/composed/HubSection';
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
  categoryCardRatio?: string;
  categoryImageFit?: 'cover' | 'contain';
  productType?: string;
}

export async function SpecHubArredo({
  parentNid,
  basePath,
  locale,
  productType,
}: SpecHubArredoProps) {
  const tHub = await getTranslations('hub');

  const isArredo = productType === 'prodotto_arredo';

  const indoorNid = isArredo ? ARREDO_INDOOR_PARENT_NID : parentNid;
  const [categories, descriptiveCategories] = await Promise.all([
    fetchHubCategories(indoorNid, locale),
    isArredo
      ? fetchHubCategories(ARREDO_DESCRIPTIVE_PARENT_NID, locale)
      : Promise.resolve([]),
  ]);

  // ── Build "other pages" list (Outdoor, Next Art, descriptive categories) ──
  type PageItem = { name: string; imageUrl: string | null; href: string };
  const otherPages: PageItem[] = [];

  if (isArredo) {
    const [outdoorContent, nextArtContent] = await Promise.all([
      fetchContent(348, locale).catch(() => null),
      fetchContent(3545, locale).catch(() => null),
    ]);

    const outdoorImageUrl = emptyToNull(
      outdoorContent?.field_immagine as string | null | undefined,
    );
    const nextArtImageUrl = emptyToNull(
      nextArtContent?.field_immagine as string | null | undefined,
    );

    otherPages.push({
      name: 'Outdoor',
      imageUrl: outdoorImageUrl,
      href: `${basePath}/outdoor`,
    });
    otherPages.push({
      name: 'Next Art',
      imageUrl: nextArtImageUrl,
      href: `/${locale}/next-art`,
    });

    // Descriptive categories (Bar e ristoranti, Guardaroba, Cucina, etc.)
    for (const cat of descriptiveCategories) {
      otherPages.push({
        name: cat.name,
        imageUrl: cat.imageUrl,
        href: `${basePath}/${slugifyName(cat.name)}`,
      });
    }
  }

  // ── Cross-links: Illuminazione + Tappeti (arredo only) ──
  const crossLinks: { title: string; url: string }[] = [];

  if (isArredo) {
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

    crossLinks.push({
      title: (illuminazioneContent?.field_titolo_main as string) ?? 'Illuminazione',
      url: `/${locale}/${illuminazionePath}`,
    });
    crossLinks.push({
      title: (carpetsContent?.field_titolo_main as string) ?? 'Carpets',
      url: `/${locale}${carpetsAlias}`,
    });
  }

  // ── Indoor mini-card list (shared between desktop and mobile) ──
  const indoorList = (
    <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-6">
      {categories.map((cat) => (
        <Link
          key={cat.nid}
          href={`${basePath}/${slugifyName(cat.name)}`}
          className="relative overflow-hidden rounded-md transition-opacity hover:opacity-80"
        >
          <div className="relative aspect-square">
            {cat.imageUrl ? (
              <Image
                src={cat.imageUrl}
                alt={cat.name}
                fill
                sizes="(min-width: 1024px) 8vw, 15vw"
                className="object-cover"
              />
            ) : (
              <div className="size-full bg-muted" />
            )}
          </div>
          <span className="absolute bottom-1 left-1 rounded-sm bg-background px-1 py-0.5">
            <Typography textRole="caption" as="span" className="line-clamp-1 text-[0.625rem]">
              {cat.name}
            </Typography>
          </span>
        </Link>
      ))}
    </div>
  );

  // ── Other pages card list (image with overlay title, same style as Indoor) ──
  const otherPagesList = (
    <div className="grid grid-cols-2 gap-x-3 gap-y-(--spacing-content) lg:grid-cols-3">
      {otherPages.map((page) => (
        <Link
          key={page.href}
          href={page.href}
          className="group flex flex-col"
        >
          <Typography textRole="overline" as="span" className="truncate mb-1">
            {page.name}
          </Typography>
          <hr className="border-t border-border mb-2" />
          <div className="relative aspect-4/3 overflow-hidden rounded-lg border border-border">
            {page.imageUrl ? (
              <Image
                src={page.imageUrl}
                alt={page.name}
                fill
                sizes="(min-width: 1024px) 20vw, 30vw"
                className="object-cover"
              />
            ) : (
              <div className="size-full bg-muted" />
            )}
          </div>
        </Link>
      ))}
    </div>
  );

  // ── Non-arredo types (illuminazione, tessuto): simple indoor grid only ──
  if (!isArredo) {
    return (
      <div className="max-w-main mx-auto px-(--spacing-page)">
        {categories.length > 0 && (
          <HubSection title={tHub('exploreByTypology')} titleRole="overline">
            {indoorList}
          </HubSection>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-main mx-auto px-(--spacing-page) flex flex-col gap-(--spacing-content)">
      {/* ── Indoor — grid of subcategory thumbnails ─────────────────── */}
      {categories.length > 0 && (
        <div className="flex flex-col gap-2">
          <Typography textRole="overline" as="span">Indoor</Typography>
          <div className="overflow-hidden rounded-lg border border-border p-3">
            {indoorList}
          </div>
        </div>
      )}

      {/* ── Other pages — image cards ─────────────────────────────────── */}
      {otherPages.length > 0 && otherPagesList}

      {/* ── Cross-links (Illuminazione, Tappeti) ──────────────────────── */}
      {crossLinks.length > 0 && <SpecDeepDiveLinks links={crossLinks} />}
    </div>
  );
}
