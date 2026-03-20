import { FILTER_REGISTRY } from '../registry';
import { describe, it, expect } from 'vitest';

describe('FILTER_REGISTRY listing config', () => {
  const productTypes = Object.keys(FILTER_REGISTRY);

  it.each(productTypes)('%s has a listing config', (pt) => {
    const config = FILTER_REGISTRY[pt];
    expect(config.listing).toBeDefined();
    expect(config.listing.pageSize).toBeGreaterThan(0);
    expect(config.listing.sortOptions.length).toBeGreaterThan(0);
  });

  it('pixall has empty categoryGroups', () => {
    expect(FILTER_REGISTRY.prodotto_pixall.listing.categoryGroups).toEqual([]);
  });

  it('mosaico has 2 categoryGroups', () => {
    expect(FILTER_REGISTRY.prodotto_mosaico.listing.categoryGroups).toHaveLength(2);
  });

  it('categoryGroups reference valid filter keys', () => {
    for (const [, config] of Object.entries(FILTER_REGISTRY)) {
      for (const group of config.listing.categoryGroups) {
        expect(config.filters[group.filterKey]).toBeDefined();
      }
    }
  });
});
