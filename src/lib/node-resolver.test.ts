import { describe, it, expect } from 'vitest';
import { getRevalidateTime, getComponentName, getIncludeFields } from './node-resolver';

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

  it('maps taxonomy_term--mosaico_collezioni to MosaicoCollezione', () => {
    expect(getComponentName('taxonomy_term--mosaico_collezioni')).toBe('MosaicoCollezione');
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

// ── getIncludeFields ──────────────────────────────────────────────────────

describe('getIncludeFields', () => {
  it('returns include fields for prodotto_mosaico', () => {
    const include = getIncludeFields('prodotto_mosaico');
    expect(include).toBeDefined();
    expect(include).toContain('field_immagine');
    expect(include).toContain('field_collezione');
    expect(include).toContain('field_gallery');
  });

  it('returns include fields for prodotto_arredo', () => {
    const include = getIncludeFields('prodotto_arredo');
    expect(include).toBeDefined();
    expect(include).toContain('field_immagine');
    expect(include).toContain('field_categoria');
  });

  it('returns include fields for prodotto_vetrite', () => {
    const include = getIncludeFields('prodotto_vetrite');
    expect(include).toBeDefined();
    expect(include).toContain('field_collezione');
    expect(include).toContain('field_colori');
  });

  it('returns include fields for prodotto_tessuto', () => {
    const include = getIncludeFields('prodotto_tessuto');
    expect(include).toBeDefined();
    expect(include).toContain('field_colori');
    expect(include).toContain('field_categoria');
  });

  it('returns include fields for prodotto_pixall', () => {
    const include = getIncludeFields('prodotto_pixall');
    expect(include).toBeDefined();
    expect(include).toContain('field_immagine');
    expect(include).toContain('field_colori');
  });

  it('returns field_blocchi for page (paragraph-based content)', () => {
    const include = getIncludeFields('page');
    expect(include).toBeDefined();
    expect(include).toContain('field_blocchi');
  });

  it('returns field_blocchi for articolo', () => {
    const include = getIncludeFields('articolo');
    expect(include).toBeDefined();
    expect(include).toContain('field_blocchi');
    expect(include).toContain('field_immagine');
  });

  it('does NOT include field_blocchi for prodotto_mosaico (products have no paragraphs)', () => {
    const include = getIncludeFields('prodotto_mosaico');
    expect(include).not.toContain('field_blocchi');
  });

  it('returns undefined for unknown bundle', () => {
    const include = getIncludeFields('unknown_bundle');
    expect(include).toBeUndefined();
  });

  it('returns include fields for taxonomy terms', () => {
    const include = getIncludeFields('mosaico_collezioni');
    expect(include).toBeDefined();
    expect(include).toContain('field_immagine');
  });
});
