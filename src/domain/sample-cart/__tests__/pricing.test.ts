import { describe, it, expect } from 'vitest';
import {
  getShippingRegion,
  calculateShippingCost,
  calculateTotal,
} from '../pricing';

// ---------------------------------------------------------------------------
// Reference data (mirrors shipping-data.json values for assertions)
// ---------------------------------------------------------------------------

const EAST_COSTS = [12.71, 18.3, 29.5, 41.08];
const CENTRAL_COSTS = [13.41, 29.69, 35.43, 41.93];
const WEST_COSTS = [27.04, 40.37, 55.74, 56.48];
const OUTER_COSTS = [28.96, 51.89, 59.24, 61.11];

// ---------------------------------------------------------------------------
// getShippingRegion
// ---------------------------------------------------------------------------

describe('getShippingRegion', () => {
  it('returns east region for new_york', () => {
    const region = getShippingRegion('new_york');
    expect(region).not.toBeNull();
    expect(region!.name).toBe('east');
  });

  it('returns central region for texas', () => {
    const region = getShippingRegion('texas');
    expect(region).not.toBeNull();
    expect(region!.name).toBe('central');
  });

  it('returns west region for california', () => {
    const region = getShippingRegion('california');
    expect(region).not.toBeNull();
    expect(region!.name).toBe('west');
  });

  it('returns outer region for hawaii', () => {
    const region = getShippingRegion('hawaii');
    expect(region).not.toBeNull();
    expect(region!.name).toBe('outer');
  });

  it('returns null for unknown state', () => {
    const region = getShippingRegion('narnia');
    expect(region).toBeNull();
  });

  it('returns null for empty string', () => {
    const region = getShippingRegion('');
    expect(region).toBeNull();
  });

  it('normalises whitespace and casing (e.g. "New York")', () => {
    const region = getShippingRegion('New York');
    expect(region).not.toBeNull();
    expect(region!.name).toBe('east');
  });
});

// ---------------------------------------------------------------------------
// calculateShippingCost
// ---------------------------------------------------------------------------

describe('calculateShippingCost', () => {
  it('returns tier 1 cost for 1-3 items', () => {
    // East region, 1 item
    const result = calculateShippingCost('new_york', 1);
    expect(result).not.toBeNull();
    expect(result!.cost).toBe(EAST_COSTS[0]);

    // Edge: 3 items still tier 1
    const result3 = calculateShippingCost('new_york', 3);
    expect(result3!.cost).toBe(EAST_COSTS[0]);
  });

  it('returns tier 2 cost for 4-6 items', () => {
    const result4 = calculateShippingCost('new_york', 4);
    expect(result4!.cost).toBe(EAST_COSTS[1]);

    const result6 = calculateShippingCost('new_york', 6);
    expect(result6!.cost).toBe(EAST_COSTS[1]);
  });

  it('returns tier 3 cost for 7-10 items', () => {
    const result7 = calculateShippingCost('new_york', 7);
    expect(result7!.cost).toBe(EAST_COSTS[2]);

    const result10 = calculateShippingCost('new_york', 10);
    expect(result10!.cost).toBe(EAST_COSTS[2]);
  });

  it('returns tier 4 cost for 11+ items', () => {
    const result11 = calculateShippingCost('new_york', 11);
    expect(result11!.cost).toBe(EAST_COSTS[3]);

    const result15 = calculateShippingCost('new_york', 15);
    expect(result15!.cost).toBe(EAST_COSTS[3]);
  });

  it('returns null for unknown state', () => {
    const result = calculateShippingCost('narnia', 3);
    expect(result).toBeNull();
  });

  it('returns correct costs for central region (texas)', () => {
    expect(calculateShippingCost('texas', 1)!.cost).toBe(CENTRAL_COSTS[0]);
    expect(calculateShippingCost('texas', 5)!.cost).toBe(CENTRAL_COSTS[1]);
    expect(calculateShippingCost('texas', 8)!.cost).toBe(CENTRAL_COSTS[2]);
    expect(calculateShippingCost('texas', 12)!.cost).toBe(CENTRAL_COSTS[3]);
  });

  it('returns correct costs for west region (california)', () => {
    expect(calculateShippingCost('california', 2)!.cost).toBe(WEST_COSTS[0]);
    expect(calculateShippingCost('california', 6)!.cost).toBe(WEST_COSTS[1]);
    expect(calculateShippingCost('california', 9)!.cost).toBe(WEST_COSTS[2]);
    expect(calculateShippingCost('california', 11)!.cost).toBe(WEST_COSTS[3]);
  });

  it('returns correct costs for outer region (hawaii)', () => {
    expect(calculateShippingCost('hawaii', 3)!.cost).toBe(OUTER_COSTS[0]);
    expect(calculateShippingCost('hawaii', 4)!.cost).toBe(OUTER_COSTS[1]);
    expect(calculateShippingCost('hawaii', 10)!.cost).toBe(OUTER_COSTS[2]);
    expect(calculateShippingCost('hawaii', 11)!.cost).toBe(OUTER_COSTS[3]);
  });

  it('returns shipping time string alongside cost', () => {
    const result = calculateShippingCost('new_york', 1);
    expect(result).not.toBeNull();
    expect(typeof result!.time).toBe('string');
    expect(result!.time.length).toBeGreaterThan(0);
  });

  it('tier boundary: 3 items is tier 1, 4 items is tier 2', () => {
    const tier1 = calculateShippingCost('california', 3);
    const tier2 = calculateShippingCost('california', 4);
    expect(tier1!.cost).toBe(WEST_COSTS[0]);
    expect(tier2!.cost).toBe(WEST_COSTS[1]);
  });

  it('tier boundary: 10 items is tier 3, 11 items is tier 4', () => {
    const tier3 = calculateShippingCost('california', 10);
    const tier4 = calculateShippingCost('california', 11);
    expect(tier3!.cost).toBe(WEST_COSTS[2]);
    expect(tier4!.cost).toBe(WEST_COSTS[3]);
  });
});

// ---------------------------------------------------------------------------
// calculateTotal
// ---------------------------------------------------------------------------

describe('calculateTotal', () => {
  it('sums itemsFee and shippingCost', () => {
    expect(calculateTotal(20, 12.71)).toBeCloseTo(32.71);
  });

  it('returns 0 when both are 0', () => {
    expect(calculateTotal(0, 0)).toBe(0);
  });

  it('returns itemsFee when shippingCost is 0', () => {
    expect(calculateTotal(20, 0)).toBe(20);
  });

  it('returns shippingCost when itemsFee is 0', () => {
    expect(calculateTotal(0, 18.3)).toBeCloseTo(18.3);
  });
});
