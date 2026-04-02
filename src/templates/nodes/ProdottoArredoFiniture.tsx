import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  FinitureGallery,
  type FinituraCategory,
} from '@/components/composed/FinitureGallery';
import type { ArredoProduct } from '@/lib/api/arredo-product';

interface ProdottoArredoFinitureProps {
  product: ArredoProduct;
  locale: string;
  /** Full slug array — used to build the back-to-product href */
  slug: string[];
}

export default async function ProdottoArredoFiniture({
  product,
  locale,
  slug,
}: ProdottoArredoFinitureProps) {
  const t = await getTranslations('products');

  // Back-to-product href: drop the last segment ('finiture')
  const productPath = `/${locale}/${slug.slice(0, -1).join('/')}`;

  const hasFiniture =
    product.tessutoFiniture.length > 0 || product.arredoFiniture.length > 0;

  // Combine tessuto + arredo categories — both are now fully normalized
  // as 3-level structures (category → fabric → variant with image).
  const allCategories: FinituraCategory[] = [
    ...product.tessutoFiniture,
    ...product.arredoFiniture,
  ];

  return (
    <div className="pb-(--spacing-section)">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 text-xs text-muted-foreground uppercase tracking-[0.12em]"
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              href={`/${locale}/arredo`}
              className="hover:text-foreground transition-colors"
            >
              {t('furniture')}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={productPath}
              className="hover:text-foreground transition-colors"
            >
              {product.title}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {t('finishes')}
          </li>
        </ol>
      </nav>

      {/* Page title — "ALBERT - FINITURE" style */}
      <h1 className="text-2xl font-semibold uppercase tracking-[0.1em] mb-(--spacing-section)">
        {product.title}
        <span className="text-muted-foreground font-normal">
          {' '}
          - {t('finishes').toUpperCase()}
        </span>
      </h1>

      {/* Finiture gallery */}
      {hasFiniture ? (
        <FinitureGallery categories={allCategories} />
      ) : (
        <p className="text-muted-foreground text-sm">
          Nessuna finitura disponibile per questo prodotto.
        </p>
      )}
    </div>
  );
}
