import { describe, it, expect } from 'vitest';
import { ProdottoArredoSchema } from './arredo';
import { ProdottoVetriteSchema } from './vetrite';
import { ProdottoPixallSchema } from './pixall';

// ── Arredo ────────────────────────────────────────────────────────────────

describe('ProdottoArredoSchema', () => {
  it('parses minimal arredo', () => {
    expect(() =>
      ProdottoArredoSchema.parse({ id: 'a1', type: 'node--prodotto_arredo' }),
    ).not.toThrow();
  });

  it('parses arredo with categoria node ref', () => {
    const result = ProdottoArredoSchema.parse({
      id: 'a1',
      type: 'node--prodotto_arredo',
      field_categoria: { id: 'c1', type: 'node--categoria', title: 'Lampade' },
    });
    expect((result.field_categoria as { title: string }).title).toBe('Lampade');
  });

  it('rejects wrong type literal', () => {
    expect(() =>
      ProdottoArredoSchema.parse({ id: 'a1', type: 'node--prodotto_mosaico' }),
    ).toThrow();
  });
});

// ── Vetrite ───────────────────────────────────────────────────────────────

describe('ProdottoVetriteSchema', () => {
  it('parses minimal vetrite', () => {
    expect(() =>
      ProdottoVetriteSchema.parse({ id: 'v1', type: 'node--prodotto_vetrite' }),
    ).not.toThrow();
  });

  it('parses vetrite with colori array', () => {
    const result = ProdottoVetriteSchema.parse({
      id: 'v1',
      type: 'node--prodotto_vetrite',
      field_colori: [{ id: 't1', type: 'taxonomy_term--vetrite_colori', name: 'Blu' }],
    });
    const colori = result.field_colori as Array<{ name: string }>;
    expect(colori[0].name).toBe('Blu');
  });

  it('rejects wrong type literal', () => {
    expect(() =>
      ProdottoVetriteSchema.parse({ id: 'v1', type: 'node--prodotto_tessuto' }),
    ).toThrow();
  });
});

// ── Pixall ────────────────────────────────────────────────────────────────

describe('ProdottoPixallSchema', () => {
  it('parses minimal pixall', () => {
    expect(() =>
      ProdottoPixallSchema.parse({ id: 'p1', type: 'node--prodotto_pixall' }),
    ).not.toThrow();
  });

  it('parses pixall with numeric fields', () => {
    const result = ProdottoPixallSchema.parse({
      id: 'p1',
      type: 'node--prodotto_pixall',
      field_consumo_stucco_m2: 1.5,
      field_retinatura: 'on_fiber_mesh',
    });
    expect(result.field_consumo_stucco_m2).toBe(1.5);
    expect(result.field_retinatura).toBe('on_fiber_mesh');
  });

  it('accepts null for nullable numeric fields', () => {
    const result = ProdottoPixallSchema.parse({
      id: 'p1',
      type: 'node--prodotto_pixall',
      field_consumo_stucco_m2: null,
    });
    expect(result.field_consumo_stucco_m2).toBeNull();
  });

  it('rejects wrong type literal', () => {
    expect(() =>
      ProdottoPixallSchema.parse({ id: 'p1', type: 'node--prodotto_arredo' }),
    ).toThrow();
  });
});
