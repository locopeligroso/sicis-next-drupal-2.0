import type { SampleCart } from './types';

const STORAGE_KEY = 'sicis-sample-cart';

// ── Internal state ──
let currentCart: SampleCart = { items: [] };
const listeners: Set<() => void> = new Set();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

// ── localStorage I/O ──

function readFromStorage(): SampleCart {
  if (typeof window === 'undefined') return { items: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    // Validate shape: must have items array
    if (parsed && Array.isArray(parsed.items)) {
      return { items: parsed.items };
    }
    return { items: [] };
  } catch {
    return { items: [] };
  }
}

function writeToStorage(cart: SampleCart): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

// ── Initialize on first load ──
if (typeof window !== 'undefined') {
  currentCart = readFromStorage();

  // Cross-tab sync: listen for storage events from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      currentCart = readFromStorage();
      emitChange();
    }
  });
}

// ── useSyncExternalStore contract ──

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getSnapshot(): SampleCart {
  return currentCart;
}

const EMPTY_CART: SampleCart = { items: [] };

export function getServerSnapshot(): SampleCart {
  return EMPTY_CART;
}

// ── Mutations (update internal state + localStorage + notify) ──

export function setCart(cart: SampleCart): void {
  currentCart = cart;
  writeToStorage(cart);
  emitChange();
}

export function getCart(): SampleCart {
  return currentCart;
}
