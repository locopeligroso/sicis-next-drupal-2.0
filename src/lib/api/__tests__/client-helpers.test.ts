/**
 * Tests for pure helper functions exported from client.ts:
 *  - stripDomain
 *  - stripLocalePrefix
 *  - emptyToNull
 *
 * apiGet is NOT tested here because it requires fetch / network.
 * Those helpers contain no async code and no side-effects, so we
 * import them as real implementations (no mocking needed except for
 * DRUPAL_BASE_URL which stripDomain reads at runtime via the module).
 */
import { describe, it, expect, vi } from 'vitest';

// ── Mocks (hoisted before the module under test is imported) ──────────────────

vi.mock('@/lib/drupal/config', () => ({
  DRUPAL_BASE_URL: 'https://drupal.example.com',
}));

vi.mock('@/i18n/config', () => ({
  toDrupalLocale: (locale: string) => locale,
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { stripDomain, stripLocalePrefix, emptyToNull } from '@/lib/api/client';

// ─────────────────────────────────────────────────────────────────────────────
// stripDomain
// ─────────────────────────────────────────────────────────────────────────────

describe('stripDomain', () => {
  it('strips domain from a full URL, leaving only the path', () => {
    expect(stripDomain('https://drupal.example.com/it/mosaico/pluma')).toBe(
      '/it/mosaico/pluma',
    );
  });

  it('strips domain from a different host (Drupal stage URL)', () => {
    expect(
      stripDomain('https://www.sicis-stage.com/it/mosaico/murano-smalto'),
    ).toBe('/it/mosaico/murano-smalto');
  });

  it('returns the path unchanged when passed a relative path', () => {
    expect(stripDomain('/it/mosaico/pluma')).toBe('/it/mosaico/pluma');
  });

  it('returns the path unchanged when passed a path without locale', () => {
    expect(stripDomain('/mosaico/pluma')).toBe('/mosaico/pluma');
  });

  it('returns null when passed null', () => {
    expect(stripDomain(null)).toBeNull();
  });

  it('returns null when passed an empty string', () => {
    expect(stripDomain('')).toBeNull();
  });

  it('strips the Drupal base path prefix when present in the URL', () => {
    // DRUPAL_BASE_URL is mocked to "https://drupal.example.com" (no sub-path),
    // so no base-path stripping applies — just domain is removed.
    expect(stripDomain('https://drupal.example.com/en/products/item')).toBe(
      '/en/products/item',
    );
  });

  it('handles URLs with query-strings by returning only the pathname', () => {
    expect(stripDomain('https://drupal.example.com/it/search?q=foo')).toBe(
      '/it/search',
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// stripLocalePrefix
// ─────────────────────────────────────────────────────────────────────────────

describe('stripLocalePrefix', () => {
  it('removes a two-letter locale prefix from a path', () => {
    expect(stripLocalePrefix('/it/foo')).toBe('/foo');
  });

  it('removes locale from a deep path', () => {
    expect(stripLocalePrefix('/en/bar/baz')).toBe('/bar/baz');
  });

  it('removes locale for all supported locale codes', () => {
    const locales = ['it', 'en', 'fr', 'de', 'es', 'ru'];
    for (const loc of locales) {
      expect(stripLocalePrefix(`/${loc}/products`)).toBe('/products');
    }
  });

  it('returns the path unchanged when there is no locale prefix', () => {
    expect(stripLocalePrefix('/mosaico/pluma')).toBe('/mosaico/pluma');
  });

  it('does not strip a three-letter prefix', () => {
    expect(stripLocalePrefix('/ita/foo')).toBe('/ita/foo');
  });

  it('returns null when passed null', () => {
    expect(stripLocalePrefix(null)).toBeNull();
  });

  it('returns null when passed an empty string', () => {
    expect(stripLocalePrefix('')).toBeNull();
  });

  it('only strips the leading prefix, not inner locale-like segments', () => {
    expect(stripLocalePrefix('/en/en/nested')).toBe('/en/nested');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// emptyToNull
// ─────────────────────────────────────────────────────────────────────────────

describe('emptyToNull', () => {
  it('converts an empty string to null', () => {
    expect(emptyToNull('')).toBeNull();
  });

  it('returns a non-empty string unchanged', () => {
    expect(emptyToNull('hello')).toBe('hello');
  });

  it('returns a URL string unchanged', () => {
    expect(emptyToNull('https://example.com/image.jpg')).toBe(
      'https://example.com/image.jpg',
    );
  });

  it('converts null to null', () => {
    expect(emptyToNull(null)).toBeNull();
  });

  it('converts undefined to null', () => {
    expect(emptyToNull(undefined)).toBeNull();
  });

  it('returns a whitespace-only string unchanged (not empty)', () => {
    // The function checks !value — " " is truthy, so it passes through.
    expect(emptyToNull('  ')).toBe('  ');
  });
});
