import type { MenuItem } from '@/lib/drupal';
import type {
  NavbarMenu,
  ExploreSection,
  ExploreCategoryGroup,
  FilterFindSection,
  FilterFindCategory,
  ProjectsSection,
  InfoSection,
} from './types';

// ════════════════════════════════════════════════════════════════════════════
// Constants — title matchers (case-insensitive)
// ════════════════════════════════════════════════════════════════════════════

/** Top-level menu item titles that identify each section */
const SECTION_TITLES = {
  explore: 'explore',
  filterFind: 'filter and find',
  projects: 'projects',
  info: 'info & services',
} as const;

/**
 * Explore section: maps each child title to a category group.
 * Key = lowercase title, Value = group label.
 */
const EXPLORE_GROUP_MAP: Record<string, string> = {
  // Mosaico — IT
  'tinte unite': 'Mosaico',
  'mosaico in marmo': 'Mosaico',
  'mosaico in metallo': 'Mosaico',
  'pixel mosaic': 'Mosaico',
  'artistic mosaic': 'Mosaico',
  // Mosaico — EN
  'solid colours': 'Mosaico',
  marble: 'Mosaico',
  'metal mosaic': 'Mosaico',
  // Mosaico — FR
  couleurs: 'Mosaico',
  'mosaïque en métal': 'Mosaico',
  // Mosaico — DE
  farben: 'Mosaico',
  marmormosaik: 'Mosaico',
  metallmosaik: 'Mosaico',
  // Mosaico — ES
  colores: 'Mosaico',
  'mosaico metálico': 'Mosaico',
  // Mosaico — RU
  цвета: 'Mosaico',
  'металлическая мозаика': 'Mosaico',

  // Vetrite — all locales
  'lastre vetro vetrite': 'Vetrite',
  'vetrite glass slabs': 'Vetrite',
  'plaque en verre vetrite': 'Vetrite',
  'glasscheibe vetrite': 'Vetrite',
  'láminas de vidrio vetrite': 'Vetrite',
  'cтеклянные листы vetrite': 'Vetrite',

  // Living — IT
  arredo: 'Living',
  cucina: 'Living',
  illuminazione: 'Living',
  'mosaico bagno': 'Living',
  // Living — EN
  furniture: 'Living',
  kitchen: 'Living',
  lighting: 'Living',
  'bathroom mosaics': 'Living',
  // Living — FR
  ameublement: 'Living',
  cuisine: 'Living',
  éclairage: 'Living',
  'mosaïques pour salle de bain': 'Living',
  // Living — DE
  einrichtung: 'Living',
  küche: 'Living',
  leuchten: 'Living',
  badezimmermosaike: 'Living',
  // Living — ES
  mueble: 'Living',
  cocina: 'Living',
  iluminación: 'Living',
  'mosaicos para el baño': 'Living',
  // Living — RU
  обстановка: 'Living',
  кухня: 'Living',
  освещение: 'Living',
  'мозаика для ванной комнаты': 'Living',

  // Tessile — all locales
  'prodotti tessili': 'Tessile',
  textiles: 'Tessile',
  'produits textiles': 'Tessile',
  textilien: 'Tessile',
  'текстильные изделия': 'Tessile',

  // Jewels — same in all locales
  'sicis jewels': 'Jewels',
};

/** Ordered group labels for the Explore section */
const EXPLORE_GROUP_ORDER = [
  'Mosaico',
  'Vetrite',
  'Living',
  'Tessile',
  'Jewels',
];

/**
 * Info section: maps each child title to a sub-section.
 * Key = lowercase title, Value = 'strategic' | 'corporate' | 'professional'.
 */
const INFO_CATEGORY_MAP: Record<
  string,
  'strategic' | 'corporate' | 'professional'
> = {
  showroom: 'strategic',
  contacts: 'strategic',
  'download catalogues': 'strategic',
  heritage: 'corporate',
  'about us': 'corporate',
  'sicis village': 'corporate',
  professional: 'professional',
};

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

function lc(s: string): string {
  return s.toLowerCase().trim();
}

/** Find a top-level menu item by case-insensitive title match */
function findSection(
  items: MenuItem[],
  sectionTitle: string,
): MenuItem | undefined {
  return items.find((item) => lc(item.title) === sectionTitle);
}

