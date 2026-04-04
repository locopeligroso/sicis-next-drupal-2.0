/**
 * Tests for mosaic-hub.ts, vetrite-hub.ts, and category-hub.ts
 *
 * Covers:
 *  - fetchMosaicCollections / fetchMosaicColors
 *  - fetchVetriteCollections / fetchVetriteColors
 *  - fetchHubCategories (with NID deduplication)
 *  - Edge cases: null response → [], empty array → [], dedup logic
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

// Partially mock @/lib/api/client: keep real helpers, stub apiGet only
vi.mock('@/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/client')>();
  return { ...actual, apiGet: vi.fn() };
});

// ── Imports after mocks ───────────────────────────────────────────────────────

import { apiGet } from '@/lib/api/client';
import {
  fetchMosaicCollections,
  fetchMosaicColors,
} from '@/lib/api/mosaic-hub';
import {
  fetchVetriteCollections,
  fetchVetriteColors,
} from '@/lib/api/vetrite-hub';
import { fetchHubCategories } from '@/lib/api/category-hub';

const mockApiGet = vi.mocked(apiGet);

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal raw MosaicViewItem / VetriteViewItem shape */
function makeMosaicViewItem(
  overrides: {
    name?: string;
    field_immagine?: string | null;
    view_taxonomy_term?: string;
  } = {},
) {
  return {
    name: overrides.name ?? 'Murano Smalto',
    // Use `in` so that an explicit null is preserved (null ?? default would swallow null)
    field_immagine:
      'field_immagine' in overrides
        ? overrides.field_immagine
        : 'https://drupal.example.com/it/image.jpg',
    view_taxonomy_term:
      overrides.view_taxonomy_term ??
      'https://drupal.example.com/it/mosaico/murano-smalto',
  };
}

