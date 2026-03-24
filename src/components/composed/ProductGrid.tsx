import type { ProductCard as ProductCardData } from "@/lib/api/products"
import { ProductCard } from "@/components/composed/ProductCard"
import { cn } from "@/lib/utils"

interface ProductGridProps {
  products: ProductCardData[]
  productCardRatio?: string
  columns?: 4 | 5
  className?: string
}

export function ProductGrid({ products, productCardRatio, columns = 4, className }: ProductGridProps) {
  const gridCols = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'

  return (
    <div
      className={cn(
        "grid", gridCols, "gap-4 md:gap-6",
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          title={product.title}
          subtitle={product.subtitle}
          imageUrl={product.imageUrl}
          href={product.path ?? "#"}
          aspectRatio={productCardRatio}
        />
      ))}
    </div>
  )
}
