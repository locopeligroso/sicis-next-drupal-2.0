import { cache } from 'react';
import { apiGet } from './client';

// ── Public shape ─────────────────────────────────────────────────────────────

/**
 * A single paragraph block returned by the blocks/{nid} endpoint.
 *
 * NOTE: `type` is stored here with the `paragraph--` prefix already prepended
 * (see normalizeBlock). ParagraphResolver expects this prefix.
 */
export interface BlockItem {
  type: string;
  pid: number;
  [key: string]: unknown;
}

// ── Image field normalizer ────────────────────────────────────────────────────

/**
 * The blocks endpoint returns `field_immagine*` values as plain URL strings,
 * e.g. `"https://...jpg"`. ParagraphResolver adapters expect the C1 object
 * shape: `{ type: "file--file", uri: { url }, meta: { alt, width, height } }`.
 *
 * This function converts any `field_immagine*` key that holds a non-empty
 * string to that shape — all other values are left untouched.
 */
function normalizeImageFields(item: Record<string, unknown>): void {
  for (const key of Object.keys(item)) {
    // Convert plain image URL strings to C1 file object shape
    if (key.startsWith('field_immagine')) {
      if (typeof item[key] === 'string' && item[key]) {
        item[key] = {
          type: 'file--file',
          uri: { url: item[key] as string },
          // Default 4:3 dimensions so GalleryCarousel can compute --slide-ratio
          // (width: 0, height: 0 causes aspect-[var(--slide-ratio)] to collapse)
          meta: { alt: '', width: 1200, height: 900 },
        };
      }
      continue;
    }

    // Recurse into nested arrays (e.g. field_elementi, field_slide, field_documenti)
    // to normalize their image fields too
    if (Array.isArray(item[key])) {
      for (const child of item[key] as unknown[]) {
        if (child && typeof child === 'object' && !Array.isArray(child)) {
          normalizeImageFields(child as Record<string, unknown>);
        }
      }
    }
  }
}

// ── Block normalizer ──────────────────────────────────────────────────────────

/**
 * Raw block item as returned by Drupal — `type` has no `paragraph--` prefix.
 */
interface RawBlockItem {
  type: string;
  pid: number;
  [key: string]: unknown;
}

function normalizeBlock(raw: RawBlockItem): BlockItem {
  // Shallow-copy so we don't mutate the original response object
  const item: Record<string, unknown> = { ...raw };

  // Prepend `paragraph--` prefix expected by ParagraphResolver
  item['type'] = `paragraph--${raw.type}`;

  // Convert plain image URL strings to C1 image object shape
  normalizeImageFields(item);

  return item as BlockItem;
}

// ── Fetcher ───────────────────────────────────────────────────────────────────

/**
 * Fetches the paragraph blocks associated with a node by NID.
 *
 * Endpoint: `/{locale}/api/v1/blocks/{nid}`
 *
 * Normalizations applied to each block:
 *  - `type` gains a `paragraph--` prefix (e.g. `"blocco_intro"` → `"paragraph--blocco_intro"`)
 *  - `field_immagine*` plain URL strings are converted to the C1 file object shape
 *
 * Returns an empty array when the node has no blocks or the request fails.
 *
 * Revalidate: 300s (editorial content)
 */
export const fetchBlocks = cache(
  async (nid: number, locale: string): Promise<BlockItem[]> => {
    const result = await apiGet<RawBlockItem[]>(
      `/${locale}/blocks/${nid}`,
      {},
      300,
    );
    if (!result) return [];
    return result.map(normalizeBlock);
  },
);
