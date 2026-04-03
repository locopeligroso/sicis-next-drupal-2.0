import Image from 'next/image';
import Link from 'next/link';

import { Typography } from '@/components/composed/Typography';
import type { BlogCard, BlogCategory } from '@/lib/api/listings';

type ArticleCard = BlogCard;

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SpecInspirationListingProps {
  title: string;
  articles: ArticleCard[];
  categories: BlogCategory[];
  activeCategory: number | null;
  total: number;
  locale: string;
  currentPage: number;
  pageSize: number;
  basePath: string;
}

// ── Category filter pills ─────────────────────────────────────────────────────

const PILL_BASE =
  'inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap';
const PILL_ACTIVE = 'bg-foreground text-background';
const PILL_INACTIVE =
  'border border-border text-muted-foreground hover:text-foreground';

function CategoryPills({
  categories,
  activeCategory,
  basePath,
}: {
  categories: BlogCategory[];
  activeCategory: number | null;
  basePath: string;
}) {
  if (categories.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-2"
      role="navigation"
      aria-label="Filtra per categoria"
    >
      <a
        href={basePath}
        className={`${PILL_BASE} ${activeCategory === null ? PILL_ACTIVE : PILL_INACTIVE}`}
        aria-current={activeCategory === null ? 'true' : undefined}
      >
        All
      </a>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.nid;
        return (
          <a
            key={cat.nid}
            href={`${basePath}?cat=${cat.nid}`}
            className={`${PILL_BASE} ${isActive ? PILL_ACTIVE : PILL_INACTIVE}`}
            aria-current={isActive ? 'true' : undefined}
          >
            {cat.name}
          </a>
        );
      })}
    </div>
  );
}

// ── Article card ──────────────────────────────────────────────────────────────

function ArticleCardItem({
  article,
  locale,
}: {
  article: ArticleCard;
  locale: string;
}) {
  const href = article.path ? `/${locale}${article.path}` : null;

  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.created));

  const inner = (
    <article>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title}
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

      <div className="mt-3 flex flex-col gap-1">
        {article.categoryName && (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {article.categoryName}
          </span>
        )}
        <p className="text-sm font-semibold leading-snug line-clamp-2">
          {article.title}
        </p>
        <time
          dateTime={article.created}
          className="text-xs text-muted-foreground"
        >
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
  activeCategory,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  activeCategory: number | null;
}) {
  if (totalPages <= 1) return null;

  const pageHref = (p: number): string => {
    const params = new URLSearchParams();
    if (activeCategory !== null) params.set('cat', String(activeCategory));
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

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

export function SpecInspirationListing({
  title,
  articles,
  categories,
  activeCategory,
  total,
  locale,
  currentPage,
  pageSize,
  basePath,
}: SpecInspirationListingProps) {
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
            {total} {total === 1 ? 'articolo' : 'articoli'}
            {totalPages > 1 &&
              ` — pagina ${currentPage} di ${totalPages} (${from}–${to})`}
          </Typography>
        )}
      </header>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="max-w-main mx-auto w-full px-(--spacing-page)">
          <CategoryPills
            categories={categories}
            activeCategory={activeCategory}
            basePath={basePath}
          />
        </div>
      )}

      {/* Grid */}
      <div className="max-w-main mx-auto w-full px-(--spacing-page)">
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-(--spacing-element)">
            {articles.map((article) => (
              <ArticleCardItem
                key={article.id}
                article={article}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-16 rounded-lg border-2 border-dashed border-border">
            <Typography
              textRole="body-sm"
              as="p"
              className="text-muted-foreground"
            >
              Nessun articolo trovato.
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
            activeCategory={activeCategory}
          />
        </div>
      )}
    </article>
  );
}
