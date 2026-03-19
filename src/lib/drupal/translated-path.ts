// ════════════════════════════════════════════════════════════════════════════
// §11  Translated path resolution
// ════════════════════════════════════════════════════════════════════════════

import { DRUPAL_BASE_URL } from './config';
import type { TranslatePathResponse } from './types';
import { translatePath } from './core';

/**
 * Given a Drupal path alias and locale context, resolves the translated URL
 * for a target locale using a two-step entity resolution:
 *
 *   Step 1: Resolve path in CURRENT locale → get entity UUID + type
 *   Step 2: Fetch entity in TARGET locale via JSON:API → get translated path alias
 *
 * Returns null if:
 * - The path is not a Drupal entity (listing pages, filter pages)
 * - The entity has no translation in the target locale
 * - The entity has no path alias in the target locale
 * - Network/API error
 *
 * Caller should fall back to `/${targetLocale}` when null is returned.
 *
 * Architecture decision: Apollo (2026-03-18) — two-step entity resolution
 */
export async function getTranslatedPath(
  drupalPath: string,
  currentLocale: string,
  targetLocale: string,
): Promise<string | null> {
  try {
    // Normalize path — ensure leading slash
    const normalizedPath = drupalPath.startsWith('/')
      ? drupalPath
      : `/${drupalPath}`;

    // ── Step 1: Resolve entity in CURRENT locale ──────────────────────
    // This gives us the entity UUID, type, and bundle — all locale-independent
    let resolved: TranslatePathResponse | null;
    try {
      resolved = await translatePath(normalizedPath, currentLocale);
    } catch {
      // Path doesn't resolve to an entity (listing page, 404, etc.)
      return null;
    }

    if (!resolved?.entity?.uuid || !resolved?.jsonapi?.resourceName) {
      return null;
    }

    const { entity, jsonapi } = resolved;

    // ── Step 2: Fetch entity path in TARGET locale via JSON:API ───────
    // resourceName is e.g. "node--prodotto_mosaico" or "taxonomy_term--vetrite_collezioni"
    // JSON:API URL path uses slashes: /jsonapi/node/prodotto_mosaico/{uuid}
    const [entityType, ...bundleParts] = jsonapi.resourceName.split('--');
    const bundle = bundleParts.join('--'); // handles edge case of double-dash in bundle name

    if (!entityType || !bundle) {
      return null;
    }

    const targetUrl = new URL(
      `${DRUPAL_BASE_URL}/${targetLocale}/jsonapi/${entityType}/${bundle}/${entity.uuid}`,
    );
    targetUrl.searchParams.set(`fields[${jsonapi.resourceName}]`, 'path');

    const targetRes = await fetch(targetUrl.toString(), {
      headers: { Accept: 'application/vnd.api+json' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: { revalidate: 3600 },
    } as any);

    // 404 = entity has no translation in target locale
    if (!targetRes.ok) {
      return null;
    }

    const targetData = (await targetRes.json()) as {
      data?: {
        attributes?: {
          path?: {
            alias?: string | null;
            langcode?: string;
          };
        };
      };
    };

    const alias = targetData?.data?.attributes?.path?.alias;
    if (!alias) {
      // Entity exists in target locale but has no path alias
      return null;
    }

    // Return the full localized path: e.g. "/it/mosaico/blends/sulcis"
    return `/${targetLocale}${alias}`;
  } catch {
    return null;
  }
}
