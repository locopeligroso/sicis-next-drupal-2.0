import { getTranslations, getLocale } from 'next-intl/server';
import { getTextValue, getProcessedText } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';
import { getColorSwatch, formatRetinatura } from '@/lib/product-helpers';
import { getDrupalImageUrl } from '@/lib/drupal';
import { DevBlockOverlay } from '@/components/composed/DevBlockOverlay';
import { SpecProductHero } from '@/components/blocks/SpecProductHero';
import { SpecProductDetails } from '@/components/blocks/SpecProductDetails';
import { SpecProductSpecs } from '@/components/blocks/SpecProductSpecs';
import { SpecProductResources } from '@/components/blocks/SpecProductResources';
import { SpecProductGallery } from '@/components/blocks/SpecProductGallery';
import type { ProductCarouselSlide } from '@/components/composed/ProductCarousel';
import type { SwatchItem } from '@/components/composed/SwatchList';
import type { AttributeItem } from '@/components/composed/AttributeGrid';
import type { SpecsRow } from '@/components/composed/SpecsTable';
import type { DocumentCardItem } from '@/components/composed/DocumentCard';
import type { ProductGalleryImage } from '@/components/blocks/SpecProductGallery';
import type { ProdottoMosaico as ProdottoMosaicoType } from '@/types/drupal/entities';

