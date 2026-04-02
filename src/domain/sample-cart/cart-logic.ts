import {
  SampleCart,
  SampleCartItem,
  SampleProductType,
  FREE_TIER_LIMITS,
  PAID_TIER_FEE,
  MAX_ITEMS,
  PricingSummary,
} from './types';

/** Create an empty cart. */
export function emptyCart(): SampleCart {
  return { items: [] };
}

/**
 * Add item to cart.
 * - If an item with the same nid already exists, returns the same cart unchanged.
 * - If the cart already has MAX_ITEMS items, returns the same cart unchanged.
 * - Otherwise returns a new cart with the item appended.
 */
export function addItem(cart: SampleCart, item: SampleCartItem): SampleCart {
  if (cart.items.length >= MAX_ITEMS) {
    return cart;
  }
  if (cart.items.some((existing) => existing.nid === item.nid)) {
    return cart;
  }
  return { items: [...cart.items, item] };
}

/**
 * Remove an item by nid.
 * - If nid is not found, returns the same cart unchanged.
 * - Otherwise returns a new cart without that item.
 */
export function removeItem(cart: SampleCart, nid: number): SampleCart {
  const index = cart.items.findIndex((item) => item.nid === nid);
  if (index === -1) {
    return cart;
  }
  return {
    items: [...cart.items.slice(0, index), ...cart.items.slice(index + 1)],
  };
}

/** Clear all items. Returns an empty cart. */
export function clearCart(): SampleCart {
  return emptyCart();
}

/**
 * Count items in the cart.
 * - With no `type` argument: returns total item count.
 * - With a `type`: returns count of items matching that type.
 */
export function getItemCount(
  cart: SampleCart,
  type?: SampleProductType,
): number {
  if (type === undefined) {
    return cart.items.length;
  }
  return cart.items.filter((item) => item.type === type).length;
}

/** Returns true if an item with the given nid is present in the cart. */
export function isInCart(cart: SampleCart, nid: number): boolean {
  return cart.items.some((item) => item.nid === nid);
}

/**
 * Compute the pricing summary for the cart.
 *
 * Fee rule: $20 flat if mosaicoCount > FREE_TIER_LIMITS.mosaico (5)
 *           OR vetriteCount > FREE_TIER_LIMITS.vetrite (3).
 *           Never $40 even when both limits are exceeded — always $20 max.
 */
export function getPricingSummary(cart: SampleCart): PricingSummary {
  const mosaicoCount = getItemCount(cart, 'mosaico');
  const vetriteCount = getItemCount(cart, 'vetrite');

  const mosaicoFree = mosaicoCount <= FREE_TIER_LIMITS.mosaico;
  const vetriteFree = vetriteCount <= FREE_TIER_LIMITS.vetrite;

  const itemsFee = mosaicoFree && vetriteFree ? 0 : PAID_TIER_FEE;

  return {
    mosaicoCount,
    vetriteCount,
    mosaicoFree,
    vetriteFree,
    itemsFee,
  };
}

/** Returns true if the cart can still accept at least one more item. */
export function canAddMore(cart: SampleCart): boolean {
  return cart.items.length < MAX_ITEMS;
}
