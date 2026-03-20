// ════════════════════════════════════════════════════════════════════════════
// §12  Showroom listing functions
// ════════════════════════════════════════════════════════════════════════════

import { cache } from 'react';
import { DRUPAL_BASE_URL, DRUPAL_ORIGIN } from './config';

export interface ShowroomCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  mapsUrl: string | null;
}

export interface ShowroomsResult {
  showrooms: ShowroomCard[];
  total: number;
}

export const fetchShowrooms = cache(
  async (locale = 'it', limit = 48, offset = 0): Promise<ShowroomsResult> => {
    const localePrefix = locale ? `/${locale}` : '';
    const url = new URL(
      `${DRUPAL_BASE_URL}${localePrefix}/jsonapi/node/showroom`,
    );

    url.searchParams.set('page[limit]', String(limit));
    url.searchParams.set('page[offset]', String(offset));
    // Actual Drupal fields: field_titolo_main, field_indirizzo, field_telefono,
    // field_indirizzo_email, field_citta, field_area, field_collegamento_gmaps,
    // field_gallery (images relationship — NOT field_immagine)
    url.searchParams.set(
      'fields[node--showroom]',
      'title,field_titolo_main,path,field_indirizzo,field_telefono,field_indirizzo_email,field_citta,field_area,field_collegamento_gmaps,field_gallery',
    );
    // field_gallery contains the showroom images (array of file--file)
    url.searchParams.set('include', 'field_gallery');
    url.searchParams.set('filter[status]', '1');
    url.searchParams.set('sort', 'title');

    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/vnd.api+json' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        next: { revalidate: 300 },
      } as any);

      if (!res.ok) {
        console.error(`[fetchShowrooms] HTTP ${res.status}`, {
          locale,
          limit,
          offset,
          url: url.toString(),
        });
        return { showrooms: [], total: 0 };
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

      const showrooms: ShowroomCard[] = (json.data ?? []).map(
        (item: Record<string, unknown>) => {
          const attrs = item.attributes as Record<string, unknown>;
          const rels = item.relationships as Record<string, unknown>;

          // Use first image from field_gallery as preview
          const galleryRel = (rels?.field_gallery as Record<string, unknown>)
            ?.data as Array<{ id: string }> | null;
          const firstImageId = galleryRel?.[0]?.id;
          const imageUrl = firstImageId
            ? (fileMap.get(firstImageId) ?? null)
            : null;

          const pathObj = attrs?.path as { alias?: string } | null;

          return {
            id: item.id as string,
            title:
              (attrs?.field_titolo_main as string) ||
              (attrs?.title as string) ||
              '',
            imageUrl,
            path: pathObj?.alias ?? null,
            address: (attrs?.field_indirizzo as string) ?? null,
            city: (attrs?.field_citta as string) ?? null,
            area: (attrs?.field_area as string) ?? null,
            phone: (attrs?.field_telefono as string) ?? null,
            email: (attrs?.field_indirizzo_email as string) ?? null,
            mapsUrl: (attrs?.field_collegamento_gmaps as string) ?? null,
          };
        },
      );

      const total = (json.meta?.count as number) ?? showrooms.length;

      return { showrooms, total };
    } catch (err) {
      console.error(`[fetchShowrooms] Network error`, {
        locale,
        limit,
        offset,
        error: err instanceof Error ? err.message : err,
      });
      return { showrooms: [], total: 0 };
    }
  },
);
