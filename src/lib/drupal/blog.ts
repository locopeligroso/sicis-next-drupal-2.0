// ════════════════════════════════════════════════════════════════════════════
// §11  Blog listing functions (articolo + news + tutorial)
// ════════════════════════════════════════════════════════════════════════════

import { cache } from 'react';
import { DRUPAL_BASE_URL, DRUPAL_ORIGIN } from './config';

export interface BlogCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  type: 'articolo' | 'news' | 'tutorial';
  created: string;
}

export interface BlogResult {
  posts: BlogCard[];
  total: number;
}

type BlogContentType = 'articolo' | 'news' | 'tutorial';

const BLOG_CONTENT_TYPES: BlogContentType[] = ['articolo', 'news', 'tutorial'];

async function fetchBlogType(
  contentType: BlogContentType,
  locale: string,
): Promise<BlogCard[]> {
  const localePrefix = locale ? `/${locale}` : '';
  const nodeType = `node--${contentType}`;
  const url = new URL(`${DRUPAL_BASE_URL}${localePrefix}/jsonapi/node/${contentType}`);

  url.searchParams.set(
    `fields[${nodeType}]`,
    'title,field_titolo_main,field_immagine,path,created',
  );

  url.searchParams.set('include', 'field_immagine');
  url.searchParams.set('filter[status]', '1');
  url.searchParams.set('sort', '-created');

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/vnd.api+json' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: { revalidate: 300 },
    } as any);

    if (!res.ok) {
      console.error(`[fetchBlogType] HTTP ${res.status}`, { contentType, locale, url: url.toString() });
      return [];
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

    return (json.data ?? []).map(
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
          type: contentType,
          created: (attrs?.created as string) ?? '',
        };
      },
    );
  } catch (err) {
    console.error(`[fetchBlogType] Network error`, { contentType, locale, error: err instanceof Error ? err.message : err });
    return [];
  }
}

export const fetchBlogPosts = cache(async (
  locale = 'it',
  limit = 48,
  offset = 0,
): Promise<BlogResult> => {
  try {
    // Fetch all three content types in parallel
    const results = await Promise.all(
      BLOG_CONTENT_TYPES.map((type) => fetchBlogType(type, locale)),
    );

    // Merge and sort by created date (newest first)
    const allPosts = results
      .flat()
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    const total = allPosts.length;

    // Apply pagination
    const posts = allPosts.slice(offset, offset + limit);

    return { posts, total };
  } catch (err) {
    console.error(`[fetchBlogPosts] Error`, { locale, limit, offset, error: err instanceof Error ? err.message : err });
    return { posts: [], total: 0 };
  }
});
