import { describe, it, expect } from 'vitest';
import { getColorSwatch, formatRetinatura, COLOR_MAP } from './product-helpers';

describe('COLOR_MAP', () => {
  it('exports a non-empty map', () => {
    expect(Object.keys(COLOR_MAP).length).toBeGreaterThan(0);
  });
  it('contains Grigio key', () => {
    expect(COLOR_MAP['Grigio']).toBe('#888888');
  });
});

describe('getColorSwatch', () => {
  it('returns hex for known color', () => {
    expect(getColorSwatch('Grigio')).toBe('#888888');
  });
  it('returns fallback for unknown color', () => {
    expect(getColorSwatch('Unknown Color')).toBe('#ccc');
  });
  it('does partial match', () => {
    expect(getColorSwatch('Deep Blue Sky')).toBe('#0a2a78');
  });
  it('handles empty string', () => {
    expect(getColorSwatch('')).toBe('#ccc');
  });
});

describe('formatRetinatura', () => {
  it('formats on_fiber_mesh', () => {
    expect(formatRetinatura('on_fiber_mesh')).toBe('Rete in fibra');
  });
  it('formats paper_to_remove', () => {
    expect(formatRetinatura('paper_to_remove')).toBe('Carta da rimuovere');
  });
  it('returns empty string for null', () => {
    expect(formatRetinatura(null)).toBe('');
  });
  it('returns raw value for unknown', () => {
    expect(formatRetinatura('unknown_value')).toBe('unknown_value');
  });
});
