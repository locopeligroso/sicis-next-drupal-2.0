// ════════════════════════════════════════════════════════════════════════════
// §12  Document listing functions
// ════════════════════════════════════════════════════════════════════════════

import { cache } from 'react';
import { DRUPAL_BASE_URL, DRUPAL_ORIGIN } from './config';

export interface DocumentCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  externalUrl: string | null;
  documentType: string | null;
  category: string | null;
}

export interface DocumentsResult {
  documents: DocumentCard[];
  total: number;
}

export const fetchDocuments = cache(async (
  locale = 'it',
  limit = 48,
  offset = 0,
): Promise<DocumentsResult> => {
  const localePrefix = locale ? `/${locale}` : '';
  const url = new URL(`${DRUPAL_BASE_URL}${localePrefix}/jsonapi/node/documento`);

  url.searchParams.set('page[limit]', String(limit));
  url.searchParams.set('page[offset]', String(offset));
  url.searchParams.set(
    'fields[node--documento]',
    'title,field_titolo_main,field_immagine,path,field_collegamento_esterno,field_tipologia_documento,field_categoria_documento',
  );
  url.searchParams.set('include', 'field_immagine');
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
      console.error(`[fetchDocuments] HTTP ${res.status}`, { locale, limit, offset, url: url.toString() });
      return { documents: [], total: 0 };
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

    const documents: DocumentCard[] = (json.data ?? []).map(
      (item: Record<string, unknown>) => {
        const attrs = item.attributes as Record<string, unknown>;
        const rels = item.relationships as Record<string, unknown>;

        const imgRel = (rels?.field_immagine as Record<string, unknown>)
          ?.data as { id: string } | null;
        const imageUrl = imgRel ? (fileMap.get(imgRel.id) ?? null) : null;

        const pathObj = attrs?.path as { alias?: string } | null;

        // External URL: may be a link field object { uri, title } or a plain string
        const extField = attrs?.field_collegamento_esterno as
          | { uri?: string }
          | string
          | null;
        let externalUrl: string | null = null;
        if (extField) {
          if (typeof extField === 'string') {
            externalUrl = extField;
          } else if (typeof extField === 'object' && extField.uri) {
            externalUrl = extField.uri;
          }
        }

        // Document type: plain string taxonomy label
        const documentType = (attrs?.field_tipologia_documento as string) ?? null;

        // Category: plain string taxonomy label
        const category = (attrs?.field_categoria_documento as string) ?? null;

        return {
          id: item.id as string,
          title:
            (attrs?.field_titolo_main as string) ||
            (attrs?.title as string) ||
            '',
          imageUrl,
          path: pathObj?.alias ?? null,
          externalUrl,
          documentType,
          category,
        };
      },
    );

    const total = (json.meta?.count as number) ?? documents.length;

    return { documents, total };
  } catch (err) {
    console.error(`[fetchDocuments] Network error`, { locale, limit, offset, error: err instanceof Error ? err.message : err });
    return { documents: [], total: 0 };
  }
});
