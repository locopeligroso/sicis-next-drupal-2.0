// ── Product page using DS Spec* blocks (data from P1 mosaic-product endpoint) ─
// Uses the same SpecProductHero, SpecProductDetails, SpecProductSpecs,
// SpecProductResources, SpecProductGallery as the full ProdottoMosaico template.
// Renders all blocks when collection data is available; gracefully omits blocks
// when relations are not yet included in the endpoint response.

import { getTranslations } from 'next-intl/server';
import { SpecProductHero } from '@/components/blocks/SpecProductHero';
import { SpecProductDetails } from '@/components/blocks/SpecProductDetails';
import { SpecProductSpecs } from '@/components/blocks/SpecProductSpecs';
import { SpecProductResources } from '@/components/blocks/SpecProductResources';
import { SpecProductGallery } from '@/components/blocks/SpecProductGallery';
import { QuoteSheetProvider } from '@/components/composed/QuoteSheetProvider';
import { sanitizeHtml } from '@/lib/sanitize';
import { formatRetinatura } from '@/lib/product-helpers';
import type { MosaicProduct } from '@/lib/api/mosaic-product';

export async function MosaicProductPreview({
  product,
  locale,
}: {
  product: MosaicProduct;
  locale: string;
}) {
  const t = await getTranslations('products');

  type ProductCarouselSlide =
    import('@/components/composed/ProductCarousel').ProductCarouselSlide;
  type ProductGalleryImage =
    import('@/components/blocks/SpecProductGallery').ProductGalleryImage;
  type AttributeItem =
    import('@/components/composed/AttributeGrid').AttributeItem;
  type SpecsRow = import('@/components/composed/SpecsTable').SpecsRow;
  type DocumentCardItem =
    import('@/components/composed/DocumentCard').DocumentCardItem;

  const col = product.collection;
  const isUs = locale === 'us';

  // ── Build carousel slides (same pattern as ProdottoMosaico) ──
  const heroSlides: ProductCarouselSlide[] = [];
  if (product.imageUrl) {
    heroSlides.push({
      type: 'image',
      src: product.imageUrl,
      alt: product.title,
    });
  }
  if (isUs && product.imageSampleUrl) {
    heroSlides.push({
      type: 'image',
      src: product.imageSampleUrl,
      alt: `${product.title} – campione`,
    });
  }
  if (product.videoUrl) {
    heroSlides.push({ type: 'video', src: product.videoUrl });
  }
  heroSlides.push({
    type: 'static',
    src: '/images/usa-mosaic-quality.jpg',
    alt: 'Quality certification',
  });

  // ── Price — US: USD fields, fallback $-----; other locales: EUR only ──
  const heroPrice = isUs
    ? product.priceUsaSqft
      ? `$${product.priceUsaSqft}`
      : product.priceUsaSheet
        ? `$${product.priceUsaSheet}`
        : '$-----'
    : product.priceEu
      ? `€${product.priceEu}`
      : null;
  const heroPriceUnit = isUs
    ? product.priceUsaSqft
      ? '/sqft'
      : product.priceUsaSheet
        ? '/sheet'
        : undefined
    : product.priceEu
      ? '/m²'
      : undefined;

  // ── Details block data (from collection) ──
  // US: inch only; other locales: mm only
  const detailAttributes: AttributeItem[] = col
    ? isUs
      ? [
          ...(col.sheetSizeInch
            ? [{ label: 'Sheet size', value: col.sheetSizeInch }]
            : []),
          ...(col.chipSizeInch
            ? [{ label: 'Chip size', value: col.chipSizeInch }]
            : []),
          ...(col.thicknessInch
            ? [{ label: 'Thickness', value: col.thicknessInch }]
            : []),
        ]
      : [
          ...(col.sheetSizeMm
            ? [{ label: 'Sheet size', value: col.sheetSizeMm }]
            : []),
          ...(col.chipSizeMm
            ? [{ label: 'Chip size', value: col.chipSizeMm }]
            : []),
          ...(col.thicknessMm
            ? [{ label: 'Thickness', value: col.thicknessMm }]
            : []),
        ]
    : [];

  // ── Specs block data (from collection) ──
  const boolLabel = (v: boolean | undefined) =>
    v === true ? t('resistant') : v === false ? t('absent') : null;
  const specsRows: SpecsRow[] = col
    ? [
        { label: t('leadContent'), value: boolLabel(col.leadContent) },
        { label: t('waterAbsorption'), value: col.waterAbsorption ?? null },
        { label: t('lightResistance'), value: boolLabel(col.lightResistance) },
        {
          label: t('chemicalResistance'),
          value: boolLabel(col.chemicalResistance),
        },
        { label: t('thermalExpansion'), value: col.thermalExpansion ?? null },
        {
          label: t('thermalShockResistance'),
          value: boolLabel(col.thermalShockResistance),
        },
        { label: t('frostResistance'), value: boolLabel(col.frostResistance) },
        { label: t('surfaceAbrasion'), value: col.surfaceAbrasion ?? null },
        { label: t('massAbrasion'), value: col.massAbrasion ?? null },
        { label: t('stainResistance'), value: boolLabel(col.stainResistance) },
        { label: t('slipResistance'), value: boolLabel(col.slipResistance) },
        {
          label: t('slipResistanceGrip'),
          value: boolLabel(col.slipResistanceGrip),
        },
      ].filter((r): r is SpecsRow => r.value !== null)
    : [];

  // ── Resources block data (from collection documents) ──
  const usesHtml = col?.usesHtml ? sanitizeHtml(col.usesHtml) : undefined;
  const maintenanceHtml = col?.maintenanceHtml
    ? sanitizeHtml(col.maintenanceHtml)
    : undefined;
  let maintenanceGuideHref: string | undefined;
  let discoverHref: string | undefined;
  const documentItems: DocumentCardItem[] = [];

  if (col) {
    for (const doc of col.documents) {
      if (doc.isGuide && doc.href) {
        maintenanceGuideHref = doc.href;
      } else if (doc.isDiscover && doc.href) {
        discoverHref = doc.href;
        documentItems.push({
          title: doc.title,
          imageSrc: doc.imageSrc,
          href: doc.href,
        });
      } else {
        documentItems.push({
          title: doc.title,
          imageSrc: doc.imageSrc,
          href: doc.href,
        });
      }
    }
  }

  // ── Gallery block data ──
  const galleryImages: ProductGalleryImage[] = product.gallery.map(
    (url, i) => ({
      src: url,
      alt: `${product.title} gallery ${i + 1}`,
    }),
  );

  return (
    <QuoteSheetProvider productName={product.title}>
    <article className="flex flex-col gap-(--spacing-section) pt-(--spacing-navbar) pb-(--spacing-section)">
      {/* ── Hero Block ── */}
      <SpecProductHero
        title={product.title}
        collection={col?.name}
        description={product.body ? sanitizeHtml(product.body) : undefined}
        slides={heroSlides}
        hasSample={product.hasSample}
        price={product.priceOnDemand ? undefined : heroPrice}
        priceUnit={product.priceOnDemand ? undefined : heroPriceUnit}
        inStock={!product.noUsaStock}
        shippingWarehouse={
          !product.noUsaStock ? 'North America Warehouse' : undefined
        }
        shippingTime={!product.noUsaStock ? '2-3 weeks' : undefined}
        discoverUrl={discoverHref}
        isUs={isUs}
      />

      {/* ── Details Block ── */}
      {detailAttributes.length > 0 && (
        <SpecProductDetails attributes={detailAttributes} />
      )}

      {/* ── Specs Block ── */}
      {specsRows.length > 0 && (
        <SpecProductSpecs
          specs={specsRows}
          assemblyValue={
            col?.meshType ? formatRetinatura(col.meshType) : undefined
          }
          assemblyImageSrc={
            col?.meshType
              ? '/images/Retinatura-mosaico-rete.jpg.webp'
              : undefined
          }
          groutingValue={
            product.grouts.length > 0 ? product.grouts[0].name : undefined
          }
          groutingImageSrc={
            product.grouts.length > 0 ? product.grouts[0].imageSrc : undefined
          }
          groutConsumption={
            isUs
              ? col?.groutConsumptionSqft != null
                ? `${col.groutConsumptionSqft} kg/sqft`
                : undefined
              : col?.groutConsumptionM2 != null
                ? `${col.groutConsumptionM2} kg/m²`
                : undefined
          }
          maintenanceHtml={maintenanceHtml}
          maintenanceLabel="Maintenance and installation"
          maintenanceGuideHref={maintenanceGuideHref ?? '#'}
          maintenanceGuideLabel="View guide"
        />
      )}

      {/* ── Resources Block ── */}
      {documentItems.length > 0 && (
        <SpecProductResources
          title="Get inspired through catalogs"
          documents={documentItems}
          downloadLabel="Scopri"
        />
      )}

      {/* ── Gallery Block ── */}
      {galleryImages.length > 0 && (
        <SpecProductGallery images={galleryImages} />
      )}

      {/* Debug: raw data (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mx-auto max-w-main px-[var(--spacing-page)] rounded-lg border p-4">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Debug: Raw product data (NID {product.nid})
          </summary>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(product, null, 2)}
          </pre>
        </details>
      )}
    </article>
    </QuoteSheetProvider>
  );
}
