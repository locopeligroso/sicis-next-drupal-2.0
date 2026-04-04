import { cache } from 'react';
import {
  apiGet,
  stripDomain,
  stripLocalePrefix,
  emptyToNull,
  resolveImage,
  type ResolvedImage,
} from './client';

// Re-export card types that match the old interface shapes (used by legacy listing components)
export type { EnvironmentCard } from './types';
export type { EnvironmentCard as AmbienteCard } from './types';

// ── Raw REST response interfaces (Drupal field names) ────────────────────────

interface RawEnvironmentItem {
  nid: string;
  field_titolo_main: string;
  field_immagine: string | null;
  field_categoria_ambiente?: string | null;
  view_node: string;
}

interface RawShowroomItem {
  nid: string;
  field_titolo_main: string;
  field_citta?: string | null;
  view_node: string;
}

interface RawArticleItem {
  nid: string;
  field_titolo_main: string;
  field_data: string;
  field_immagine_anteprima: string | null;
  view_node: string;
  field_categoria_blog: { nid: number; field_titolo_main: string } | null;
}

interface RawNewsItem {
  nid: string;
  field_titolo_main: string;
  field_data: string;
  field_immagine_anteprima: string | null;
  view_node: string;
}

interface RawTutorialItem {
  nid: string;
  field_titolo_main: string;
  field_immagine: string | null;
  field_id_video?: string | null;
  field_categoria_video?: string | null;
  view_node: string;
}

interface RawProjectItem {
  nid: string;
  field_titolo_main: string;
  field_immagine: string | null;
  field_tipologia?: string | null;
  field_categoria_progetto?: { tid: number; name: string } | null;
  view_node: string;
  field_collegamento_esterno?: string | null;
}

// Documents endpoint is confirmed dead (404) but we keep the fetcher intact.
// Shape is unknown — using a permissive raw type.
interface RawDocumentItem {
  nid: string;
  field_titolo_main?: string;
  title?: string;
  field_immagine?: string | null;
  field_tipologia_documento?: string | null;
  field_categoria_documento?: string | null;
  field_collegamento_esterno?: string | null;
  view_node?: string | null;
  [key: string]: unknown;
}

// ── Public card types (output shapes used by components) ─────────────────────

/**
 * Legacy-compatible ShowroomCard shape.
 * The REST API only returns nid, title, city, and view_node.
 * Remaining fields default to null for legacy component compatibility.
 */
export interface ShowroomCard {
  id: string;
  title: string;
  image: ResolvedImage | null;
  path: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  mapsUrl: string | null;
}

/**
 * Blog category extracted from articles endpoint.
 * There is no separate categories endpoint — categories are derived from articles data.
 */
export interface BlogCategory {
  nid: number;
  name: string;
}

/**
 * Legacy-compatible BlogCard shape.
 * Matches `src/lib/drupal/blog.ts` → `BlogCard`.
 * categoryNid/categoryName are populated only for articolo type.
 */
export interface BlogCard {
  id: string;
  title: string;
  image: ResolvedImage | null;
  path: string | null;
  type: 'articolo' | 'news' | 'tutorial';
  created: string;
  categoryNid: number | null;
  categoryName: string | null;
}

export interface BlogResult {
  posts: BlogCard[];
  total: number;
}

/**
 * Legacy-compatible ProgettoCard shape.
 * Matches `src/lib/drupal/projects.ts` → `ProgettoCard`.
 */
export interface ProgettoCard {
  id: string;
  title: string;
  image: ResolvedImage | null;
  /** External link (field_collegamento_esterno) or internal path fallback */
  path: string | null;
  categoryTid: number | null;
  categoryName: string | null;
}

export interface ProjectsResult {
  projects: ProgettoCard[];
  total: number;
}

/**
 * Legacy-compatible DocumentCard shape.
 * Matches `src/lib/drupal/documents.ts` → `DocumentCard`.
 */
export interface DocumentCard {
  id: string;
  title: string;
  image: ResolvedImage | null;
  path: string | null;
  externalUrl: string | null;
  documentType: string | null;
  category: string | null;
}

