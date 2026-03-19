import { describe, it, expect, vi } from 'vitest';
import { fetchProduct } from './products';

describe('fetchProduct', () => {
  it('returns typed ProdottoMosaico on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          id: '1', type: 'node--prodotto_mosaico',
          attributes: { title: 'Sun 3', field_prezzo_eu: '120.00' },
          relationships: {},
        },
      }),
    } as Response);
    const result = await fetchProduct('prodotto_mosaico', '1', 'it');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.type).toBe('node--prodotto_mosaico');
      expect(result.data.title).toBe('Sun 3');
    }
  });

  it('returns NOT_FOUND on 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response);
    const result = await fetchProduct('prodotto_mosaico', 'missing', 'it');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });
});
