import { describe, it, expect } from 'vitest';
import type { MenuItem } from '@/lib/drupal';
import { mapMenuToNavbar } from '../menu-mapper';

// ════════════════════════════════════════════════════════════════════════════
// Fixture: realistic Drupal main menu (IT locale, post-transformMenuToNavItems)
// ════════════════════════════════════════════════════════════════════════════

function makeItem(
  title: string,
  url: string,
  children: MenuItem[] = [],
  weight = 0,
  description = '',
): MenuItem {
  return {
    id: `menu-${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    description,
    url,
    weight,
    children,
  };
}

const fixtureMenuItems: MenuItem[] = [
  // Home (no children — should be skipped)
  makeItem('Home', '/it'),
  // Products (children with sub-children → variant: 'product')
  makeItem('Products', '/it', [
    makeItem('Mosaico', '/it/mosaico', [
      makeItem('Info tecniche', '/it/info-tecniche-mosaico'),
    ]),
    makeItem('Lastre vetro Vetrite', '/it/vetrite', [
      makeItem('Info tecniche', '/it/info-tecniche-vetrite'),
    ]),
    makeItem('Arredo', '/it/arredo', [
      makeItem('Info tecniche', '/it/info-tecniche-arredo'),
      makeItem('Cross-Link', '', [
        makeItem('Lighting', '/it/illuminazione'),
        makeItem('Carpets', '/it/tessile/tappeti'),
      ]),
    ]),
    makeItem('Illuminazione', '/it/illuminazione', [
      makeItem('Info tecniche', '/it/info-tecniche-illuminazione'),
    ]),
    makeItem('Prodotti Tessili', '/it/tessile', [
      makeItem('Info tecniche', '/it/info-tecniche-tessuti'),
    ]),
    makeItem('Sicis Jewels', '/it/sicis-jewels', [
      makeItem('Dedicated website', 'https://www.sicisjewels.com/'),
    ]),
  ]),
  // Projects (flat children → variant: 'list')
  makeItem('Projects', '/it', [
    makeItem('Progetti', '/it/progetti', [], 0, 'Le realizzazioni SICIS'),
    makeItem('Ambienti', '/it/ambienti', [], 1, 'Ispirazioni per ogni spazio'),
    makeItem('Inspiration', '/it/blog', [], 2, 'Tendenze e idee'),
    makeItem(
      'Interior Design Service',
      '/it/interior-design-service',
      [],
      3,
      'Progettazione personalizzata',
    ),
  ]),
  // Info & Services (flat children → variant: 'list')
  makeItem('Info & Services', '/it', [
    makeItem('Heritage', '/it/heritage'),
    makeItem('About us', '/it/about-us'),
    makeItem('Sicis Village', '/it/sicis-village'),
    makeItem('Showroom', '/it/showroom', [], 0, 'I nostri spazi espositivi'),
    makeItem('Contacts', '/it/contacts', [], 0, 'Scrivici'),
    makeItem('Download Catalogues', '/it/download-catalogues'),
  ]),
];

// ════════════════════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════════════════════

describe('mapMenuToNavbar', () => {
  const result = mapMenuToNavbar(fixtureMenuItems);

  // ── Generic section structure ────────────────────────────────────────

  describe('section structure', () => {
    it('creates 3 sections (skips Home with no children)', () => {
      expect(result.sections).toHaveLength(3);
    });

    it('preserves CMS order: Products, Projects, Info & Services', () => {
      const titles = result.sections.map((s) => s.title);
      expect(titles).toEqual(['Products', 'Projects', 'Info & Services']);
    });

    it('infers product variant for sections with sub-children', () => {
      const products = result.sections[0];
      expect(products.variant).toBe('product');
    });

    it('infers list variant for flat sections', () => {
      const projects = result.sections[1];
      const info = result.sections[2];
      expect(projects.variant).toBe('list');
      expect(info.variant).toBe('list');
    });
  });

  // ── Products section ────────────────────────────────────────────────

  describe('products section', () => {
    const products = result.sections[0];

    it('has 6 product categories', () => {
      expect(products.items).toHaveLength(6);
    });

    it('preserves item titles from CMS', () => {
      const titles = products.items.map((c) => c.item.title);
      expect(titles).toEqual([
        'Mosaico',
        'Lastre vetro Vetrite',
        'Arredo',
        'Illuminazione',
        'Prodotti Tessili',
        'Sicis Jewels',
      ]);
    });

    it('extracts secondaryLinks from sub-children', () => {
      const mosaico = products.items[0];
      expect(mosaico.secondaryLinks).toHaveLength(1);
      expect(mosaico.secondaryLinks[0].title).toBe('Info tecniche');
    });

    it('extracts crossLinks from Cross-Link sub-children', () => {
      const arredo = products.items[2];
      expect(arredo.crossLinks).toHaveLength(2);
      expect(arredo.crossLinks[0].title).toBe('Lighting');
      expect(arredo.crossLinks[1].title).toBe('Carpets');
    });

    it('does not put cross-link items into secondaryLinks', () => {
      const arredo = products.items[2];
      expect(arredo.secondaryLinks).toHaveLength(1);
      expect(arredo.secondaryLinks[0].title).toBe('Info tecniche');
    });
  });

  // ── Projects section ────────────────────────────────────────────────

  describe('projects section', () => {
    const projects = result.sections[1];

    it('has 4 items', () => {
      expect(projects.items).toHaveLength(4);
    });

    it('preserves items in CMS order', () => {
      const titles = projects.items.map((i) => i.item.title);
      expect(titles).toEqual([
        'Progetti',
        'Ambienti',
        'Inspiration',
        'Interior Design Service',
      ]);
    });
  });

  // ── Info section ────────────────────────────────────────────────────

  describe('info section', () => {
    const info = result.sections[2];

    it('has 6 items in CMS order', () => {
      expect(info.items).toHaveLength(6);
      const titles = info.items.map((i) => i.item.title);
      expect(titles).toEqual([
        'Heritage',
        'About us',
        'Sicis Village',
        'Showroom',
        'Contacts',
        'Download Catalogues',
      ]);
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns empty sections array for empty input', () => {
      const empty = mapMenuToNavbar([]);
      expect(empty.sections).toEqual([]);
    });

    it('skips items without children', () => {
      const minimal = mapMenuToNavbar([
        makeItem('Home', '/it'),
        makeItem('Projects', '/it', [makeItem('Progetti', '/it/progetti')]),
      ]);
      expect(minimal.sections).toHaveLength(1);
      expect(minimal.sections[0].title).toBe('Projects');
    });

    it('adapts to any section title — no hardcoded matching', () => {
      const renamed = mapMenuToNavbar([
        makeItem('Completely New Name', '/it', [
          makeItem('Child A', '/it/a', [makeItem('Sub', '/it/a/sub')]),
        ]),
      ]);
      expect(renamed.sections).toHaveLength(1);
      expect(renamed.sections[0].title).toBe('Completely New Name');
      expect(renamed.sections[0].variant).toBe('product');
    });
  });
});
