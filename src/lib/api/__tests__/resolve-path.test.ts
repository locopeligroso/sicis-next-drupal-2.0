/**
 * Tests for resolve-path.ts — resolvePath()
 *
 * resolvePath wraps apiGet and is memoized with React.cache.
 * We mock apiGet to avoid network calls, and we mock React.cache
 * as a pass-through so the underlying async function is directly callable.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (hoisted before imports) ───────────────────────────────────────────

vi.mock('@/lib/drupal/config', () => ({
  DRUPAL_BASE_URL: 'https://drupal.example.com',
}));

vi.mock('@/i18n/config', () => ({
  locales: ['it', 'en', 'fr', 'de', 'es', 'ru', 'us'],
  toDrupalLocale: (locale: string) => (locale === 'us' ? 'en' : locale),
}));

// Bypass React.cache — return the function itself so we can call it normally
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cache: (fn: unknown) => fn };
});

vi.mock('@/lib/api/client', () => ({
  apiGet: vi.fn(),
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { resolvePath } from '@/lib/api/resolve-path';
import { apiGet } from '@/lib/api/client';
import type { ResolvePathResponse } from '@/lib/api/types';

const mockApiGet = vi.mocked(apiGet);

// ─────────────────────────────────────────────────────────────────────────────
// resolvePath
// ─────────────────────────────────────────────────────────────────────────────

describe('resolvePath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns entity metadata when the endpoint responds with valid data', async () => {
    const response: ResolvePathResponse = {
      nid: 42,
      type: 'node',
      bundle: 'prodotto_mosaico',
      locale: 'it',
    };
    mockApiGet.mockResolvedValue(response);

    const result = await resolvePath('/mosaico/pluma/01-bora', 'it');

    expect(result).toEqual(response);
  });

  it('returns null when apiGet returns null (path not found / 404)', async () => {
    mockApiGet.mockResolvedValue(null);

    const result = await resolvePath('/non-existent-path', 'it');

    expect(result).toBeNull();
  });

  it('calls apiGet with the correct path prefix and path param', async () => {
    mockApiGet.mockResolvedValue(null);

    await resolvePath('/mosaico/pluma', 'en');

    expect(mockApiGet).toHaveBeenCalledWith(
      '/en/resolve-path',
      { path: '/mosaico/pluma' },
      3600,
    );
  });

  it('calls apiGet with the provided locale in the path', async () => {
    mockApiGet.mockResolvedValue(null);

    await resolvePath('/vetrite/murano', 'fr');

    expect(mockApiGet).toHaveBeenCalledWith(
      '/fr/resolve-path',
      { path: '/vetrite/murano' },
      3600,
    );
  });

  it('returns taxonomy_term type for taxonomy paths', async () => {
    const response: ResolvePathResponse = {
      nid: 99,
      type: 'taxonomy_term',
      bundle: 'mosaico_collezioni',
      locale: 'it',
    };
    mockApiGet.mockResolvedValue(response);

    const result = await resolvePath('/mosaico/collezione/murano-smalto', 'it');

    expect(result?.type).toBe('taxonomy_term');
    expect(result?.bundle).toBe('mosaico_collezioni');
  });

  it('mirrors Drupal locale aliases for the "us" locale', async () => {
    const response: ResolvePathResponse = {
      nid: 10,
      type: 'node',
      bundle: 'page',
      locale: 'en',
      aliases: { en: '/en/about', it: '/it/chi-siamo' },
    };
    mockApiGet.mockResolvedValue(response);

    const result = await resolvePath('/about', 'us');

    // toDrupalLocale('us') === 'en', so data.aliases['en'] exists,
    // and since data.aliases['us'] was absent it should be mirrored.
    expect(result?.aliases?.['us']).toBe('/en/about');
  });

  it('does not overwrite an existing alias when mirroring', async () => {
    const response: ResolvePathResponse = {
      nid: 10,
      type: 'node',
      bundle: 'page',
      locale: 'en',
      // 'us' key already present — should NOT be overwritten
      aliases: { en: '/en/about', us: '/us/custom-path' },
    };
    mockApiGet.mockResolvedValue(response);

    const result = await resolvePath('/about', 'us');

    expect(result?.aliases?.['us']).toBe('/us/custom-path');
  });

  it('handles a response without aliases gracefully', async () => {
    const response: ResolvePathResponse = {
      nid: 7,
      type: 'node',
      bundle: 'articolo',
      locale: 'it',
      // aliases intentionally absent
    };
    mockApiGet.mockResolvedValue(response);

    const result = await resolvePath('/blog/some-article', 'it');

    expect(result).toEqual(response);
    expect(result?.aliases).toBeUndefined();
  });

  it('accepts various path formats without throwing', async () => {
    mockApiGet.mockResolvedValue(null);

    await expect(resolvePath('/', 'it')).resolves.toBeNull();
    await expect(resolvePath('/a', 'en')).resolves.toBeNull();
    await expect(resolvePath('/a/b/c/d/e', 'fr')).resolves.toBeNull();
  });
});
