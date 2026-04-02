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

    // Cross-links: Illuminazione + Tappeti
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

    otherPages.push({
      name: (illuminazioneContent?.field_titolo_main as string) ?? 'Illuminazione',
      imageUrl: emptyToNull(illuminazioneContent?.field_immagine as string | null | undefined),
      href: `/${locale}/${illuminazionePath}`,
    });
    otherPages.push({
      name: (carpetsContent?.field_titolo_main as string) ?? 'Carpets',
      imageUrl: emptyToNull(carpetsContent?.field_immagine as string | null | undefined),
      href: `/${locale}${carpetsAlias}`,
    });
  }

  // ── Indoor mini-card list (shared between desktop and mobile) ──
  const indoorList = (
    <div className="grid grid-cols-2 gap-2">
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
  );

  // ── Other pages card list (slightly larger cards) ──
  const otherPagesList = (
    <div className="grid grid-cols-2 gap-3">
      {otherPages.map((page) => (
        <Link
          key={page.href}
          href={page.href}
          className="flex items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
        >
          {page.imageUrl ? (
            <Image
              src={page.imageUrl}
              alt={page.name}
              width={64}
              height={64}
              className="size-16 shrink-0 rounded-md object-cover"
            />
          ) : (
            <span className="size-16 shrink-0 rounded-md bg-muted" />
          )}
          <Typography textRole="body-md" as="span" className="line-clamp-2 font-medium">
            {page.name}
          </Typography>
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
    <div className="max-w-main mx-auto px-(--spacing-page)">
      {/* ── Desktop: side-by-side ──────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-(--spacing-content)">
        {categories.length > 0 && (
          <HubSection title="Indoor" titleRole="overline">
            {indoorList}
          </HubSection>
        )}

        {otherPages.length > 0 && (
          <HubSection title={tHub('discoverAlso')} titleRole="overline" separator={false}>
            {otherPagesList}
          </HubSection>
        )}
      </div>

      {/* ── Mobile: stacked ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-(--spacing-section) lg:hidden">
        {categories.length > 0 && (
          <HubSection title="Indoor" titleRole="overline">
            {indoorList}
          </HubSection>
        )}

        {otherPages.length > 0 && (
          <HubSection title={tHub('discoverAlso')} titleRole="overline" separator={false}>
            {otherPagesList}
          </HubSection>
        )}
      </div>
    </div>
  );
}
