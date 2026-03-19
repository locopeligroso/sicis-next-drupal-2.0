// ════════════════════════════════════════════════════════════════════════════
// §5  Image URL helper
// ════════════════════════════════════════════════════════════════════════════

import { DRUPAL_ORIGIN } from './config';

/**
 * Extract image URL from a deserialized Drupal file--file relationship.
 *
 * Drupal JSON:API returns uri.url as a path already relative to the server root,
 * e.g. "/www.sicis.com_aiweb/httpdocs/sites/default/files/image.jpg"
 * We prepend only the origin (protocol + host), not the full base URL.
 */
export function getDrupalImageUrl(field: unknown): string | null {
  if (!field || typeof field !== 'object') return null;
  const f = field as Record<string, unknown>;

  // After resolver deserialization: { type: 'file--file', uri: { url: '/www.../sites/...' } }
  const uri = f.uri as { url?: string; value?: string } | undefined;

  if (uri?.url) {
    const url = uri.url;
    // If already absolute, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // uri.url is a root-relative path — prepend only the origin
    return `${DRUPAL_ORIGIN}${url}`;
  }

  // Fallback: direct url field
  if (typeof f.url === 'string') {
    const url = f.url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${DRUPAL_ORIGIN}${url}`;
  }

  return null;
}
