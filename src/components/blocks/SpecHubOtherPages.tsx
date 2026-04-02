import Image from 'next/image';
import Link from 'next/link';
import { fetchHubCategories } from '@/lib/api/category-hub';
import { apiGet } from '@/lib/api/client';
import { Separator } from '@/components/ui/separator';
import { Typography } from '@/components/composed/Typography';

interface ContentItem {
  nid: string;
  path?: { alias?: string };
  aliases?: Record<string, string>;
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
  const categories = await fetchHubCategories(parentNid, locale);

  if (categories.length === 0) return null;

  // Resolve aliases for each category in parallel
  const contentItems = await Promise.all(
    categories.map((cat) =>
      apiGet<ContentItem[]>(`/${locale}/content/${cat.nid}`, {}, 1800).catch(() => null),
    ),
  );

  const pages = categories.map((cat, i) => {
    const content = contentItems[i];
    const alias =
      (Array.isArray(content) ? content[0] : content)?.aliases?.[locale] ??
      (Array.isArray(content) ? content[0] : content)?.path?.alias;
    const href = alias ? `/${locale}${alias}` : `${basePath}/${cat.nid}`;

    return { ...cat, href };
  });

  return (
    <div className="max-w-main mx-auto px-(--spacing-page)">
      <div className="grid grid-cols-2 gap-x-3 gap-y-(--spacing-content) lg:grid-cols-3">
        {pages.map((page) => (
          <Link
            key={page.nid}
            href={page.href}
            className="group flex flex-col"
          >
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
