import { fetchProducts, getDrupalImageUrl } from '@/lib/drupal';
import { fetchAllFilterOptions } from '@/lib/api/filters';
import { parseFiltersFromUrl } from '@/domain/filters/search-params';
import { FILTER_REGISTRY } from '@/domain/filters/registry';
import { getTranslations } from 'next-intl/server';
import ProductListing from '@/components_legacy/ProductListing';
import FilterSidebar from '@/components_legacy/FilterSidebar';
import DrupalImage from '@/components_legacy/DrupalImage';

interface Props {
  node: Record<string, unknown>;
  currentPage?: number;
  pageSize?: number;
  basePath?: string;
  searchParams?: Record<string, string | string[]>;
}

export default async function VetriteCollezione({
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
  // basePath = '/{locale}/{contentBasePath}/{collectionSlug}'
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
    fetchAllFilterOptions('prodotto_vetrite', langcode),
    fetchProducts({
      productType: 'prodotto_vetrite',
      locale: langcode,
      limit: pageSize,
      offset,
      // Always filter by collection name (P0 path filter, exact Drupal term name)
      // Plus any P1/P2 query filters parsed from URL
      filters: [
        { field: 'field_collezione.name', value: name, operator: '=' },
        ...parsedFilters.filterDefinitions.filter(
          (d) => d.field !== 'field_collezione.name',
        ),
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
  const registryConfig = FILTER_REGISTRY['prodotto_vetrite'];
  const availableFilters = Object.values(registryConfig.filters);

  // parseFiltersFromUrl already detects the P0 path filter from baseSlug
  // (which includes the collection segment). Use its output directly.
  const allActiveFilters = parsedFilters.activeFilters;

  // FilterSidebar basePath = content type root (clearAll goes back to /it/lastre-vetro-vetrite)
  const contentBasePath =
    registryConfig.basePaths[langcode] ?? 'lastre-vetro-vetrite';
  const sidebarBasePath = `/${langcode}/${contentBasePath}`;

  // ── Translations ──
  const t = await getTranslations('products');
  const tCommon = await getTranslations('common');

  // ── Collection hero image ──
  const heroImage = node.field_immagine;
  const heroImageUrl = getDrupalImageUrl(heroImage);

  // ── Collection documents (catalogs, technical sheets) ──
  interface DocItem {
    id?: string;
    title?: unknown;
    field_titolo_main?: unknown;
    field_tipologia_documento?: unknown;
    field_collegamento_esterno?: unknown;
    field_immagine?: unknown;
    field_allegato?: { uri?: { url?: string; value?: string } };
  }
  const documenti = (node.field_documenti as DocItem[] | undefined) ?? [];

  return (
    <>
      <style>{`
        .filter-page-grid { display: grid; grid-template-columns: 16.25rem 1fr; min-height: 100vh; align-items: start; }
        @media (max-width: 48rem) { .filter-page-grid { grid-template-columns: 1fr; } }
      `}</style>
      {/* ── Collection hero image ── */}
      {heroImageUrl && (
        <section className="relative w-full overflow-hidden">
          <style>{`
            .vetrite-hero-img { aspect-ratio: 16/9; }
            @media (min-width: 48rem) { .vetrite-hero-img { aspect-ratio: 21/9; } }
          `}</style>
          <DrupalImage
            field={heroImage}
            alt={name}
            className="vetrite-hero-img"
          />
          <div
            className="absolute inset-0 flex items-end"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
            }}
          >
            <div className="px-6 pb-6 md:px-10 md:pb-10">
              <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight drop-shadow-sm">
                {name}
              </h1>
            </div>
          </div>
        </section>
      )}

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

      {/* ── Collection documents (catalogs, tech sheets) ── */}
      {documenti.length > 0 && (
        <section className="py-12 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-8">
            <h2 className="text-2xl font-bold mb-6">{t('documents')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documenti.map((doc, i) => {
                const docTitle =
                  (typeof doc.field_titolo_main === 'string'
                    ? doc.field_titolo_main
                    : null) ??
                  (typeof doc.title === 'string' ? doc.title : null) ??
                  '';
                const docType =
                  typeof doc.field_tipologia_documento === 'string'
                    ? doc.field_tipologia_documento
                    : null;
                const extLinkRaw = doc.field_collegamento_esterno;
                const docLink =
                  typeof extLinkRaw === 'string'
                    ? extLinkRaw
                    : extLinkRaw && typeof extLinkRaw === 'object'
                      ? ((extLinkRaw as { uri?: string }).uri ?? null)
                      : null;
                const allegatoUrl = doc.field_allegato?.uri?.url
                  ? getDrupalImageUrl(doc.field_allegato)
                  : null;
                const href = docLink || allegatoUrl;
                const imgUrl = getDrupalImageUrl(doc.field_immagine);

                return (
                  <div
                    key={doc.id ?? i}
                    className="border border-gray-200 rounded-lg overflow-hidden flex flex-col"
                  >
                    {imgUrl && (
                      <DrupalImage
                        field={doc.field_immagine}
                        alt={docTitle}
                        aspectRatio="4/3"
                        style={{ width: '100%' }}
                      />
                    )}
                    <div className="p-4 flex-1 flex flex-col">
                      {docType && (
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                          {docType}
                        </p>
                      )}
                      {docTitle && (
                        <p className="font-medium text-sm mb-2">{docTitle}</p>
                      )}
                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-auto text-sm underline"
                        >
                          {tCommon('download')}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
