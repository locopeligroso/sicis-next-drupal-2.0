'use client'

import type { ProductCard } from '@/lib/api/products'
import type { FilterDefinition } from '@/domain/filters/search-params'
import { LoadMoreButton } from '@/components/composed/LoadMoreButton'
import { ClientFilteredListing } from '@/components/composed/ClientFilteredListing'

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
  imageFit?: "cover" | "contain"
  /** When set, enables client-side P0 collection filtering (mosaico/pixall) */
  allProducts?: ProductCard[]
  activeCollectionSlug?: string | null
}

export function SpecProductListing({
  products,
  total,
  productType,
  activeFilters,
  currentSort,
  pageSize,
  locale,
  basePath,
  productCardRatio,
  imageFit,
  allProducts,
  activeCollectionSlug,
}: SpecProductListingProps) {
  if (allProducts) {
    return (
      <ClientFilteredListing
        allProducts={allProducts}
        activeCollectionSlug={activeCollectionSlug ?? null}
        basePath={basePath}
        locale={locale}
        productCardRatio={productCardRatio}
        imageFit={imageFit}
      />
    )
  }

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
      imageFit={imageFit}
    />
  )
}
