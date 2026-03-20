// ════════════════════════════════════════════════════════════════════════════
// §14  Subcategory listing functions
// ════════════════════════════════════════════════════════════════════════════

import { cache } from 'react';
import { DRUPAL_BASE_URL, DRUPAL_ORIGIN } from './config';

export interface SubcategoryCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
}

export interface SubcategoriesResult {
  subcategories: SubcategoryCard[];
  total: number;
}

/**
 * Fetches node--categoria entities whose field_categoria points to a parent categoria.
 * Used for hub categories like "Illuminazione" that have child categories
 * (Lampade da tavolo, Lampadari, etc.) instead of direct products.
 *
 * @param parentUuid - UUID of the parent node--categoria entity
 * @param locale - Active locale code
 */
export const fetchSubcategories = cache(
  async (parentUuid: string, locale = 'it'): Promise<SubcategoriesResult> => {
    const localePrefix = locale ? `/${locale}` : '';
    const url = new URL(
      `${DRUPAL_BASE_URL}${localePrefix}/jsonapi/node/categoria`,
    );

    url.searchParams.set('page[limit]', '50');
    url.searchParams.set(
      'fields[node--categoria]',
      'title,field_titolo_main,field_immagine,path',
    );
    url.searchParams.set('include', 'field_immagine');
    url.searchParams.set('filter[status]', '1');
    url.searchParams.set('filter[field_categoria.id]', parentUuid);
    url.searchParams.set('sort', 'title');

    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/vnd.api+json' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        next: { revalidate: 300 },
      } as any);

      if (!res.ok) {
        console.error(`[fetchSubcategories] HTTP ${res.status}`, {
          parentUuid,
          locale,
        });
        return { subcategories: [], total: 0 };
      }

      const json = await res.json();

      const fileMap = new Map<string, string>();
      for (const item of json.included ?? []) {
        if (item.type === 'file--file') {
          const uriUrl = item.attributes?.uri?.url;
          if (uriUrl) {
            fileMap.set(item.id, `${DRUPAL_ORIGIN}${uriUrl}`);
          }
        }
      }

      const subcategories: SubcategoryCard[] = (json.data ?? []).map(
        (item: Record<string, unknown>) => {
          const attrs = item.attributes as Record<string, unknown>;
          const rels = item.relationships as Record<string, unknown>;

          const imgRel = (rels?.field_immagine as Record<string, unknown>)
            ?.data as { id: string } | null;
          const imageUrl = imgRel ? (fileMap.get(imgRel.id) ?? null) : null;

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

      const total = (json.meta?.count as number) ?? subcategories.length;

      return { subcategories, total };
    } catch (err) {
      console.error(`[fetchSubcategories] Network error`, {
        parentUuid,
        locale,
        error: err instanceof Error ? err.message : err,
      });
      return { subcategories: [], total: 0 };
    }
  },
);
