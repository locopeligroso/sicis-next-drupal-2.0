/**
 * ProdottoTessuto — HYBRID DS + INSPECTOR (DS migration in progress)
 *
 * TOP SECTION (DS blocks — migrated):
 *  - Hero: SpecTextileHero (variant picker carousel + swatches) if variants
 *    are present (Tessuti + Arazzi = 81/150), else SpecArredoHero fallback
 *    (no hero image — field_immagine_anteprima not exposed by REST yet)
 *  - GenGallery intro (conditional)
 *  - SpecProductTechnicalArea: cards = Composizione + Specifiche fisiche +
 *    Manutenzione (conditional per card)
 *  - GenGallery main (conditional)
 *  - SpecProductResources: documents (conditional)
 *
 * BOTTOM SECTION (Inspector — debug only):
 *  Hardcoded labels highlighted fluo yellow to distinguish from API data.
 *  Debug sections: NID/category/prices (always-null) + JSON dump.
 *  Note: field_tipologia_tessuto is filter-only (listing), not shown in detail.
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

// ── Inspector helpers ────────────────────────────────────────────────────────

/** Hardcoded label highlight — fluorescent yellow to distinguish from API data */
function Hc({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-yellow-300 text-black px-0.5 rounded-sm">{children}</span>
  );
}

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function Field({
  name,
  value,
  type,
}: {
  name: string;
  value: unknown;
  type?: string;
}) {
  const empty = isEmpty(value);
  return (
    <div className="py-2 border-b border-border/40">
      <div className="flex items-baseline gap-3 text-xs font-mono">
        <Hc>{name}</Hc>
        {type && <Hc>[{type}]</Hc>}
        {empty && <span className="text-[0.6875rem] ml-auto"><Hc>NULL / EMPTY</Hc></span>}
      </div>
      {!empty && (
        <div className="mt-1 text-sm font-mono text-foreground break-words">
          {typeof value === 'string' || typeof value === 'number'
            ? String(value)
            : <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}

function Html({ name, html }: { name: string; html: string | null }) {
  const empty = isEmpty(html);
  return (
    <div className="py-2 border-b border-border/40">
      <div className="flex items-baseline gap-3 text-xs font-mono">
        <Hc>{name}</Hc>
        <Hc>[html]</Hc>
        {empty && <span className="text-[0.6875rem] ml-auto"><Hc>NULL / EMPTY</Hc></span>}
      </div>
      {!empty && html && (
        <>
          <pre className="mt-1 text-xs font-mono text-muted-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded max-h-32 overflow-auto">{html}</pre>
          <div className="mt-2 text-sm [&_p]:m-0 [&_p+p]:mt-2" dangerouslySetInnerHTML={{ __html: html }} />
        </>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number | string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 py-4 border-t-2 border-border">
      <h2 className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2">
        <Hc>{title}</Hc>
        {count !== undefined && (
          <span className="text-xs font-normal"><Hc>({count})</Hc></span>
        )}
      </h2>
      {children}
    </section>
  );
}

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
              // no imageSrc: tessuti senza varianti non hanno hero image (TODO Freddi)
              // no priceEu/Usa: always null for tessuto
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

        {/* ── 🚧 INSPECTOR MODE — remaining sections to be migrated ───────── */}
        <section className="max-w-main mx-auto w-full px-(--spacing-page) flex flex-col gap-2">
          <div className="border-2 border-dashed border-yellow-500 rounded p-4 bg-yellow-500/5">
            <div className="text-sm font-mono font-bold uppercase tracking-wider mb-4">
              <Hc>🚧 TO BE MIGRATED — Inspector mode</Hc>
            </div>

            {/* ── Identità debug ── */}
            <Section title="Identità (debug)">
              <Field name="nid" type="number" value={product.nid} />
              <Field name="category" type="object" value={product.category} />
            </Section>

            {/* ── Prezzi (always null) ── */}
            <Section title="Prezzi (sempre null, bloccato da Freddi)">
              <Field name="priceEu" type="string|null" value={product.priceEu} />
              <Field name="priceUsa" type="string|null" value={product.priceUsa} />
            </Section>

            {/* ── JSON Dump ── */}
            <Section title="JSON completo (TextileProduct normalizzato)">
              <details>
                <summary className="text-xs font-mono cursor-pointer">
                  <Hc>Espandi</Hc>
                </summary>
                <pre className="mt-2 text-[0.6875rem] font-mono bg-muted/30 p-3 rounded max-h-96 overflow-auto">
                  {JSON.stringify(product, null, 2)}
                </pre>
              </details>
            </Section>
          </div>
        </section>
      </article>
    </QuoteSheetProvider>
  );
}
