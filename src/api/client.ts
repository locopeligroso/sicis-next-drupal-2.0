import { DRUPAL_BASE_URL } from '@/config/drupal';

export type ApiError = {
  code: 'TIMEOUT' | 'NETWORK' | 'VALIDATION' | 'NOT_FOUND' | 'SERVER_ERROR';
  message: string;
  status?: number;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

/**
 * Centralised Drupal JSON:API fetch wrapper.
 *
 * Features:
 * - Single `DRUPAL_BASE_URL` source (replaces 6 duplicated definitions)
 * - Configurable timeout via `AbortController` (default 10 s)
 * - Typed discriminated-union result — no more `throw`/`null`/`console.error` mix
 * - Native `fetch()` for Next.js ISR request deduplication and cache tagging
 *
 * @param path - Relative path (e.g. `'/jsonapi/node/page'`) or absolute URL.
 *               Relative paths are prefixed with `DRUPAL_BASE_URL`.
 * @param init - Standard `RequestInit` options extended with Next.js `next` cache config.
 *               The `Accept: application/vnd.api+json` header is always set.
 * @param timeoutMs - Request timeout in milliseconds (default `10_000`)
 * @returns `ApiResult<T>` — `{ ok: true, data: T }` on success,
 *          or `{ ok: false, error: ApiError }` on timeout, network error, or HTTP error.
 * @example
 * const result = await drupalFetch<JsonApiResponse>('/jsonapi/node/page', {
 *   next: { revalidate: 600, tags: ['page'] },
 * });
 * if (result.ok) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error.code, result.error.message);
 * }
 */
export async function drupalFetch<T = unknown>(
  path: string,
  init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {},
  timeoutMs = 10_000,
): Promise<ApiResult<T>> {
  const url = path.startsWith('http') ? path : `${DRUPAL_BASE_URL}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.api+json',
        ...init.headers,
      },
      signal: controller.signal,
      ...init,
    });
    clearTimeout(timer);

    if (res.status === 404) {
      return {
        ok: false,
        error: { code: 'NOT_FOUND', message: `404: ${url}`, status: 404 },
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        error: {
          code: 'SERVER_ERROR',
          message: `HTTP ${res.status}: ${url}`,
          status: res.status,
        },
      };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        ok: false,
        error: {
          code: 'TIMEOUT',
          message: `Timeout after ${timeoutMs}ms: ${url}`,
        },
      };
    }
    return { ok: false, error: { code: 'NETWORK', message: String(err) } };
  }
}