// ════════════════════════════════════════════════════════════════════════════
// Section builders
// ════════════════════════════════════════════════════════════════════════════

function buildExploreSection(
  sectionItem: MenuItem | undefined,
): ExploreSection {
  if (!sectionItem?.children?.length) {
    return { items: [] };
  }

  // Bucket children into groups
  const buckets = new Map<string, MenuItem[]>();
  for (const label of EXPLORE_GROUP_ORDER) {
    buckets.set(label, []);
  }

  for (const child of sectionItem.children) {
    const groupLabel = EXPLORE_GROUP_MAP[lc(child.title)];
    if (groupLabel && buckets.has(groupLabel)) {
      buckets.get(groupLabel)!.push(child);
    }
  }

  // Build ordered groups, only include non-empty
  const groups: ExploreCategoryGroup[] = [];
  for (const label of EXPLORE_GROUP_ORDER) {
    const items = buckets.get(label)!;
    if (items.length > 0) {
      groups.push({ label, items });
    }
  }

  return { items: groups };
}

/** Short display titles for Filter&Find categories */
const FILTER_FIND_SHORT_TITLES: Record<string, string> = {
  'prodotti tessili': 'Tessili',
  textiles: 'Tessili',
  'produits textiles': 'Tessili',
  textilien: 'Tessili',
  'текстильные изделия': 'Tessili',
  'lastre vetro vetrite': 'Vetrite',
  'vetrite glass slabs': 'Vetrite',
  'plaque en verre vetrite': 'Vetrite',
  'glasscheibe vetrite': 'Vetrite',
  'láminas de vidrio vetrite': 'Vetrite',
  'cтеклянные листы vetrite': 'Vetrite',
};

function buildFilterFindSection(
  sectionItem: MenuItem | undefined,
): FilterFindSection {
  if (!sectionItem?.children?.length) {
    return { items: [] };
  }

  const items: FilterFindCategory[] = sectionItem.children.map((child) => ({
    item: {
      ...child,
      title: FILTER_FIND_SHORT_TITLES[lc(child.title)] ?? child.title,
    },
    secondaryLinks: (child.children ?? []).map((c) => ({
      title: c.title,
      url: c.url,
    })),
  }));

  return { items };
}

function buildProjectsSection(
  sectionItem: MenuItem | undefined,
): ProjectsSection {
  if (!sectionItem?.children?.length) {
    return { items: [] };
  }

  return { items: [...sectionItem.children] };
}

function buildInfoSection(sectionItem: MenuItem | undefined): InfoSection {
  const empty: InfoSection = { strategic: [], corporate: [], professional: [] };

  if (!sectionItem?.children?.length) {
    return empty;
  }

  const result: InfoSection = {
    strategic: [],
    corporate: [],
    professional: [],
  };

  for (const child of sectionItem.children) {
    const category = INFO_CATEGORY_MAP[lc(child.title)];
    if (category) {
      result[category].push(child);
    }
  }

  return result;
}

// ════════════════════════════════════════════════════════════════════════════
// Main mapper
// ════════════════════════════════════════════════════════════════════════════

/**
 * Maps flat Drupal main-menu items (output of `transformMenuToNavItems`)
 * into a structured `NavbarMenu` for the new navbar.
 *
 * Matches top-level sections and their children by title (case-insensitive).
 * Missing sections result in empty arrays, never errors.
 */
export function mapMenuToNavbar(menuItems: MenuItem[]): NavbarMenu {
  const exploreItem = findSection(menuItems, SECTION_TITLES.explore);
  const filterFindItem = findSection(menuItems, SECTION_TITLES.filterFind);
  const projectsItem = findSection(menuItems, SECTION_TITLES.projects);
  const infoItem = findSection(menuItems, SECTION_TITLES.info);

  return {
    explore: buildExploreSection(exploreItem),
    filterFind: buildFilterFindSection(filterFindItem),
    projects: buildProjectsSection(projectsItem),
    info: buildInfoSection(infoItem),
    sectionDescriptions: {
      explore: exploreItem?.description ?? '',
      filterFind: filterFindItem?.description ?? '',
      projects: projectsItem?.description ?? '',
      info: infoItem?.description ?? '',
    },
  };
}
