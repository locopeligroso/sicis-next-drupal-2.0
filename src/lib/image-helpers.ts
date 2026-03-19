const PUBLIC_DRUPAL_URL =
  (process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || 'http://localhost')
    .replace(/\/$/, ''); // strip trailing slash

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
    const origin = new URL(PUBLIC_DRUPAL_URL).origin;
    return `${origin}${url}`;
  }

  // Fallback: direct url field
  if (typeof f.url === 'string') {
    const url = f.url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const origin = new URL(PUBLIC_DRUPAL_URL).origin;
    return `${origin}${url}`;
  }

  return null;
}
