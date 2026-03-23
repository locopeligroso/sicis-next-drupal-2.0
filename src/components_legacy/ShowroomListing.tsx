import Link from 'next/link';
import type { ShowroomCard } from '@/lib/api/listings';

interface ShowroomListingProps {
  title: string;
  showrooms: ShowroomCard[];
  total: number;
  locale: string;
  currentPage?: number;
  pageSize?: number;
  basePath?: string;
}

function ShowroomCardItem({
  showroom,
  locale,
}: {
  showroom: ShowroomCard;
  locale: string;
}) {
  const href = showroom.path ? `/${locale}${showroom.path}` : null;

  const card = (
    <article
      style={{
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}
    >
      <div
        style={{
          aspectRatio: '4/3',
          background: '#f3f4f6',
          overflow: 'hidden',
        }}
      >
        {showroom.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={showroom.imageUrl}
            alt={showroom.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d1d5db',
              fontSize: '0.75rem',
            }}
          >
            No image
          </div>
        )}
      </div>
      <div style={{ padding: '0.75rem' }}>
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.4,
            marginBottom: '0.25rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {showroom.title}
        </p>
        {showroom.address && (
          <p
            style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              lineHeight: 1.4,
              marginBottom: '0.125rem',
            }}
          >
            {showroom.address}
          </p>
        )}
        {showroom.phone && (
          <p
            style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              lineHeight: 1.4,
              marginBottom: 0,
            }}
          >
            {showroom.phone}
          </p>
        )}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {card}
      </Link>
    );
  }

  return card;
}

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

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    pages.add(i);
  }
  const pageList = Array.from(pages).sort((a, b) => a - b);

  const pageHref = (p: number): string => {
    if (p <= 1) return basePath;
    return `${basePath}?page=${p}`;
  };

  return (
    <nav
      aria-label="Paginazione"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem',
        marginTop: '3rem',
        flexWrap: 'wrap',
      }}
    >
      {currentPage > 1 && (
        <Link
          href={pageHref(currentPage - 1)}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            border: '0.0625rem solid #e5e7eb',
            textDecoration: 'none',
            color: '#374151',
          }}
          aria-label="Pagina precedente"
        >
          ←
        </Link>
      )}

      {pageList.map((p, i) => {
        const prev = pageList[i - 1];
        const showEllipsis = prev !== undefined && p - prev > 1;
        return (
          <span key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {showEllipsis && (
              <span style={{ padding: '0.5rem 0.25rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                …
              </span>
            )}
            <Link
              href={pageHref(p)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                border: '0.0625rem solid #e5e7eb',
                textDecoration: 'none',
                color: p === currentPage ? '#fff' : '#374151',
                background: p === currentPage ? '#111' : 'transparent',
                fontWeight: p === currentPage ? 700 : 400,
                minWidth: '2.5rem',
                textAlign: 'center',
              }}
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
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            border: '0.0625rem solid #e5e7eb',
            textDecoration: 'none',
            color: '#374151',
          }}
          aria-label="Pagina successiva"
        >
          →
        </Link>
      )}
    </nav>
  );
}

export default function ShowroomListing({
  title,
  showrooms,
  total,
  locale,
  currentPage = 1,
  pageSize = 48,
  basePath = '',
}: ShowroomListingProps) {
  const totalPages = Math.ceil(total / pageSize);
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {title}
        </h1>
        {total > 0 && (
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {total} showroom{total !== 1 && 's'}
            {totalPages > 1 && ` — pagina ${currentPage} di ${totalPages} (${from}–${to})`}
          </p>
        )}
      </div>

      {/* Grid */}
      {showrooms.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
            gap: '1rem',
          }}
        >
          {showrooms.map((showroom) => (
            <ShowroomCardItem key={showroom.id} showroom={showroom} locale={locale} />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: '4rem 0',
            textAlign: 'center',
            color: '#9ca3af',
            border: '2px dashed #e5e7eb',
            borderRadius: '0.5rem',
          }}
        >
          <p>Nessuno showroom trovato.</p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={basePath}
      />
    </div>
  );
}
