import { describe, it, expect } from 'vitest';
import {
  emptyCart,
  addItem,
  removeItem,
  clearCart,
  getItemCount,
  isInCart,
  getPricingSummary,
  canAddMore,
} from '../cart-logic';
import { MAX_ITEMS, FREE_TIER_LIMITS, PAID_TIER_FEE } from '../types';
import type { SampleCartItem } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMosaicItem(
  nid: number,
  overrides: Partial<SampleCartItem> = {},
): SampleCartItem {
  return {
    nid,
    type: 'mosaico',
    title: `Mosaic ${nid}`,
    imageUrl: null,
    collection: 'Test Collection',
    sampleFormat: null,
    variant: null,
    ...overrides,
  };
}

function makeVetriteItem(
  nid: number,
  overrides: Partial<SampleCartItem> = {},
): SampleCartItem {
  return {
    nid,
    type: 'vetrite',
    title: `Vetrite ${nid}`,
    imageUrl: null,
    collection: 'Test Collection',
    sampleFormat: '4x4',
    variant: 'satin',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// emptyCart
// ---------------------------------------------------------------------------

describe('emptyCart', () => {
  it('returns cart with empty items array', () => {
    const cart = emptyCart();
    expect(cart.items).toEqual([]);
    expect(cart.items).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// addItem
// ---------------------------------------------------------------------------

describe('addItem', () => {
  it('adds item to empty cart', () => {
    const cart = emptyCart();
    const item = makeMosaicItem(1);
    const result = addItem(cart, item);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(item);
  });

  it('adds multiple items', () => {
    let cart = emptyCart();
    cart = addItem(cart, makeMosaicItem(1));
    cart = addItem(cart, makeMosaicItem(2));
    cart = addItem(cart, makeVetriteItem(3));
    expect(cart.items).toHaveLength(3);
  });

  it('prevents duplicate nid (no-op, returns same cart)', () => {
    let cart = emptyCart();
    const item = makeMosaicItem(42);
    cart = addItem(cart, item);
    const cartBefore = cart;
    const cartAfter = addItem(cart, makeMosaicItem(42));
    expect(cartAfter).toBe(cartBefore); // referential equality — same object
    expect(cartAfter.items).toHaveLength(1);
  });

  it('respects MAX_ITEMS limit', () => {
    let cart = emptyCart();
    for (let i = 1; i <= MAX_ITEMS; i++) {
      cart = addItem(cart, makeMosaicItem(i));
    }
    expect(cart.items).toHaveLength(MAX_ITEMS);

    // Attempting to add one more must be a no-op
    const overflow = makeMosaicItem(MAX_ITEMS + 1);
    const cartAfter = addItem(cart, overflow);
    expect(cartAfter).toBe(cart); // same reference
    expect(cartAfter.items).toHaveLength(MAX_ITEMS);
  });

  it('supports mixed mosaico and vetrite items', () => {
    let cart = emptyCart();
    cart = addItem(cart, makeMosaicItem(1));
    cart = addItem(cart, makeVetriteItem(2));
    expect(cart.items).toHaveLength(2);
    expect(cart.items[0].type).toBe('mosaico');
    expect(cart.items[1].type).toBe('vetrite');
  });
});

// ---------------------------------------------------------------------------
// removeItem
// ---------------------------------------------------------------------------

describe('removeItem', () => {
  it('removes item by nid', () => {
    let cart = emptyCart();
    cart = addItem(cart, makeMosaicItem(10));
    const result = removeItem(cart, 10);
    expect(result.items).toHaveLength(0);
  });

  it('no-op when nid not found', () => {
    let cart = emptyCart();
    cart = addItem(cart, makeMosaicItem(10));
    const cartBefore = cart;
    const result = removeItem(cart, 999);
    expect(result).toBe(cartBefore); // same reference
    expect(result.items).toHaveLength(1);
  });

  it('removes from cart with multiple items', () => {
    let cart = emptyCart();
    cart = addItem(cart, makeMosaicItem(1));
    cart = addItem(cart, makeMosaicItem(2));
    cart = addItem(cart, makeVetriteItem(3));

    const result = removeItem(cart, 2);
    expect(result.items).toHaveLength(2);
    expect(result.items.find((i) => i.nid === 2)).toBeUndefined();
    expect(result.items.find((i) => i.nid === 1)).toBeDefined();
    expect(result.items.find((i) => i.nid === 3)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// clearCart
// ---------------------------------------------------------------------------

describe('clearCart', () => {
  it('returns empty cart', () => {
    const result = clearCart();
    expect(result.items).toEqual([]);
    expect(result.items).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getItemCount
// ---------------------------------------------------------------------------

describe('getItemCount', () => {
  it('returns 0 for empty cart', () => {
    expect(getItemCount(emptyCart())).toBe(0);
  });

  it('returns total count without type filter', () => {
    let cart = emptyCart();
    cart = addItem(cart, makeMosaicItem(1));
    cart = addItem(cart, makeMosaicItem(2));
    cart = addItem(cart, makeVetriteItem(3));
    expect(getItemCount(cart)).toBe(3);
  });

  it('returns count filtered by mosaico type', () => {
    let cart = emptyCart();
    cart = addItem(cart, makeMosaicItem(1));
    cart = addItem(cart, makeMosaicItem(2));
    cart = addItem(cart, makeVetriteItem(3));
    expect(getItemCount(cart, 'mosaico')).toBe(2);
  });

  it('returns count filtered by vetrite type', () => {
    let cart = emptyCart();
    cart = addItem(cart, makeMosaicItem(1));
    cart = addItem(cart, makeVetriteItem(2));
    cart = addItem(cart, makeVetriteItem(3));
    expect(getItemCount(cart, 'vetrite')).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// isInCart
// ---------------------------------------------------------------------------

describe('isInCart', () => {
  it('returns false for empty cart', () => {
    expect(isInCart(emptyCart(), 1)).toBe(false);
  });

  it('returns true when item exists', () => {
    let cart = emptyCart();
    cart = addItem(cart, makeMosaicItem(7));
    expect(isInCart(cart, 7)).toBe(true);
  });

  it('returns false when item not in cart', () => {
    let cart = emptyCart();
    cart = addItem(cart, makeMosaicItem(7));
    expect(isInCart(cart, 99)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getPricingSummary
// ---------------------------------------------------------------------------

describe('getPricingSummary', () => {
  it('returns zero fee for empty cart', () => {
    const summary = getPricingSummary(emptyCart());
    expect(summary.itemsFee).toBe(0);
    expect(summary.mosaicoCount).toBe(0);
    expect(summary.vetriteCount).toBe(0);
    expect(summary.mosaicoFree).toBe(true);
    expect(summary.vetriteFree).toBe(true);
  });

  it('returns zero fee when under both free tiers (5 mosaico, 3 vetrite)', () => {
    let cart = emptyCart();
    // 4 mosaico < 5 limit, 2 vetrite < 3 limit
    for (let i = 1; i <= 4; i++) cart = addItem(cart, makeMosaicItem(i));
    for (let i = 10; i <= 11; i++) cart = addItem(cart, makeVetriteItem(i));

    const summary = getPricingSummary(cart);
    expect(summary.itemsFee).toBe(0);
    expect(summary.mosaicoFree).toBe(true);
    expect(summary.vetriteFree).toBe(true);
  });

  it('returns zero fee at exact free tier boundary (5 mosaico, 3 vetrite)', () => {
    let cart = emptyCart();
    for (let i = 1; i <= FREE_TIER_LIMITS.mosaico; i++)
      cart = addItem(cart, makeMosaicItem(i));
    for (let i = 10; i < 10 + FREE_TIER_LIMITS.vetrite; i++)
      cart = addItem(cart, makeVetriteItem(i));

    const summary = getPricingSummary(cart);
    expect(summary.mosaicoCount).toBe(FREE_TIER_LIMITS.mosaico);
    expect(summary.vetriteCount).toBe(FREE_TIER_LIMITS.vetrite);
    expect(summary.mosaicoFree).toBe(true);
    expect(summary.vetriteFree).toBe(true);
    expect(summary.itemsFee).toBe(0);
  });

  it('returns $20 when mosaico exceeds 5', () => {
    let cart = emptyCart();
    // 6 mosaico — one over the limit
    for (let i = 1; i <= FREE_TIER_LIMITS.mosaico + 1; i++)
      cart = addItem(cart, makeMosaicItem(i));

    const summary = getPricingSummary(cart);
    expect(summary.mosaicoFree).toBe(false);
    expect(summary.itemsFee).toBe(PAID_TIER_FEE);
  });

  it('returns $20 when vetrite exceeds 3', () => {
    let cart = emptyCart();
    // 4 vetrite — one over the limit
    for (let i = 10; i < 10 + FREE_TIER_LIMITS.vetrite + 1; i++)
      cart = addItem(cart, makeVetriteItem(i));

    const summary = getPricingSummary(cart);
    expect(summary.vetriteFree).toBe(false);
    expect(summary.itemsFee).toBe(PAID_TIER_FEE);
  });

  it('returns $20 (NOT $40) when BOTH exceed limits', () => {
    let cart = emptyCart();
    // 6 mosaico + 4 vetrite = both exceed their limits
    for (let i = 1; i <= FREE_TIER_LIMITS.mosaico + 1; i++)
      cart = addItem(cart, makeMosaicItem(i));
    for (let i = 10; i < 10 + FREE_TIER_LIMITS.vetrite + 1; i++)
      cart = addItem(cart, makeVetriteItem(i));

    const summary = getPricingSummary(cart);
    expect(summary.mosaicoFree).toBe(false);
    expect(summary.vetriteFree).toBe(false);
    // Fee must be flat $20, never $40
    expect(summary.itemsFee).toBe(PAID_TIER_FEE);
    expect(summary.itemsFee).not.toBe(PAID_TIER_FEE * 2);
  });

  it('returns $20 with only mosaico exceeding, zero vetrite', () => {
    let cart = emptyCart();
    for (let i = 1; i <= FREE_TIER_LIMITS.mosaico + 1; i++)
      cart = addItem(cart, makeMosaicItem(i));

    const summary = getPricingSummary(cart);
    expect(summary.vetriteCount).toBe(0);
    expect(summary.vetriteFree).toBe(true);
    expect(summary.mosaicoFree).toBe(false);
    expect(summary.itemsFee).toBe(PAID_TIER_FEE);
  });

  it('returns $20 with only vetrite exceeding, zero mosaico', () => {
    let cart = emptyCart();
    for (let i = 10; i < 10 + FREE_TIER_LIMITS.vetrite + 1; i++)
      cart = addItem(cart, makeVetriteItem(i));

    const summary = getPricingSummary(cart);
    expect(summary.mosaicoCount).toBe(0);
    expect(summary.mosaicoFree).toBe(true);
    expect(summary.vetriteFree).toBe(false);
    expect(summary.itemsFee).toBe(PAID_TIER_FEE);
  });

  it('correctly counts per type', () => {
    let cart = emptyCart();
    cart = addItem(cart, makeMosaicItem(1));
    cart = addItem(cart, makeMosaicItem(2));
    cart = addItem(cart, makeMosaicItem(3));
    cart = addItem(cart, makeVetriteItem(10));
    cart = addItem(cart, makeVetriteItem(11));

    const summary = getPricingSummary(cart);
    expect(summary.mosaicoCount).toBe(3);
    expect(summary.vetriteCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// canAddMore
// ---------------------------------------------------------------------------

describe('canAddMore', () => {
  it('returns true for empty cart', () => {
    expect(canAddMore(emptyCart())).toBe(true);
  });

  it('returns false when at MAX_ITEMS', () => {
    let cart = emptyCart();
    for (let i = 1; i <= MAX_ITEMS; i++) {
      cart = addItem(cart, makeMosaicItem(i));
    }
    expect(canAddMore(cart)).toBe(false);
  });

  it('returns true when below MAX_ITEMS', () => {
    let cart = emptyCart();
    for (let i = 1; i < MAX_ITEMS; i++) {
      cart = addItem(cart, makeMosaicItem(i));
    }
    expect(canAddMore(cart)).toBe(true);
  });
});
