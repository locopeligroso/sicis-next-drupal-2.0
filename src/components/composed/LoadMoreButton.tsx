'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { ProductCard as ProductCardData } from '@/lib/drupal/products'
import type { FilterDefinition } from '@/domain/filters/search-params'
import { loadMoreProducts } from '@/lib/actions/load-more-products'
import { ProductGrid } from '@/components/composed/ProductGrid'
import { Typography } from '@/components/composed/Typography'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface LoadMoreButtonProps {
  productType: string
  activeFilters: FilterDefinition[]
  sort: string
  pageSize: number
  initialProducts: ProductCardData[]
  initialTotal: number
  locale: string
  productCardRatio?: string
}

export function LoadMoreButton({
  productType,
  activeFilters,
  sort,
  pageSize,
  initialProducts,
  initialTotal,
  locale,
  productCardRatio,
}: LoadMoreButtonProps) {
  const t = useTranslations('listing')
  const [products, setProducts] = useState(initialProducts)
  const [offset, setOffset] = useState(initialProducts.length)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialProducts.length < initialTotal)

  async function handleLoadMore() {
    setLoading(true)
    try {
      const result = await loadMoreProducts(
        productType,
        activeFilters,
        sort,
        offset,
        pageSize,
        locale,
      )
      setProducts((prev) => [...prev, ...result.products])
      setOffset((prev) => prev + pageSize)
      setHasMore(result.hasMore)
    } finally {
      setLoading(false)
    }
  }

  if (products.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Typography textRole="body-lg" className="text-muted-foreground">
          {t('noResults')}
        </Typography>
      </div>
    )
  }

  return (
    <>
      <ProductGrid products={products} productCardRatio={productCardRatio} />
      {hasMore && (
        <div className="flex justify-center py-8">
          <Button
            disabled={loading}
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
          >
            {loading ? <Spinner data-icon="inline-start" /> : null}
            {t('loadMore', { count: pageSize })}
          </Button>
        </div>
      )}
    </>
  )
}
