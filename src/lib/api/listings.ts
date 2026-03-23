import { cache } from 'react';
import { apiGet, stripDomain, emptyToNull } from './client';
import type {
  PaginatedResponse,
  EnvironmentCard,
  ShowroomCard as RestShowroomCard,
  BlogCard as RestBlogCard,
  ProjectCard as RestProjectCard,
  DocumentCard as RestDocumentCard,
} from './types';

// Re-export card types that match the old interface shapes (used by legacy listing components)
export type { EnvironmentCard as AmbienteCard } from './types';

/**
 * Legacy-compatible ShowroomCard shape.
 * The REST API returns `gmapsUrl`; legacy components expect `mapsUrl`.
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

// V7: Environments
export const fetchEnvironments = cache(
  async (locale = 'it', limit = 48, offset = 0) => {
    const page = Math.floor(offset / limit);
    const result = await apiGet<PaginatedResponse<EnvironmentCard>>(
      `/${locale}/environments`,
      { items_per_page: limit, page },
      300,
    );
    if (!result) return { environments: [] as EnvironmentCard[], total: 0 };
    return {
      environments: result.items.map((item) => ({
        ...item,
        path: stripDomain(item.path),
        imageUrl: emptyToNull(item.imageUrl),
      })),
      total: result.total,
    };
  },
);

// V8: Showrooms
export const fetchShowrooms = cache(
  async (locale = 'it', limit = 48, offset = 0) => {
    const result = await apiGet<PaginatedResponse<RestShowroomCard>>(
      `/${locale}/showrooms`,
      {},
      300,
    );
    if (!result) return { showrooms: [] as ShowroomCard[], total: 0 };
    return {
      showrooms: result.items.map((item): ShowroomCard => ({
        id: item.id,
        title: item.title,
        path: stripDomain(item.path),
        imageUrl: emptyToNull(item.imageUrl),
        address: item.address,
        city: item.city,
        area: item.area,
        phone: item.phone,
        email: item.email ?? null,
        mapsUrl: item.gmapsUrl ?? null,
      })),
      total: result.total,
    };
  },
);

// ── Legacy-compatible card types ────────────────────────────────────────────

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
 * REST `ProjectCard` has `category`; legacy components don't use it.
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
 * REST `DocumentCard` has `fileUrl`; legacy components don't use it.
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

// ── V5: Blog ────────────────────────────────────────────────────────────────

/**
 * Convert Unix timestamp string to ISO 8601 string.
 * Drupal REST returns `created` as a Unix timestamp (e.g. "1772451555").
 * Legacy components expect ISO 8601 for `new Date(dateString)`.
 */
function unixToIso(timestamp: string): string {
  const seconds = parseInt(timestamp, 10);
  if (isNaN(seconds)) return timestamp;
  return new Date(seconds * 1000).toISOString();
}

export const fetchBlogPosts = cache(
  async (locale = 'it', limit = 48, offset = 0): Promise<BlogResult> => {
    const page = Math.floor(offset / limit);
    const result = await apiGet<PaginatedResponse<RestBlogCard>>(
      `/${locale}/blog`,
      { items_per_page: limit, page },
      300,
    );
    if (!result) return { posts: [], total: 0 };
    return {
      posts: result.items.map((item): BlogCard => ({
        id: item.id,
        title: item.title,
        imageUrl: emptyToNull(item.imageUrl),
        path: stripDomain(item.path),
        type: item.type,
        created: unixToIso(item.created),
      })),
      total: result.total,
    };
  },
);

// ── V6: Projects ────────────────────────────────────────────────────────────

export const fetchProjects = cache(
  async (locale = 'it', limit = 48, offset = 0): Promise<ProjectsResult> => {
    const page = Math.floor(offset / limit);
    const result = await apiGet<PaginatedResponse<RestProjectCard>>(
      `/${locale}/projects`,
      { items_per_page: limit, page },
      300,
    );
    if (!result) return { projects: [], total: 0 };
    return {
      projects: result.items.map((item): ProgettoCard => ({
        id: item.id,
        title: item.title,
        imageUrl: emptyToNull(item.imageUrl),
        path: stripDomain(item.path),
      })),
      total: result.total,
    };
  },
);

// ── V9: Documents ───────────────────────────────────────────────────────────

export const fetchDocuments = cache(
  async (locale = 'it', limit = 48, offset = 0): Promise<DocumentsResult> => {
    const page = Math.floor(offset / limit);
    const result = await apiGet<PaginatedResponse<RestDocumentCard>>(
      `/${locale}/documents`,
      { items_per_page: limit, page },
      300,
    );
    if (!result) return { documents: [], total: 0 };
    return {
      documents: result.items.map((item): DocumentCard => ({
        id: item.id,
        title: item.title,
        imageUrl: emptyToNull(item.imageUrl),
        path: stripDomain(item.path),
        externalUrl: item.externalUrl ?? null,
        documentType: item.documentType ?? null,
        category: item.category ?? null,
      })),
      total: result.total,
    };
  },
);
