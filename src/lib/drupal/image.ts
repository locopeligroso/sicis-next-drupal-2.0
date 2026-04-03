// ════════════════════════════════════════════════════════════════════════════
// §5  Image URL helper
// ════════════════════════════════════════════════════════════════════════════

import { resolveImageUrl } from '@/lib/api/client';

/**
 * Extract image URL from any Drupal image field shape.
 *
 * Handles all formats:
 *   - string: "https://...foto.jpg" (blocks endpoint, legacy)
 *   - { url, width, height } (blocks endpoint, new Freddi format)
 *   - { uri: { url } } (entity/content endpoint)
 *
 * Delegates to resolveImageUrl for unified handling.
 */
export function getDrupalImageUrl(field: unknown): string | null {
  return resolveImageUrl(field);
}
