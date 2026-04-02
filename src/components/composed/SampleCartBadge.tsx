'use client';

import { ShoppingBagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSampleCart } from '@/domain/sample-cart/SampleCartProvider';

export function SampleCartBadge() {
  const { itemCount, canAddMore, openCart } = useSampleCart();

  // NOOP_CONTEXT has canAddMore: false and itemCount: 0.
  // On US locale with an empty cart, canAddMore is true (MAX_ITEMS > 0).
  // So this condition is only true when the provider is in no-op mode (non-US).
  if (!canAddMore && itemCount === 0) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openCart}
      aria-label={
        itemCount > 0
          ? `Sample cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
          : 'Sample cart'
      }
      className="relative"
    >
      <ShoppingBagIcon className="h-5 w-5" />
      {itemCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Button>
  );
}
