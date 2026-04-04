import type { ProductCard as ProductCardData } from '@/lib/api/products';
import { ProductCard } from '@/components/composed/ProductCard';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: ProductCardData[];
  locale: string;
  productCardRatio?: string;
  imageFit?: 'cover' | 'contain';
  columns?: 4 | 5;
  className?: string;
}

export function ProductGrid({
  products,
  locale,
  productCardRatio,
  imageFit,
  columns = 4,
  className,
}: ProductGridProps) {
  const gridCols =
    'grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';

  return (
    <div className={cn('grid', gridCols, 'gap-4 md:gap-6', className)}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          title={product.title}
          subtitle={product.subtitle}
          image={product.image}
          href={product.path ? `/${locale}${product.path}` : '#'}
          aspectRatio={productCardRatio}
          imageFit={imageFit}
        />
      ))}
    </div>
  );
}
