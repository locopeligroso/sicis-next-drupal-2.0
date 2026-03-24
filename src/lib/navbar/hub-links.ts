import { cache } from 'react';
import { fetchMenu, transformMenuToNavItems } from '@/lib/drupal';
import { mapMenuToNavbar } from '@/lib/navbar/menu-mapper';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import type { SecondaryLink } from './types';

/**
 * Returns the secondary links from the Filter & Find mega-menu
 * for a given product type. Used in hub pages for the "Approfondimenti" section.
 *
 * Matches the menu category by comparing its URL to the product type's basePath.
 * Uses React.cache() for request-level deduplication.
 */
export const getHubDeepDiveLinks = cache(
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
);
