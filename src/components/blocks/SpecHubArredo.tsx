import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowUpRight } from 'lucide-react';

import type { SecondaryLink } from '@/lib/navbar/types';
import { fetchHubCategories } from '@/lib/api/category-hub';
import { HubSection } from '@/components/composed/HubSection';
import { CategoryCard } from '@/components/composed/CategoryCard';
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
}

export async function SpecHubArredo({
  parentNid,
  basePath,
  locale,
  categoryCardRatio = '4/3',
  categoryImageFit = 'cover',
  deepDiveLinks = [],
}: SpecHubArredoProps) {
  const tHub = await getTranslations('hub');

  // Fetch categories from the new categories/{nid} endpoint
  const categories = await fetchHubCategories(parentNid, locale);

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
      {deepDiveSection}
    </div>
  );
}
