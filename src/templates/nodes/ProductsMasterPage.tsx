import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Typography } from '@/components/composed/Typography';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { FILTER_REGISTRY } from '@/domain/filters/registry';

// ── Static data ─────────────────────────────────────────────────────────────

/** The 5 product categories displayed on the master page (Pixall excluded). */
const CATEGORY_TYPES = [
  'prodotto_mosaico',
  'prodotto_vetrite',
  'prodotto_arredo',
  'prodotto_illuminazione',
  'prodotto_tessuto',
] as const;

/**
 * Maps content type to translation keys for the category label and description.
 * Label uses nav.* or products.* (same mapping as ListingBreadcrumb).
 * Description uses nav.filter*Desc keys already present in all 6 locales.
 */
const CATEGORY_META: Record<
  string,
  { labelNs: 'nav' | 'products'; labelKey: string; descKey: string }
> = {
  prodotto_mosaico: {
    labelNs: 'nav',
    labelKey: 'mosaico',
    descKey: 'filterMosaicoDesc',
  },
  prodotto_vetrite: {
    labelNs: 'nav',
    labelKey: 'vetrite',
    descKey: 'filterVetriteDesc',
  },
  prodotto_arredo: {
    labelNs: 'nav',
    labelKey: 'arredo',
    descKey: 'filterArredoDesc',
  },
  prodotto_illuminazione: {
    labelNs: 'products',
    labelKey: 'lighting',
    descKey: 'filterIlluminazioneDesc',
  },
  prodotto_tessuto: {
    labelNs: 'nav',
    labelKey: 'tessuto',
    descKey: 'filterTessiliDesc',
  },
};

// ── Component ───────────────────────────────────────────────────────────────

interface ProductsMasterPageProps {
  locale: string;
}

export default async function ProductsMasterPage({
  locale,
}: ProductsMasterPageProps) {
  const tBreadcrumb = await getTranslations('breadcrumb');
  const tNav = await getTranslations('nav');
  const tProducts = await getTranslations('products');

  function getCategoryLabel(type: string): string {
    const meta = CATEGORY_META[type];
    if (!meta) return type;
    return meta.labelNs === 'nav'
      ? tNav(meta.labelKey)
      : tProducts(meta.labelKey);
  }

  function getCategoryDesc(type: string): string {
    const meta = CATEGORY_META[type];
    if (!meta) return '';
    return tNav(meta.descKey);
  }

  function getCategoryHref(type: string): string {
    const config = FILTER_REGISTRY[type];
    if (!config) return '#';
    const basePath = config.basePaths[locale] ?? config.basePaths.it;
    return `/${locale}/${basePath}`;
  }

  const title = tBreadcrumb('filterAndFind');

  return (
    <div className="max-w-main mx-auto px-(--spacing-page) pb-(--spacing-section)">
      {/* Breadcrumb — Products is the terminal level */}
      <Breadcrumb className="pt-(--spacing-content) pb-(--spacing-element)">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title */}
      <div className="flex flex-col gap-(--spacing-element) pb-(--spacing-content)">
        <Typography textRole="h1" as="h1" className="max-w-[40ch]">
          {title}
        </Typography>
      </div>

      {/* Category cards grid */}
      <div className="grid grid-cols-1 gap-(--spacing-element) md:grid-cols-2 lg:grid-cols-3">
        {CATEGORY_TYPES.map((type) => {
          const label = getCategoryLabel(type);
          const desc = getCategoryDesc(type);
          const href = getCategoryHref(type);

          return (
            <Link
              key={type}
              href={href}
              className="group relative block overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <AspectRatio ratio={4 / 3} className="bg-muted">
                {/* Placeholder — replace with real images later */}
              </AspectRatio>

              {/* Overlay — raw white/black values intentional: text sits on a
                 photo with a scrim gradient, not on a themed surface. */}
              <div className="absolute inset-0 flex flex-col justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-(--spacing-element) transition-colors group-hover:from-black/70">
                <Typography
                  textRole="h3"
                  as="span"
                  className="text-white"
                >
                  {label}
                </Typography>
                {desc && (
                  <Typography
                    textRole="body-sm"
                    as="span"
                    className="text-white/80"
                  >
                    {desc}
                  </Typography>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
