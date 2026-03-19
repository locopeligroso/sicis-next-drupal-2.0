import Link from 'next/link';
import { getTextValue } from '@/lib/field-helpers';
import {
  getCategoriaProductType,
  fetchProducts,
  type ProductCard,
} from '@/lib/drupal';

interface CategoriaProps {
  node: Record<string, unknown>;
}

function ProductCardItem({
  product,
  locale,
}: {
  product: ProductCard;
  locale: string;
}) {
  const href = product.path
    ? `/${locale}${product.path}`
    : `/${locale}`;

  return (
    <Link
      href={href}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        border: '0.0625rem solid #e0e0e0',
        overflow: 'hidden',
      }}
    >
      {/* Image */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1',
          background: '#f5f5f5',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
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
              color: '#ccc',
              fontSize: '0.75rem',
            }}
          >
            No image
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '0.75rem' }}>
        <p
          style={{
            margin: '0 0 0.25rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {product.title}
        </p>
        {product.priceOnDemand ? (
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#888', fontStyle: 'italic' }}>
            Su richiesta
          </p>
        ) : product.price ? (
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700 }}>
            {product.price}€
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default async function Categoria({ node }: CategoriaProps) {
  const title = getTextValue(node.field_titolo_main) || getTextValue(node.title) || '';
  // langcode comes from Drupal attributes as a plain string (e.g. "it", "en")
  const locale = (node.langcode as string) || 'it';

  const productType = getCategoriaProductType(title);

  let products: ProductCard[] = [];
  let total = 0;

  if (productType) {
    const result = await fetchProducts({ productType, locale, limit: 24 });
    products = result.products;
    total = result.total;
  }

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: '0.0625rem solid #e0e0e0',
          paddingBottom: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            margin: '0 0 0.5rem',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {total > 0 && (
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#888' }}>
            {total} prodotti
          </p>
        )}
      </div>

      {/* Product grid */}
      {products.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
            gap: '1.5rem',
          }}
        >
          {products.map((product) => (
            <ProductCardItem key={product.id} product={product} locale={locale} />
          ))}
        </div>
      ) : productType ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            color: '#888',
            border: '0.0625rem dashed #ddd',
          }}
        >
          <p style={{ margin: 0 }}>Nessun prodotto trovato.</p>
        </div>
      ) : (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            color: '#888',
            border: '0.0625rem dashed #ddd',
          }}
        >
          <p style={{ margin: 0 }}>
            Categoria non mappata: <code>{title}</code>
          </p>
        </div>
      )}

      {/* Load more hint */}
      {total > 24 && (
        <p
          style={{
            textAlign: 'center',
            marginTop: '2rem',
            fontSize: '0.875rem',
            color: '#888',
          }}
        >
          Mostrando 24 di {total} prodotti
        </p>
      )}
    </div>
  );
}
