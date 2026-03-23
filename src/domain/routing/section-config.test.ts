import { describe, it, expect } from 'vitest';
import { getSectionConfig } from './section-config';

describe('getSectionConfig', () => {
  it('returns mosaico config for /mosaico', () => {
    const config = getSectionConfig(['mosaico'], 'it');
    expect(config?.productType).toBe('prodotto_mosaico');
  });

  it('returns mosaico config with collection for /mosaico/murano-smalto', () => {
    const config = getSectionConfig(['mosaico', 'murano-smalto'], 'it');
    expect(config?.productType).toBe('prodotto_mosaico');
    expect(config?.filterField).toBe('field_collezione.name');
    expect(config?.filterValue).toBe('Murano Smalto');
  });

  it('returns tessuto config for /tessili', () => {
    const config = getSectionConfig(['tessili'], 'it');
    expect(config?.productType).toBe('prodotto_tessuto');
  });

  it('returns tessuto config with category for /arazzi', () => {
    const config = getSectionConfig(['arazzi'], 'it');
    expect(config?.productType).toBe('prodotto_tessuto');
    expect(config?.filterField).toBe('field_categoria.title');
    expect(config?.filterValue).toBe('Arazzi');
  });

  it('returns arredo config for /arredo', () => {
    const config = getSectionConfig(['arredo'], 'it');
    expect(config?.productType).toBe('prodotto_arredo');
  });

  it('returns null for unknown slug', () => {
    expect(getSectionConfig(['unknown-path'], 'it')).toBeNull();
  });

  it('returns pixall config for /pixall', () => {
    const config = getSectionConfig(['pixall'], 'it');
    expect(config?.productType).toBe('prodotto_pixall');
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  it('returns vetrite config for /lastre-vetro-vetrite', () => {
    const config = getSectionConfig(['lastre-vetro-vetrite'], 'it');
    expect(config?.productType).toBe('prodotto_vetrite');
  });

  it('returns vetrite config with collection for /lastre-vetro-vetrite/electric-marble', () => {
    const config = getSectionConfig(['lastre-vetro-vetrite', 'electric-marble'], 'it');
    expect(config?.productType).toBe('prodotto_vetrite');
    expect(config?.filterField).toBe('field_collezione.name');
    expect(config?.filterValue).toBe('Electric Marble');
  });

  it('returns arredo config with subcategory for /arredo/divani', () => {
    const config = getSectionConfig(['arredo', 'divani'], 'it');
    expect(config?.productType).toBe('prodotto_arredo');
    expect(config?.filterField).toBe('field_categoria.title');
    expect(config?.filterValue).toBe('Divani');
  });

  it('returns null for product detail page /mosaico/murano-smalto/sun-3', () => {
    const config = getSectionConfig(['mosaico', 'murano-smalto', 'sun-3'], 'it');
    expect(config).toBeNull();
  });

  it('returns tessuto config for /tessile/tessuti', () => {
    const config = getSectionConfig(['tessile', 'tessuti'], 'it');
    expect(config?.productType).toBe('prodotto_tessuto');
  });

  it('handles EN locale for /mosaic', () => {
    const config = getSectionConfig(['mosaic'], 'en');
    expect(config?.productType).toBe('prodotto_mosaico');
  });

  it('handles EN locale for /furniture-and-accessories', () => {
    const config = getSectionConfig(['furniture-and-accessories'], 'en');
    expect(config?.productType).toBe('prodotto_arredo');
  });

  // ── Pixall override under Mosaico ──────────────────────────────────────

  it('routes /mosaico/pixall to prodotto_pixall, not a Mosaico collection', () => {
    const config = getSectionConfig(['mosaico', 'pixall'], 'it');
    expect(config).toEqual({ productType: 'prodotto_pixall' });
  });

  it('still routes /mosaico/murano-smalto as a Mosaico collection filter', () => {
    const config = getSectionConfig(['mosaico', 'murano-smalto'], 'it');
    expect(config?.productType).toBe('prodotto_mosaico');
    expect(config?.filterField).toBe('field_collezione.name');
    expect(config?.filterValue).toBe('Murano Smalto');
  });

  it('still routes standalone /pixall to prodotto_pixall', () => {
    const config = getSectionConfig(['pixall'], 'it');
    expect(config).toEqual({ productType: 'prodotto_pixall' });
  });
});
