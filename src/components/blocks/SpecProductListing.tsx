'use client'

import type { ProductCard } from '@/lib/api/products'
import type { FilterDefinition } from '@/domain/filters/search-params'
import { LoadMoreButton } from '@/components/composed/LoadMoreButton'

interface SpecProductListingProps {
  products: ProductCard[]
  total: number
  productType: string
  activeFilters: FilterDefinition[]
  currentSort: string
  pageSize: number
  locale: string
  basePath: string
  productCardRatio?: string
}

export function SpecProductListing({
  products,
  total,
  productType,
  activeFilters,
  currentSort,
  pageSize,
  locale,
  productCardRatio,
}: SpecProductListingProps) {
  return (
    <LoadMoreButton
      key={`${JSON.stringify(activeFilters)}-${currentSort}-${total}`}
      productType={productType}
      activeFilters={activeFilters}
      sort={currentSort}
      pageSize={pageSize}
      initialProducts={products}
      initialTotal={total}
      locale={locale}
      productCardRatio={productCardRatio}
    />
  )
}
