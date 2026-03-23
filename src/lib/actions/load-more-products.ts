'use server';

import { fetchProducts, type ProductCard } from '@/lib/api/products';
import type { FilterDefinition } from '@/domain/filters/search-params';

export async function loadMoreProducts(
  productType: string,
  activeFilters: FilterDefinition[],
  sort: string,
  offset: number,
  pageSize: number,
  locale: string,
): Promise<{ products: ProductCard[]; hasMore: boolean }> {
  const { products, total } = await fetchProducts({
    productType,
    locale,
    limit: pageSize,
    offset,
    filters: activeFilters,
    sort: sort || undefined,
  });

  return {
    products,
    hasMore: offset + pageSize < total,
  };
}