export interface DocumentsResult {
  documents: DocumentCard[];
  total: number;
}

// ── environments endpoint ────────────────────────────────────────────────────

export const fetchEnvironments = cache(
  async (locale = 'it', limit = 48, offset = 0) => {
    const items = await apiGet<RawEnvironmentItem[]>(
      `/${locale}/environments`,
      {},
      1800,
    );
    if (!items || !Array.isArray(items)) return { environments: [], total: 0 };
    const total = items.length;
    const paginated = items.slice(offset, offset + limit);
    return {
      environments: paginated.map((item) => ({
        id: item.nid,
        title: item.field_titolo_main,
        image: resolveImage(item.field_immagine),
        path: stripLocalePrefix(stripDomain(item.view_node)),
      })),
      total,
    };
  },
);

// ── showrooms endpoint ───────────────────────────────────────────────────────

export const fetchShowrooms = cache(
  async (locale = 'it', limit = 48, offset = 0) => {
    const items = await apiGet<RawShowroomItem[]>(
      `/${locale}/showrooms`,
      {},
      1800,
    );
    if (!items || !Array.isArray(items))
      return { showrooms: [] as ShowroomCard[], total: 0 };
    const total = items.length;
    const paginated = items.slice(offset, offset + limit);
    return {
      showrooms: paginated.map(
        (item): ShowroomCard => ({
          id: item.nid,
          title: item.field_titolo_main,
          path: stripLocalePrefix(stripDomain(item.view_node)),
          image: null,
          address: null,
          city: item.field_citta ?? null,
          area: null,
          phone: null,
          email: null,
          mapsUrl: null,
        }),
      ),
      total,
    };
  },
);

// ── articles endpoint ────────────────────────────────────────────────────────

/**
 * Internal helper used by fetchBlogPosts aggregate.
 * Returns all articles as BlogResult (posts+total shape).
 * Not exported — use fetchArticles for public access.
 */
const _fetchArticlesBlog = cache(async (locale = 'it'): Promise<BlogResult> => {
  const items = await apiGet<RawArticleItem[]>(`/${locale}/articles`, {}, 1800);
  if (!items || !Array.isArray(items)) return { posts: [], total: 0 };
  return {
    posts: items.map(
      (item): BlogCard => ({
        id: item.nid,
        title: item.field_titolo_main.replace(/&amp;/g, '&'),
        image: resolveImage(item.field_immagine_anteprima),
        path: stripLocalePrefix(stripDomain(item.view_node)),
        type: 'articolo',
        created: item.field_data,
        categoryNid: item.field_categoria_blog?.nid ?? null,
        categoryName:
          item.field_categoria_blog?.field_titolo_main?.replace(
            /&amp;/g,
            '&',
          ) ?? null,
      }),
    ),
    total: items.length,
  };
});

/** Raw shape from /api/v1/categories-blog and /api/v1/tags endpoints */
interface RawBlogFilterItem {
  nid: string;
  field_titolo_main: string;
}

export interface BlogTag {
  nid: number;
  name: string;
  path?: string | null;
}

/**
 * Fetches blog categories from the dedicated categories-blog endpoint.
 */
export const fetchBlogCategories = cache(
  async (locale = 'it'): Promise<BlogCategory[]> => {
    const items = await apiGet<RawBlogFilterItem[]>(
      `/${locale}/categories-blog`,
      {},
      3600,
    );
    if (!items || !Array.isArray(items)) return [];
    return items.map((item) => ({
      nid: Number(item.nid),
      name: item.field_titolo_main.replace(/&amp;/g, '&'),
    }));
  },
);

/** Slugify a title for path alias resolution */
function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Fetches blog tags. Tries the dedicated /tags endpoint first,
 * falls back to hardcoded NID list via content/{nid} if endpoint is down.
 * Resolves path aliases via slugified title + resolvePath.
 */
