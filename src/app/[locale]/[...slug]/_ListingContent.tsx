import { notFound } from 'next/navigation';
import { getSectionConfigAsync } from '@/domain/routing/section-config';
import { deslugify } from '@/domain/filters/registry';
import { resolvePath } from '@/lib/api/resolve-path';
import { ARREDO_INDOOR_PARENT_NID } from '@/lib/api/category-hub';
import { renderProductListing } from '@/lib/render-product-listing';

interface ListingContentProps {
  singleSlug: string;
  slug: string[];
  locale: string;
  searchParams:
    | Promise<Record<string, string | string[]> | undefined>
    | undefined;
  drupalPath: string;
}

export async function ListingContent({
  singleSlug,
  slug,
  locale,
  searchParams,
  drupalPath,
}: ListingContentProps) {
  const sp = await searchParams;
  const sectionConfig = await getSectionConfigAsync(slug, locale);
  if (!sectionConfig) {
    notFound();
  }

  const CATEGORY_HUB_TYPES = new Set([
    'prodotto_arredo',
    'prodotto_illuminazione',
    'prodotto_tessuto',
  ]);
  let hubParentNid: number | undefined;
  let resolvedCategoryNid: number | undefined;

  if (CATEGORY_HUB_TYPES.has(sectionConfig.productType)) {
    if (sectionConfig.productType === 'prodotto_arredo') {
      hubParentNid = ARREDO_INDOOR_PARENT_NID;
    } else {
      // For illuminazione/tessili: always resolve base slug to get parent NID
      // e.g. /lighting → NID 337, /textiles → NID 350
      const basePath = `/${slug[0]}`;
      const baseResolved = await resolvePath(basePath, locale);
      if (baseResolved) hubParentNid = baseResolved.nid;
    }

    // When a subcategory is active (e.g. /lighting/floor-lamps),
    // use the parent hub NID as resolvedCategoryNid so render-product-listing
    // can show sibling subcategories in the sidebar.
    // Drupal doesn't have path aliases for subcategory pages (e.g. /lighting/floor-lamps),
    // so we use the parent NID directly — the sibling fallback in render-product-listing
    // then fetches children of the parent.
    if (
      sectionConfig.filterField &&
      sectionConfig.filterValue &&
      hubParentNid
    ) {
      resolvedCategoryNid = hubParentNid;
    }
  }

  return renderProductListing({
    productType: sectionConfig.productType,
    title: deslugify(singleSlug),
    slug,
    searchParams: sp,
    locale,
    hubParentNid,
    resolvedCategoryNid,
  });
}
