import { describe, it, expect } from 'vitest';
import {
  deslugify,
  getFilterConfig,
  translateBasePath,
  SLUG_OVERRIDES,
  FILTER_REGISTRY,
} from './registry';

describe('deslugify', () => {
  it('returns override for special characters (Colibrì)', () => {
    expect(deslugify('colibri')).toBe('Colibrì');
  });

  it('returns override for slash in name (Red / Orange)', () => {
    expect(deslugify('red-orange')).toBe('Red / Orange');
  });

  it('returns override for murano-smalto', () => {
    expect(deslugify('murano-smalto')).toBe('Murano Smalto');
  });

  it('capitalises fallback (simple slug)', () => {
    expect(deslugify('grigio')).toBe('Grigio');
  });

  it('capitalises each word in multi-word slug', () => {
    expect(deslugify('electric-marble-new')).toBe('Electric Marble New');
  });

  it('handles tessuto category slugs', () => {
    expect(deslugify('arazzi')).toBe('Arazzi');
    expect(deslugify('tappeti')).toBe('Tappeti');
    expect(deslugify('coperte')).toBe('Coperte');
    expect(deslugify('cuscini')).toBe('Cuscini');
  });

  it('SLUG_OVERRIDES has no duplicate keys', () => {
    const keys = Object.keys(SLUG_OVERRIDES);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});

describe('getFilterConfig', () => {
  it('returns config for prodotto_mosaico', () => {
    const config = getFilterConfig('prodotto_mosaico');
    expect(config).not.toBeNull();
    expect(config?.filters.collection).toBeDefined();
    expect(config?.filters.color).toBeDefined();
  });

  it('returns config for prodotto_tessuto with category filter', () => {
    const config = getFilterConfig('prodotto_tessuto');
    expect(config?.filters.category).toBeDefined();
    expect(config?.filters.category.drupalField).toBe('field_categoria.title');
    expect(config?.filters.category.priority).toBe('P0');
  });

  it('returns config for prodotto_arredo with subcategory filter', () => {
    const config = getFilterConfig('prodotto_arredo');
    expect(config?.filters.subcategory.nodeType).toBe('node--categoria');
  });

  it('returns null for unknown content type', () => {
    expect(getFilterConfig('node--unknown')).toBeNull();
  });

  it('all 5 product types are registered', () => {
    const types = [
      'prodotto_mosaico',
      'prodotto_vetrite',
      'prodotto_arredo',
      'prodotto_tessuto',
      'prodotto_pixall',
    ];
    for (const t of types) {
      expect(getFilterConfig(t)).not.toBeNull();
    }
  });
});

describe('translateBasePath', () => {
  it('translates IT mosaico to EN mosaic', () => {
    expect(translateBasePath('/mosaico', 'en')).toBe('/mosaic');
  });

  it('translates IT mosaico with sub-path', () => {
    expect(translateBasePath('/mosaico/colori/grigio', 'en')).toBe(
      '/mosaic/colori/grigio',
    );
  });

  it('returns path unchanged if no match', () => {
    expect(translateBasePath('/unknown-path', 'en')).toBe('/unknown-path');
  });

  it('returns path unchanged if already correct locale', () => {
    expect(translateBasePath('/mosaic', 'en')).toBe('/mosaic');
  });

  it('handles path without leading slash', () => {
    expect(translateBasePath('mosaico', 'en')).toBe('mosaic');
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('translates IT arredo to EN furniture-and-accessories', () => {
    expect(translateBasePath('/arredo', 'en')).toBe(
      '/furniture-and-accessories',
    );
  });

  it('returns pixall unchanged (same path in all locales)', () => {
    expect(translateBasePath('/pixall', 'en')).toBe('/pixall');
  });

  it('translates IT lastre-vetro-vetrite to EN vetrite-glass-slabs', () => {
    expect(translateBasePath('/lastre-vetro-vetrite', 'en')).toBe(
      '/vetrite-glass-slabs',
    );
  });
});

describe('FILTER_REGISTRY completeness', () => {
  it('all 5 product types have basePaths for all 6 locales', () => {
    const locales = ['it', 'en', 'fr', 'de', 'es', 'ru'];
    const types = [
      'prodotto_mosaico',
      'prodotto_vetrite',
      'prodotto_arredo',
      'prodotto_tessuto',
      'prodotto_pixall',
    ];
    for (const type of types) {
      const config = getFilterConfig(type);
      expect(config).not.toBeNull();
      for (const locale of locales) {
        expect(config?.basePaths[locale]).toBeDefined();
      }
    }
  });

  it('all filter groups have required fields (key, drupalField, displayAs, priority)', () => {
    for (const [, config] of Object.entries(FILTER_REGISTRY)) {
      for (const [key, filter] of Object.entries(config.filters)) {
        expect(filter.key).toBe(key);
        expect(filter.drupalField).toBeTruthy();
        expect(filter.displayAs).toMatch(/^(buttons|checkboxes|dropdown)$/);
        expect(filter.priority).toMatch(/^(P0|P1|P2)$/);
      }
    }
  });

  it('translateBasePath handles all product type base paths', () => {
    expect(translateBasePath('/mosaico', 'en')).toBe('/mosaic');
    expect(translateBasePath('/arredo', 'en')).toBe(
      '/furniture-and-accessories',
    );
    expect(translateBasePath('/pixall', 'en')).toBe('/pixall');
  });
});

describe('filter removal — unused P1/P2 filters', () => {
  it('prodotto_vetrite has collection, color, and finish filters', () => {
    const config = getFilterConfig('prodotto_vetrite')!;
    const keys = Object.keys(config.filters);
    expect(keys).toEqual(['collection', 'color', 'finish']);
    expect(config.filters.finish.priority).toBe('P1');
    expect(config.filters).not.toHaveProperty('texture');
  });

  it('prodotto_arredo has ONLY subcategory filter', () => {
    const config = getFilterConfig('prodotto_arredo')!;
    const keys = Object.keys(config.filters);
    expect(keys).toEqual(['subcategory']);
    expect(config.filters).not.toHaveProperty('finish');
    expect(config.filters).not.toHaveProperty('fabric');
  });

  it('prodotto_mosaico has collection, color, shape, finish — NO grout', () => {
    const config = getFilterConfig('prodotto_mosaico')!;
    const keys = Object.keys(config.filters);
    expect(keys).toEqual(['collection', 'color', 'shape', 'finish']);
    expect(config.filters).not.toHaveProperty('grout');
  });

  it('prodotto_pixall has color and shape — NO grout', () => {
    const config = getFilterConfig('prodotto_pixall')!;
    const keys = Object.keys(config.filters);
    expect(keys).toEqual(['color', 'shape']);
    expect(config.filters).not.toHaveProperty('grout');
  });

  it('prodotto_tessuto has category and type filters', () => {
    const config = getFilterConfig('prodotto_tessuto')!;
    const keys = Object.keys(config.filters);
    expect(keys).toEqual(['category', 'type', 'tipologia']);
    expect(config.filters.type.queryKey).toBe('type');
    expect(config.filters.type.priority).toBe('P1');
    expect(config.filters.tipologia.queryKey).toBe('tipologia');
    expect(config.filters.tipologia.priority).toBe('P1');
  });

  it('prodotto_illuminazione retains its subcategory filter unchanged', () => {
    const config = getFilterConfig('prodotto_illuminazione')!;
    const keys = Object.keys(config.filters);
    expect(keys).toEqual(['subcategory']);
  });
});
