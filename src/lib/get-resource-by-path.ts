/**
 * Custom path resolver for Drupal headless.
 *
 * Replaces next-drupal's getResourceByPath() which requires the
 * Drupal `subrequests` module (POST, non-cacheable).
 *
 * This implementation uses two GET requests (both cacheable with ISR):
 *   1. GET /router/translate-path?path=... → resolves path to entity type + JSON:API URL
 *   2. GET {jsonapi.individual}?include=... → fetches the full resource
 *
 * The JSON:API response is fully deserialized:
 * - attributes are flattened to top level
 * - relationships are resolved using the included array
 *
 * Architecture decision: Apollo (2026-03-16)
 * Refactored: Atlas (2026-03-17) — separated translatePath + fetchJsonApiResource,
 *   removed destructive retry on 400, removed automatic defaultInclude.
 */

const DRUPAL_BASE_URL =
  process.env.DRUPAL_BASE_URL ||
  process.env.NEXT_PUBLIC_DRUPAL_BASE_URL ||
  'http://localhost';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TranslatePathResponse {
  resolved: string;
  isHomePath: boolean;
  entity: {
    type: string;
    bundle: string;
    id: string;
    uuid: string;
    langcode: string;
    url: string;
    canonical: string;
  };
  jsonapi: {
    individual: string;
    resourceName: string;
    pathPrefix: string;
    basePath: string;
    entryPoint: string;
  };
  label: string;
  meta: Record<string, unknown>;
}

export interface DrupalResource {
  type: string;
  id: string;
  [key: string]: unknown;
}

export interface GetResourceByPathOptions {
  locale?: string;
  defaultLocale?: string;
  /** JSON:API include param — e.g. "field_blocchi,field_immagine" */
  include?: string;
  /** Additional JSON:API query params */
  params?: Record<string, string>;
  /** ISR revalidation time in seconds for the resource fetch (default: 60) */
  revalidate?: number;
}

export interface FetchJsonApiOptions {
  include?: string;
  params?: Record<string, string>;
  revalidate?: number;
}

export interface JsonApiResource {
  type: string;
  id: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, JsonApiRelationship>;
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

interface JsonApiRelationship {
  data: JsonApiResourceIdentifier | JsonApiResourceIdentifier[] | null;
  links?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

interface JsonApiResourceIdentifier {
  type: string;
  id: string;
  meta?: Record<string, unknown>;
}

// ── Deserialization ──────────────────────────────────────────────────────────

export function buildIncludedMap(
  included: JsonApiResource[] | undefined,
): Map<string, JsonApiResource> {
  const map = new Map<string, JsonApiResource>();
  if (!included) return map;
  for (const item of included) {
    map.set(`${item.type}:${item.id}`, item);
  }
  return map;
}

export function deserializeResource(
  resource: JsonApiResource,
  includedMap: Map<string, JsonApiResource>,
  depth = 0,
): Record<string, unknown> {
  // Prevent infinite recursion on circular references
  if (depth > 5) return { type: resource.type, id: resource.id };

  const result: Record<string, unknown> = {
    type: resource.type,
    id: resource.id,
  };

  // Flatten attributes to top level
  if (resource.attributes) {
    for (const [key, value] of Object.entries(resource.attributes)) {
      result[key] = value;
    }
  }

  // Resolve relationships using included map
  if (resource.relationships) {
    for (const [key, rel] of Object.entries(resource.relationships)) {
      if (!rel.data) {
        result[key] = null;
        continue;
      }

      if (Array.isArray(rel.data)) {
        result[key] = rel.data.map((ref) => {
          const included = includedMap.get(`${ref.type}:${ref.id}`);
          if (included) {
            return deserializeResource(included, includedMap, depth + 1);
          }
          return { type: ref.type, id: ref.id };
        });
      } else {
        const included = includedMap.get(`${rel.data.type}:${rel.data.id}`);
        if (included) {
          result[key] = deserializeResource(included, includedMap, depth + 1);
        } else {
          result[key] = { type: rel.data.type, id: rel.data.id };
        }
      }
    }
  }

  return result;
}

// ── translatePath ─────────────────────────────────────────────────────────────

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

// ── fetchJsonApiResource ──────────────────────────────────────────────────────

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

// ── getResourceByPath (backward-compatible wrapper) ───────────────────────────

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
