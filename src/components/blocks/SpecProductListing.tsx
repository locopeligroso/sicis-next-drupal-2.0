'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ListingToolbar } from '@/components/composed/ListingToolbar'
import { LoadMoreButton } from '@/components/composed/LoadMoreButton'
import type { ProductCard } from '@/lib/drupal/products'
import type { SortOptionDef } from '@/domain/filters/registry'
import type { FilterDefinition } from '@/domain/filters/search-params'

interface SpecProductListingProps {
  products: ProductCard[]
  total: number
  sortOptions: SortOptionDef[]
  currentSort: string
  productType: string
  activeFilters: FilterDefinition[]
  pageSize: number
  locale: string
  basePath: string
  productCardRatio?: string
}

export function SpecProductListing({
  products,
  total,
  sortOptions,
  currentSort,
  productType,
  activeFilters,
  pageSize,
  locale,
  basePath,
  productCardRatio,
}: SpecProductListingProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSortChange = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (sortValue) {
      params.set('sort', sortValue)
    } else {
      params.delete('sort')
    }
    const qs = params.toString()
    router.push(qs ? `${basePath}?${qs}` : basePath)
  }

  return (
    <div className="flex flex-col gap-6">
      <ListingToolbar
        totalCount={total}
        sortOptions={sortOptions}
        currentSort={currentSort}
        onSortChange={handleSortChange}
      />
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
    </div>
  )
}
