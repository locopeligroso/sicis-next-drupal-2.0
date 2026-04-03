import type { MenuItem } from '@/lib/drupal';
import type {
  NavbarMenu,
  NavSection,
  NavSectionItem,
  SecondaryLink,
} from './types';

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

function lc(s: string): string {
  return s.toLowerCase().trim();
}

/** Drupal returns "None" (Python repr) for empty descriptions */
function cleanDescription(desc: string | undefined): string {
  if (!desc || desc === 'None') return '';
  return desc;
}

/**
 * Infer section variant from children structure.
 * If ANY child has sub-children, this is a 'product' section
 * (product categories have info-tecniche, cross-link sub-items).
 * Otherwise it's a flat 'list' section.
 */
function inferVariant(children: MenuItem[]): 'product' | 'list' {
  return children.some((c) => (c.children ?? []).length > 0)
    ? 'product'
    : 'list';
}

/**
 * Build a NavSectionItem from a menu child.
 * Extracts secondaryLinks and crossLinks from sub-children:
 * - Sub-child titled "cross-link" with grandchildren → crossLinks
 * - Sub-child without children → secondaryLink
 */
function buildSectionItem(child: MenuItem): NavSectionItem {
  const secondaryLinks: SecondaryLink[] = [];
  const crossLinks: SecondaryLink[] = [];

  for (const subChild of child.children ?? []) {
    const hasGrandchildren = (subChild.children ?? []).length > 0;

    if (hasGrandchildren && lc(subChild.title) === 'cross-link') {
      for (const gc of subChild.children!) {
        crossLinks.push({ title: gc.title, url: gc.url });
      }
    } else if (!hasGrandchildren) {
      secondaryLinks.push({ title: subChild.title, url: subChild.url });
    }
  }

  return { item: child, secondaryLinks, crossLinks };
}

// ════════════════════════════════════════════════════════════════════════════
// Main mapper
// ════════════════════════════════════════════════════════════════════════════

/**
 * Maps Drupal main-menu items into a generic NavbarMenu.
 *
 * Fully CMS-driven: iterates top-level items in order, skips items
 * without children (e.g. "Home"), infers variant from structure.
 * Zero title matching — when CMS changes, frontend adapts automatically.
 */
export function mapMenuToNavbar(menuItems: MenuItem[]): NavbarMenu {
  const sections: NavSection[] = [];

  for (const item of menuItems) {
    // Skip top-level items without children (e.g. "Home" link)
    if (!item.children?.length) continue;

    const variant = inferVariant(item.children);
    const items = item.children.map(buildSectionItem);

    sections.push({
      title: item.title,
      description: cleanDescription(item.description),
      url: item.url,
      variant,
      items,
    });
  }

  return { sections };
}