export const fetchBlogTags = cache(
  async (locale = 'it'): Promise<BlogTag[]> => {
    // Try dedicated endpoint first
    let items = await apiGet<RawBlogFilterItem[]>(`/${locale}/tags`, {}, 3600);

    // Fallback: fetch each known tag NID via content endpoint
    if (!items || !Array.isArray(items) || items.length === 0) {
      const TAG_NIDS = [3206, 3204, 3203, 3202, 3207, 3205, 3201, 3208];
      const contentResults = await Promise.all(
        TAG_NIDS.map((nid) =>
          apiGet<{ nid: string; field_titolo_main: string }[]>(
            `/${locale}/content/${nid}`,
            {},
            3600,
          ),
        ),
      );
      items = contentResults
        .filter(
          (r): r is { nid: string; field_titolo_main: string }[] =>
            Array.isArray(r) && r.length > 0,
        )
        .map((r) => ({
          nid: r[0].nid,
          field_titolo_main: r[0].field_titolo_main,
        }));
    }

    if (!items || items.length === 0) return [];

    // Resolve path aliases in parallel via slugified titles
    const { resolvePath } = await import('./resolve-path');
    const tags = await Promise.all(
      items.map(async (item) => {
        const nid = Number(item.nid);
        const name = item.field_titolo_main.replace(/&amp;/g, '&');
        const slug = slugifyTitle(name);
        let path: string | null = null;
        try {
          const resolved = await resolvePath(`/${slug}`, locale);
          if (resolved?.nid === nid) {
            path = resolved.aliases?.[locale] ?? `/${slug}`;
          }
        } catch {
          // slug doesn't match — path stays null
        }
        return { nid, name, path };
      }),
    );

    return tags;
  },
);

/**
 * Fetches articles only (excludes news and tutorials).
 * Supports optional categoryNid filter and client-side pagination.
 */
export const fetchArticles = cache(
  async (
    locale = 'it',
    limit = 48,
    offset = 0,
    categoryNid?: number,
  ): Promise<{ articles: BlogCard[]; total: number }> => {
    const items = await apiGet<RawArticleItem[]>(
      `/${locale}/articles`,
      {},
      1800,
    );
    if (!items || !Array.isArray(items)) return { articles: [], total: 0 };
    const filtered =
      categoryNid !== undefined
        ? items.filter((item) => item.field_categoria_blog?.nid === categoryNid)
        : items;
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    return {
      articles: paginated.map(
        (item): BlogCard => ({
          id: item.nid,
          title: item.field_titolo_main.replace(/&amp;/g, '&'),
          image: resolveImage(item.field_immagine_anteprima),
          path: stripLocalePrefix(stripDomain(item.view_node)),
          type: 'articolo',
          created: item.field_data,
          categoryNid: item.field_categoria_blog?.nid ?? null,
          categoryName:
            item.field_categoria_blog?.field_titolo_main?.replace(
              /&amp;/g,
              '&',
            ) ?? null,
        }),
      ),
      total,
    };
  },
);

// ── news endpoint ────────────────────────────────────────────────────────────

export const fetchNews = cache(async (locale = 'it'): Promise<BlogResult> => {
  const items = await apiGet<RawNewsItem[]>(`/${locale}/news`, {}, 1800);
  if (!items || !Array.isArray(items)) return { posts: [], total: 0 };
  return {
    posts: items.map(
      (item): BlogCard => ({
        id: item.nid,
        title: item.field_titolo_main,
        image: resolveImage(item.field_immagine_anteprima),
        path: stripLocalePrefix(stripDomain(item.view_node)),
        type: 'news',
        created: item.field_data,
        categoryNid: null,
        categoryName: null,
      }),
    ),
    total: items.length,
  };
});

/**
 * Fetches news items only (excludes articles and tutorials).
 * Supports client-side pagination.
 */
