import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import DrupalImage from '@/components_legacy/DrupalImage';
import ParagraphResolver from '@/components_legacy/blocks_legacy/ParagraphResolver';
import { getTextValue, getProcessedText } from '@/lib/field-helpers';
import { getDrupalImageUrl } from '@/lib/drupal/image';
import { DRUPAL_BASE_URL } from '@/lib/drupal/config';
import { sanitizeHtml } from '@/lib/sanitize';
import { getFilterConfig } from '@/domain/filters/registry';
import { DevBlockOverlay } from '@/components/composed/DevBlockOverlay';
import { SpecArredoHero } from '@/components/blocks/SpecArredoHero';
import { GenGallery, type GenGallerySlide } from '@/components/blocks/GenGallery';
import type { BreadcrumbSegment } from '@/components/composed/SmartBreadcrumb';
import styles from '@/styles/product.module.css';
import type { ProdottoArredo as ProdottoArredoType } from '@/types/drupal/entities';

// ── Document item type ────────────────────────────────────────────────────────
interface DocItem {
  id?: string;
  field_titolo_main?: unknown;
  title?: unknown;
  field_tipologia_documento?: unknown;
  field_collegamento_esterno?: unknown;
  field_immagine?: unknown;
  field_allegato?: { entity?: { uri?: { value?: string } } };
}

// ── Finitura type ─────────────────────────────────────────────────────────────
interface FinituraItem {
  id?: string;
  name?: string;
  field_etichetta?: unknown;
  field_testo?: unknown;
  field_immagine?: unknown;
}

// ── REST finiture arredo types (from arredo-product endpoint) ─────────────────
interface FinituraVariant {
  tid: number;
  name: string;
  imageUrl: string | null;
}
interface FinituraTessuto {
  tid: number;
  name: string;
  imageUrl: string | null;
  variants: FinituraVariant[];
}
interface FinituraCategory {
  tid: number;
  name: string;
  items: FinituraTessuto[];
}
interface FinitureArredoField {
  tessutoFiniture: FinituraCategory[];
  arredoFiniture: FinituraCategory[];
}

// ── Scheda tecnica (file--file entity) ────────────────────────────────────────
interface SchedaTecnicaItem {
  id?: string;
  filename?: string;
  uri?: { url?: string; value?: string };
}

