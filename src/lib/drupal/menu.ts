// ════════════════════════════════════════════════════════════════════════════
// §6  Menu functions
// ════════════════════════════════════════════════════════════════════════════

import { cache } from 'react';
import { locales, toDrupalLocale } from '@/i18n/config';
import { DRUPAL_BASE_URL } from './config';

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  weight: number;
  children: MenuItem[];
}

export interface Menu {
  id: string;
  items: MenuItem[];
}

/**
 * Fetches a menu from Drupal for a specific locale.
 * Passing the locale prefix ensures Drupal returns path aliases in the
 * correct language (e.g. /mosaic/... for EN, /mosaico/... for IT).
 */
export const fetchMenu = cache(
  async (menuName: string, locale?: string): Promise<Menu | null> => {
    try {
      const drupalLocale = locale ? toDrupalLocale(locale) : undefined;
      const localePrefix = drupalLocale ? `/${drupalLocale}` : '';
      const url = `${DRUPAL_BASE_URL}${localePrefix}/api/menu/${menuName}`;

      const res = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!res.ok) {
        console.error(`[fetchMenu] HTTP ${res.status} for "${menuName}"`, {
          locale,
          url,
        });
        return null;
      }

      return res.json();
    } catch (error) {
      console.error(`[fetchMenu] Network error for "${menuName}"`, {
        locale,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  },
);

/**
 * Recursively transforms a single menu item and all its descendants.
 * Normalises URLs at every level so locale prefix is always correct.
 */
function transformItemRecursive(item: MenuItem, locale: string): MenuItem {
  return {
    ...item,
    url: normalizeUrl(item.url, locale),
    children: item.children.map((child) =>
      transformItemRecursive(child, locale),
    ),
  };
}

/**
 * Transforms Drupal menu to Header NavItem format.
 * Adds locale prefix to URLs at all nesting levels.
 */
export function transformMenuToNavItems(
  menu: Menu | null,
  locale: string,
): MenuItem[] {
  if (!menu?.items) return [];
  return menu.items.map((item) => transformItemRecursive(item, locale));
}

/**
 * Normalizes URL to include locale prefix.
 * Strips Drupal base path (e.g. /www.sicis.com_aiweb/httpdocs) and any
 * existing locale prefix before prepending the correct locale.
 */
function normalizeUrl(url: string, locale: string): string {
  if (!url || url === '<nolink>') return `/${locale}`;

  // 1. If absolute URL (http/https), return as-is (external link)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 2. Strip Drupal base path (e.g. /www.sicis.com_aiweb/httpdocs)
  const drupalBasePath = (() => {
    try {
      return new URL(
        process.env.DRUPAL_BASE_URL ||
          process.env.NEXT_PUBLIC_DRUPAL_BASE_URL ||
          'http://localhost',
      ).pathname.replace(/\/$/, '');
    } catch {
      return '';
    }
  })();

  if (drupalBasePath && url.startsWith(drupalBasePath)) {
    url = url.slice(drupalBasePath.length) || '/';
  }

  // 3. Strip existing locale prefix from Drupal URL (e.g. /en/, /it/)
  const localePattern = new RegExp(`^\\/(${locales.join('|')})(\\\/|$)`);
  url = url.replace(localePattern, '/');

  // translateBasePath removed — menu API returns locale-correct URLs when fetched per-locale

  // 5. Ensure leading slash
  if (!url.startsWith('/')) url = '/' + url;

  // 6. Add correct locale prefix
  return `/${locale}${url === '/' ? '' : url}`;
}
