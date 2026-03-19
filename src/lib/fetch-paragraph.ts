/**
 * Fetch a paragraph entity with nested includes from Drupal JSON:API.
 *
 * Used by paragraph components that need nested data (elements, slides)
 * which cannot be included at the node level (Drupal returns 400 for
 * 3-level deep includes like field_blocchi.field_elementi.field_immagine).
 *
 * Architecture decision: Apollo (2026-03-17)
 */

import {
  buildIncludedMap,
  deserializeResource,
} from './get-resource-by-path';

const DRUPAL_BASE_URL = (
  process.env.DRUPAL_BASE_URL ||
  process.env.NEXT_PUBLIC_DRUPAL_BASE_URL ||
  'http://localhost'
).replace(/\/$/, '');

/**
 * Include strings for paragraph types that need secondary fetches.
 * Maps paragraph type → JSON:API include string for nested relationships.
 */
const PARAGRAPH_INCLUDE: Record<string, string> = {
  'paragraph--blocco_slider_home':
    'field_elementi,field_elementi.field_immagine',
  'paragraph--blocco_gallery':
    'field_slide,field_slide.field_immagine',
  'paragraph--blocco_gallery_intro':
    'field_slide,field_slide.field_immagine',
  'paragraph--blocco_correlati':
    'field_elementi,field_elementi.field_immagine',
};

/**
 * Check if a paragraph type requires a secondary fetch for nested data.
 */
export function needsSecondaryFetch(paragraphType: string): boolean {
  return paragraphType in PARAGRAPH_INCLUDE;
}

/**
 * Fetch a paragraph with its nested includes resolved.
 *
 * @param paragraph - Deserialized paragraph with at least { type, id, langcode? }
 * @param options - Override include string or revalidate time
 * @returns Fully deserialized paragraph with nested data, or null on failure
 */
export async function fetchParagraph(
  paragraph: { type: string; id: string; [key: string]: unknown },
  options: {
    include?: string;
    revalidate?: number;
  } = {},
): Promise<Record<string, unknown> | null> {
  const { type, id } = paragraph;
  const bundle = type.replace('paragraph--', '');
  const locale = (paragraph.langcode as string) || 'en';
  const include = options.include ?? PARAGRAPH_INCLUDE[type];
  const revalidate = options.revalidate ?? 60;

  if (!include) {
    // No nested includes needed — return the paragraph as-is
    return paragraph as Record<string, unknown>;
  }

  const url = `${DRUPAL_BASE_URL}/${locale}/jsonapi/paragraph/${bundle}/${id}?include=${encodeURIComponent(include)}`;

  try {
    const res = await fetch(url, {
      next: { revalidate },
      headers: { Accept: 'application/vnd.api+json' },
    } as RequestInit);

    if (!res.ok) {
      console.error(
        `[fetchParagraph] ${res.status} for ${type}/${id}: ${res.statusText}`,
      );
      return null;
    }

    const json = await res.json();

    if (!json?.data) {
      console.error(`[fetchParagraph] No data in response for ${type}/${id}`);
      return null;
    }

    const includedMap = buildIncludedMap(json.included);
    return deserializeResource(json.data, includedMap);
  } catch (err) {
    console.error(`[fetchParagraph] Fetch failed for ${type}/${id}:`, err);
    return null;
  }
}
