import type { MenuItem } from '@/lib/drupal';

// ════════════════════════════════════════════════════════════════════════════
// Generic section model — fully CMS-driven, no hardcoded section names
// ════════════════════════════════════════════════════════════════════════════

export interface SecondaryLink {
  title: string;
  url: string;
}

/**
 * A single item within a nav section.
 * For 'product' sections: represents a product category (Mosaico, Vetrite, etc.)
 * For 'list' sections: represents a child page (Progetti, Showroom, etc.)
 */
export interface NavSectionItem {
  /** The original menu item from Drupal */
  item: MenuItem;
  /** Deep-dive links (info tecniche, catalogs, certifications) */
  secondaryLinks: SecondaryLink[];
  /** Cross-product links (e.g. Illuminazione, Tappeti from arredo hub) */
  crossLinks: SecondaryLink[];
}

/**
 * A top-level navigation section.
 * Variant is inferred structurally:
 * - 'product': children have sub-children (info tecniche, cross-links)
 * - 'list': children are flat links
 */
export interface NavSection {
  /** CMS title (e.g. "Products", "Projects", "Info & Services") */
  title: string;
  /** CMS description */
  description: string;
  /** URL of the section itself (may be empty/<nolink> for container sections) */
  url: string;
  /** Structural variant — determines mega-menu renderer */
  variant: 'product' | 'list';
  /** Children of this section */
  items: NavSectionItem[];
}

// ════════════════════════════════════════════════════════════════════════════
// NavbarMenu — top-level structure
// ════════════════════════════════════════════════════════════════════════════

export interface NavbarMenu {
  /** Ordered sections from CMS — each becomes a mega-menu tab */
  sections: NavSection[];
}
