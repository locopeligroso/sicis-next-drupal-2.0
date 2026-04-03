import { ARREDO_INDOOR_PARENT_NID } from '@/lib/api/category-hub';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import { resolvePath } from '@/lib/api/resolve-path';

/**
 * Resolves the hub parent NID for a given product type and locale.
 * - prodotto_arredo: returns the hardcoded indoor parent NID (4261).
 * - All other types: resolves the base listing path from FILTER_REGISTRY via Drupal.
 * Returns undefined when the product type has no registry entry.
 */
export async function resolveHubParentNid(
  productType: string,
  locale: string,
): Promise<number | undefined> {
  if (productType === 'prodotto_arredo') {
    return ARREDO_INDOOR_PARENT_NID;
  }
  const ptConfig = FILTER_REGISTRY[productType];
  if (!ptConfig) return undefined;
  const basePathSegment = (
    ptConfig.basePaths[locale] ?? ptConfig.basePaths.it
  ).split('/')[0];
  const baseResolved = await resolvePath(`/${basePathSegment}`, locale);
  return baseResolved?.nid;
}