function makeCategoryRawItem(
  overrides: {
    nid?: string;
    field_titolo_main?: string;
    field_immagine?: string;
  } = {},
) {
  return {
    nid: overrides.nid ?? '100',
    field_titolo_main: overrides.field_titolo_main ?? 'Category Title',
    field_immagine:
      overrides.field_immagine ?? 'https://drupal.example.com/cat.jpg',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchMosaicCollections
// ─────────────────────────────────────────────────────────────────────────────

describe('fetchMosaicCollections', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns normalized MosaicTermItem[] on a valid response', async () => {
    mockApiGet.mockResolvedValue([
      makeMosaicViewItem({
        name: 'Murano Smalto',
        field_immagine: 'https://drupal.example.com/it/img.jpg',
        view_taxonomy_term:
          'https://drupal.example.com/it/mosaico/murano-smalto',
      }),
    ]);

    const result = await fetchMosaicCollections('it');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'Murano Smalto',
      image: { url: 'https://drupal.example.com/it/img.jpg', width: null, height: null },
      href: '/it/mosaico/murano-smalto',
    });
  });

  it('strips domain from view_taxonomy_term to produce href', async () => {
    mockApiGet.mockResolvedValue([
      makeMosaicViewItem({
        view_taxonomy_term: 'https://www.sicis-stage.com/en/mosaico/pluma',
      }),
    ]);

    const result = await fetchMosaicCollections('en');

    expect(result[0].href).toBe('/en/mosaico/pluma');
  });

  it('converts empty field_immagine to null', async () => {
    mockApiGet.mockResolvedValue([makeMosaicViewItem({ field_immagine: '' })]);

    const result = await fetchMosaicCollections('it');

    expect(result[0].image).toBeNull();
  });

  it('preserves null field_immagine as null', async () => {
    mockApiGet.mockResolvedValue([
      makeMosaicViewItem({ field_immagine: null }),
    ]);

    const result = await fetchMosaicCollections('it');

    expect(result[0].image).toBeNull();
  });

  it('returns empty array when apiGet returns null', async () => {
    mockApiGet.mockResolvedValue(null);

    const result = await fetchMosaicCollections('it');

    expect(result).toEqual([]);
  });

  it('returns empty array when apiGet returns an empty array', async () => {
    mockApiGet.mockResolvedValue([]);

    const result = await fetchMosaicCollections('it');

    expect(result).toEqual([]);
  });

  it('normalizes multiple items correctly', async () => {
    mockApiGet.mockResolvedValue([
      makeMosaicViewItem({ name: 'A' }),
      makeMosaicViewItem({ name: 'B' }),
      makeMosaicViewItem({ name: 'C' }),
    ]);

    const result = await fetchMosaicCollections('it');

    expect(result).toHaveLength(3);
    expect(result.map((r) => r.name)).toEqual(['A', 'B', 'C']);
  });

  it('calls apiGet with correct endpoint path for the given locale', async () => {
    mockApiGet.mockResolvedValue([]);

    await fetchMosaicCollections('fr');

    expect(mockApiGet).toHaveBeenCalledWith(
      '/fr/mosaic-collections',
      {},
      86400,
    );
  });

  it('falls back to "#" when view_taxonomy_term is empty (stripDomain returns null)', async () => {
    mockApiGet.mockResolvedValue([
      makeMosaicViewItem({ view_taxonomy_term: '' }),
    ]);

    const result = await fetchMosaicCollections('it');

    expect(result[0].href).toBe('#');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// fetchMosaicColors
// ─────────────────────────────────────────────────────────────────────────────

describe('fetchMosaicColors', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns normalized MosaicTermItem[] on a valid response', async () => {
    mockApiGet.mockResolvedValue([
      makeMosaicViewItem({
        name: 'Bianco',
        view_taxonomy_term:
          'https://drupal.example.com/it/mosaico/colori/bianco',
      }),
    ]);

    const result = await fetchMosaicColors('it');

    expect(result[0].name).toBe('Bianco');
    expect(result[0].href).toBe('/it/mosaico/colori/bianco');
  });

  it('calls apiGet with the mosaic-colors endpoint', async () => {
    mockApiGet.mockResolvedValue([]);

    await fetchMosaicColors('de');

    expect(mockApiGet).toHaveBeenCalledWith('/de/mosaic-colors', {}, 86400);
  });

  it('returns empty array when apiGet returns null', async () => {
    mockApiGet.mockResolvedValue(null);

    expect(await fetchMosaicColors('it')).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// fetchVetriteCollections
// ─────────────────────────────────────────────────────────────────────────────

describe('fetchVetriteCollections', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns normalized VetriteTermItem[] on a valid response', async () => {
    mockApiGet.mockResolvedValue([
      makeMosaicViewItem({
        name: 'Vetrite A',
        field_immagine: 'https://drupal.example.com/img.jpg',
        view_taxonomy_term: 'https://drupal.example.com/it/vetrite/collez-a',
      }),
    ]);

    const result = await fetchVetriteCollections('it');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'Vetrite A',
      image: { url: 'https://drupal.example.com/img.jpg', width: null, height: null },
      href: '/it/vetrite/collez-a',
    });
  });

  it('calls apiGet with the vetrite-collections endpoint', async () => {
    mockApiGet.mockResolvedValue([]);

    await fetchVetriteCollections('es');

    expect(mockApiGet).toHaveBeenCalledWith(
      '/es/vetrite-collections',
      {},
      86400,
    );
  });

  it('converts empty imageUrl to null', async () => {
    mockApiGet.mockResolvedValue([makeMosaicViewItem({ field_immagine: '' })]);

    const result = await fetchVetriteCollections('it');

    expect(result[0].image).toBeNull();
  });

  it('returns empty array when apiGet returns null', async () => {
    mockApiGet.mockResolvedValue(null);

    expect(await fetchVetriteCollections('it')).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// fetchVetriteColors
// ─────────────────────────────────────────────────────────────────────────────

describe('fetchVetriteColors', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns normalized VetriteTermItem[] on a valid response', async () => {
    mockApiGet.mockResolvedValue([
      makeMosaicViewItem({
        name: 'Verde',
        view_taxonomy_term:
          'https://drupal.example.com/it/vetrite/colori/verde',
      }),
    ]);

    const result = await fetchVetriteColors('it');

    expect(result[0].name).toBe('Verde');
    expect(result[0].href).toBe('/it/vetrite/colori/verde');
  });

  it('calls apiGet with the vetrite-colors endpoint', async () => {
    mockApiGet.mockResolvedValue([]);

    await fetchVetriteColors('ru');

    expect(mockApiGet).toHaveBeenCalledWith('/ru/vetrite-colors', {}, 86400);
  });

  it('returns empty array when apiGet returns null', async () => {
    mockApiGet.mockResolvedValue(null);

    expect(await fetchVetriteColors('it')).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// fetchHubCategories
// ─────────────────────────────────────────────────────────────────────────────

describe('fetchHubCategories', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns normalized CategoryHubItem[] on a valid response', async () => {
    mockApiGet.mockResolvedValue([
      makeCategoryRawItem({
        nid: '10',
        field_titolo_main: 'Arredo',
        field_immagine: 'https://drupal.example.com/arredo.jpg',
      }),
    ]);

    const result = await fetchHubCategories(1, 'it');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      nid: '10',
      name: 'Arredo',
      image: { url: 'https://drupal.example.com/arredo.jpg', width: null, height: null },
    });
  });

  it('deduplicates items with the same NID, keeping the first occurrence', async () => {
    mockApiGet.mockResolvedValue([
      makeCategoryRawItem({ nid: '10', field_titolo_main: 'First' }),
      makeCategoryRawItem({ nid: '10', field_titolo_main: 'Duplicate' }),
      makeCategoryRawItem({ nid: '20', field_titolo_main: 'Second' }),
    ]);

    const result = await fetchHubCategories(1, 'it');

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('First');
    expect(result[1].name).toBe('Second');
  });

  it('keeps all items when all NIDs are unique', async () => {
    mockApiGet.mockResolvedValue([
      makeCategoryRawItem({ nid: '1' }),
      makeCategoryRawItem({ nid: '2' }),
      makeCategoryRawItem({ nid: '3' }),
    ]);

    const result = await fetchHubCategories(5, 'it');

    expect(result).toHaveLength(3);
  });

  it('converts empty field_immagine to null', async () => {
    mockApiGet.mockResolvedValue([
      makeCategoryRawItem({ nid: '10', field_immagine: '' }),
    ]);

    const result = await fetchHubCategories(1, 'it');

    expect(result[0].image).toBeNull();
  });

  it('returns empty array when apiGet returns null', async () => {
    mockApiGet.mockResolvedValue(null);

    expect(await fetchHubCategories(1, 'it')).toEqual([]);
  });

  it('returns empty array when apiGet returns an empty array', async () => {
    mockApiGet.mockResolvedValue([]);

    expect(await fetchHubCategories(1, 'it')).toEqual([]);
  });

  it('calls apiGet with the correct categories/{parentNid} endpoint', async () => {
    mockApiGet.mockResolvedValue([]);

    await fetchHubCategories(42, 'en');

    expect(mockApiGet).toHaveBeenCalledWith('/en/categories/42', {}, 86400);
  });

  it('handles multiple duplicate NID groups correctly', async () => {
    mockApiGet.mockResolvedValue([
      makeCategoryRawItem({ nid: 'A', field_titolo_main: 'A-first' }),
      makeCategoryRawItem({ nid: 'A', field_titolo_main: 'A-dup' }),
      makeCategoryRawItem({ nid: 'B', field_titolo_main: 'B-first' }),
      makeCategoryRawItem({ nid: 'B', field_titolo_main: 'B-dup' }),
    ]);

    const result = await fetchHubCategories(1, 'it');

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('A-first');
    expect(result[1].name).toBe('B-first');
  });
});
