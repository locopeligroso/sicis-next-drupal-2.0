// ════════════════════════════════════════════════════════════════════════════
// §11  Environment listing functions
// ════════════════════════════════════════════════════════════════════════════

import { cache } from 'react';
import { DRUPAL_BASE_URL, DRUPAL_ORIGIN } from './config';

export interface AmbienteCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
}

export interface EnvironmentsResult {
  environments: AmbienteCard[];
  total: number;
}

export const fetchEnvironments = cache(async (
  locale = 'it',
  limit = 48,
  offset = 0,
): Promise<EnvironmentsResult> => {
  const localePrefix = locale ? `/${locale}` : '';
  const url = new URL(`${DRUPAL_BASE_URL}${localePrefix}/jsonapi/node/ambiente`);

  url.searchParams.set('page[limit]', String(limit));
  url.searchParams.set('page[offset]', String(offset));
  url.searchParams.set(
    'fields[node--ambiente]',
    'title,field_titolo_main,field_immagine,field_blocchi,path',
  );
  // Include direct image + first paragraph image as fallback for preview
  url.searchParams.set('include', 'field_immagine,field_blocchi.field_immagine');
  // Only published nodes
  url.searchParams.set('filter[status]', '1');
  // Sort by title
  url.searchParams.set('sort', 'title');

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/vnd.api+json' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: { revalidate: 300 },
    } as any);

    if (!res.ok) {
      console.error(`[fetchEnvironments] HTTP ${res.status}`, { locale, limit, offset, url: url.toString() });
      return { environments: [], total: 0 };
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

    const environments: AmbienteCard[] = (json.data ?? []).map(
      (item: Record<string, unknown>) => {
        const attrs = item.attributes as Record<string, unknown>;
        const rels = item.relationships as Record<string, unknown>;

        // Try direct field_immagine first, then fallback to first paragraph image
        const imgRel = (rels?.field_immagine as Record<string, unknown>)
          ?.data as { id: string } | null;
        let imageUrl = imgRel ? (fileMap.get(imgRel.id) ?? null) : null;

        if (!imageUrl) {
          const blocchi = (rels?.field_blocchi as Record<string, unknown>)
            ?.data as Array<{ id: string; type: string }> | null;
          if (blocchi) {
            for (const blocco of blocchi) {
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

    const total = (json.meta?.count as number) ?? environments.length;

    return { environments, total };
  } catch (err) {
    console.error(`[fetchEnvironments] Network error`, { locale, limit, offset, error: err instanceof Error ? err.message : err });
    return { environments: [], total: 0 };
  }
});
