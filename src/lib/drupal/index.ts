/**
 * Drupal client barrel — re-exports from remaining modules.
 *
 * Data fetching has moved to `src/lib/api/` (REST endpoints).
 * This barrel now only exports:
 *   - config.ts   (DRUPAL_BASE_URL)
 *   - image.ts    (getDrupalImageUrl)
 *   - menu.ts     (fetchMenu, transformMenuToNavItems, MenuItem)
 */

export * from './config';
export * from './image';
export * from './menu';
