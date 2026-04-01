import { getTranslations } from 'next-intl/server';

import type {
  FilterGroupConfig,
  ListingConfig,
} from '@/domain/filters/registry';
import type { SecondaryLink } from '@/lib/navbar/types';
import {
  fetchMosaicColors,
  fetchMosaicCollections,
} from '@/lib/api/mosaic-hub';
import {
  fetchVetriteColors,
  fetchVetriteCollections,
} from '@/lib/api/vetrite-hub';
import { HubSection } from '@/components/composed/HubSection';
import { CategoryCard } from '@/components/composed/CategoryCard';
import { ColorSwatchLink } from '@/components/composed/ColorSwatchLink';

interface SpecHubMosaicoProps {
  filterOptions: Record<string, unknown[]>;
  filters: Record<string, FilterGroupConfig>;
  listingConfig: ListingConfig;
  basePath: string;
  locale: string;
  productType: string;
  deepDiveLinks?: SecondaryLink[];
}

export async function SpecHubMosaico({
  listingConfig,
  locale,
  productType,
}: SpecHubMosaicoProps) {
  const tHub = await getTranslations('hub');

  // Fetch colors and collections from the correct endpoint per product type
  const [colors, rawCollections] = await Promise.all(
    productType === 'prodotto_vetrite'
      ? [fetchVetriteColors(locale), fetchVetriteCollections(locale)]
      : [fetchMosaicColors(locale), fetchMosaicCollections(locale)],
  );

  // Filter out sub-collection entries (e.g. "Neocolibrì – Barrels") —
  // these are taxonomy children that should not appear as top-level hub cards.
  // Guard against Drupal view changes that temporarily include sub-groups.
  const collections = rawCollections.filter(
    (c) => !c.name.includes(' – ') && !c.name.includes(' - '),
  );

  return (
    <div className="flex flex-col gap-(--spacing-section)">
      {/* ── Listing 1: Colori ──────────────────────────────────────────── */}
      {colors.length > 0 && (
        <HubSection title={tHub('exploreByColor')}>
          <div className="flex flex-wrap gap-4">
            {colors.map((color) => (
              <ColorSwatchLink
                key={color.name}
                label={color.name}
                imageUrl={color.imageUrl}
                href={color.href}
              />
            ))}
          </div>
        </HubSection>
      )}

      {/* ── Listing 2: Collezioni ──────────────────────────────────────── */}
      {collections.length > 0 && (
        <HubSection title={tHub('exploreByCollection')}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {collections.map((collection) => (
              <CategoryCard
                key={collection.name}
                title={collection.name}
                imageUrl={collection.imageUrl}
                href={collection.href}
                aspectRatio={listingConfig.categoryCardRatio}
              />
            ))}
          </div>
        </HubSection>
      )}
    </div>
  );
}
