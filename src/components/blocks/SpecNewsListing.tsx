import Image from 'next/image';
import Link from 'next/link';

import { Typography } from '@/components/composed/Typography';

// ── Local interface (will be replaced with imports from listings.ts later) ────

export interface NewsCard {
  id: string;
  title: string;
  imageUrl: string | null;
  path: string | null;
  created: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SpecNewsListingProps {
  title: string;
  news: NewsCard[];
  total: number;
  locale: string;
  currentPage: number;
  pageSize: number;
  basePath: string;
}

// ── News card ─────────────────────────────────────────────────────────────────

function NewsCardItem({ item, locale }: { item: NewsCard; locale: string }) {
  const href = item.path ? `/${locale}${item.path}` : null;

  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(item.created));

  const inner = (
    <article>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="mt-3 flex flex-col gap-1">
        <p className="text-sm font-semibold leading-snug line-clamp-2">
          {item.title}
        </p>
        <time dateTime={item.created} className="text-xs text-muted-foreground">
          {formattedDate}
        </time>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="group block text-inherit no-underline">
        {inner}
      </Link>
    );
  }

  return inner;
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const pageHref = (p: number): string => {
    if (p <= 1) return basePath;
    const params = new URLSearchParams();
    params.set('page', String(p));
    return `${basePath}?${params.toString()}`;
  };

  // Build visible page list: always show first/last + ±2 around current.
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (
    let i = Math.max(1, currentPage - 2);
    i <= Math.min(totalPages, currentPage + 2);
    i++
  ) {
    pages.add(i);
  }
  const pageList = Array.from(pages).sort((a, b) => a - b);

  const btnBase =
    'inline-flex items-center justify-center min-w-[2.5rem] h-10 px-3 text-sm rounded-md transition-colors';
  const btnActive = 'bg-foreground text-background font-bold';
  const btnInactive = 'border border-border text-foreground hover:bg-muted';
  const btnNav = 'border border-border text-foreground hover:bg-muted px-4';

  return (
    <nav
      aria-label="Paginazione"
      className="flex items-center justify-center flex-wrap gap-1"
    >
      {currentPage > 1 && (
        <Link
          href={pageHref(currentPage - 1)}
          className={`${btnBase} ${btnNav}`}
          aria-label="Pagina precedente"
        >
          ←
        </Link>
      )}

      {pageList.map((p, i) => {
        const prev = pageList[i - 1];
        const showEllipsis = prev !== undefined && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1">
            {showEllipsis && (
              <span className="px-1 text-sm text-muted-foreground">…</span>
            )}
            <Link
              href={pageHref(p)}
              className={`${btnBase} ${p === currentPage ? btnActive : btnInactive}`}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </Link>
          </span>
        );
      })}

      {currentPage < totalPages && (
        <Link
          href={pageHref(currentPage + 1)}
          className={`${btnBase} ${btnNav}`}
          aria-label="Pagina successiva"
        >
          →
        </Link>
      )}
    </nav>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SpecNewsListing({
  title,
  news,
  total,
  locale,
  currentPage,
  pageSize,
  basePath,
}: SpecNewsListingProps) {
  const totalPages = Math.ceil(total / pageSize);
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  return (
    <article className="flex flex-col gap-(--spacing-section)">
      {/* Header */}
      <header className="max-w-main mx-auto w-full px-(--spacing-page) flex flex-col gap-(--spacing-element) border-b border-border pb-(--spacing-content)">
        <Typography textRole="h1" as="h1">
          {title}
        </Typography>
        {total > 0 && (
          <Typography
            textRole="body-sm"
            as="p"
            className="text-muted-foreground"
          >
            {total} {total === 1 ? 'news' : 'news'}
            {totalPages > 1 &&
              ` — pagina ${currentPage} di ${totalPages} (${from}–${to})`}
          </Typography>
        )}
      </header>

      {/* Grid */}
      <div className="max-w-main mx-auto w-full px-(--spacing-page)">
        {news.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-(--spacing-element)">
            {news.map((item) => (
              <NewsCardItem key={item.id} item={item} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-16 rounded-lg border-2 border-dashed border-border">
            <Typography
              textRole="body-sm"
              as="p"
              className="text-muted-foreground"
            >
              Nessuna news trovata.
            </Typography>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="max-w-main mx-auto w-full px-(--spacing-page)">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={basePath}
          />
        </div>
      )}
    </article>
  );
}
