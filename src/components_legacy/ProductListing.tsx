import Link from 'next/link';
import type { ProductCard } from '@/lib/drupal';

interface ProductListingProps {
  title: string;
  products: ProductCard[];
  total: number;
  locale: string;
  currentPage?: number;
  pageSize?: number;
  basePath?: string;
  activeQueryParams?: Record<string, string | string[]>;
}

function ProductCardItem({
  product,
  locale,
}: {
  product: ProductCard;
  locale: string;
}) {
  const href = product.path ? `/${locale}${product.path}` : `/${locale}`;

  return (
    <Link
      href={href}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      <div style={{ aspectRatio: '1 / 1', background: '#f3f4f6', overflow: 'hidden' }}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
          {product.title}
        </p>
        {product.priceOnDemand ? (
          <p style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
            Su richiesta
          </p>
        ) : product.price ? (
          <p style={{ fontSize: '0.875rem', fontWeight: 700 }}>{product.price}€</p>
        ) : null}
      </div>
    </Link>
  );
}

function Pagination({
  currentPage,
  totalPages,
  basePath,
  activeQueryParams,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  activeQueryParams?: Record<string, string | string[]>;
}) {
  if (totalPages <= 1) return null;

  // Build page numbers to show: always first, last, current ±2
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    pages.add(i);
  }
  const pageList = Array.from(pages).sort((a, b) => a - b);

  const pageHref = (p: number): string => {
    const params = new URLSearchParams();
    if (activeQueryParams) {
      Object.entries(activeQueryParams).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach((val) => params.append(k, val));
        } else if (v) {
          params.set(k, v);
        }
      });
    }
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
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
      {/* Prev */}
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

      {/* Page numbers with ellipsis */}
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

      {/* Next */}
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

export default function ProductListing({
  title,
  products,
  total,
  locale,
  currentPage = 1,
  pageSize = 48,
  basePath = '',
  activeQueryParams,
}: ProductListingProps) {
  const displayTitle = title
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

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
          {displayTitle}
        </h1>
        {total > 0 && (
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {total} prodotti
            {totalPages > 1 && ` — pagina ${currentPage} di ${totalPages} (${from}–${to})`}
          </p>
        )}
      </div>

      {/* Grid */}
      {products.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
            gap: '1rem',
          }}
        >
          {products.map((product) => (
            <ProductCardItem key={product.id} product={product} locale={locale} />
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
          <p>Nessun prodotto trovato in questa sezione.</p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={basePath}
        activeQueryParams={activeQueryParams}
      />
    </div>
  );
}
