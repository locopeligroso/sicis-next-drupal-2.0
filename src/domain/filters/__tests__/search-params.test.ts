import { parseFiltersFromUrl } from '../search-params';
import { describe, it, expect } from 'vitest';

describe('parseFiltersFromUrl', () => {
  it('parses collection from path', () => {
    const result = parseFiltersFromUrl(['mosaico', 'murano-smalto'], {}, 'it');
    expect(result.contentType).toBe('prodotto_mosaico');
    expect(result.activeFilters).toHaveLength(1);
    expect(result.activeFilters[0]).toMatchObject({
      key: 'collection',
      type: 'path',
    });
  });

  it('parses sort from searchParams', () => {
    const result = parseFiltersFromUrl(['mosaico'], { sort: 'title' }, 'it');
    expect(result.sort).toBe('title');
  });

  it('handles second P0 as query param', () => {
    const result = parseFiltersFromUrl(
      ['mosaico', 'murano-smalto'],
      { color: 'rosso' },
      'it',
    );
    expect(result.activeFilters).toHaveLength(2);
    expect(result.activeFilters[0]).toMatchObject({ key: 'collection', type: 'path' });
    expect(result.activeFilters[1]).toMatchObject({ key: 'color', type: 'query', value: 'rosso' });
    expect(result.filterDefinitions).toHaveLength(2);
  });

  it('does not duplicate P0 already resolved from path', () => {
    const result = parseFiltersFromUrl(
      ['mosaico', 'murano-smalto'],
      { collection: 'waterglass' },
      'it',
    );
    // collection already resolved from path, query param should be ignored
    expect(result.activeFilters).toHaveLength(1);
    expect(result.activeFilters[0].key).toBe('collection');
  });
});