export const fetchNewsItems = cache(
  async (
    locale = 'it',
    limit = 48,
    offset = 0,
  ): Promise<{ news: BlogCard[]; total: number }> => {
    const items = await apiGet<RawNewsItem[]>(`/${locale}/news`, {}, 1800);
    if (!items || !Array.isArray(items)) return { news: [], total: 0 };
    const total = items.length;
    const paginated = items.slice(offset, offset + limit);
    return {
      news: paginated.map(
        (item): BlogCard => ({
          id: item.nid,
          title: item.field_titolo_main,
          image: resolveImage(item.field_immagine_anteprima),
          path: stripLocalePrefix(stripDomain(item.view_node)),
          type: 'news',
          created: item.field_data,
          categoryNid: null,
          categoryName: null,
        }),
      ),
      total,
    };
  },
);

// ── tutorials endpoint ───────────────────────────────────────────────────────

export const fetchTutorials = cache(
  async (locale = 'it'): Promise<BlogResult> => {
    const items = await apiGet<RawTutorialItem[]>(
      `/${locale}/tutorials`,
      {},
      1800,
    );
    if (!items || !Array.isArray(items)) return { posts: [], total: 0 };
    return {
      posts: items.map(
        (item): BlogCard => ({
          id: item.nid,
          title: item.field_titolo_main,
          image: resolveImage(item.field_immagine),
          path: stripLocalePrefix(stripDomain(item.view_node)),
          type: 'tutorial',
          // tutorials have no field_data — use empty string as fallback
          created: '',
          categoryNid: null,
          categoryName: null,
        }),
      ),
      total: items.length,
    };
  },
);

// ── tutorial card types ──────────────────────────────────────────────────────

export interface TutorialCard {
  id: string;
  title: string;
  image: ResolvedImage | null;
  videoId: string | null;
  path: string | null;
  category: string | null; // "vetrite" or "mosaico"
  tipologiaTid: number | null; // will be populated when Freddi adds the field
}

export interface TutorialTipologia {
  tid: number;
  name: string;
}

// ── tutorial-tipologie endpoint ──────────────────────────────────────────────

export const fetchTutorialTipologie = cache(
  async (locale = 'it'): Promise<TutorialTipologia[]> => {
    const items = await apiGet<
      { tid: string; name: string; view_taxonomy_term: string }[]
    >(`/${locale}/tutorial-tipologie`, {}, 3600);
    if (!items || !Array.isArray(items)) return [];
    return items.map((item) => ({
      tid: Number(item.tid),
      name: item.name.replace(/&amp;/g, '&'),
    }));
  },
);

// ── tutorials by category ────────────────────────────────────────────────────

/**
 * Fetches tutorials filtered by category ("vetrite" or "mosaico"),
 * with optional tipologia filter (ready for when Freddi adds field_tipologia).
 */
export const fetchTutorialsByCategory = cache(
  async (
    locale = 'it',
    category: 'vetrite' | 'mosaico',
    limit = 48,
    offset = 0,
    tipologiaTid?: number,
  ): Promise<{ tutorials: TutorialCard[]; total: number }> => {
    const items = await apiGet<RawTutorialItem[]>(
      `/${locale}/tutorials`,
      {},
      1800,
    );
    if (!items || !Array.isArray(items)) return { tutorials: [], total: 0 };

    let filtered = items.filter(
      (item) => item.field_categoria_video === category,
    );

    // Tipologia filter — ready for when Freddi adds field_tipologia to tutorials API
    // if (tipologiaTid !== undefined) {
    //   filtered = filtered.filter(item => item.field_tipologia?.tid === tipologiaTid);
    // }

    // Suppress unused-variable warning until the filter is activated
    void tipologiaTid;

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    return {
      tutorials: paginated.map(
        (item): TutorialCard => ({
          id: item.nid,
          title: item.field_titolo_main.replace(/&amp;/g, '&'),
          image: resolveImage(item.field_immagine),
          videoId: emptyToNull(item.field_id_video),
          path: stripLocalePrefix(stripDomain(item.view_node)),
          category: item.field_categoria_video ?? null,
          tipologiaTid: null, // placeholder until field_tipologia is added
        }),
      ),
      total,
    };
  },
);

// ── blog aggregate (articles + news + tutorials) ─────────────────────────────

