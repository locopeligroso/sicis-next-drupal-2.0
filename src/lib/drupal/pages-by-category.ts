// ════════════════════════════════════════════════════════════════════════════
// §12  Pages-by-category listing functions
// ════════════════════════════════════════════════════════════════════════════

import { cache } from 'react';
import { DRUPAL_BASE_URL, DRUPAL_ORIGIN } from './config';

export interface PageCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
}

export interface PagesByCategoryResult {
  pages: PageCard[];
  total: number;
}

/**
 * Fetches published node--page entities filtered by field_categoria.
 * Used by node--categoria pages that are not product categories
 * (e.g. "Mosaico Artistico", "Mosaico in Marmo").
 *
 * @param categoriaUuid - UUID of the node--categoria entity to filter by
 * @param locale - Active locale code
 * @param limit - Max items per page
 * @param offset - Pagination offset
 */
export const fetchPagesByCategory = cache(async (
  categoriaUuid: string,
  locale = 'it',
  limit = 48,
  offset = 0,
): Promise<PagesByCategoryResult> => {
  const localePrefix = locale ? `/${locale}` : '';
  const url = new URL(`${DRUPAL_BASE_URL}${localePrefix}/jsonapi/node/page`);

  url.searchParams.set('page[limit]', String(limit));
  url.searchParams.set('page[offset]', String(offset));
  url.searchParams.set(
    'fields[node--page]',
    'title,field_titolo_main,field_immagine,field_blocchi,path',
  );
  // Include direct image + first paragraph image as fallback for preview
  url.searchParams.set('include', 'field_immagine,field_blocchi.field_immagine');
  url.searchParams.set('filter[status]', '1');
  url.searchParams.set('filter[field_categoria.id]', categoriaUuid);
  url.searchParams.set('sort', 'title');

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/vnd.api+json' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: { revalidate: 300 },
    } as any);

    if (!res.ok) {
      console.error(`[fetchPagesByCategory] HTTP ${res.status}`, { categoriaUuid, locale, limit, offset });
      return { pages: [], total: 0 };
    }

    const json = await res.json();

    // Build included file map: file uuid → absolute image URL
    const fileMap = new Map<string, string>();
    for (const item of json.included ?? []) {
      if (item.type === 'file--file') {
        const uriUrl = item.attributes?.uri?.url;
        if (uriUrl) {
          fileMap.set(item.id, `${DRUPAL_ORIGIN}${uriUrl}`);
        }
      }
    }

    const pages: PageCard[] = (json.data ?? []).map(
      (item: Record<string, unknown>) => {
        const attrs = item.attributes as Record<string, unknown>;
        const rels = item.relationships as Record<string, unknown>;

        // Try direct field_immagine first, then fallback to first paragraph image
        const imgRel = (rels?.field_immagine as Record<string, unknown>)
          ?.data as { id: string } | null;
        let imageUrl = imgRel ? (fileMap.get(imgRel.id) ?? null) : null;

        if (!imageUrl) {
          // Fallback: find first image from field_blocchi paragraphs
          const blocchi = (rels?.field_blocchi as Record<string, unknown>)
            ?.data as Array<{ id: string; type: string }> | null;
          if (blocchi) {
            for (const blocco of blocchi) {
              // Look up this paragraph in included data to find its field_immagine
              const includedParagraph = (json.included ?? []).find(
                (inc: Record<string, unknown>) => inc.id === blocco.id,
              );
              if (includedParagraph) {
                const pRels = includedParagraph.relationships as Record<string, unknown> | undefined;
                const pImg = (pRels?.field_immagine as Record<string, unknown>)
                  ?.data as { id: string } | null;
                if (pImg) {
                  imageUrl = fileMap.get(pImg.id) ?? null;
                  if (imageUrl) break;
                }
              }
            }
          }
        }

        const pathObj = attrs?.path as { alias?: string } | null;

        return {
          id: item.id as string,
          title:
            (attrs?.field_titolo_main as string) ||
            (attrs?.title as string) ||
            '',
          imageUrl,
          path: pathObj?.alias ?? null,
        };
      },
    );

    const total = (json.meta?.count as number) ?? pages.length;

    return { pages, total };
  } catch (err) {
    console.error(`[fetchPagesByCategory] Network error`, { categoriaUuid, locale, error: err instanceof Error ? err.message : err });
    return { pages: [], total: 0 };
  }
});
