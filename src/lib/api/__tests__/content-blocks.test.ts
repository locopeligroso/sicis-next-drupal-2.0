/**
 * Tests for content.ts — fetchContent()
 * Tests for blocks.ts — fetchBlocks()
 *
 * Both are React.cache-wrapped async functions that call apiGet.
 * We mock apiGet and bypass React.cache so the underlying functions are
 * directly callable and deterministic.
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

// Bypass React.cache — return the function itself
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cache: (fn: unknown) => fn };
});

vi.mock('@/lib/api/client', () => ({
  apiGet: vi.fn(),
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { apiGet } from '@/lib/api/client';
import { fetchContent } from '@/lib/api/content';
import { fetchBlocks } from '@/lib/api/blocks';

const mockApiGet = vi.mocked(apiGet);

// ─────────────────────────────────────────────────────────────────────────────
// fetchContent
// ─────────────────────────────────────────────────────────────────────────────

describe('fetchContent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the first element of the array on a valid response', async () => {
    const entity = {
      nid: '42',
      type: 'prodotto_mosaico',
      field_titolo: 'Test',
    };
    mockApiGet.mockResolvedValue([entity]);

    const result = await fetchContent(42, 'it');

    expect(result).toEqual(entity);
  });

  it('returns null when apiGet returns null (404)', async () => {
    mockApiGet.mockResolvedValue(null);

    const result = await fetchContent(999, 'it');

    expect(result).toBeNull();
  });

  it('returns null when apiGet returns an empty array', async () => {
    mockApiGet.mockResolvedValue([]);

    const result = await fetchContent(1, 'it');

    expect(result).toBeNull();
  });

  it('calls apiGet with the correct content/{nid} path', async () => {
    mockApiGet.mockResolvedValue(null);

    await fetchContent(7, 'en');

    expect(mockApiGet).toHaveBeenCalledWith('/en/content/7', {}, 300);
  });

  it('includes nid and type fields in the returned entity', async () => {
    const entity = { nid: '1', type: 'page', title: 'Homepage' };
    mockApiGet.mockResolvedValue([entity]);

    const result = await fetchContent(1, 'it');

    expect(result?.nid).toBe('1');
    expect(result?.type).toBe('page');
  });

  it('passes through arbitrary extra fields on the entity', async () => {
    const entity = {
      nid: '5',
      type: 'landing_page',
      field_custom: 'value',
      nested: { deep: true },
    };
    mockApiGet.mockResolvedValue([entity]);

    const result = await fetchContent(5, 'fr');

    expect(result?.['field_custom']).toBe('value');
    expect(result?.['nested']).toEqual({ deep: true });
  });

  it('unwraps only the first element when the array contains multiple items', async () => {
    const first = { nid: '10', type: 'page' };
    const second = { nid: '11', type: 'page' };
    mockApiGet.mockResolvedValue([first, second]);

    const result = await fetchContent(10, 'it');

    expect(result?.nid).toBe('10');
  });

  it('uses locale in the API path', async () => {
    mockApiGet.mockResolvedValue(null);

    await fetchContent(3, 'de');

    expect(mockApiGet).toHaveBeenCalledWith('/de/content/3', {}, 300);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// fetchBlocks
// ─────────────────────────────────────────────────────────────────────────────

describe('fetchBlocks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns normalized BlockItem[] on a valid response', async () => {
    mockApiGet.mockResolvedValue([
      { type: 'blocco_intro', pid: 1, field_titolo: 'Hello' },
    ]);

    const result = await fetchBlocks(42, 'it');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('paragraph--blocco_intro');
    expect(result[0].pid).toBe(1);
  });

  it('prepends "paragraph--" prefix to the type field', async () => {
    mockApiGet.mockResolvedValue([
      { type: 'blocco_gallery', pid: 10 },
      { type: 'blocco_testo_immagine', pid: 11 },
    ]);

    const result = await fetchBlocks(1, 'it');

    expect(result[0].type).toBe('paragraph--blocco_gallery');
    expect(result[1].type).toBe('paragraph--blocco_testo_immagine');
  });

  it('returns empty array when apiGet returns null', async () => {
    mockApiGet.mockResolvedValue(null);

    const result = await fetchBlocks(1, 'it');

    expect(result).toEqual([]);
  });

  it('returns empty array when apiGet returns an empty array', async () => {
    mockApiGet.mockResolvedValue([]);

    const result = await fetchBlocks(1, 'it');

    expect(result).toEqual([]);
  });

  it('calls apiGet with the correct blocks/{nid} path', async () => {
    mockApiGet.mockResolvedValue([]);

    await fetchBlocks(99, 'en');

    expect(mockApiGet).toHaveBeenCalledWith('/en/blocks/99', {}, 300);
  });

  it('converts a plain field_immagine URL string to C1 file-object shape', async () => {
    mockApiGet.mockResolvedValue([
      {
        type: 'blocco_intro',
        pid: 1,
        field_immagine: 'https://drupal.example.com/image.jpg',
      },
    ]);

    const result = await fetchBlocks(1, 'it');
    const img = result[0]['field_immagine'] as Record<string, unknown>;

    expect(img.type).toBe('file--file');
    expect((img.uri as Record<string, unknown>)['url']).toBe(
      'https://drupal.example.com/image.jpg',
    );
    expect((img.meta as Record<string, unknown>)['width']).toBe(1200);
    expect((img.meta as Record<string, unknown>)['height']).toBe(900);
  });

  it('leaves non-image fields unchanged', async () => {
    mockApiGet.mockResolvedValue([
      {
        type: 'blocco_quote',
        pid: 2,
        field_testo: 'A quote text',
        field_autore: 'Someone',
      },
    ]);

    const result = await fetchBlocks(1, 'it');

    expect(result[0]['field_testo']).toBe('A quote text');
    expect(result[0]['field_autore']).toBe('Someone');
  });

  it('does not convert a null field_immagine value', async () => {
    mockApiGet.mockResolvedValue([
      { type: 'blocco_intro', pid: 1, field_immagine: null },
    ]);

    const result = await fetchBlocks(1, 'it');

    expect(result[0]['field_immagine']).toBeNull();
  });

  it('does not convert an empty string field_immagine value', async () => {
    mockApiGet.mockResolvedValue([
      { type: 'blocco_intro', pid: 1, field_immagine: '' },
    ]);

    const result = await fetchBlocks(1, 'it');

    // Empty string is falsy — normalizeImageFields only converts non-empty strings
    expect(result[0]['field_immagine']).toBe('');
  });

  it('normalizes image fields inside nested arrays (field_elementi)', async () => {
    mockApiGet.mockResolvedValue([
      {
        type: 'blocco_gallery',
        pid: 3,
        field_elementi: [
          { field_immagine: 'https://drupal.example.com/a.jpg' },
          { field_immagine: 'https://drupal.example.com/b.jpg' },
        ],
      },
    ]);

    const result = await fetchBlocks(1, 'it');
    const elementi = result[0]['field_elementi'] as Array<
      Record<string, unknown>
    >;

    expect(
      (elementi[0]['field_immagine'] as Record<string, unknown>)?.type,
    ).toBe('file--file');
    expect(
      (elementi[1]['field_immagine'] as Record<string, unknown>)?.type,
    ).toBe('file--file');
  });

  it('normalizes multiple blocks in a single response', async () => {
    mockApiGet.mockResolvedValue([
      { type: 'blocco_intro', pid: 1 },
      { type: 'blocco_video', pid: 2 },
      { type: 'blocco_a', pid: 3 },
    ]);

    const result = await fetchBlocks(10, 'it');

    expect(result).toHaveLength(3);
    expect(result.map((b) => b.type)).toEqual([
      'paragraph--blocco_intro',
      'paragraph--blocco_video',
      'paragraph--blocco_a',
    ]);
  });

  it('uses locale in the API path', async () => {
    mockApiGet.mockResolvedValue([]);

    await fetchBlocks(5, 'ru');

    expect(mockApiGet).toHaveBeenCalledWith('/ru/blocks/5', {}, 300);
  });
});
