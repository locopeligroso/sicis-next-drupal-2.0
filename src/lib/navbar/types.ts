import type { MenuItem } from '@/lib/drupal';

// ════════════════════════════════════════════════════════════════════════════
// Explore section — 12 Drupal children reorganized into 5 category groups
// ════════════════════════════════════════════════════════════════════════════

export interface ExploreCategoryGroup {
  /** Group label (e.g. "Mosaico", "Vetrite", "Living", "Tessile", "Jewels") */
  label: string;
  items: MenuItem[];
}

export interface ExploreSection {
  items: ExploreCategoryGroup[];
}

// ════════════════════════════════════════════════════════════════════════════
// Filter & Find section — 5 product categories with secondary links
// ════════════════════════════════════════════════════════════════════════════

export interface SecondaryLink {
  title: string;
  url: string;
}

export interface FilterFindCategory {
  /** The original menu item (e.g. "Mosaico", "Lastre vetro Vetrite") */
  item: MenuItem;
  /** Deep-dive links (catalogs, certifications, tutorials, etc.) */
  secondaryLinks: SecondaryLink[];
  /** Cross-product links (e.g. Illuminazione, Tappeti from arredo hub) */
  crossLinks: SecondaryLink[];
}

export interface FilterFindSection {
  items: FilterFindCategory[];
}

// ════════════════════════════════════════════════════════════════════════════
// Projects section — 4 items kept as-is
// ════════════════════════════════════════════════════════════════════════════

export interface ProjectsSection {
  items: MenuItem[];
}

// ════════════════════════════════════════════════════════════════════════════
// Info section — split into strategic, corporate, professional
// ════════════════════════════════════════════════════════════════════════════

export interface InfoSection {
  strategic: MenuItem[];
  corporate: MenuItem[];
  professional: MenuItem[];
}

// ════════════════════════════════════════════════════════════════════════════
// NavbarMenu — top-level structure
// ════════════════════════════════════════════════════════════════════════════

export interface NavbarMenu {
  explore: ExploreSection;
  filterFind: FilterFindSection;
  projects: ProjectsSection;
  info: InfoSection;
  /** CMS descriptions for top-level nav items (from Drupal menu description field) */
  sectionDescriptions: Record<string, string>;
}
