import type { ProductCard as ProductCardData } from "@/lib/api/products"
import { ProductCard } from "@/components/composed/ProductCard"
import { cn } from "@/lib/utils"

interface ProductGridProps {
  products: ProductCardData[]
  productCardRatio?: string
  className?: string
}

export function ProductGrid({ products, productCardRatio, className }: ProductGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6",
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
