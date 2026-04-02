import type { ShippingRegion } from './types';

import shippingData from './shipping-data.json';

/**
 * Get the shipping region config for a US state name (snake_case or display name).
 * Input is normalised to lowercase snake_case before lookup.
 * Returns null for unknown or empty states.
 */
export function getShippingRegion(stateName: string): ShippingRegion | null {
  if (!stateName) return null;

  const normalised = stateName.trim().toLowerCase().replace(/\s+/g, '_');

  const entry = shippingData.states.find((s) => s.state === normalised);
  if (!entry || !entry.region) return null;

  const region =
    shippingData.regions[entry.region as keyof typeof shippingData.regions];
  if (!region) return null;

  return region;
}

/**
 * Calculate shipping cost for a given US state and total item count.
 *
 * Tier mapping (matches original widget):
 *   1–3  items → cost[0]
 *   4–6  items → cost[1]
 *   7–10 items → cost[2]
 *   11+  items → cost[3]
 *
 * Returns null when the state is unknown.
 */
export function calculateShippingCost(
  stateName: string,
  totalItems: number,
): { cost: number; time: string } | null {
  const region = getShippingRegion(stateName);
  if (!region) return null;

  let tierIndex: number;
  if (totalItems <= 3) {
    tierIndex = 0;
  } else if (totalItems <= 6) {
    tierIndex = 1;
  } else if (totalItems <= 10) {
    tierIndex = 2;
  } else {
    tierIndex = 3;
  }

  return {
    cost: region.cost[tierIndex],
    time: region.shipping,
  };
}

/**
 * Calculate order total: itemsFee + shippingCost.
 * Both values are assumed to be non-negative USD amounts.
 */
export function calculateTotal(itemsFee: number, shippingCost: number): number {
  return itemsFee + shippingCost;
}
