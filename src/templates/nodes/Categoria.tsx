import Link from 'next/link';
import { getTextValue } from '@/lib/field-helpers';
import {
  getCategoriaProductType,
  fetchProducts,
  fetchPagesByCategory,
  fetchSubcategories,
  type ProductCard,
  type PageCard,
  type SubcategoryCard,
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
  const href = product.path ? `/${locale}${product.path}` : `/${locale}`;

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
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              color: '#888',
              fontStyle: 'italic',
            }}
          >
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

function PageCardItem({ page, locale }: { page: PageCard; locale: string }) {
  const href = page.path ? `/${locale}${page.path}` : null;

  const card = (
    <article
      style={{
        overflow: 'hidden',
        border: '0.0625rem solid #e0e0e0',
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '4/3',
          background: '#f5f5f5',
          overflow: 'hidden',
        }}
      >
        {page.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.imageUrl}
            alt={page.title}
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
      <div style={{ padding: '0.75rem' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {page.title}
        </p>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link
        href={href}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        {card}
      </Link>
    );
  }

  return card;
}

export default async function Categoria({ node }: CategoriaProps) {
  const title =
    getTextValue(node.field_titolo_main) || getTextValue(node.title) || '';
  const locale = (node.langcode as string) || 'it';
  const categoriaUuid = node.id as string;

  const productType = getCategoriaProductType(title);

  // ── Product category (Mosaico, Vetrite, Arredo, etc.) ──
  if (productType) {
    const { products, total } = await fetchProducts({
      productType,
      locale,
      limit: 24,
    });
    return (
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem' }}>
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
        {products.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
              gap: '1.5rem',
            }}
          >
            {products.map((product) => (
              <ProductCardItem
                key={product.id}
                product={product}
                locale={locale}
              />
            ))}
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
            <p style={{ margin: 0 }}>Nessun prodotto trovato.</p>
          </div>
        )}
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

  // ── Hub category (Illuminazione, etc.) ──
  // Try subcategories first (node--categoria children), then pages
  const { subcategories } = await fetchSubcategories(categoriaUuid, locale);

  if (subcategories.length > 0) {
    return (
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem' }}>
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
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#888' }}>
            {subcategories.length}{' '}
            {subcategories.length === 1 ? 'categoria' : 'categorie'}
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
            gap: '1.5rem',
          }}
        >
          {subcategories.map((sub: SubcategoryCard) => (
            <PageCardItem key={sub.id} page={sub} locale={locale} />
          ))}
        </div>
      </div>
    );
  }

  // ── Content category (Mosaico Artistico, Mosaico in Marmo, etc.) ──
  // Fetch node--page entities that have field_categoria pointing to this categoria
  const { pages, total } = await fetchPagesByCategory(
    categoriaUuid,
    locale,
    48,
  );

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem' }}>
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
            {total} {total === 1 ? 'pagina' : 'pagine'}
          </p>
        )}
      </div>
      {pages.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
            gap: '1.5rem',
          }}
        >
          {pages.map((page) => (
            <PageCardItem key={page.id} page={page} locale={locale} />
          ))}
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
            Nessun contenuto trovato per questa categoria.
          </p>
        </div>
      )}
    </div>
  );
}
