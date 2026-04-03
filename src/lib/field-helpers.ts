/**
 * Field access helpers for Drupal JSON:API deserialized data.
 *
 * Drupal JSON:API returns fields in different shapes depending on field type:
 * - Plain text fields: plain string "value"
 * - Formatted text fields: { value: string, format: string, processed: string }
 * - Boolean fields: plain boolean
 * - Decimal/integer fields: plain number or string
 *
 * These helpers handle all cases transparently.
 */

/**
 * Extract a text value from a Drupal field that may be:
 * - a plain string (plain text fields)
 * - an object { value: string } (formatted text fields)
 * - null/undefined
 */
export function getTextValue(field: unknown): string | undefined {
  let raw: string | undefined;
  if (typeof field === 'string') raw = field;
  else if (field && typeof field === 'object') {
    const obj = field as Record<string, unknown>;
    if (typeof obj.value === 'string') raw = obj.value;
  }
  if (!raw) return undefined;
  // Strip HTML tags and trim whitespace (Drupal wraps titles in <p> tags)
  return raw.replace(/<[^>]*>/g, '').trim() || undefined;
}

/**
 * Extract processed HTML from a Drupal text field.
 * Falls back to plain value if no processed version exists.
 */
export function getProcessedText(field: unknown): string | undefined {
  if (typeof field === 'string') return field || undefined;
  if (field && typeof field === 'object') {
    const obj = field as Record<string, unknown>;
    if (typeof obj.processed === 'string') return obj.processed || undefined;
    if (typeof obj.value === 'string') return obj.value || undefined;
  }
  return undefined;
}

/**
 * Extract a boolean value from a Drupal field.
 * Handles both plain boolean and { value: boolean } shapes.
 */
/**
 * Extract the title from a Drupal node.
 * Tries field_titolo_main first, falls back to title.
 */
export function getTitle(node: Record<string, unknown>): string {
  return getTextValue(node.field_titolo_main) || getTextValue(node.title) || '';
}

/**
 * Extract the body HTML from a Drupal node.
 * Uses field_testo_main (processed text).
 */
export function getBody(node: Record<string, unknown>): string {
  return getProcessedText(node.field_testo_main) || '';
}

export function getBoolValue(field: unknown): boolean {
  if (typeof field === 'boolean') return field;
  if (field && typeof field === 'object') {
    const obj = field as Record<string, unknown>;
    if (typeof obj.value === 'boolean') return obj.value;
  }
  return false;
}
