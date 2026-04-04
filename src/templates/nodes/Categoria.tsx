import Link from 'next/link';
import { getTextValue } from '@/lib/field-helpers';
import { getCategoriaProductType, type ProductCard } from '@/lib/api/products';
import { fetchProductListing } from '@/lib/api/product-listing-factory';
import {
  fetchPagesByCategory,
  fetchSubcategories,
  type PageCard,
  type SubcategoryCard,
} from '@/lib/api/categories';
import {
  fetchMosaicCategoryPages,
  MOSAIC_CATEGORY_NIDS,
} from '@/lib/api/mosaic-hub';
import { SpecMosaicCategoryGrid } from '@/components/blocks/SpecMosaicCategoryGrid';
import { getDrupalImageUrl } from '@/lib/drupal';
import DrupalImage from '@/components_legacy/DrupalImage';
import ParagraphResolver from '@/components_legacy/blocks_legacy/ParagraphResolver';

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
        {product.image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image.url}
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
        {page.image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.image.url}
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

/** NIDs that map to mosaic sub-category pages (mosaico-marmo, mosaico-artistico, pixel) */
const MOSAIC_CATEGORY_NID_SET = new Set<number>(
  Object.values(MOSAIC_CATEGORY_NIDS),
);

export default async function Categoria({ node }: CategoriaProps) {
  const title =
    getTextValue(node.field_titolo_main) || getTextValue(node.title) || '';
  const locale = (node.langcode as string) || 'it';
  // entity endpoint provides NID via _nid; fall back to id for legacy compat
  const categoriaId = String(node._nid ?? node.id);
  const nid = node._nid != null ? Number(node._nid) : NaN;
  const paragraphs =
    (node.field_blocchi as Record<string, unknown>[] | undefined) ?? [];

  // ── Content page: title + hero image + blocks ──
  // All categoria nodes render as content pages. If they have paragraph blocks,
  // render them. If not, show title + hero image (placeholder until Freddi adds blocks).
  // This prevents Explore children (/mosaic/marble, /mosaic/artistic-mosaic) from
  // being hijacked as product listings.
  const heroImage = getDrupalImageUrl(node.field_immagine);

  // ── Mosaic category sub-pages (NIDs 319, 320, 321) ──
  // These three categoria nodes are Explore landing pages that each display a grid
  // of child pages. Detect them by NID and inject SpecMosaicCategoryGrid after the
  // header, leaving paragraph blocks rendering intact below.
  const isMosaicCategory =
    !Number.isNaN(nid) && MOSAIC_CATEGORY_NID_SET.has(nid);
  const mosaicSubPages = isMosaicCategory
    ? await fetchMosaicCategoryPages(nid, locale)
    : null;

  return (
    <article className="flex flex-col gap-(--spacing-section) pt-(--spacing-navbar) pb-(--spacing-section) overflow-x-hidden [&>*]:w-full">
      {title && (
        <header className="max-w-main mx-auto px-(--spacing-page)">
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {title}
          </h1>
        </header>
      )}
      {mosaicSubPages && mosaicSubPages.length > 0 && (
        <SpecMosaicCategoryGrid items={mosaicSubPages} />
      )}
      {paragraphs.map((p, i) => (
        <ParagraphResolver
          key={(p.id as string) ?? i}
          paragraph={p}
          pageTitle={title ?? undefined}
        />
      ))}
    </article>
  );

  /* eslint-disable no-unreachable */
  // Dead code below — kept for reference during migration.
  // When all categoria nodes have blocks, remove everything below this line.
  const productType = getCategoriaProductType(title) as string | null;

  // ── Product category (Mosaico, Vetrite, Arredo, etc.) ──
  if (productType) {
    const { products, total } = await fetchProductListing(productType!, locale);
    return (
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem' }}>
        <div
          style={{
            borderBottom: '0.0625rem solid #e0e0e0',
            paddingBottom: '1.5rem',
            marginBottom: '2rem',
          }}
        >
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

  // ── Hub category with subcategories (e.g. Illuminazione → Lampadari, Lampade, etc.) ──
  // Fetch child node--categoria entities, then fetch products for ALL subcategories
  // and merge into a single listing. This mirrors the "Filter and Find" product listing.
  const { subcategories } = await fetchSubcategories(categoriaId, locale);

  if (subcategories.length > 0) {
    // Derive productType from the parent category title; fallback to prodotto_arredo
    const inferredType = getCategoriaProductType(title) || 'prodotto_arredo';
    // products (legacy) `category` param does NOT support multi-value (comma/array).
    // Fetch products for each subcategory in parallel and merge results.
    // Fetch all products for this product type (subcategory filtering not
    // available via factory — legacy products endpoint is dead)
    const { products: allProducts, total } = await fetchProductListing(
      inferredType,
      locale,
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
          {total > 0 && (
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#888' }}>
              {total} prodotti
            </p>
          )}
        </div>
        {allProducts.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
              gap: '1.5rem',
            }}
          >
            {allProducts.map((product) => (
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
      </div>
    );
  }

  // ── Content category (Mosaico Artistico, Mosaico in Marmo, etc.) ──
  // Fetch node--page entities that have field_categoria pointing to this categoria
  const { pages, total } = await fetchPagesByCategory(categoriaId, locale, 48);

  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem' }}>
      <div
        style={{
          borderBottom: '0.0625rem solid #e0e0e0',
          paddingBottom: '1.5rem',
          marginBottom: '2rem',
        }}
      >
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
        // ── CMS content fallback: render node image + paragraphs ──
        <div>
          <DrupalImage
            field={node.field_immagine}
            alt={title}
            aspectRatio="16/9"
            style={{ marginBottom: '2rem' }}
          />
          {paragraphs.map((p, i) => (
            <ParagraphResolver
              key={(p.id as string) ?? i}
              paragraph={p}
              pageTitle={title ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
