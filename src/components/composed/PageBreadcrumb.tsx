import {
  SmartBreadcrumb,
  type BreadcrumbSegment,
} from '@/components/composed/SmartBreadcrumb';
import { resolvePath } from '@/lib/api/resolve-path';
import { fetchHubCategories } from '@/lib/api/category-hub';
import { toDrupalLocale } from '@/i18n/config';

interface PageBreadcrumbProps {
  /** URL slug segments e.g. ['mosaic', 'marble'] */
  slug: string[];
  locale: string;
  /** Override label for the last segment (e.g. node title from CMS) */
  lastLabel?: string;
}

/**
 * Humanize a URL slug: "metal-mosaic" → "Metal Mosaic"
 */
function humanize(s: string): string {
  return decodeURIComponent(s)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Slugify for EN matching: "Metal mosaic" → "metal-mosaic"
 */
function slugifyName(name: string): string {
  return name
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u00C0-\u024F\u0400-\u04FF-]/g, '');
}

/**
 * Fetch sibling pages for a parent path.
 * Uses the same strategy as SpecHubOtherPages: fetch EN categories,
 * resolve EN slug via resolve-path, extract locale-specific alias.
 */
async function fetchSiblings(
  parentPath: string,
  locale: string,
): Promise<{ label: string; href: string }[]> {
  const drupalLocale = toDrupalLocale(locale);

  // Resolve parent to get NID
  const parentResolved = await resolvePath(parentPath, drupalLocale).catch(
    () => null,
  );
  if (!parentResolved) return [];

  // Fetch categories in current locale (for display names) + EN (for slug matching)
  const [categories, enCategories, baseResolved] = await Promise.all([
    fetchHubCategories(parentResolved.nid, locale),
    fetchHubCategories(parentResolved.nid, 'en'),
    resolvePath(parentPath, drupalLocale).catch(() => null),
  ]);

  if (categories.length === 0) return [];

  const enBasePath = baseResolved?.aliases?.en ?? parentPath;

  // NID → EN name map for reliable slug resolution
  const enNameByNid = new Map(enCategories.map((c) => [c.nid, c.name]));

  // Resolve aliases for each sibling via EN path
  const resolved = await Promise.all(
    categories.map(async (cat) => {
      const enName = enNameByNid.get(cat.nid);
      if (!enName) return null;
      const enSlug = slugifyName(enName);
      const r = await resolvePath(`${enBasePath}/${enSlug}`, 'en').catch(
        () => null,
      );
      const alias = r?.aliases?.[drupalLocale] ?? r?.aliases?.[locale];
      return {
        label: cat.name,
        href: alias
          ? `/${locale}${alias}`
          : `/${locale}${parentPath}/${slugifyName(cat.name)}`,
      };
    }),
  );

  return resolved.filter(
    (r): r is { label: string; href: string } => r !== null,
  );
}

/**
 * Async server component — universal breadcrumb from URL slug segments.
 * For 2+ segment pages, fetches siblings at the same level (e.g. Marble's
 * siblings = Artistic Mosaic, Metal Mosaic, Pixel under /mosaic/).
 */
export async function PageBreadcrumb({
  slug,
  locale,
  lastLabel,
}: PageBreadcrumbProps) {
  if (slug.length === 0) return null;

  const segments: BreadcrumbSegment[] = [];

  // Fetch siblings for the last segment (pages at the same parent level)
  let siblings: { label: string; href: string }[] | undefined;
  if (slug.length >= 2) {
    const parentPath = `/${slug[0]}`;
    siblings = await fetchSiblings(parentPath, locale);
    // Only include siblings if there are at least 2 (including current page)
    if (siblings.length < 2) siblings = undefined;
  }

  for (let i = 0; i < slug.length; i++) {
    const isLast = i === slug.length - 1;
    const label = isLast && lastLabel ? lastLabel : humanize(slug[i]);
    const href = `/${locale}/${slug.slice(0, i + 1).join('/')}`;

    segments.push({
      label,
      href,
      // Add siblings dropdown to the last segment
      ...(isLast && siblings ? { siblings } : {}),
    });
  }

  return (
    <div className="max-w-main mx-auto px-(--spacing-page) pt-4">
      <SmartBreadcrumb segments={segments} />
    </div>
  );
}
