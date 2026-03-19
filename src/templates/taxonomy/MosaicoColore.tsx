import { fetchProducts } from '@/lib/fetch-products';
import { fetchAllFilterOptions } from '@/lib/fetch-filter-options';
import { parseFiltersFromUrl } from '@/domain/filters/search-params';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import ProductListing from '@/components_legacy/ProductListing';
import FilterSidebar from '@/components_legacy/FilterSidebar';

interface Props {
  node: Record<string, unknown>;
  currentPage?: number;
  pageSize?: number;
  basePath?: string;
  searchParams?: Record<string, string | string[]>;
}

export default async function MosaicoColore({
  node,
  currentPage = 1,
  pageSize = 48,
  basePath = '',
  searchParams,
}: Props) {
  const name = (node.name as string | undefined) ?? '';
  const langcode = (node.langcode as string | undefined) ?? 'it';
  const offset = (currentPage - 1) * pageSize;

  // Extract slug segments from basePath for parseFiltersFromUrl
  // basePath = '/{locale}/{contentBasePath}/{colorSlug}'
  // We need segments after the locale prefix
  const pathWithoutLocale = basePath.startsWith(`/${langcode}/`)
    ? basePath.slice(`/${langcode}/`.length)
    : basePath.replace(/^\//, '');
  const slugSegments = pathWithoutLocale.split('/').filter(Boolean);

  // Parse P1/P2 query filters from URL searchParams
  const spRecord: Record<string, string> = {};
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (k !== 'page') spRecord[k] = Array.isArray(v) ? v[0] : v;
    });
  }
  const parsedFilters = parseFiltersFromUrl(slugSegments, spRecord, langcode);

  // Fetch filter options and filtered products in parallel
  const [filterOptions, { products, total }] = await Promise.all([
    fetchAllFilterOptions('prodotto_mosaico', langcode),
    fetchProducts({
      productType: 'prodotto_mosaico',
      locale: langcode,
      limit: pageSize,
      offset,
      // Always filter by color name (P0 path filter, exact Drupal term name)
      // Plus any P1/P2 query filters parsed from URL
        filters: [
        { field: 'field_colori.name', value: name, operator: '=' },
        ...parsedFilters.filterDefinitions.filter(d => d.field !== 'field_colori.name'),
      ],
    }),
  ]);

  // Build activeQueryParams for Pagination (query filters only)
  const activeQueryParams: Record<string, string | string[]> = {};
  parsedFilters.activeFilters
    .filter((f) => f.type === 'query')
    .forEach((f) => {
      activeQueryParams[f.key] = f.value;
    });

  // Registry config
  const registryConfig = FILTER_REGISTRY['prodotto_mosaico'];
  const availableFilters = Object.values(registryConfig.filters);

  // parseFiltersFromUrl already detects the P0 path filter from baseSlug
  // (which includes the color segment). Use its output directly.
  const allActiveFilters = parsedFilters.activeFilters;

  // FilterSidebar basePath = content type root (clearAll goes back to /it/mosaico)
  const contentBasePath = registryConfig.basePaths[langcode] ?? 'mosaico';
  const sidebarBasePath = `/${langcode}/${contentBasePath}`;

  return (
    <>
      <style>{`
        .filter-page-grid { display: grid; grid-template-columns: 16.25rem 1fr; min-height: 100vh; align-items: start; }
        @media (max-width: 48rem) { .filter-page-grid { grid-template-columns: 1fr; } }
      `}</style>
      <div className="filter-page-grid">
        <FilterSidebar
          availableFilters={availableFilters}
          filterOptions={filterOptions}
          activeFilters={allActiveFilters}
          locale={langcode}
          basePath={sidebarBasePath}
        />
        <ProductListing
          title={name}
          products={products}
          total={total}
          locale={langcode}
          currentPage={currentPage}
          pageSize={pageSize}
          basePath={basePath}
          activeQueryParams={activeQueryParams}
        />
      </div>
    </>
  );
}
