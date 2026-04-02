'use client';

import * as React from 'react';
import { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot, getServerSnapshot, setCart } from './storage';
import {
  addItem as addItemLogic,
  removeItem as removeItemLogic,
  clearCart as clearCartLogic,
  getItemCount,
  isInCart as isInCartLogic,
  getPricingSummary,
  canAddMore as canAddMoreLogic,
} from './cart-logic';
import type { SampleCartItem, SampleCart, PricingSummary } from './types';
import { SampleCartSheet } from '@/components/composed/SampleCartSheet';

interface SampleCartContextValue {
  cart: SampleCart;
  addItem: (item: SampleCartItem) => boolean;
  removeItem: (nid: number) => void;
  clearCart: () => void;
  isInCart: (nid: number) => boolean;
  itemCount: number;
  pricingSummary: PricingSummary;
  canAddMore: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const NOOP_CONTEXT: SampleCartContextValue = {
  cart: { items: [] },
  addItem: () => false,
  removeItem: () => {},
  clearCart: () => {},
  isInCart: () => false,
  itemCount: 0,
  pricingSummary: {
    mosaicoCount: 0,
    vetriteCount: 0,
    mosaicoFree: true,
    vetriteFree: true,
    itemsFee: 0,
  },
  canAddMore: false,
  isCartOpen: false,
  openCart: () => {},
  closeCart: () => {},
};

const SampleCartContext =
  React.createContext<SampleCartContextValue>(NOOP_CONTEXT);

export function useSampleCart() {
  return React.useContext(SampleCartContext);
}

export function SampleCartProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const isUs = locale === 'us';
  const [isCartOpen, setIsCartOpen] = React.useState(false);

  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = React.useCallback((item: SampleCartItem): boolean => {
    const current = getSnapshot();
    if (!canAddMoreLogic(current)) return false;
    if (isInCartLogic(current, item.nid)) return false;
    setCart(addItemLogic(current, item));
    return true;
  }, []);

  const removeItem = React.useCallback((nid: number) => {
    setCart(removeItemLogic(getSnapshot(), nid));
  }, []);

  const clearCartFn = React.useCallback(() => {
    setCart(clearCartLogic());
  }, []);

  const value = React.useMemo<SampleCartContextValue>(() => {
    if (!isUs) return NOOP_CONTEXT;
    return {
      cart,
      addItem,
      removeItem,
      clearCart: clearCartFn,
      isInCart: (nid: number) => isInCartLogic(cart, nid),
      itemCount: getItemCount(cart),
      pricingSummary: getPricingSummary(cart),
      canAddMore: canAddMoreLogic(cart),
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
    };
  }, [isUs, cart, isCartOpen, addItem, removeItem, clearCartFn]);

  return (
    <SampleCartContext value={value}>
      {children}
      {isUs && (
        <SampleCartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
      )}
    </SampleCartContext>
  );
}