export default async function ProdottoMosaico({
  node,
}: {
  node: Record<string, unknown>;
}) {
  // Cast sicuro: il node-resolver passa Record<string,unknown>, ma il contenuto
  // è sempre un ProdottoMosaico deserializzato da Drupal JSON:API
  const typedNode = node as ProdottoMosaicoType;
  const t = await getTranslations('products');
  const tCommon = await getTranslations('common');

  const collezioneData = typedNode.field_collezione;
  const collezione = collezioneData?.name;
  const locale = await getLocale();
  const isUs = locale === 'us';

  // ── Product fields with collection fallback ──
  // Product-level values override collection-level values when present.
  const title = getTextValue(typedNode.field_titolo_main);
  const body =
    getProcessedText(typedNode.field_testo_main) ||
    getProcessedText(collezioneData?.field_testo) ||
    null;
  const composizione = getTextValue(typedNode.field_composizione);
  const prezzoEu = typedNode.field_prezzo_eu ?? null;
  const prezzoUsa = typedNode.field_prezzo_usa ?? null;
  const prezzoOnDemand = typedNode.field_prezzo_on_demand ?? false;
  const noUsaStock = typedNode.field_no_usa_stock ?? false;
  const forma = Array.isArray(typedNode.field_forma)
    ? typedNode.field_forma[0]?.name
    : undefined;
  const finitura = Array.isArray(typedNode.field_finitura)
    ? typedNode.field_finitura[0]?.name
    : undefined;
  const colori = typedNode.field_colori ?? [];
  const stucchi = typedNode.field_stucco ?? [];
  const gallery = typedNode.field_gallery ?? [];

  // ── Build slides for SpecProductHero carousel ──
  const heroSlides: ProductCarouselSlide[] = [];

  // Gallery images
  for (const img of gallery) {
    const src = getDrupalImageUrl(img);
    if (src) {
      heroSlides.push({ type: 'image', src, alt: title ?? '' });
    }
  }

  // Main image as fallback if no gallery
  if (heroSlides.length === 0) {
    const mainSrc = getDrupalImageUrl(typedNode.field_immagine);
    if (mainSrc) {
      heroSlides.push({ type: 'image', src: mainSrc, alt: title ?? '' });
    }
  }

  // Video
  const videoUrl = getDrupalImageUrl(typedNode.field_video);
  if (videoUrl) {
    heroSlides.push({ type: 'video', src: videoUrl });
  }

  // Static quality image
  heroSlides.push({
    type: 'static',
    src: '/images/usa-mosaic-quality.jpg',
    alt: 'Quality certification',
  });

  // ── Collection link ──
  const collectionHref = collezioneData?.path?.alias
    ? `/${locale}${collezioneData.path.alias}`
    : undefined;

  // ── Price — US: USD fields, fallback $-----; other locales: EUR only ──
  const heroPrice = isUs
    ? prezzoUsa
      ? `$${prezzoUsa}`
      : '$-----'
    : prezzoEu
      ? `€${prezzoEu}`
      : null;
  const heroPriceUnit = isUs
    ? prezzoUsa
      ? '/sqft'
      : undefined
    : prezzoEu
      ? '/m²'
      : undefined;

  // ── Details Block data ──
  // US: inch only; other locales: mm only
  const detailAttributes: AttributeItem[] = [
    ...(isUs
      ? [
          ...(collezioneData?.field_dimensione_foglio_inch
            ? [
                {
                  label: 'Sheet size',
                  value: collezioneData.field_dimensione_foglio_inch,
                },
              ]
            : []),
          ...(collezioneData?.field_dimensione_tessera_inch
            ? [
                {
                  label: 'Chip size',
                  value: collezioneData.field_dimensione_tessera_inch,
                },
              ]
            : []),
          ...(collezioneData?.field_spessore_inch
            ? [
                {
                  label: 'Thickness',
                  value: collezioneData.field_spessore_inch,
                },
              ]
            : []),
        ]
      : [
          ...(collezioneData?.field_dimensione_foglio_mm
            ? [
                {
                  label: 'Sheet size',
                  value: collezioneData.field_dimensione_foglio_mm,
                },
              ]
            : []),
          ...(collezioneData?.field_dimensione_tessera_mm
            ? [
                {
                  label: 'Chip size',
                  value: collezioneData.field_dimensione_tessera_mm,
                },
              ]
            : []),
          ...(collezioneData?.field_spessore_mm
            ? [{ label: 'Thickness', value: collezioneData.field_spessore_mm }]
            : []),
        ]),
    ...(forma ? [{ label: 'Shape', value: forma }] : []),
    ...(finitura ? [{ label: 'Finishing', value: finitura }] : []),
  ];

  const detailColors: SwatchItem[] = colori.map((c) => {
    const name = c.name ?? '';
    const imageSrc = getDrupalImageUrl(
      (c as Record<string, unknown>).field_immagine,
    );
    return {
      name,
      imageSrc,
      cssColor: imageSrc ? undefined : getColorSwatch(name),
    };
  });

  const detailGrouts: SwatchItem[] = stucchi.map((s) => ({
    name: s.name ?? '',
    imageSrc: getDrupalImageUrl((s as Record<string, unknown>).field_immagine),
  }));

  // ── Specs Block data ──
  // Only resistance/test data — dimensions are in the attributes row
  const boolLabel = (v: unknown) =>
    v === true ? t('resistant') : v === false ? t('absent') : null;
  const specsRows: SpecsRow[] = [
    {
      label: t('leadContent'),
      value: boolLabel(collezioneData?.field_contenuto_piombo),
    },
    {
      label: t('waterAbsorption'),
      value: collezioneData?.field_assorbimento_acqua ?? null,
    },
    {
      label: t('lightResistance'),
      value: boolLabel(collezioneData?.field_resistenza_luce),
    },
    {
      label: t('chemicalResistance'),
      value: boolLabel(collezioneData?.field_resistenza_chimica),
    },
    {
      label: t('thermalExpansion'),
      value: collezioneData?.field_espansione_termica ?? null,
    },
    {
      label: t('thermalShockResistance'),
      value: boolLabel(collezioneData?.field_resistenza_sbalzi_termici),
    },
    {
      label: t('frostResistance'),
      value: boolLabel(collezioneData?.field_resistenza_gelo),
    },
    {
      label: t('surfaceAbrasion'),
      value: collezioneData?.field_resistenza_abr_superficie ?? null,
    },
    {
      label: t('massAbrasion'),
      value: collezioneData?.field_resistenza_abr_massa ?? null,
    },
    {
      label: t('stainResistance'),
      value: boolLabel(collezioneData?.field_resistenza_macchie),
    },
    {
      label: t('slipResistance'),
      value: boolLabel(collezioneData?.field_resistenza_scivolosita),
    },
    {
      label: t('slipResistanceGrip'),
      value: boolLabel(collezioneData?.field_resistenza_scivol_perc),
    },
  ].filter((r): r is SpecsRow => r.value !== null);

  // ── Resources Block data ──
  const usesHtml = getProcessedText(collezioneData?.field_utilizzi)
    ? sanitizeHtml(getProcessedText(collezioneData?.field_utilizzi)!)
    : undefined;
  const maintenanceHtml = getProcessedText(collezioneData?.field_manutenzione)
    ? sanitizeHtml(getProcessedText(collezioneData?.field_manutenzione)!)
    : undefined;

  const rawDocs =
    (collezioneData?.field_documenti as
      | Array<{
          id?: string;
          title?: unknown;
          field_titolo_main?: unknown;
          field_tipologia_documento?: unknown;
          field_collegamento_esterno?: unknown;
          field_immagine?: unknown;
          field_allegato?: { entity?: { uri?: { value?: string } } };
        }>
      | undefined) ?? [];

  let maintenanceGuideHref: string | undefined;
  let discoverHref: string | undefined;
  let discoverTitle: string | undefined;
  const documentItems: DocumentCardItem[] = [];

  for (const doc of rawDocs) {
    const docTitle =
      getTextValue(doc.field_titolo_main) || getTextValue(doc.title) || '';
    const docType = getTextValue(doc.field_tipologia_documento);
    const extLinkRaw = doc.field_collegamento_esterno;
    const docLink =
      typeof extLinkRaw === 'string'
        ? extLinkRaw
        : extLinkRaw && typeof extLinkRaw === 'object'
          ? ((extLinkRaw as { uri?: string }).uri ?? null)
          : null;
    const allegato = doc.field_allegato?.entity?.uri?.value ?? null;
    const href = docLink || allegato;
    const imageSrc = getDrupalImageUrl(doc.field_immagine);

    // Installation/maintenance guides go to the maintenance card
    const isGuide =
      docTitle.toLowerCase().includes('install') ||
      docTitle.toLowerCase().includes('manual') ||
      docType?.toLowerCase().includes('guide');
    // "Cosa rende unici" / "what makes unique" goes to hero discover link
    const isDiscover =
      docTitle.toLowerCase().includes('rende unic') ||
      docTitle.toLowerCase().includes('makes unique');

    if (isGuide) {
      if (href) maintenanceGuideHref = href;
    } else if (isDiscover && href) {
      discoverHref = href;
      discoverTitle = docTitle;
      documentItems.push({ title: docTitle, type: docType, imageSrc, href });
    } else {
      documentItems.push({ title: docTitle, type: docType, imageSrc, href });
    }
  }

  // ── Gallery Block data ──
  const galleryImages: ProductGalleryImage[] = gallery
    .map((img) => {
      const src = getDrupalImageUrl(img);
      return src ? { src, alt: `${title ?? ''} gallery` } : null;
    })
    .filter((img): img is ProductGalleryImage => img !== null);

  return (
    <article className="flex flex-col gap-(--spacing-section) pt-(--spacing-navbar) pb-(--spacing-section)">
      {/* ── Hero Block ── */}
      <DevBlockOverlay name="SpecProductHero" status="ds">
        <SpecProductHero
          title={title ?? typedNode.title ?? ''}
          collection={collezione}
          collectionHref={collectionHref}
          description={body ? sanitizeHtml(body) : undefined}
          slides={heroSlides}
          hasSample={typedNode.field_campione ?? false}
          price={heroPrice}
          priceUnit={heroPriceUnit}
          inStock={!noUsaStock}
          shippingWarehouse={!noUsaStock ? 'North America Warehouse' : undefined}
          shippingTime={!noUsaStock ? '2-3 weeks' : undefined}
          discoverUrl={discoverHref}
          isUs={isUs}
        />
      </DevBlockOverlay>

      {/* ── Details Block ── */}
      <DevBlockOverlay name="SpecProductDetails" status="ds">
        <SpecProductDetails attributes={detailAttributes} />
      </DevBlockOverlay>

      {/* ── Specs Block ── */}
      <DevBlockOverlay name="SpecProductSpecs" status="ds">
        <SpecProductSpecs
          specs={specsRows}
          assemblyValue={
            collezioneData?.field_retinatura
              ? formatRetinatura(collezioneData.field_retinatura)
              : undefined
          }
          assemblyImageSrc={
            collezioneData?.field_retinatura
              ? '/images/Retinatura-mosaico-rete.jpg.webp'
              : undefined
          }
          groutingValue={stucchi.length > 0 ? stucchi[0].name : undefined}
          groutingImageSrc={
            stucchi.length > 0
              ? getDrupalImageUrl(
                  (stucchi[0] as Record<string, unknown>).field_immagine,
                )
              : undefined
          }
          groutConsumption={
            isUs
              ? collezioneData?.field_consumo_stucco_sqft != null
                ? `${collezioneData.field_consumo_stucco_sqft} kg/sqft`
                : undefined
              : collezioneData?.field_consumo_stucco_m2 != null
                ? `${collezioneData.field_consumo_stucco_m2} kg/m²`
                : undefined
          }
          maintenanceHtml={maintenanceHtml}
          maintenanceLabel="Maintenance and installation"
          maintenanceGuideHref={maintenanceGuideHref ?? '#'}
          maintenanceGuideLabel="View guide"
        />
      </DevBlockOverlay>

      {/* ── Resources Block ── */}
      <DevBlockOverlay name="SpecProductResources" status="ds">
        <SpecProductResources
          title="Get inspired through catalogs"
          documents={documentItems}
          downloadLabel="Scopri"
        />
      </DevBlockOverlay>

      {/* ── Gallery Block ── */}
      <DevBlockOverlay name="SpecProductGallery" status="ds">
        <SpecProductGallery images={galleryImages} />
      </DevBlockOverlay>
    </article>
  );
}
