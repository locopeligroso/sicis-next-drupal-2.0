import { cache } from 'react';
import { apiGet } from './client';
import type { EntityResponse } from './types';

/**
 * Fetches a fully-resolved entity by its Drupal path alias.
 *
 * entity endpoint ⚠️ LEGACY: `/{locale}/api/v1/entity?path={path}`
 *
 * Replaces the two-step translatePath + fetchJsonApiResource pattern.
 * The response includes pre-resolved relationships and paragraphs —
 * no INCLUDE_MAP or secondary fetches needed.
 *
 * @param path   - Drupal path alias WITHOUT locale prefix (e.g. `/mosaico/pluma/01-bora`)
 * @param locale - Active locale code (e.g. `'it'`, `'en'`)
 * @returns EntityResponse with `meta` (type, bundle, id, uuid, locale, path) and `data` (all fields),
 *          or `null` if the path does not resolve to an entity.
 */
export const fetchEntity = cache(
  async (path: string, locale: string): Promise<EntityResponse | null> => {
    return apiGet<EntityResponse>(`/${locale}/entity`, { path }, 60);
  },
);
