import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { fetchMenu, transformMenuToNavItems } from '@/lib/drupal';
import { mapMenuToNavbar } from '@/lib/navbar/menu-mapper';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import { resolvePath } from '@/lib/api/resolve-path';
import { apiGet } from '@/lib/api/client';
import type { SecondaryLink } from './types';

interface HubLinks {
  deepDiveLinks: SecondaryLink[];
  crossLinks: SecondaryLink[];
}

/**
 * Given a page URL, resolve its NID, fetch its blocks, and if the page
 * contains a `blocco_e`, return the referenced pages as individual links.
 * Otherwise return the original link unchanged.
 */
async function expandDeepDiveLink(
  link: SecondaryLink,
  locale: string,
): Promise<SecondaryLink[]> {
  try {
    // Strip locale prefix to get the path alias (e.g. "/info-tecniche-arredo")
    const urlPath = link.url.replace(new RegExp(`^/${locale}`), '');
    const resolved = await resolvePath(urlPath, locale);
    if (!resolved?.nid) return [link];

    const blocks = await apiGet<
      { type: string; field_elementi_tecnici?: { nid: number; field_titolo_main: string; aliases: Record<string, string> }[] }[]
    >(`/${locale}/blocks/${resolved.nid}`, {}, 1800);

    if (!blocks || !Array.isArray(blocks)) return [link];

    // Find a blocco_e with referenced pages
    const bloccoE = blocks.find(
      (b) => b.type === 'blocco_e' && Array.isArray(b.field_elementi_tecnici) && b.field_elementi_tecnici.length > 0,
    );

    if (!bloccoE) return [link];

    return bloccoE.field_elementi_tecnici!.map((page) => ({
      title: page.field_titolo_main,
      url: `/${locale}${page.aliases[locale] ?? page.aliases['it'] ?? ''}`,
    }));
  } catch {
    return [link];
  }
}

/**
 * Returns the secondary links and cross-links from the Filter & Find mega-menu
 * for a given product type. Used in hub pages for the "Approfondimenti" and
 * "Scopri anche" sections.
 *
 * Deep dive links that point to pages containing a `blocco_e` are expanded:
 * instead of showing a single link (e.g. "Info tecniche"), the individual
 * referenced pages are shown (e.g. "Libreria cataloghi", "Certificazioni").
 *
 * Two-layer cache:
 * - unstable_cache (ISR): persists the result across requests for 3600s.
 * - React.cache(): deduplicates identical calls within the same render pass.
 */
const _getHubLinksISR = unstable_cache(
  async (productType: string, locale: string): Promise<HubLinks> => {
    const config = FILTER_REGISTRY[productType];
    if (!config) return { deepDiveLinks: [], crossLinks: [] };

    const menu = await fetchMenu('main', locale);
    const menuItems = transformMenuToNavItems(menu, locale);
    const navbarMenu = mapMenuToNavbar(menuItems);

    const basePath = config.basePaths[locale] ?? config.basePaths['it'];

    const category = navbarMenu.filterFind.items.find((cat) => {
      const url = cat.item.url;
      return url.endsWith(`/${basePath}`) || url.endsWith(`/${basePath}/`);
    });

    const rawLinks = category?.secondaryLinks ?? [];

    // Expand each link: if it points to a page with blocco_e, unpack its children
    const expandedArrays = await Promise.all(
      rawLinks.map((link) => expandDeepDiveLink(link, locale)),
    );
    const deepDiveLinks = expandedArrays.flat();

    return {
      deepDiveLinks,
      crossLinks: category?.crossLinks ?? [],
    };
  },
  ['hub-links'],
  { revalidate: 3600, tags: ['menu', 'hub-links'] },
);

export const getHubLinks = cache(
  (productType: string, locale: string): Promise<HubLinks> =>
    _getHubLinksISR(productType, locale),
);

/** @deprecated Use getHubLinks instead */
export const getHubDeepDiveLinks = cache(
  async (productType: string, locale: string): Promise<SecondaryLink[]> => {
    const { deepDiveLinks } = await _getHubLinksISR(productType, locale);
    return deepDiveLinks;
  },
);
