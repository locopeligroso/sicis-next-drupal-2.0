/**
 * ProdottoTessuto — DS template (100% migrated 2026-04-06)
 *
 * DS blocks:
 *  - Hero: SpecTextileHero (variant picker carousel + swatches) when variants
 *    present (Tessuti 69 + Arazzi 12 = 81/150), else SpecArredoHero fallback
 *    (Tappeti/Cuscini/Coperte: no hero image until Freddi exposes
 *    field_immagine_anteprima in REST)
 *  - GenGallery intro + main (conditional)
 *  - SpecProductTechnicalArea: cards = Composizione (auto-detects label/value
 *    pattern in HTML) + Specifiche fisiche (key-value list) + Manutenzione
 *    (tooltip icons)
 *  - SpecProductResources: documents (conditional)
 *
 * Notes:
 *  - field_tipologia_tessuto is filter-only (listing), not shown in detail
 *  - field_prezzo_eu/usa always null for tessuto (not rendered)
 *  - field_immagine_anteprima not in REST (TODO Freddi)
 *  - ParagraphResolver not included (field_blocchi not in REST endpoint yet,
 *    will be added when Freddi enriches the endpoint)
 *
 * Data flow: page.tsx → fetchTextileProduct → TextileProduct (normalized)
 *   → ProdottoTessuto({ product, slug, locale }) (no legacy adapter)
 */
import { getTranslations } from 'next-intl/server';
import { getFilterConfig } from '@/domain/filters/registry';
import { sanitizeHtml } from '@/lib/sanitize';
import { SpecArredoHero } from '@/components/blocks/SpecArredoHero';
import {
  SpecTextileHero,
  type TextileHeroVariant,
} from '@/components/blocks/SpecTextileHero';
import { GenGallery, type GenGallerySlide } from '@/components/blocks/GenGallery';
import { SpecProductResources } from '@/components/blocks/SpecProductResources';
import {
  SpecProductTechnicalArea,
  type TechnicalAreaSpecsItem,
  type TechnicalAreaMaintenanceItem,
} from '@/components/blocks/SpecProductTechnicalArea';
import type { DocumentCardItem } from '@/components/composed/DocumentCard';
import { PageBreadcrumb } from '@/components/composed/PageBreadcrumb';
import { DevBlockOverlay } from '@/components/composed/DevBlockOverlay';
import { QuoteSheetProvider } from '@/components/composed/QuoteSheetProvider';
import type { TextileProduct } from '@/lib/api/textile-product';

// ── Component ────────────────────────────────────────────────────────────────

