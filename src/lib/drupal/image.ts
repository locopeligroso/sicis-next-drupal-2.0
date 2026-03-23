// ════════════════════════════════════════════════════════════════════════════
// §5  Image URL helper
// ════════════════════════════════════════════════════════════════════════════

/**
 * Extract image URL from a deserialized Drupal file--file relationship.
 *
 * The C1 entity endpoint returns absolute URLs in uri.url — no origin prefix needed.
 */
export function getDrupalImageUrl(field: unknown): string | null {
  if (!field || typeof field !== 'object') return null;
  const f = field as Record<string, unknown>;
  const uri = f.uri as Record<string, unknown> | undefined;
  const url = uri?.url;
  if (typeof url === 'string') return url;
  return null;
}
