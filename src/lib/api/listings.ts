import { cache } from 'react';
import { apiGet, stripDomain, stripLocalePrefix, emptyToNull } from './client';

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
  imageUrl: string | null;
  path: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  mapsUrl: string | null;
}

/**
 * Legacy-compatible BlogCard shape.
 * Matches `src/lib/drupal/blog.ts` → `BlogCard`.
 */
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

/**
 * Legacy-compatible ProgettoCard shape.
 * Matches `src/lib/drupal/projects.ts` → `ProgettoCard`.
 */
export interface ProgettoCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
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
        imageUrl: emptyToNull(item.field_immagine),
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
          imageUrl: null,
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

export const fetchArticles = cache(
  async (locale = 'it'): Promise<BlogResult> => {
    const items = await apiGet<RawArticleItem[]>(
      `/${locale}/articles`,
      {},
      1800,
    );
    if (!items || !Array.isArray(items)) return { posts: [], total: 0 };
    return {
      posts: items.map(
        (item): BlogCard => ({
          id: item.nid,
          title: item.field_titolo_main,
          imageUrl: emptyToNull(item.field_immagine_anteprima),
          path: stripLocalePrefix(stripDomain(item.view_node)),
          type: 'articolo',
          created: item.field_data,
        }),
      ),
      total: items.length,
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
        imageUrl: emptyToNull(item.field_immagine_anteprima),
        path: stripLocalePrefix(stripDomain(item.view_node)),
        type: 'news',
        created: item.field_data,
      }),
    ),
    total: items.length,
  };
});

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
          imageUrl: emptyToNull(item.field_immagine),
          path: stripLocalePrefix(stripDomain(item.view_node)),
          type: 'tutorial',
          // tutorials have no field_data — use empty string as fallback
          created: '',
        }),
      ),
      total: items.length,
    };
  },
);

// ── blog aggregate (articles + news + tutorials) ─────────────────────────────

export const fetchBlogPosts = cache(
  async (locale = 'it', limit = 48, offset = 0): Promise<BlogResult> => {
    // Fetch all 3 types in parallel — total is small (29+12+43 = 84 items),
    // so we fetch everything from each endpoint and paginate client-side.
    const [articles, news, tutorials] = await Promise.all([
      fetchArticles(locale),
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

// ── projects endpoint ───────────────────────────────────────────────────────

export const fetchProjects = cache(
  async (locale = 'it', limit = 48, offset = 0): Promise<ProjectsResult> => {
    const items = await apiGet<RawProjectItem[]>(
      `/${locale}/projects`,
      {},
      1800,
    );
    if (!items || !Array.isArray(items)) return { projects: [], total: 0 };
    const total = items.length;
    const paginated = items.slice(offset, offset + limit);
    return {
      projects: paginated.map(
        (item): ProgettoCard => ({
          id: item.nid,
          title: item.field_titolo_main,
          imageUrl: emptyToNull(item.field_immagine),
          path: stripLocalePrefix(stripDomain(item.view_node)),
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
          imageUrl: emptyToNull(
            item.field_immagine as string | null | undefined,
          ),
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
