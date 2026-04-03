import Link from 'next/link';

import { Typography } from '@/components/composed/Typography';
import type { TutorialCard, TutorialTipologia } from '@/lib/api/listings';

export interface SpecTutorialListingProps {
  title: string;
  tutorials: TutorialCard[];
  tipologie: TutorialTipologia[];
  activeTipologia: number | null;
  total: number;
  locale: string;
  currentPage: number;
  pageSize: number;
  basePath: string;
}

// ── Tipologia filter pills ────────────────────────────────────────────────────

function TipologiaPills({
  tipologie,
  activeTipologia,
  basePath,
}: {
  tipologie: TutorialTipologia[];
  activeTipologia: number | null;
  basePath: string;
}) {
  if (tipologie.length === 0) return null;

  const pillBase =
    'inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap';
  const pillActive = 'bg-foreground text-background';
  const pillInactive =
    'border border-border text-muted-foreground hover:text-foreground';

  return (
    <div
      className="flex flex-wrap gap-2"
      role="navigation"
      aria-label="Filtra per tipologia"
    >
      {/* All pill */}
      <a
        href={basePath}
        className={`${pillBase} ${activeTipologia === null ? pillActive : pillInactive}`}
        aria-current={activeTipologia === null ? 'true' : undefined}
      >
        All
      </a>

      {tipologie.map((tip) => {
        const isActive = activeTipologia === tip.tid;
        return (
          <a
            key={tip.tid}
            href={`${basePath}?tip=${tip.tid}`}
            className={`${pillBase} ${isActive ? pillActive : pillInactive}`}
            aria-current={isActive ? 'true' : undefined}
          >
            {tip.name}
          </a>
        );
      })}
    </div>
  );
}

// ── Tutorial card ─────────────────────────────────────────────────────────────

function TutorialCardItem({
  tutorial,
  locale,
}: {
  tutorial: TutorialCard;
  locale: string;
}) {
  const href = tutorial.path ? `/${locale}${tutorial.path}` : null;

  // Resolve thumbnail: Drupal image > YouTube hqdefault > null
  const thumbnailSrc =
    tutorial.imageUrl ??
    (tutorial.videoId
      ? `https://img.youtube.com/vi/${tutorial.videoId}/hqdefault.jpg`
      : null);

  const inner = (
    <article>
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        {thumbnailSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnailSrc}
            alt={tutorial.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}

        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-white ml-1" />
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold leading-snug line-clamp-2">
        {tutorial.title}
      </p>
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
  activeTipologia,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  activeTipologia: number | null;
}) {
  if (totalPages <= 1) return null;

  const pageHref = (p: number): string => {
    const params = new URLSearchParams();
    if (activeTipologia !== null) params.set('tip', String(activeTipologia));
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Always show first/last + ±2 around current.
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

export function SpecTutorialListing({
  title,
  tutorials,
  tipologie,
  activeTipologia,
  total,
  locale,
  currentPage,
  pageSize,
  basePath,
}: SpecTutorialListingProps) {
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
            {total} {total === 1 ? 'tutorial' : 'tutorial'}
            {totalPages > 1 &&
              ` — pagina ${currentPage} di ${totalPages} (${from}–${to})`}
          </Typography>
        )}
      </header>

      {/* Tipologia filter bar */}
      {tipologie.length > 0 && (
        <div className="max-w-main mx-auto w-full px-(--spacing-page)">
          <TipologiaPills
            tipologie={tipologie}
            activeTipologia={activeTipologia}
            basePath={basePath}
          />
        </div>
      )}

      {/* Grid */}
      <div className="max-w-main mx-auto w-full px-(--spacing-page)">
        {tutorials.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-(--spacing-element)">
            {tutorials.map((tutorial) => (
              <TutorialCardItem
                key={tutorial.id}
                tutorial={tutorial}
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
              Nessun tutorial trovato.
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
            activeTipologia={activeTipologia}
          />
        </div>
      )}
    </article>
  );
}