export default async function ProdottoTessuto({
  product,
  slug,
  locale,
}: {
  product: TextileProduct;
  slug?: string[];
  locale: string;
}) {
  const t = await getTranslations('products');

  // ── Tessuto base path for category link ──────────────────────────────────
  const tessutoConfig = getFilterConfig('prodotto_tessuto');
  const tessutoBasePath =
    tessutoConfig?.basePaths[locale] ??
    tessutoConfig?.basePaths.it ??
    'prodotti-tessili';

  // slug = ['tessile', 'arazzi', 'chardin'] → slug[1] = 'arazzi' (category slug)
  const categoriaSlug = slug && slug.length >= 3 ? slug[1] : undefined;
  const categoryHref = categoriaSlug
    ? `/${locale}/${tessutoBasePath}/${categoriaSlug}`
    : undefined;

  // ── Breadcrumb (slot pattern) ────────────────────────────────────────────
  const breadcrumb = slug && slug.length > 0 ? (
    <PageBreadcrumb
      slug={slug}
      locale={locale}
      lastLabel={product.title}
    />
  ) : null;

  // ── Gallery slides ────────────────────────────────────────────────────────
  const galleryIntroSlides: GenGallerySlide[] = product.galleryIntro.map((img) => ({
    src: img.url,
    alt: `${product.title} gallery`,
    width: img.width ?? 1200,
    height: img.height ?? 800,
  }));

  const galleryMainSlides: GenGallerySlide[] = product.gallery.map((img) => ({
    src: img.url,
    alt: `${product.title} gallery`,
    width: img.width ?? 1200,
    height: img.height ?? 800,
  }));

  // ── Document items ───────────────────────────────────────────────────────
  const documentItems: DocumentCardItem[] = product.documents.map((doc) => ({
    title: doc.title,
    image: doc.image,
    href: doc.href,
  }));

  // ── Physical specs key-value items (strip HTML, combine cm/inch pairs) ───
  const stripHtml = (v: string | null) =>
    v
      ? v
          .replace(/<[^>]*>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .trim()
      : null;

  const joinUnits = (cm: string | null, inch: string | null) => {
    const a = stripHtml(cm);
    const b = stripHtml(inch);
    if (a && b) return `${a} cm · ${b}″`;
    if (a) return `${a} cm`;
    if (b) return `${b}″`;
    return null;
  };

  const specsItems: TechnicalAreaSpecsItem[] = [
    { label: t('dimensions'), value: joinUnits(product.dimensionsCm, product.dimensionsInch) },
    { label: t('height'), value: joinUnits(product.heightCm, product.heightInch) },
    { label: t('weight'), value: stripHtml(product.weight) },
    { label: t('thickness'), value: stripHtml(product.thickness) },
    { label: t('knottingDensity'), value: stripHtml(product.knottingDensity) },
    { label: t('usage'), value: product.usage },
  ].filter((x): x is TechnicalAreaSpecsItem => !!x.value);

  // ── Maintenance items (taxonomy icons) ───────────────────────────────────
  const maintenanceItems: TechnicalAreaMaintenanceItem[] = product.maintenance.map((m) => ({
    name: m.name,
    image: m.image,
  }));

  // ── Textile variants (from finiture 2-level: flatten children of first category) ──
  // Verified: 81/150 products have finiture (Tessuti + Arazzi), each with 1 category.
  // All variants within a product share same image aspect ratio.
  const variants: TextileHeroVariant[] =
    product.finiture[0]?.children.map((v) => ({
      name: v.name,
      colorCode: v.colorCode,
      colorName: v.colorName,
      image: v.image,
      composition: v.text,
    })) ?? [];

  return (
    <QuoteSheetProvider productName={product.title}>
      <article className="flex flex-col gap-(--spacing-section) pb-(--spacing-section)">
        {/* ── Hero Block (DS) ─────────────────────────────────────────────── */}
        {variants.length > 0 ? (
          <DevBlockOverlay name="SpecTextileHero" status="ds">
            <SpecTextileHero
              title={product.title}
              breadcrumb={breadcrumb}
              category={product.category?.title}
              categoryHref={categoryHref}
              description={product.body ? sanitizeHtml(product.body) : undefined}
              variants={variants}
            />
          </DevBlockOverlay>
        ) : (
          <DevBlockOverlay name="SpecArredoHero" status="ds">
            <SpecArredoHero
              title={product.title}
              breadcrumb={breadcrumb}
              category={product.category?.title}
              categoryHref={categoryHref}
              description={product.body ? sanitizeHtml(product.body) : undefined}
            />
          </DevBlockOverlay>
        )}

        {/* ── Gallery Intro (DS) ──────────────────────────────────────────── */}
        {galleryIntroSlides.length > 0 && (
          <DevBlockOverlay name="GenGallery" status="ds">
            <GenGallery slides={galleryIntroSlides} />
          </DevBlockOverlay>
        )}

        {/* ── Technical Area (DS) — Composizione + Specs + Manutenzione ── */}
        {(product.composition || specsItems.length > 0 || maintenanceItems.length > 0) && (
          <DevBlockOverlay name="SpecProductTechnicalArea" status="ds">
            <SpecProductTechnicalArea
              title={t('technicalArea')}
              materialsHtml={product.composition ? sanitizeHtml(product.composition) : undefined}
              materialsLabel={t('composition')}
              specsItems={specsItems}
              specsItemsLabel={t('dimensionsAndSpecs')}
              maintenanceItems={maintenanceItems}
              maintenanceLabel={t('maintenance')}
              finitureLinkLabel={t('viewAllFinishes')}
              finishesLabel={t('finishes')}
              resourcesLabel={t('resources')}
            />
          </DevBlockOverlay>
        )}

        {/* ── Gallery Main (DS) ───────────────────────────────────────────── */}
        {galleryMainSlides.length > 0 && (
          <DevBlockOverlay name="GenGallery" status="ds">
            <GenGallery slides={galleryMainSlides} />
          </DevBlockOverlay>
        )}

        {/* ── Documents (DS) ──────────────────────────────────────────────── */}
        {documentItems.length > 0 && (
          <DevBlockOverlay name="SpecProductResources" status="ds">
            <SpecProductResources title={t('exploreCatalogs')} documents={documentItems} />
          </DevBlockOverlay>
        )}
      </article>
    </QuoteSheetProvider>
  );
}
