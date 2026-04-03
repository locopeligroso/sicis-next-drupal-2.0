'use client';

import { createContext, useContext } from 'react';
import type { ProductCard } from '@/lib/api/products';

interface ClientFilterContextValue {
  navigateToCollection: (slug: string | null) => void;
  currentSlug: string | null;
  allProducts: ProductCard[];
  basePath: string;
  locale: string;
}

export const ClientFilterContext = createContext<ClientFilterContextValue | null>(
  null,
);

export function useClientFilter() {
  return useContext(ClientFilterContext);
}
