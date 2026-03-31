import { describe, it, expect } from 'vitest';
import { getRevalidateTime, getComponentName } from './node-resolver';

// ── getComponentName ──────────────────────────────────────────────────────

describe('getComponentName', () => {
  it('maps node--prodotto_mosaico to ProdottoMosaico', () => {
    expect(getComponentName('node--prodotto_mosaico')).toBe('ProdottoMosaico');
  });

  it('maps node--page to Page', () => {
    expect(getComponentName('node--page')).toBe('Page');
  });

  it('maps node--landing_page to LandingPage', () => {
    expect(getComponentName('node--landing_page')).toBe('LandingPage');
  });

  it('maps node--prodotto_arredo to ProdottoArredo', () => {
    expect(getComponentName('node--prodotto_arredo')).toBe('ProdottoArredo');
  });

  it('maps node--prodotto_vetrite to ProdottoVetrite', () => {
    expect(getComponentName('node--prodotto_vetrite')).toBe('ProdottoVetrite');
  });

  it('maps node--prodotto_tessuto to ProdottoTessuto', () => {
    expect(getComponentName('node--prodotto_tessuto')).toBe('ProdottoTessuto');
  });

  it('maps node--prodotto_pixall to ProdottoPixall', () => {
    expect(getComponentName('node--prodotto_pixall')).toBe('ProdottoPixall');
  });

  it('maps node--articolo to Articolo', () => {
    expect(getComponentName('node--articolo')).toBe('Articolo');
  });

  it('maps node--news to News', () => {
    expect(getComponentName('node--news')).toBe('News');
  });

  it('maps node--tutorial to Tutorial', () => {
    expect(getComponentName('node--tutorial')).toBe('Tutorial');
  });

  it('maps node--progetto to Progetto', () => {
    expect(getComponentName('node--progetto')).toBe('Progetto');
  });

  it('returns UnknownEntity for unmapped type', () => {
    expect(getComponentName('node--unknown_type')).toBe('UnknownEntity');
  });

  it('returns UnknownEntity for empty string', () => {
    expect(getComponentName('')).toBe('UnknownEntity');
  });
});

// ── getRevalidateTime ─────────────────────────────────────────────────────

describe('getRevalidateTime', () => {
  it('returns 60s for prodotto_mosaico', () => {
    expect(getRevalidateTime('node--prodotto_mosaico')).toBe(60);
  });

  it('returns 60s for prodotto_arredo', () => {
    expect(getRevalidateTime('node--prodotto_arredo')).toBe(60);
  });

  it('returns 60s for prodotto_vetrite', () => {
    expect(getRevalidateTime('node--prodotto_vetrite')).toBe(60);
  });

  it('returns 60s for prodotto_tessuto', () => {
    expect(getRevalidateTime('node--prodotto_tessuto')).toBe(60);
  });

  it('returns 60s for prodotto_pixall', () => {
    expect(getRevalidateTime('node--prodotto_pixall')).toBe(60);
  });

  it('returns 300s for articolo', () => {
    expect(getRevalidateTime('node--articolo')).toBe(300);
  });

  it('returns 300s for news', () => {
    expect(getRevalidateTime('node--news')).toBe(300);
  });

  it('returns 300s for tutorial', () => {
    expect(getRevalidateTime('node--tutorial')).toBe(300);
  });

  it('returns 600s for page', () => {
    expect(getRevalidateTime('node--page')).toBe(600);
  });

  it('returns 600s for landing_page', () => {
    expect(getRevalidateTime('node--landing_page')).toBe(600);
  });

  it('returns 3600s for any taxonomy_term type', () => {
    expect(getRevalidateTime('taxonomy_term--mosaico_collezioni')).toBe(3600);
    expect(getRevalidateTime('taxonomy_term--colori')).toBe(3600);
    expect(getRevalidateTime('taxonomy_term--any_vocab')).toBe(3600);
  });

  it('returns 300s (safe default) for unknown type', () => {
    expect(getRevalidateTime('node--unknown_type')).toBe(300);
  });
});
