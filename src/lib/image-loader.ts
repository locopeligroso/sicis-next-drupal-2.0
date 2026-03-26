/**
 * Custom image loader for development.
 *
 * next/image's default loader rejects private IPs (192.168.x.x) for security.
 * In dev, we bypass this by returning the original URL with width as query param.
 * In production, the default Next.js loader handles optimization.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // For absolute URLs (Drupal images), return as-is with width hint
  if (src.startsWith('http')) {
    return src;
  }
  // For relative URLs (public/ images), let Next.js handle them
  return `${src}?w=${width}&q=${quality ?? 75}`;
}