export const fetchBlogPosts = cache(
  async (locale = 'it', limit = 48, offset = 0): Promise<BlogResult> => {
    // Fetch all 3 types in parallel — total is small (29+12+43 = 84 items),
    // so we fetch everything from each endpoint and paginate client-side.
    const [articles, news, tutorials] = await Promise.all([
      _fetchArticlesBlog(locale),
      fetchNews(locale),
      fetchTutorials(locale),
    ]);

    // Merge and sort newest first.
    // field_data is ISO 8601 date string — string comparison works correctly.
    // Tutorials have no date so they sort to the end (empty string).
    const allPosts = [
      ...articles.posts,
      ...news.posts,
      ...tutorials.posts,
    ].sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
    );

    const total = articles.total + news.total + tutorials.total;

    // Apply client-side pagination
    const paginated = allPosts.slice(offset, offset + limit);

    return { posts: paginated, total };
  },
);

// ── project categories ──────────────────────────────────────────────────────

interface RawProjectCategory {
  tid: string;
  name: string;
  view_taxonomy_term: string;
}

export interface ProjectCategory {
  tid: number;
  name: string;
}

export const fetchProjectCategories = cache(
  async (locale = 'it'): Promise<ProjectCategory[]> => {
    const items = await apiGet<RawProjectCategory[]>(
      `/${locale}/project-categories`,
      {},
      3600,
    );
    if (!items || !Array.isArray(items)) return [];
    return items.map((item) => ({
      tid: Number(item.tid),
      name: item.name.replace(/&amp;/g, '&'),
    }));
  },
);

// ── projects endpoint ───────────────────────────────────────────────────────

export const fetchProjects = cache(
  async (
    locale = 'it',
    limit = 48,
    offset = 0,
    categoryTid?: number,
  ): Promise<ProjectsResult> => {
    const items = await apiGet<RawProjectItem[]>(
      `/${locale}/projects`,
      {},
      1800,
    );
    if (!items || !Array.isArray(items)) return { projects: [], total: 0 };
    let filtered = items;
    if (categoryTid !== undefined) {
      filtered = items.filter(
        (item) => item.field_categoria_progetto?.tid === categoryTid,
      );
    }
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    return {
      projects: paginated.map(
        (item): ProgettoCard => ({
          id: item.nid,
          title: item.field_titolo_main.replace(/&amp;/g, '&'),
          image: resolveImage(item.field_immagine),
          path:
            emptyToNull(item.field_collegamento_esterno) ??
            stripLocalePrefix(stripDomain(item.view_node)),
          categoryTid: item.field_categoria_progetto?.tid ?? null,
          categoryName:
            item.field_categoria_progetto?.name?.replace(/&amp;/g, '&') ?? null,
        }),
      ),
      total,
    };
  },
);

// ── documents endpoint ──────────────────────────────────────────────────────
// NOTE: This endpoint is confirmed dead (404) on the current Drupal instance.
// The fetcher is kept for forward compatibility — it returns empty arrays safely.

export const fetchDocuments = cache(
  async (locale = 'it', limit = 48, offset = 0): Promise<DocumentsResult> => {
    const items = await apiGet<RawDocumentItem[]>(
      `/${locale}/documents`,
      {},
      1800,
    );
    if (!items || !Array.isArray(items)) return { documents: [], total: 0 };
    const total = items.length;
    const paginated = items.slice(offset, offset + limit);
    return {
      documents: paginated.map(
        (item): DocumentCard => ({
          id: item.nid,
          title: (item.field_titolo_main ?? item.title ?? '') as string,
          image: resolveImage(item.field_immagine),
          path: item.view_node
            ? stripLocalePrefix(stripDomain(item.view_node as string))
            : null,
          externalUrl: (item.field_collegamento_esterno ?? null) as
            | string
            | null,
          documentType: (item.field_tipologia_documento ?? null) as
            | string
            | null,
          category: (item.field_categoria_documento ?? null) as string | null,
        }),
      ),
      total,
    };
  },
);
