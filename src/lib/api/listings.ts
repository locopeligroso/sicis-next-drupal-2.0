import { cache } from 'react';
import { apiGet, stripDomain, emptyToNull } from './client';
import type {
  PaginatedResponse,
  EnvironmentCard,
  ShowroomCard as RestShowroomCard,
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
