import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { fetchMenu, transformMenuToNavItems } from '@/lib/drupal';
import { mapMenuToNavbar } from '@/lib/navbar/menu-mapper';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import type { SecondaryLink } from './types';

/**
 * Returns the secondary links from the Filter & Find mega-menu
 * for a given product type. Used in hub pages for the "Approfondimenti" section.
 *
 * Two-layer cache:
 * - unstable_cache (ISR): persists the result across requests for 3600s.
 *   Prevents menu re-parsing on every ISR revalidation cycle.
 * - React.cache(): deduplicates identical calls within the same render pass
 *   (e.g. when both generateMetadata and SlugPage call this with the same args).
 */
const _getHubDeepDiveLinksISR = unstable_cache(
  async (productType: string, locale: string): Promise<SecondaryLink[]> => {
    const config = FILTER_REGISTRY[productType];
    if (!config) return [];

    const menu = await fetchMenu('main', locale);
    const menuItems = transformMenuToNavItems(menu, locale);
    const navbarMenu = mapMenuToNavbar(menuItems);

    const basePath = config.basePaths[locale] ?? config.basePaths['it'];

    const category = navbarMenu.filterFind.items.find((cat) => {
      const url = cat.item.url;
      return url.endsWith(`/${basePath}`) || url.endsWith(`/${basePath}/`);
    });

    return category?.secondaryLinks ?? [];
  },
  ['hub-deep-dive-links'],
  { revalidate: 3600, tags: ['menu', 'hub-links'] },
);

export const getHubDeepDiveLinks = cache(
  (productType: string, locale: string): Promise<SecondaryLink[]> =>
    _getHubDeepDiveLinksISR(productType, locale),
);
