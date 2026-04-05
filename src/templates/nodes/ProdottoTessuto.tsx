/**
 * ProdottoTessuto — HYBRID DS + INSPECTOR (DS migration in progress)
 *
 * TOP SECTION (DS blocks — migrated):
 *  - SpecArredoHero: title, category, body description, breadcrumb
 *    (no hero image — field_immagine_anteprima not exposed by REST yet)
 *    (no price — field_prezzo_* always null for tessuto)
 *  - GenGallery intro (conditional)
 *  - SpecProductTechnicalArea: composizione HTML (conditional, card = composition)
 *  - GenGallery main (conditional)
 *  - SpecProductResources: documents (conditional)
 *
 * BOTTOM SECTION (Inspector — to be migrated):
 *  Hardcoded labels highlighted fluo yellow to distinguish from API data.
 *  Remaining sections: tipologie, specifiche fisiche,
 *  finiture 2-level, manutenzione, JSON dump.
 */
import { getTranslations } from 'next-intl/server';
import { getFilterConfig } from '@/domain/filters/registry';
import { sanitizeHtml } from '@/lib/sanitize';
import { SpecArredoHero } from '@/components/blocks/SpecArredoHero';
import { GenGallery, type GenGallerySlide } from '@/components/blocks/GenGallery';
import { SpecProductResources } from '@/components/blocks/SpecProductResources';
import { SpecProductTechnicalArea } from '@/components/blocks/SpecProductTechnicalArea';
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

function Thumb({ url, width, height, alt }: { url: string; width?: number | null; height?: number | null; alt?: string }) {
  return (
    <div className="flex flex-col gap-1 text-xs font-mono">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt ?? ''} className="size-24 object-cover rounded border border-border" loading="lazy" />
      <span className="text-[0.625rem]">{width ?? <Hc>?</Hc>}<Hc>×</Hc>{height ?? <Hc>?</Hc>}</span>
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

  return (
    <QuoteSheetProvider productName={product.title}>
      <article className="flex flex-col gap-(--spacing-section) pb-(--spacing-section)">
        {/* ── Hero Block (DS) ─────────────────────────────────────────────── */}
        <DevBlockOverlay name="SpecArredoHero" status="ds">
          <SpecArredoHero
            title={product.title}
            breadcrumb={breadcrumb}
            category={product.category?.title}
            categoryHref={categoryHref}
            description={product.body ? sanitizeHtml(product.body) : undefined}
            // no imageSrc: field_immagine_anteprima not in REST yet (TODO Freddi)
            // no priceEu/Usa: always null for tessuto (TODO clarify with Freddi)
          />
        </DevBlockOverlay>

        {/* ── Gallery Intro (DS) ──────────────────────────────────────────── */}
        {galleryIntroSlides.length > 0 && (
          <DevBlockOverlay name="GenGallery" status="ds">
            <GenGallery slides={galleryIntroSlides} />
          </DevBlockOverlay>
        )}

        {/* ── Technical Area: Composizione (DS) ──────────────────────────── */}
        {product.composition && (
          <DevBlockOverlay name="SpecProductTechnicalArea" status="ds">
            <SpecProductTechnicalArea
              title={t('technicalArea')}
              materialsHtml={sanitizeHtml(product.composition)}
              materialsLabel={t('composition')}
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

            {/* ── Physical specs ── */}
            <Section title="Specifiche fisiche">
              <Field name="dimensionsCm" type="string|null" value={product.dimensionsCm} />
              <Field name="dimensionsInch" type="string|null" value={product.dimensionsInch} />
              <Field name="heightCm" type="string|null" value={product.heightCm} />
              <Field name="heightInch" type="string|null" value={product.heightInch} />
              <Field name="weight" type="string|null" value={product.weight} />
              <Field name="thickness" type="string|null" value={product.thickness} />
              <Field name="knottingDensity" type="string|null" value={product.knottingDensity} />
              <Field name="usage" type="string|null" value={product.usage} />
            </Section>

            {/* ── Typologies ── */}
            <Section title="Tipologie" count={product.typologies.length}>
              {product.typologies.length === 0 ? (
                <div className="text-xs font-mono"><Hc>NESSUNA TIPOLOGIA</Hc></div>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {product.typologies.map((typ) => (
                    <li key={typ.tid} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      <Hc>tid {typ.tid}:</Hc> {typ.name}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* ── Finiture (2-level) ── */}
            <Section title="Finiture tessuto" count={product.finiture.length}>
              {product.finiture.length === 0 ? (
                <div className="text-xs font-mono"><Hc>NESSUNA FINITURA</Hc></div>
              ) : (
                <div className="flex flex-col gap-4">
                  {product.finiture.map((cat) => (
                    <div key={cat.tid} className="border border-border rounded p-3">
                      <div className="text-xs font-mono mb-2">
                        <Hc>Categoria:</Hc> {cat.name}{' '}
                        <Hc>(tid {cat.tid})</Hc>{' '}
                        <Hc>— {cat.children.length} varianti</Hc>
                      </div>
                      {cat.children.length === 0 ? (
                        <div className="text-xs font-mono"><Hc>NESSUNA VARIANTE</Hc></div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {cat.children.map((v) => (
                            <div key={v.tid} className="flex flex-col gap-1 text-xs font-mono border border-border/40 rounded p-2">
                              <div className="flex items-center gap-2">
                                {v.colorCode && (
                                  <span
                                    className="size-6 rounded border border-border shrink-0"
                                    style={{ backgroundColor: v.colorCode }}
                                    title={v.colorCode}
                                  />
                                )}
                                <span className="font-bold">{v.name}</span>
                              </div>
                              {v.image && (
                                <Thumb url={v.image.url} width={v.image.width} height={v.image.height} alt={v.name} />
                              )}
                              <div className="text-[0.625rem] flex flex-col gap-0.5">
                                <span><Hc>tid:</Hc> {v.tid}</span>
                                {v.colorCode && <span><Hc>hex:</Hc> {v.colorCode}</span>}
                                {v.colorName && <span><Hc>colore ref:</Hc> {v.colorName}</span>}
                                {v.label && <span><Hc>etichetta:</Hc> {v.label}</span>}
                                {v.text && <span className="truncate max-w-40"><Hc>text:</Hc> {v.text.slice(0, 50)}...</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* ── Maintenance ── */}
            <Section title="Indicazioni manutenzione" count={product.maintenance.length}>
              {product.maintenance.length === 0 ? (
                <div className="text-xs font-mono"><Hc>NESSUNA INDICAZIONE</Hc></div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {product.maintenance.map((m) => (
                    <div key={m.tid} className="flex flex-col items-center gap-1 text-xs font-mono max-w-32">
                      {m.image ? (
                        <Thumb url={m.image.url} width={m.image.width} height={m.image.height} alt={m.name} />
                      ) : (
                        <div className="size-24 bg-muted rounded border border-border flex items-center justify-center text-[0.625rem]">
                          <Hc>NO IMG</Hc>
                        </div>
                      )}
                      <span className="text-center text-[0.6875rem]">{m.name}</span>
                      <span className="text-[0.625rem]"><Hc>tid {m.tid}</Hc></span>
                    </div>
                  ))}
                </div>
              )}
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
