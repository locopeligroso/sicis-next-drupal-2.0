import Image from 'next/image';
import Link from 'next/link';
import { Typography } from '@/components/composed/Typography';

interface CategoryGridItem {
  nid: string;
  title: string;
  imageUrl: string | null;
  href: string | null;
}

interface SpecMosaicCategoryGridProps {
  items: CategoryGridItem[];
  title?: string;
}

export function SpecMosaicCategoryGrid({
  items,
  title,
}: SpecMosaicCategoryGridProps) {
  if (items.length === 0) return null;

  return (
    <section className="max-w-main mx-auto px-(--spacing-page) py-(--spacing-section)">
      {title && (
        <Typography
          textRole="h2"
          className="mb-(--spacing-content) text-foreground"
        >
          {title}
        </Typography>
      )}

      <ul
        className="grid grid-cols-1 gap-(--spacing-content) md:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0"
        role="list"
      >
        {items.map((item) => (
          <li key={item.nid}>
            <CardItem item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CardItem({ item }: { item: CategoryGridItem }) {
  const inner = (
    <div className="group relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="size-full bg-surface-2" />
      )}

      {/* title overlay — gradient scrim at bottom */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-12 pb-4 px-4">
        <Typography
          textRole="subtitle-2"
          as="span"
          className="text-white line-clamp-2"
        >
          {item.title}
        </Typography>
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        prefetch={false}
        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-lg"
        aria-label={item.title}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div aria-label={item.title} className="rounded-lg">
      {inner}
    </div>
  );
}