// ── Tessuto term ──────────────────────────────────────────────────────────────
interface TessutoItem {
  id?: string;
  name?: string;
  field_immagine?: {
    uri?: { url?: string; value?: string };
    meta?: { alt?: string; width?: number; height?: number };
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default async function ProdottoArredo({
  node,
  slug,
}: {
  node: Record<string, unknown>;
  slug?: string[];
}) {
  // Cast sicuro: il node-resolver passa Record<string,unknown>, ma il contenuto
  // è sempre un ProdottoArredo deserializzato da Drupal JSON:API
  const typedNode = node as ProdottoArredoType;
  const t = await getTranslations('products');
  const tCommon = await getTranslations('common');
  const tNav = await getTranslations('nav');

  const title = getTextValue(typedNode.field_titolo_main) || typedNode.title;
  const body = getProcessedText(typedNode.field_testo_main);
  const materiali = getProcessedText(typedNode.field_materiali);
  const specifiche = getProcessedText(typedNode.field_specifiche_tecniche);
  const locale = typedNode.langcode ?? 'it';

  // ── Arredo base path (needed early for category path fallback) ────────────
  const arredoConfig = getFilterConfig('prodotto_arredo');
  const arredoBasePath = arredoConfig?.basePaths[locale] ?? arredoConfig?.basePaths.it ?? 'arredo';

  // ── Pricing ───────────────────────────────────────────────────────────────
  // field_prezzo_eu/usa in Arredo è { value: string } | null | undefined
  const prezzoEu = typedNode.field_prezzo_eu?.value ?? null;
  const prezzoUsa = typedNode.field_prezzo_usa?.value ?? null;
  const prezzoOnDemand = false; // Arredo non ha field_prezzo_on_demand nel schema

  // ── External link ─────────────────────────────────────────────────────────
  const extLinkRaw = typedNode.field_collegamento_esterno;
  const extLink =
    typeof extLinkRaw === 'string'
      ? extLinkRaw
      : extLinkRaw && typeof extLinkRaw === 'object'
        ? ((extLinkRaw as { uri?: string }).uri ?? null)
        : null;

  // ── 3D file ───────────────────────────────────────────────────────────────
  // field_path_file_ftp non è nel schema Arredo — accesso sicuro via cast
  const ftpFiles = (typedNode as Record<string, unknown>)
    .field_path_file_ftp as string[] | string | undefined;
  const file3d = Array.isArray(ftpFiles) ? ftpFiles[0] : (ftpFiles ?? null);

  // ── Categoria parent ──────────────────────────────────────────────────────
  const categoriaData = typedNode.field_categoria;
  // Category name: from entity fields, or derive from URL slug as fallback
  const categoriaNameFromEntity =
    getTextValue(categoriaData?.field_titolo_main) ||
    ((categoriaData as Record<string, unknown> | undefined)?.title as
      | string
      | undefined) ||
    ((categoriaData as Record<string, unknown> | undefined)?.name as
      | string
      | undefined);
  // slug = ['arredo', 'letti', 'komo-bed'] → slug[1] = 'letti' → 'Letti'
  const categoriaSlug = slug && slug.length >= 3 ? slug[1] : undefined;
  const categoriaNameFromSlug = categoriaSlug
    ? categoriaSlug.charAt(0).toUpperCase() + categoriaSlug.slice(1).replace(/-/g, ' ')
    : undefined;
  const categoriaName = categoriaNameFromEntity || categoriaNameFromSlug;
  const categoriaBody = getProcessedText(categoriaData?.field_testo_main);
  const categoriaAlias = (categoriaData as Record<string, unknown> | undefined)
    ?.path as { alias?: string } | undefined;
  const categoriaPath = categoriaAlias?.alias
    ?? (categoriaSlug ? `/${arredoBasePath}/${categoriaSlug}` : undefined);

  // ── Media ─────────────────────────────────────────────────────────────────
  const gallery = typedNode.field_gallery ?? [];
  const galleryIntro = typedNode.field_gallery_intro ?? [];

  // ── Finiture ──────────────────────────────────────────────────────────────
  const finiture = (typedNode.field_finiture ?? []) as FinituraItem[];

  // ── Documents ─────────────────────────────────────────────────────────────
  const documenti = (typedNode.field_documenti ?? []) as DocItem[];

  // ── Scheda tecnica (file--file entities) ──────────────────────────────────
  const schedeTecniche = (typedNode.field_scheda_tecnica ??
    []) as SchedaTecnicaItem[];

  // ── Finiture from REST endpoint (3-level: category > fabric > variant) ──────
  const finitureArredoField = (typedNode as Record<string, unknown>)
    .field_finiture_arredo as FinitureArredoField | undefined;
  const tessutoFiniture: FinituraCategory[] =
    finitureArredoField?.tessutoFiniture ?? [];
  const arredoFinitureList = finitureArredoField?.arredoFiniture ?? [];
  const finitureHref = (typedNode as Record<string, unknown>)._finitureHref as
    | string
    | undefined;
  const hasFiniture =
    tessutoFiniture.length > 0 || arredoFinitureList.length > 0;

  // ── Hero image ────────────────────────────────────────────────────────────
  const heroImageSrc = getDrupalImageUrl(typedNode.field_immagine);

  // ── Breadcrumb ───────────────────────────────────────────────────────────
  const breadcrumbSegments: BreadcrumbSegment[] = [
    { label: tNav('arredo'), href: `/${locale}/${arredoBasePath}` },
    ...(categoriaName
      ? [{
          label: categoriaName,
          href: categoriaPath ? `/${locale}${categoriaPath}` : `/${locale}/${arredoBasePath}`,
        }]
      : []),
  ];

  // ── Gallery intro slides (carousel subito dopo hero) ───────────────────────
  const galleryIntroSlides = galleryIntro
    .map((img) => {
      const src = getDrupalImageUrl(img);
      return src ? ({ src, alt: `${title ?? ''} gallery` } satisfies GenGallerySlide) : null;
    })
    .filter((s) => s !== null);

  // ── Gallery slides ────────────────────────────────────────────────────────
  const galleryMainSlides = gallery
    .map((img) => {
      const src = getDrupalImageUrl(img);
      return src ? ({ src, alt: `${title ?? ''} gallery` } satisfies GenGallerySlide) : null;
    })
    .filter((s) => s !== null);

  // ── Tessuti (taxonomy terms) — fallback to English if not translated ──────
  const tessutiRaw = (typedNode.field_tessuti ?? []) as TessutoItem[];
  let tessuti = tessutiRaw.filter((t) => t.name);
  if (tessuti.length === 0 && tessutiRaw.length > 0) {
    const stubs = tessutiRaw as Array<{ type?: string; id?: string }>;
    const fetches = stubs
      .filter((s) => s.type && s.id)
      .map(async (s) => {
        const bundle = s.type!.replace('taxonomy_term--', '');
        try {
          const res = await fetch(
            `${DRUPAL_BASE_URL}/en/jsonapi/taxonomy_term/${bundle}/${s.id}?include=field_immagine`,
            {
              headers: { Accept: 'application/vnd.api+json' },
              next: { revalidate: 3600 },
            } as RequestInit,
          );
          if (!res.ok) return null;
          const json = await res.json();
          const name = json?.data?.attributes?.name;
          if (!name) return null;
          // Extract image from included
          const imgRel = json?.data?.relationships?.field_immagine?.data;
          let field_immagine: TessutoItem['field_immagine'] = undefined;
          if (imgRel?.id) {
            const included = (json?.included ?? []) as Array<
              Record<string, unknown>
            >;
            const fileEntity = included.find(
              (inc: Record<string, unknown>) => inc.id === imgRel.id,
            );
            if (fileEntity) {
              const attrs = fileEntity.attributes as
                | Record<string, unknown>
                | undefined;
              field_immagine = {
                uri: attrs?.uri as TessutoItem['field_immagine'] extends {
                  uri?: infer U;
                }
                  ? U
                  : never,
                meta: imgRel.meta as TessutoItem['field_immagine'] extends {
                  meta?: infer M;
                }
                  ? M
                  : never,
              };
            }
          }
          return { id: s.id, name, field_immagine } as TessutoItem;
        } catch {
          return null;
        }
      });
    tessuti = (await Promise.all(fetches)).filter(
      (t): t is TessutoItem => t !== null,
    );
  }

  return (
    <article className="flex flex-col gap-(--spacing-section) pb-(--spacing-section)">
      {/* ── Hero Block (DS) ─────────────────────────────────────────────────── */}
      <DevBlockOverlay name="SpecArredoHero" status="ds">
        <SpecArredoHero
          title={title ?? ''}
          breadcrumbSegments={breadcrumbSegments}
          category={categoriaName ?? undefined}
          categoryHref={categoriaPath ? `/${locale}${categoriaPath}` : undefined}
          description={body ? sanitizeHtml(body) : undefined}
          imageSrc={heroImageSrc}
          priceEu={prezzoEu ?? undefined}
          priceUsa={prezzoUsa ?? undefined}
          isUs={locale === 'us'}
        />
      </DevBlockOverlay>

      {/* ── Gallery Intro (DS) ─────────────────────────────────────────────── */}
      <DevBlockOverlay name="GenGallery" status="ds">
        <GenGallery slides={galleryIntroSlides} />
      </DevBlockOverlay>

      {/* ── 4. Materiali costruttivi ─────────────────────────────────────────── */}
      {materiali && (
        <section className={styles.section} aria-labelledby="materiali-heading">
          <h2 id="materiali-heading" className={styles.sectionHeading}>
            {t('materials')}
          </h2>
          <div
            style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(materiali) }}
          />
        </section>
      )}

      {/* ── 5. Specifiche tecniche / Dimensioni ──────────────────────────────── */}
      {specifiche && (
        <section
          className={styles.section}
          aria-labelledby="specifiche-heading"
        >
          <h2 id="specifiche-heading" className={styles.sectionHeading}>
            {t('dimensionsAndSpecs')}
          </h2>
          <div
            style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(specifiche) }}
          />
        </section>
      )}

      {/* ── 6. Finiture ──────────────────────────────────────────────────────── */}
      {finiture.length > 0 && (
        <section className={styles.section} aria-labelledby="finiture-heading">
          <h2 id="finiture-heading" className={styles.sectionHeading}>
            {t('colorsAndFinishes')}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
              gap: '1rem',
            }}
          >
            {finiture.map((f, i) => {
              const etichetta = getTextValue(f.field_etichetta);
              const testo = getTextValue(f.field_testo);
              return (
                <div
                  key={f.id ?? i}
                  style={{
                    padding: '0.75rem',
                    border: '0.0625rem solid #e0e0e0',
                  }}
                >
                  {!!f.field_immagine && (
                    <DrupalImage
                      field={f.field_immagine}
                      alt={etichetta || f.name || ''}
                      aspectRatio="1"
                      style={{ marginBottom: '0.5rem' }}
                    />
                  )}
                  <p
                    style={{
                      margin: '0 0 0.125rem',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                    }}
                  >
                    {etichetta || f.name}
                  </p>
                  {testo && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.8125rem',
                        color: '#666',
                      }}
                    >
                      {testo}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 6.5. Tessuti (raggruppati per famiglia) ────────────────────────── */}
      {tessuti.length > 0 &&
        (() => {
          // Raggruppa per famiglia: "Oregon – Ash" → famiglia "Oregon", variante "Ash"
          const grouped = new Map<
            string,
            { id?: string; variant: string; imgUrl?: string | null }[]
          >();
          for (const tessuto of tessuti) {
            if (!tessuto.name) continue;
            const sepIdx = tessuto.name.indexOf('–');
            const family =
              sepIdx > 0
                ? tessuto.name.slice(0, sepIdx).trim()
                : tessuto.name.trim();
            const variant =
              sepIdx > 0 ? tessuto.name.slice(sepIdx + 1).trim() : '';
            const imgUrl = tessuto.field_immagine
              ? getDrupalImageUrl(tessuto.field_immagine)
              : null;
            if (!grouped.has(family)) grouped.set(family, []);
            grouped.get(family)!.push({ id: tessuto.id, variant, imgUrl });
          }
          if (grouped.size === 0) return null;
          return (
            <section
              className={styles.section}
              aria-labelledby="tessuti-heading"
            >
              <h2 id="tessuti-heading" className={styles.sectionHeading}>
                {t('fabrics')}
              </h2>
              <div>
                {[...grouped.entries()].map(([family, variants]) => (
                  <div
                    key={family}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.375rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {variants.map((v, i) => (
                      <span
                        key={v.id ?? i}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.75rem 0.25rem 0.25rem',
                          border: '0.0625rem solid #ccc',
                          fontSize: '0.8125rem',
                          color: '#333',
                        }}
                      >
                        {v.imgUrl && (
                          <img
                            src={v.imgUrl}
                            alt={
                              v.variant ? `${family} – ${v.variant}` : family
                            }
                            width={28}
                            height={28}
                            style={{
                              borderRadius: '0.125rem',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        {v.variant ? `${family} – ${v.variant}` : family}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

      {/* ── 6.6. Finiture CTA — link alla pagina finiture dedicata ────────────── */}
      {hasFiniture && finitureHref && (
        <section
          className={styles.section}
          aria-labelledby="finiture-cta-heading"
        >
          <h2 id="finiture-cta-heading" className={styles.sectionHeading}>
            {t('finishes')}
          </h2>
          <Link
            href={finitureHref}
            style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              padding: '0.625rem 1.25rem',
              border: '0.0625rem solid #111',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#111',
              textDecoration: 'none',
              letterSpacing: '0.03em',
            }}
          >
            {t('viewAllFinishes')} →
          </Link>
        </section>
      )}

      {/* ── 8. Categoria parent ──────────────────────────────────────────────── */}
      {categoriaData && (
        <section className={styles.section} aria-labelledby="categoria-heading">
          <h2 id="categoria-heading" className={styles.sectionHeading}>
            {t('category')}
          </h2>
          {categoriaName &&
            (categoriaPath ? (
              <Link
                href={`/${locale}${categoriaPath}`}
                style={{
                  fontWeight: 600,
                  fontSize: '1.125rem',
                  color: '#111',
                  textDecoration: 'none',
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                {categoriaName}
              </Link>
            ) : (
              <p
                style={{
                  fontWeight: 600,
                  fontSize: '1.125rem',
                  margin: '0 0 0.5rem',
                }}
              >
                {categoriaName}
              </p>
            ))}
          <DrupalImage
            field={(categoriaData as Record<string, unknown>).field_immagine}
            alt={categoriaName ?? ''}
            aspectRatio="16/9"
            style={{ maxWidth: '20rem', marginBottom: '0.75rem' }}
          />
          {categoriaBody && (
            <div
              style={{ lineHeight: 1.7, color: '#555' }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(categoriaBody) }}
            />
          )}
        </section>
      )}

      {/* ── Gallery (DS) ─────────────────────────────────────────────────── */}
      <DevBlockOverlay name="GenGallery" status="ds">
        <GenGallery slides={galleryMainSlides} />
      </DevBlockOverlay>

      {/* ── 10. Documenti download ───────────────────────────────────────────── */}
      {documenti.length > 0 && (
        <section className={styles.section} aria-labelledby="documenti-heading">
          <h2 id="documenti-heading" className={styles.sectionHeading}>
            {t('documents')}
          </h2>
          <ul className={styles.docList}>
            {documenti.map((doc, i) => {
              const docTitolo =
                getTextValue(doc.field_titolo_main) || getTextValue(doc.title);
              const docTipologia = getTextValue(doc.field_tipologia_documento);
              const extLinkRaw2 = doc.field_collegamento_esterno;
              const docLink =
                typeof extLinkRaw2 === 'string'
                  ? extLinkRaw2
                  : extLinkRaw2 && typeof extLinkRaw2 === 'object'
                    ? ((extLinkRaw2 as { uri?: string }).uri ?? null)
                    : null;
              const allegato = doc.field_allegato?.entity?.uri?.value ?? null;
              const href = docLink || allegato;
              return (
                <li key={doc.id ?? i} className={styles.docItem}>
                  {!!doc.field_immagine && (
                    <DrupalImage
                      field={doc.field_immagine}
                      alt={docTitolo ?? ''}
                      aspectRatio="1"
                      style={{ width: '3rem', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {docTipologia && (
                      <p
                        className={styles.label}
                        style={{ margin: '0 0 0.125rem' }}
                      >
                        {docTipologia}
                      </p>
                    )}
                    {docTitolo && (
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 500,
                          fontSize: '0.9375rem',
                        }}
                      >
                        {docTitolo}
                      </p>
                    )}
                  </div>
                  {href && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${tCommon('download')} ${docTitolo ?? 'documento'}`}
                      style={{
                        fontSize: '0.8125rem',
                        color: '#333',
                        textDecoration: 'underline',
                        flexShrink: 0,
                      }}
                    >
                      {tCommon('download')}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── 11. Scheda tecnica + File 3D + link esterno ──────────────────────── */}
      {(schedeTecniche.length > 0 || file3d || extLink) && (
        <section
          className={styles.section}
          style={{ marginBottom: 0 }}
          aria-labelledby="extra-heading"
        >
          <h2 id="extra-heading" className={styles.sectionHeading}>
            {t('linksAndResources')}
          </h2>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            {schedeTecniche.map((scheda, i) => {
              const href = getDrupalImageUrl(scheda);
              const label = scheda.filename || t('technicalSheet');
              return href ? (
                <a
                  key={scheda.id ?? i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${tCommon('download')} ${label}`}
                  style={{
                    fontSize: '0.875rem',
                    color: '#333',
                    textDecoration: 'underline',
                  }}
                >
                  {label}
                </a>
              ) : null;
            })}
            {file3d && (
              <a
                href={`/sites/default/files/${file3d}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.875rem',
                  color: '#333',
                  textDecoration: 'underline',
                }}
              >
                {t('download3dFile')}
              </a>
            )}
            {extLink && (
              <a
                href={extLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.875rem',
                  color: '#333',
                  textDecoration: 'underline',
                }}
              >
                {t('viewOn1stDibs')}
              </a>
            )}
          </div>
        </section>
      )}

      {/* ── Paragraph blocks (Gen) ─────────────────────────────────────────── */}
      {(
        (typedNode.field_blocchi as Record<string, unknown>[] | undefined) ?? []
      ).map((p, i) => (
        <ParagraphResolver
          key={(p.id as string) ?? i}
          paragraph={p}
          pageTitle={title ?? undefined}
        />
      ))}
    </article>
  );
}
