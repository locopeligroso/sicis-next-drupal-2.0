import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  fetchHubCategories,
  ARREDO_INDOOR_PARENT_NID,
} from '@/lib/api/category-hub';
import { HubSection } from '@/components/composed/HubSection';
import { Typography } from '@/components/composed/Typography';

/**
 * NFC-normalize + lowercase + slugify a category name.
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
  const categories = await fetchHubCategories(indoorNid, locale);

  if (categories.length === 0) return null;

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

  // ── Non-arredo types (illuminazione, tessuto): simple indoor grid only ──
  if (!isArredo) {
    return (
      <div className="max-w-main mx-auto px-(--spacing-page)">
        <HubSection title={tHub('exploreByTypology')} titleRole="overline">
          {indoorList}
        </HubSection>
      </div>
    );
  }

  return (
    <div className="max-w-main mx-auto px-(--spacing-page)">
      <div className="flex flex-col gap-2">
        <Typography textRole="overline" as="span">{tHub('indoor')}</Typography>
        <div className="overflow-hidden rounded-lg border border-border p-3">
          {indoorList}
        </div>
      </div>
    </div>
  );
}
