'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { PackageIcon, CheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSampleCart } from '@/domain/sample-cart/SampleCartProvider';
import type { SampleCartItem } from '@/domain/sample-cart/types';
import { MAX_ITEMS } from '@/domain/sample-cart/types';

interface AddToSampleCartButtonProps {
  item: Omit<SampleCartItem, 'variant'>;
  variantOptions?: string[];
  className?: string;
}

export function AddToSampleCartButton({
  item,
  variantOptions,
  className,
}: AddToSampleCartButtonProps) {
  const t = useTranslations('sampleCart');
  const tProducts = useTranslations('products');
  const { addItem, isInCart, canAddMore } = useSampleCart();

  const [justAdded, setJustAdded] = React.useState(false);
  const [selectedVariant, setSelectedVariant] = React.useState<string>(
    variantOptions?.length === 1 ? variantOptions[0] : '',
  );

  const alreadyInCart = isInCart(item.nid);
  const needsVariant =
    variantOptions !== undefined && variantOptions.length > 1;
  const variantReady = !needsVariant || selectedVariant !== '';

  const handleAdd = () => {
    if (alreadyInCart) {
      toast.info(t('alreadyInCart'));
      return;
    }
    const fullItem: SampleCartItem = {
      ...item,
      variant: selectedVariant !== '' ? selectedVariant : null,
    };
    const added = addItem(fullItem);
    if (added) {
      toast.success(t('addedToCart'));
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } else {
      toast.warning(t('maxItemsReached', { max: MAX_ITEMS }));
    }
  };

  const isDisabled = alreadyInCart || !canAddMore || !variantReady;
  const showCheck = alreadyInCart || justAdded;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {needsVariant && (
        <Select
          value={selectedVariant}
          onValueChange={(value) => {
            if (value !== null) setSelectedVariant(value);
          }}
        >
          <SelectTrigger className="w-auto min-w-[140px]">
            <SelectValue placeholder={t('selectFinish')} />
          </SelectTrigger>
          <SelectContent>
            {variantOptions!.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        size="lg"
        variant="outline"
        className="flex-1"
        onClick={handleAdd}
        disabled={isDisabled}
        aria-label={
          alreadyInCart
            ? t('alreadyInCart')
            : !canAddMore
              ? t('maxItemsReached', { max: MAX_ITEMS })
              : tProducts('requestSample')
        }
      >
        {showCheck ? (
          <CheckIcon data-icon="inline-start" />
        ) : (
          <PackageIcon data-icon="inline-start" />
        )}
        {alreadyInCart
          ? t('inCartLabel')
          : justAdded
            ? t('addedLabel')
            : tProducts('requestSample')}
      </Button>
    </div>
  );
}
