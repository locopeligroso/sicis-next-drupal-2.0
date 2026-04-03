import Image from 'next/image';
import Link from 'next/link';
import { fetchHubCategories } from '@/lib/api/category-hub';
import { resolvePath } from '@/lib/api/resolve-path';
import { stripLocalePrefix } from '@/lib/api/client';
import { toDrupalLocale } from '@/i18n/config';
import { Typography } from '@/components/composed/Typography';

function slugifyName(name: string): string {
  return name
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u00C0-\u024F\u0400-\u04FF-]/g, '');
}

interface SpecHubOtherPagesProps {
  parentNid: number | number[];
  basePath: string;
  locale: string;
}

export async function SpecHubOtherPages({
  parentNid: parentNidProp,
  basePath,
  locale,
}: SpecHubOtherPagesProps) {
  // Support array of parent NIDs — render categories from all parents
  const parentNids = Array.isArray(parentNidProp)
    ? parentNidProp
    : [parentNidProp];

  // Fetch categories from all parent NIDs in parallel, then merge
  const allCategoriesArrays = await Promise.all(
    parentNids.map((nid) => fetchHubCategories(nid, locale)),
  );
  const mergedCategories = allCategoriesArrays.flat();
  if (mergedCategories.length === 0) return null;

  const drupalLocale = toDrupalLocale(locale);
  const categories = mergedCategories;

  // Fetch EN categories for reliable slug-based resolve-path
  const allEnArrays = await Promise.all(
    parentNids.map((nid) => fetchHubCategories(nid, 'en')),
  );
  const enCategories = allEnArrays.flat();

  const baseResolved = await resolvePath(
    stripLocalePrefix(basePath) ?? basePath,
    drupalLocale,
  ).catch(() => null);

  const enBasePath = baseResolved?.aliases?.en ?? stripLocalePrefix(basePath);

  // Build NID→EN-name map for reliable slug generation
  const enNameByNid = new Map(enCategories.map((c) => [c.nid, c.name]));

  // Resolve aliases for each category via EN path (most reliable)
  const resolvedItems = await Promise.all(
    categories.map((cat) => {
      const enName = enNameByNid.get(cat.nid);
      if (!enName) return Promise.resolve(null);
      const enSlug = slugifyName(enName);
      return resolvePath(`${enBasePath}/${enSlug}`, 'en').catch(() => null);
    }),
  );

  const pages = categories.map((cat, i) => {
    const resolved = resolvedItems[i];
    const alias =
      resolved?.aliases?.[drupalLocale] ?? resolved?.aliases?.[locale];
    const href = alias
      ? `/${locale}${alias}`
      : `${basePath}/${slugifyName(cat.name)}`;

    return { ...cat, href };
  });

  return (
    <div className="max-w-main mx-auto px-(--spacing-page)">
      <div className="grid grid-cols-2 gap-x-3 gap-y-(--spacing-content) lg:grid-cols-3">
        {pages.map((page) => (
          <Link key={page.nid} href={page.href} className="group flex flex-col">
            <Typography textRole="overline" as="span" className="truncate mb-1">
              {page.name}
            </Typography>
            <div className="relative aspect-4/3 overflow-hidden rounded-lg border border-border">
              {page.imageUrl ? (
                <Image
                  src={page.imageUrl}
                  alt={page.name}
                  fill
                  sizes="(min-width: 1024px) 20vw, 30vw"
                  className="object-cover"
                />
              ) : (
                <div className="size-full bg-muted" />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
