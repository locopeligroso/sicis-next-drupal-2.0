import type { EntityTypeName } from '@/types/drupal/entities';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import type { ListingConfig } from '@/domain/filters/registry';

/**
 * Returns the listing configuration from the filter registry for a given product type.
 *
 * Used by the catch-all route to determine page size, category groups, sort options
 * and card aspect ratio for product listing pages.
 *
 * @param productType - Drupal content type machine name (e.g. `'prodotto_mosaico'`)
 * @returns `ListingConfig` with pageSize, categoryGroups, sortOptions, categoryCardRatio,
 *          or `null` if the product type is not registered.
 * @example
 * getListingConfig('prodotto_mosaico')?.pageSize // → 48
 * getListingConfig('unknown')                     // → null
 */
export function getListingConfig(productType: string): ListingConfig | null {
  const config = FILTER_REGISTRY[productType];
  return config?.listing ?? null;
}

/**
 * Returns the ISR revalidation time in seconds for a given Drupal entity type.
 *
 * Revalidation strategy:
 * - Products: 60 s (high update frequency, price/stock changes)
 * - Editorial (articolo, news, tutorial): 300 s
 * - Static pages: 600 s
 * - Taxonomy terms: 3600 s (rarely change)
 * - Unknown types: 300 s (safe default)
 *
 * @param type - Drupal entity type name (e.g. `'node--prodotto_mosaico'`)
 * @returns Revalidation time in seconds for use with `next: { revalidate }`
 * @example
 * getRevalidateTime('node--prodotto_mosaico') // → 60
 * getRevalidateTime('node--page')             // → 600
 * getRevalidateTime('taxonomy_term--colori')  // → 3600
 */
export function getRevalidateTime(type: EntityTypeName): number {
  switch (type) {
    case 'node--prodotto_mosaico':
    case 'node--prodotto_arredo':
    case 'node--prodotto_pixall':
    case 'node--prodotto_tessuto':
    case 'node--prodotto_vetrite':
    case 'node--prodotto_illuminazione':
      return 60;
    case 'node--articolo':
    case 'node--news':
    case 'node--tutorial':
      return 300;
    case 'node--page':
    case 'node--landing_page':
      return 600;
    default:
      if (type.startsWith('taxonomy_term--')) return 3600;
      return 300;
  }
}

/**
 * Maps a Drupal entity type name to the corresponding React component name.
 *
 * Used by the catch-all route (`[...slug]/page.tsx`) to dynamically import
 * the correct component for each content type. Returns `'UnknownEntity'` as
 * a safe fallback for unmapped types.
 *
 * @param type - Drupal entity type name (e.g. `'node--prodotto_mosaico'`)
 * @returns React component name string (e.g. `'ProdottoMosaico'`)
 * @example
 * getComponentName('node--prodotto_mosaico') // → 'ProdottoMosaico'
 * getComponentName('node--page')             // → 'Page'
 * getComponentName('node--unknown_type')     // → 'UnknownEntity'
 */
export function getComponentName(type: EntityTypeName): string {
  const map: Record<string, string> = {
    'node--page': 'Page',
    'node--landing_page': 'LandingPage',
    'node--prodotto_mosaico': 'ProdottoMosaico',
    'node--prodotto_arredo': 'ProdottoArredo',
    'node--prodotto_illuminazione': 'ProdottoIlluminazione',
    'node--prodotto_pixall': 'ProdottoPixall',
    'node--prodotto_tessuto': 'ProdottoTessuto',
    'node--prodotto_vetrite': 'ProdottoVetrite',
    'node--articolo': 'Articolo',
    'node--news': 'News',
    'node--tutorial': 'Tutorial',
    'node--progetto': 'Progetto',
    'node--showroom': 'Showroom',
    'node--ambiente': 'Ambiente',
    'node--categoria': 'Categoria',
    'node--categoria_blog': 'CategoriaBlog',
    'node--documento': 'Documento',
    'node--tag': 'Tag',
    'taxonomy_term--mosaico_collezioni': 'MosaicoCollezione',
    'taxonomy_term--mosaico_colori': 'MosaicoColore',
    'taxonomy_term--vetrite_collezioni': 'VetriteCollezione',
    'taxonomy_term--vetrite_colori': 'VetriteColore',
  };
  return map[type] ?? 'UnknownEntity';
}

