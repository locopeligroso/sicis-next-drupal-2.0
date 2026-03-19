import { describe, it, expect } from 'vitest';
import { buildQuery } from './query-builder';

describe('buildQuery', () => {
  it('builds pagination params', () => {
    const qs = buildQuery({ limit: 48, offset: 0 });
    expect(qs).toContain('page%5Blimit%5D=48');
    expect(qs).toContain('page%5Boffset%5D=0');
  });

  it('builds single filter', () => {
    const qs = buildQuery({
      filters: [{ field: 'field_colori.name', value: 'Grigio' }],
    });
    expect(qs).toContain('Grigio');
    expect(qs).toContain('field_colori.name');
  });

  it('builds multi-value filter with IN operator', () => {
    const qs = buildQuery({
      filters: [{ field: 'field_colori.name', value: ['Grigio', 'Bianco'] }],
    });
    expect(qs).toContain('IN');
    expect(qs).toContain('Grigio');
    expect(qs).toContain('Bianco');
  });

  it('builds include param', () => {
    const qs = buildQuery({ include: ['field_colori', 'field_collezione'] });
    expect(qs).toContain('include=field_colori%2Cfield_collezione');
  });

  it('builds sort param', () => {
    const qs = buildQuery({ sort: '-created' });
    expect(qs).toContain('sort=-created');
  });

  it('builds sparse fieldsets', () => {
    const qs = buildQuery({
      fields: { 'node--prodotto_mosaico': ['title', 'field_prezzo_eu'] },
    });
    expect(qs).toContain('fields');
    expect(qs).toContain('title');
  });

  it('returns empty string for empty options', () => {
    const qs = buildQuery({});
    expect(typeof qs).toBe('string');
  });
});
