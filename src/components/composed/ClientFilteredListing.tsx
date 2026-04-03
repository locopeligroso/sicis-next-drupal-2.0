'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { ProductCard as ProductCardData } from '@/lib/api/products';
import { ProductGrid } from '@/components/composed/ProductGrid';
import { Typography } from '@/components/composed/Typography';

interface ClientFilteredListingProps {
  allProducts: ProductCardData[];
  activeCollectionSlug: string | null;
  basePath: string;
  locale: string;
  productCardRatio?: string;
  imageFit?: 'cover' | 'contain';
}

/**
 * Derives the collection slug from a product's path.
 * Path format: /mosaico/glimmer/102-mango → collection = "glimmer"
 * The collection is the segment right after the base path.
 */
function getCollectionSlug(
  productPath: string | null,
  basePath: string,
  locale: string,
): string | null {
  if (!productPath) return null;
  // productPath is locale-stripped: /mosaico/glimmer/102-mango
  // basePath is: /it/mosaico → we need just "mosaico"
  const baseSegment = basePath.replace(`/${locale}/`, '').replace(`/${locale}`, '');
  const segments = productPath.replace(/^\//, '').split('/');
  // Find the base segment index, collection is the next one
  const baseIdx = segments.indexOf(baseSegment);
  if (baseIdx >= 0 && segments.length > baseIdx + 1) {
    return segments[baseIdx + 1];
  }
  // Fallback: second segment (skip product type)
  return segments.length >= 2 ? segments[1] : null;
}

export function ClientFilteredListing({
  allProducts,
  activeCollectionSlug,
  basePath,
  locale,
  productCardRatio,
  imageFit,
}: ClientFilteredListingProps) {
  const t = useTranslations('listing');
  const [currentSlug, setCurrentSlug] = useState(activeCollectionSlug);

  // Listen for popstate (browser back/forward)
  useEffect(() => {
    function handlePopState() {
      const path = window.location.pathname;
      // Extract collection slug from current URL
      const baseSegment = basePath.replace(`/${locale}/`, '').replace(`/${locale}`, '');
      const segments = path.replace(/^\//, '').split('/');
      const baseIdx = segments.findIndex((s) => s === baseSegment);
      const newSlug = baseIdx >= 0 && segments.length > baseIdx + 2
        ? segments[baseIdx + 1]
        : null;
      setCurrentSlug(newSlug);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [basePath, locale]);

  // Filter products by collection slug
  const filtered = useMemo(() => {
    if (!currentSlug) return allProducts;
    return allProducts.filter((p) => {
      const slug = getCollectionSlug(p.path, basePath, locale);
      return slug === currentSlug;
    });
  }, [allProducts, currentSlug, basePath, locale]);

  // Navigate to a collection (called by sidebar filter clicks)
  const navigateToCollection = useCallback(
    (slug: string | null) => {
      setCurrentSlug(slug);
      const newPath = slug ? `${basePath}/${slug}` : basePath;
      window.history.pushState(null, '', newPath);
    },
    [basePath],
  );

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
        locale={locale}
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
