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
  weight = 0
): MenuItem {
  return {
    id: `menu-${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    url,
    weight,
    children,
  };
}

const fixtureMenuItems: MenuItem[] = [
  // Home
  makeItem('Home', '/it'),
  // Explore (12 children)
  makeItem('Explore', '/it', [
    makeItem('Tinte unite', '/it/mosaico/tinte-unite', [], 0),
    makeItem('Mosaico in marmo', '/it/mosaico/marmo', [], 1),
    makeItem('Mosaico in metallo', '/it/mosaico/metallo', [], 2),
    makeItem('Pixel mosaic', '/it/mosaico/pixel', [], 3),
    makeItem('Artistic mosaic', '/it/mosaico/artistico', [], 4),
    makeItem('Lastre vetro Vetrite', '/it/vetrite', [], 5),
    makeItem('Arredo', '/it/arredo', [], 6),
    makeItem('Cucina', '/it/cucina', [], 7),
    makeItem('Illuminazione', '/it/illuminazione', [], 8),
    makeItem('Prodotti Tessili', '/it/tessile', [], 9),
    makeItem('Mosaico bagno', '/it/mosaico/bagno', [], 10),
    makeItem('Sicis Jewels', '/it/jewels', [], 11),
  ]),
  // Filter and Find (5 children)
  makeItem('Filter and Find', '/it', [
    makeItem('Mosaico', '/it/mosaico', [], 0),
    makeItem('Lastre vetro Vetrite', '/it/vetrite', [], 1),
    makeItem('Arredo', '/it/arredo', [], 2),
    makeItem('Illuminazione', '/it/illuminazione', [], 3),
    makeItem('Prodotti Tessili', '/it/tessile', [], 4),
  ]),
  // Projects (4 children)
  makeItem('Projects', '/it', [
    makeItem('Progetti', '/it/progetti', [], 0),
    makeItem('Ambienti', '/it/ambienti', [], 1),
    makeItem('Inspiration', '/it/inspiration', [], 2),
    makeItem('Interior Design Service', '/it/interior-design-service', [], 3),
  ]),
  // Info & Services (7 children)
  makeItem('Info & Services', '/it', [
    makeItem('Heritage', '/it/heritage', [], 0),
    makeItem('About us', '/it/about-us', [], 1),
    makeItem('Sicis Village', '/it/sicis-village', [], 2),
    makeItem('Showroom', '/it/showroom', [], 3),
    makeItem('Contacts', '/it/contacts', [], 4),
    makeItem('Professional', '/it/professional', [], 5),
    makeItem('Download Catalogues', '/it/download-catalogues', [], 6),
  ]),
];

// ════════════════════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════════════════════

describe('mapMenuToNavbar', () => {
  const result = mapMenuToNavbar(fixtureMenuItems);

  // ── Explore section ───────────────────────────────────────────────────

  describe('explore section', () => {
    it('has 5 category groups', () => {
      expect(result.explore.items).toHaveLength(5);
    });

    it('groups Mosaico items correctly', () => {
      const mosaico = result.explore.items.find((g) => g.label === 'Mosaico');
      expect(mosaico).toBeDefined();
      expect(mosaico!.items).toHaveLength(5);
      const titles = mosaico!.items.map((i) => i.title);
      expect(titles).toContain('Tinte unite');
      expect(titles).toContain('Mosaico in marmo');
      expect(titles).toContain('Mosaico in metallo');
      expect(titles).toContain('Pixel mosaic');
      expect(titles).toContain('Artistic mosaic');
    });

    it('groups Vetrite items correctly', () => {
      const vetrite = result.explore.items.find((g) => g.label === 'Vetrite');
      expect(vetrite).toBeDefined();
      expect(vetrite!.items).toHaveLength(1);
      expect(vetrite!.items[0].title).toBe('Lastre vetro Vetrite');
    });

    it('groups Living items correctly', () => {
      const living = result.explore.items.find((g) => g.label === 'Living');
      expect(living).toBeDefined();
      expect(living!.items).toHaveLength(4);
      const titles = living!.items.map((i) => i.title);
      expect(titles).toContain('Arredo');
      expect(titles).toContain('Cucina');
      expect(titles).toContain('Illuminazione');
      expect(titles).toContain('Mosaico bagno');
    });

    it('groups Tessile items correctly', () => {
      const tessile = result.explore.items.find((g) => g.label === 'Tessile');
      expect(tessile).toBeDefined();
      expect(tessile!.items).toHaveLength(1);
      expect(tessile!.items[0].title).toBe('Prodotti Tessili');
    });

    it('groups Jewels items correctly', () => {
      const jewels = result.explore.items.find((g) => g.label === 'Jewels');
      expect(jewels).toBeDefined();
      expect(jewels!.items).toHaveLength(1);
      expect(jewels!.items[0].title).toBe('Sicis Jewels');
    });

    it('preserves group order: Mosaico, Vetrite, Living, Tessile, Jewels', () => {
      const labels = result.explore.items.map((g) => g.label);
      expect(labels).toEqual(['Mosaico', 'Vetrite', 'Living', 'Tessile', 'Jewels']);
    });
  });

  // ── FilterFind section ────────────────────────────────────────────────

  describe('filterFind section', () => {
    it('has 5 filter categories', () => {
      expect(result.filterFind.items).toHaveLength(5);
    });

    it('preserves the original menu items', () => {
      const titles = result.filterFind.items.map((c) => c.item.title);
      expect(titles).toEqual([
        'Mosaico',
        'Lastre vetro Vetrite',
        'Arredo',
        'Illuminazione',
        'Prodotti Tessili',
      ]);
    });

    it('each category has a secondaryLinks array', () => {
      for (const cat of result.filterFind.items) {
        expect(Array.isArray(cat.secondaryLinks)).toBe(true);
      }
    });
  });

  // ── Projects section ──────────────────────────────────────────────────

  describe('projects section', () => {
    it('has 4 items', () => {
      expect(result.projects.items).toHaveLength(4);
    });

    it('preserves the items in order', () => {
      const titles = result.projects.items.map((i) => i.title);
      expect(titles).toEqual([
        'Progetti',
        'Ambienti',
        'Inspiration',
        'Interior Design Service',
      ]);
    });
  });

  // ── Info section ──────────────────────────────────────────────────────

  describe('info section', () => {
    it('assigns strategic items correctly', () => {
      const titles = result.info.strategic.map((i) => i.title);
      expect(titles).toContain('Showroom');
      expect(titles).toContain('Contacts');
      expect(titles).toContain('Download Catalogues');
      expect(titles).toHaveLength(3);
    });

    it('assigns corporate items correctly', () => {
      const titles = result.info.corporate.map((i) => i.title);
      expect(titles).toContain('Heritage');
      expect(titles).toContain('About us');
      expect(titles).toContain('Sicis Village');
      expect(titles).toHaveLength(3);
    });

    it('assigns professional items correctly', () => {
      const titles = result.info.professional.map((i) => i.title);
      expect(titles).toContain('Professional');
      expect(titles).toHaveLength(1);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns empty sections for empty input', () => {
      const empty = mapMenuToNavbar([]);
      expect(empty.explore.items).toEqual([]);
      expect(empty.filterFind.items).toEqual([]);
      expect(empty.projects.items).toEqual([]);
      expect(empty.info.strategic).toEqual([]);
      expect(empty.info.corporate).toEqual([]);
      expect(empty.info.professional).toEqual([]);
    });

    it('handles missing top-level sections gracefully', () => {
      const partial = mapMenuToNavbar([
        makeItem('Home', '/it'),
        makeItem('Projects', '/it', [
          makeItem('Progetti', '/it/progetti'),
        ]),
      ]);
      expect(partial.explore.items).toEqual([]);
      expect(partial.filterFind.items).toEqual([]);
      expect(partial.projects.items).toHaveLength(1);
      expect(partial.info.strategic).toEqual([]);
    });

    it('handles case-insensitive title matching for top-level sections', () => {
      const caseVariant = mapMenuToNavbar([
        makeItem('EXPLORE', '/it', [
          makeItem('Tinte unite', '/it/mosaico/tinte-unite'),
        ]),
      ]);
      expect(caseVariant.explore.items.length).toBeGreaterThan(0);
    });

    it('handles case-insensitive title matching for info sub-items', () => {
      const caseVariant = mapMenuToNavbar([
        makeItem('Info & Services', '/it', [
          makeItem('SHOWROOM', '/it/showroom'),
          makeItem('heritage', '/it/heritage'),
          makeItem('professional', '/it/professional'),
        ]),
      ]);
      expect(caseVariant.info.strategic).toHaveLength(1);
      expect(caseVariant.info.corporate).toHaveLength(1);
      expect(caseVariant.info.professional).toHaveLength(1);
    });
  });
});
