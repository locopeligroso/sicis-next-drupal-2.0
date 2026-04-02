import Image from 'next/image';
import Link from 'next/link';
import { fetchHubCategories } from '@/lib/api/category-hub';
import { resolvePath } from '@/lib/api/resolve-path';
import { stripLocalePrefix } from '@/lib/api/client';
import { toDrupalLocale } from '@/i18n/config';
import { Separator } from '@/components/ui/separator';
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
  parentNid: number;
  basePath: string;
  locale: string;
}

export async function SpecHubOtherPages({
  parentNid,
  basePath,
  locale,
}: SpecHubOtherPagesProps) {
  const drupalLocale = toDrupalLocale(locale);

  // Fetch categories in current locale (for display names/images) AND in EN
  // (for reliable slug-based resolve-path). EN slugifyName matches EN Drupal
  // aliases (e.g. "Metal mosaic" → "metal-mosaic" = /mosaic/metal-mosaic).
  const [categories, enCategories, baseResolved] = await Promise.all([
    fetchHubCategories(parentNid, locale),
    fetchHubCategories(parentNid, 'en'),
    // Resolve basePath to discover EN base alias (e.g. /mosaico → aliases.en = /mosaic)
    resolvePath(stripLocalePrefix(basePath) ?? basePath, drupalLocale).catch(
      () => null,
    ),
  ]);

  if (categories.length === 0) return null;

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
            <Separator className="mb-2" />
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
