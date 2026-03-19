// ════════════════════════════════════════════════════════════════════════════
// §4  Core fetch functions (translatePath, fetchJsonApiResource, getResourceByPath)
// ════════════════════════════════════════════════════════════════════════════

import { DRUPAL_BASE_URL } from './config';
import type {
  TranslatePathResponse,
  DrupalResource,
  FetchJsonApiOptions,
  GetResourceByPathOptions,
  JsonApiResource,
} from './types';
import { buildIncludedMap, deserializeResource } from './deserializer';

/**
 * Resolves a Drupal path to entity metadata via decoupled_router.
 * Returns null if the path does not resolve to any entity (404).
 */
export async function translatePath(
  path: string,
  locale?: string,
): Promise<TranslatePathResponse | null> {
  const localePrefix = locale ? `/${locale}` : '';
  const translateUrl = new URL(
    `${DRUPAL_BASE_URL}${localePrefix}/router/translate-path`,
  );
  translateUrl.searchParams.set('path', path);

  try {
    const translateRes = await fetch(translateUrl.toString(), {
      headers: { Accept: 'application/json' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: { revalidate: 3600 },
    } as any);

    if (translateRes.status === 404) return null;

    if (!translateRes.ok) {
      throw new Error(
        `[decoupled_router] translate-path failed: ${translateRes.status} for path "${path}"`,
      );
    }

    const translated: TranslatePathResponse = await translateRes.json();

    if (!translated?.jsonapi?.individual) {
      console.warn(
        `[decoupled_router] No jsonapi.individual for path "${path}"`,
      );
      return null;
    }

    return translated;
  } catch (err) {
    if (err instanceof Error && err.message.includes('translate-path failed'))
      throw err;
    throw new Error(
      `[decoupled_router] Network error for "${path}": ${String(err)}`,
    );
  }
}

/**
 * Fetches and deserializes a JSON:API resource from a known individual URL.
 *
 * The include parameter should contain ONLY fields valid for the target
 * content type. Use getIncludeFields(bundle) from node-resolver.ts.
 * No retry logic — caller is responsible for correct includes.
 */
export async function fetchJsonApiResource(
  jsonApiUrl: string,
  options: FetchJsonApiOptions = {},
): Promise<DrupalResource | null> {
  const { include, params = {}, revalidate = 60 } = options;

  // Build resource URL from the individual URL, rebased on DRUPAL_BASE_URL
  const individualUrl = new URL(jsonApiUrl);
  const resourceUrl = new URL(
    individualUrl.pathname + individualUrl.search,
    DRUPAL_BASE_URL,
  );

  if (include) {
    resourceUrl.searchParams.set('include', include);
  }

  for (const [key, value] of Object.entries(params)) {
    resourceUrl.searchParams.set(key, value);
  }

  let resourceJson: { data: JsonApiResource; included?: JsonApiResource[] };

  try {
    const resourceRes = await fetch(resourceUrl.toString(), {
      headers: { Accept: 'application/vnd.api+json' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: { revalidate },
    } as any);

    if (resourceRes.status === 404) return null;

    if (!resourceRes.ok) {
      const body = await resourceRes.text().catch(() => '');
      console.error(
        `[jsonapi] Fetch failed: ${resourceRes.status} for "${resourceUrl.toString()}"`,
        body.substring(0, 200),
      );
      throw new Error(
        `[jsonapi] Resource fetch failed: ${resourceRes.status} for "${resourceUrl.toString()}"`,
      );
    }

    resourceJson = await resourceRes.json();
  } catch (err) {
    if (err instanceof Error && err.message.includes('[jsonapi]')) throw err;
    throw new Error(
      `[jsonapi] Network error for "${jsonApiUrl}": ${String(err)}`,
    );
  }

  if (!resourceJson?.data) {
    console.warn(`[jsonapi] No data in response for "${jsonApiUrl}"`);
    return null;
  }

  const includedMap = buildIncludedMap(resourceJson.included);
  const deserialized = deserializeResource(resourceJson.data, includedMap);

  return deserialized as DrupalResource;
}

/**
 * Convenience wrapper: resolves a Drupal path and fetches the resource.
 *
 * For the catch-all slug page, prefer calling translatePath() and
 * fetchJsonApiResource() separately to use bundle-specific includes.
 */
export async function getResourceByPath(
  path: string,
  options: GetResourceByPathOptions = {},
): Promise<DrupalResource | null> {
  const { locale, include, params, revalidate = 60 } = options;

  const translated = await translatePath(path, locale);
  if (!translated) return null;

  return fetchJsonApiResource(translated.jsonapi.individual, {
    include,
    params,
    revalidate,
  });
}
