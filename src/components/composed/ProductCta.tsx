'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FileTextIcon } from 'lucide-react';
import { useQuoteSheet } from '@/components/composed/QuoteSheetProvider';
import { AddToSampleCartButton } from '@/components/composed/AddToSampleCartButton';
import type { SampleCartItem } from '@/domain/sample-cart/types';

interface ProductCtaProps {
  hasSample?: boolean;
  showRequestSample?: boolean;
  sampleItem?: Omit<SampleCartItem, 'variant'>;
  variantOptions?: string[];
  onGetQuote?: () => void;
  className?: string;
}

export function ProductCta({
  hasSample = true,
  showRequestSample = true,
  sampleItem,
  variantOptions,
  onGetQuote,
  className,
}: ProductCtaProps) {
  const t = useTranslations('products');
  const { openQuote } = useQuoteSheet();
  const handleGetQuote = onGetQuote ?? openQuote;

  return (
    <div className={className}>
      <div className="flex gap-3 md:max-w-sm">
        {hasSample && showRequestSample && sampleItem && (
          <AddToSampleCartButton
            item={sampleItem}
            variantOptions={variantOptions}
            className="flex-1"
          />
        )}
        <Button size="lg" className="flex-1" onClick={handleGetQuote}>
          <FileTextIcon data-icon="inline-start" />
          {t('getQuote')}
        </Button>
      </div>
    </div>
  );
}
