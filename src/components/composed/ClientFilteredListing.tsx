'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { ProductCard as ProductCardData } from '@/lib/api/products';
import { ProductGrid } from '@/components/composed/ProductGrid';
import { Typography } from '@/components/composed/Typography';
import { ClientFilterContext, useClientFilter } from '@/hooks/client-filter-context';

/**
 * Derives the collection slug from a product's path.
 * Path format: /mosaico/glimmer/102-mango → collection = "glimmer"
 */
function getCollectionSlug(
  productPath: string | null,
  basePath: string,
  locale: string,
): string | null {
  if (!productPath) return null;
  const baseSegment = basePath.replace(`/${locale}/`, '').replace(`/${locale}`, '');
  const segments = productPath.replace(/^\//, '').split('/');
  const baseIdx = segments.indexOf(baseSegment);
  if (baseIdx >= 0 && segments.length > baseIdx + 1) {
    return segments[baseIdx + 1];
  }
  return segments.length >= 2 ? segments[1] : null;
}

// ── Provider: wraps sidebar + grid, exposes navigateToCollection via context ──

interface ClientFilterProviderProps {
  allProducts: ProductCardData[];
  activeCollectionSlug: string | null;
  basePath: string;
  locale: string;
  productCardRatio?: string;
  imageFit?: 'cover' | 'contain';
  children: React.ReactNode;
}

export function ClientFilterProvider({
  allProducts,
  activeCollectionSlug,
  basePath,
  locale,
  children,
}: ClientFilterProviderProps) {
  const [currentSlug, setCurrentSlug] = useState(activeCollectionSlug);

  useEffect(() => {
    function handlePopState() {
      const path = window.location.pathname;
      const baseSegment = basePath.replace(`/${locale}/`, '').replace(`/${locale}`, '');
      const segments = path.replace(/^\//, '').split('/');
      const baseIdx = segments.findIndex((s) => s === baseSegment);
      const newSlug =
        baseIdx >= 0 && segments.length > baseIdx + 2
          ? segments[baseIdx + 1]
          : null;
      setCurrentSlug(newSlug);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [basePath, locale]);

  const navigateToCollection = useCallback(
    (slug: string | null) => {
      setCurrentSlug(slug);
      const newPath = slug ? `${basePath}/${slug}` : basePath;
      window.history.pushState(null, '', newPath);
    },
    [basePath],
  );

  const contextValue = useMemo(
    () => ({ navigateToCollection, currentSlug, allProducts, basePath, locale }),
    [navigateToCollection, currentSlug, allProducts, basePath, locale],
  );

  return (
    <ClientFilterContext value={contextValue}>
      {children}
    </ClientFilterContext>
  );
}

// ── Grid: reads current filter state from context, renders filtered products ──

interface ClientFilteredGridProps {
  productCardRatio?: string;
  imageFit?: 'cover' | 'contain';
}

export function ClientFilteredGrid({
  productCardRatio,
  imageFit,
}: ClientFilteredGridProps) {
  const t = useTranslations('listing');
  const ctx = useClientFilter();

  const filtered = useMemo(() => {
    if (!ctx || !ctx.currentSlug) return ctx?.allProducts ?? [];
    return (ctx.allProducts ?? []).filter((p) => {
      const slug = getCollectionSlug(p.path, ctx.basePath, ctx.locale);
      return slug === ctx.currentSlug;
    });
  }, [ctx]);

  if (!ctx) return null;

  if (filtered.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Typography textRole="body-lg" className="text-muted-foreground">
          {t('noResults')}
        </Typography>
      </div>
    );
  }

  return (
    <>
      <ProductGrid
        products={filtered}
        locale={ctx.locale}
        productCardRatio={productCardRatio}
        imageFit={imageFit}
      />
      <div className="flex justify-center py-4">
        <Typography textRole="body-sm" className="text-muted-foreground">
          {t('productCount', { count: filtered.length })}
        </Typography>
      </div>
    </>
  );
}
