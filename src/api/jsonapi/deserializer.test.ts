import { describe, it, expect } from 'vitest';
import { deserialize, deserializeCollection } from './deserializer';

const mockSingle = {
  data: {
    id: '123',
    type: 'node--prodotto_mosaico',
    attributes: { title: 'Sun 3', field_prezzo_eu: '120.00' },
    relationships: {
      field_colori: {
        data: [{ id: 'abc', type: 'taxonomy_term--mosaico_colori' }],
      },
      field_collezione: {
        data: { id: 'def', type: 'taxonomy_term--mosaico_collezioni' },
      },
      field_vuoto: { data: null },
    },
  },
  included: [
    {
      id: 'abc',
      type: 'taxonomy_term--mosaico_colori',
      attributes: { name: 'Grigio' },
      relationships: {},
    },
    {
      id: 'def',
      type: 'taxonomy_term--mosaico_collezioni',
      attributes: { name: 'Murano Smalto' },
      relationships: {},
    },
  ],
};

describe('deserialize', () => {
  it('flattens attributes to top level', () => {
    const result = deserialize(mockSingle);
    expect(result.title).toBe('Sun 3');
    expect(result.field_prezzo_eu).toBe('120.00');
  });

  it('preserves id and type at top level', () => {
    const result = deserialize(mockSingle);
    expect(result.id).toBe('123');
    expect(result.type).toBe('node--prodotto_mosaico');
  });

  it('resolves to-many relationships from included', () => {
    const result = deserialize(mockSingle);
    const colori = result.field_colori as Array<{ name: string }>;
    expect(Array.isArray(colori)).toBe(true);
    expect(colori[0].name).toBe('Grigio');
  });

  it('resolves to-one relationships from included', () => {
    const result = deserialize(mockSingle);
    const collezione = result.field_collezione as { name: string };
    expect(collezione.name).toBe('Murano Smalto');
  });

  it('sets null for empty relationships', () => {
    const result = deserialize(mockSingle);
    expect(result.field_vuoto).toBeNull();
  });

  it('returns raw ref if not in included', () => {
    const noIncluded = {
      data: {
        id: '1',
        type: 'node--page',
        attributes: {},
        relationships: {
          field_ref: { data: { id: 'xyz', type: 'node--other' } },
        },
      },
    };
    const result = deserialize(noIncluded);
    expect(result.field_ref).toEqual({ id: 'xyz', type: 'node--other' });
  });
});

describe('deserializeCollection', () => {
  it('returns items array and total from meta.count', () => {
    const mockCollection = {
      data: [
        { id: '1', type: 'node--page', attributes: { title: 'A' }, relationships: {} },
        { id: '2', type: 'node--page', attributes: { title: 'B' }, relationships: {} },
      ],
      meta: { count: 42 },
    };
    const result = deserializeCollection(mockCollection);
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(42);
    expect(result.items[0].title).toBe('A');
  });

  it('falls back to data.length if meta.count missing', () => {
    const mockCollection = {
      data: [
        { id: '1', type: 'node--page', attributes: { title: 'A' }, relationships: {} },
      ],
    };
    const result = deserializeCollection(mockCollection);
    expect(result.total).toBe(1);
  });
});
