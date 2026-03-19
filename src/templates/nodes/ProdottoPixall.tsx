import { getTranslations } from 'next-intl/server';
import { getTextValue, getProcessedText } from '@/lib/field-helpers';
import { getColorSwatch, formatRetinatura } from '@/lib/product-helpers';
import DrupalImage from '@/components_legacy/DrupalImage';
import type { ProdottoPixall as ProdottoPixallType } from '@/types/drupal/products/pixall';
import styles from '@/styles/product.module.css';

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

// ── Component ─────────────────────────────────────────────────────────────────
export default async function ProdottoPixall({ node }: { node: Record<string, unknown> }) {
  // Cast sicuro: il node-resolver passa Record<string,unknown>, ma il contenuto
  // è sempre un ProdottoPixall deserializzato da Drupal JSON:API
  const typedNode = node as ProdottoPixallType;
  const t = await getTranslations('products');
  const tCommon = await getTranslations('common');

  // ── Text fields ──────────────────────────────────────────────────────────────
  const title = getTextValue(typedNode.field_titolo_main) || typedNode.title;
  const body: string | undefined = getProcessedText(typedNode.field_testo_main);
  const composizione = getProcessedText(typedNode.field_composizione);
  const manutenzione = getProcessedText(typedNode.field_manutenzione);

  // ── Dimension fields ─────────────────────────────────────────────────────────
  const dimTesseraMm = typedNode.field_dimensione_tessera_mm ?? null;
  const dimTesseraInch = typedNode.field_dimensione_tessera_inch ?? null;
  const dimFoglioMm = typedNode.field_dimensione_foglio_mm ?? null;
  const dimFoglioInch = typedNode.field_dimensione_foglio_inch ?? null;
  const dimModuli = typedNode.field_dimensione_moduli ?? null;

  // ── Numeric fields ───────────────────────────────────────────────────────────
  const consumoM2 = typedNode.field_consumo_stucco_m2 != null
    ? String(typedNode.field_consumo_stucco_m2)
    : null;
  const consumoSqft = typedNode.field_consumo_stucco_sqft != null
    ? String(typedNode.field_consumo_stucco_sqft)
    : null;

  // ── New attribute fields ─────────────────────────────────────────────────────
  const retinatura = typedNode.field_retinatura ?? undefined;
  const utilizzi = getProcessedText(typedNode.field_utilizzi);
  const numeroModuli = typedNode.field_numero_moduli ?? undefined;

  // ── Taxonomy arrays ──────────────────────────────────────────────────────────
  const colori = typedNode.field_colori ?? [];
  const forme = typedNode.field_forma ?? [];
  const stucchi = typedNode.field_stucco ?? [];

  // ── Media ────────────────────────────────────────────────────────────────────
  const gallery = typedNode.field_gallery ?? [];
  const immagineModuli = typedNode.field_immagine_moduli;

  // ── Documents ────────────────────────────────────────────────────────────────
  const documenti = (typedNode.field_documenti ?? []) as DocItem[];

  // ── Derived flags ────────────────────────────────────────────────────────────
  const hasDimensions = dimTesseraMm || dimTesseraInch || dimFoglioMm || dimFoglioInch || dimModuli;
  const hasConsumption = consumoM2 || consumoSqft;
  const hasSpecifiche = hasDimensions || hasConsumption || retinatura || numeroModuli;

  return (
    <article style={{ maxWidth: '60rem', margin: '0 auto', padding: '2rem' }}>

      {/* ── 1. Title ─────────────────────────────────────────────────────────── */}
      {title && (
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.2 }}>
          {title}
        </h1>
      )}

      {/* ── 2. Main image ────────────────────────────────────────────────────── */}
      <DrupalImage
        field={typedNode.field_immagine}
        alt={title ?? ''}
        aspectRatio="4/3"
        style={{ marginBottom: '2rem' }}
      />

      {/* ── 3. Description ───────────────────────────────────────────────────── */}
      {body ? (
        <div
          style={{ lineHeight: 1.7, marginBottom: '2rem' }}
          dangerouslySetInnerHTML={{ __html: body }}
        />
      ) : null}

      {/* ── 4. Specifiche tecniche ────────────────────────────────────────────── */}
      {hasSpecifiche && (
        <section className={styles.section} aria-labelledby="specifiche-heading">
          <h2 id="specifiche-heading" className={styles.sectionHeading}>
            {t('technicalSpecs')}
          </h2>

          {hasDimensions && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
                gap: '1.25rem',
                marginBottom: (hasConsumption || retinatura || numeroModuli) ? '1.5rem' : 0,
              }}
            >
              {dimTesseraMm && (
                <div>
                  <p className={styles.label}>{t('tileSizeMm')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{dimTesseraMm}</p>
                </div>
              )}
              {dimTesseraInch && (
                <div>
                  <p className={styles.label}>{t('tileSizeInch')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{dimTesseraInch}</p>
                </div>
              )}
              {dimFoglioMm && (
                <div>
                  <p className={styles.label}>{t('sheetSizeMm')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{dimFoglioMm}</p>
                </div>
              )}
              {dimFoglioInch && (
                <div>
                  <p className={styles.label}>{t('sheetSizeInch')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{dimFoglioInch}</p>
                </div>
              )}
              {dimModuli && (
                <div>
                  <p className={styles.label}>{t('moduleSize')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{dimModuli}</p>
                </div>
              )}
            </div>
          )}

          {hasConsumption && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
                gap: '1.25rem',
                marginBottom: (retinatura || numeroModuli) ? '1.5rem' : 0,
              }}
            >
              {consumoM2 && (
                <div>
                  <p className={styles.label}>{t('groutConsumptionM2')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{consumoM2} kg/m²</p>
                </div>
              )}
              {consumoSqft && (
                <div>
                  <p className={styles.label}>{t('groutConsumptionSqft')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{consumoSqft} kg/sqft</p>
                </div>
              )}
            </div>
          )}

          {/* Numero moduli + Retinatura */}
          {(numeroModuli || retinatura) && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
                gap: '1.25rem',
              }}
            >
              {numeroModuli && (
                <div>
                  <p className={styles.label}>{t('modulesPerSheet')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{numeroModuli}</p>
                </div>
              )}
              {retinatura && (
                <div>
                  <p className={styles.label}>{t('backing')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{formatRetinatura(retinatura)}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── 5. Composizione ──────────────────────────────────────────────────── */}
      {composizione && (
        <section className={styles.section} aria-labelledby="composizione-heading">
          <h2 id="composizione-heading" className={styles.sectionHeading}>
            {t('composition')}
          </h2>
          <div
            style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: composizione }}
          />
        </section>
      )}

      {/* ── 5b. Schema moduli ────────────────────────────────────────────────── */}
      {immagineModuli && (
        <section className={styles.section} aria-labelledby="moduli-img-heading">
          <h2 id="moduli-img-heading" className={styles.sectionHeading}>
            {t('modulesSchema')}
          </h2>
          <DrupalImage
            field={immagineModuli}
            alt={`${title ?? ''} — schema moduli`}
            aspectRatio="4/3"
            style={{ maxWidth: '24rem' }}
          />
        </section>
      )}

      {/* ── 5c. Utilizzi consigliati ──────────────────────────────────────────── */}
      {utilizzi && (
        <section className={styles.section} aria-labelledby="utilizzi-heading">
          <h2 id="utilizzi-heading" className={styles.sectionHeading}>
            {t('recommendedUses')}
          </h2>
          <div
            style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: utilizzi }}
          />
        </section>
      )}

      {/* ── 6. Colori e finiture ──────────────────────────────────────────────── */}
      {(colori.length > 0 || retinatura) && (
        <section className={styles.section} aria-labelledby="colori-heading">
          <h2 id="colori-heading" className={styles.sectionHeading}>
            {t('colorsAndFinishes')}
          </h2>

          {colori.length > 0 && (
            <div style={{ marginBottom: retinatura ? '1.25rem' : 0 }}>
              <p className={styles.label}>{t('colors')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {colori.map((c, i) => {
                  const name = c.name ?? '';
                  const swatch = getColorSwatch(name);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'inline-block',
                          width: '1.25rem',
                          height: '1.25rem',
                          borderRadius: '50%',
                          background: swatch,
                          border: '0.0625rem solid rgba(0,0,0,0.12)',
                          flexShrink: 0,
                        }}
                      />
                      {name && (
                        <span style={{ fontSize: '0.875rem', color: '#444' }}>{name}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {retinatura && (
            <div>
              <p className={styles.label}>{t('backing')}</p>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9375rem' }}>
                {formatRetinatura(retinatura)}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── 7. Forma ─────────────────────────────────────────────────────────── */}
      {forme.length > 0 && (
        <section className={styles.section} aria-labelledby="forma-heading">
          <h2 id="forma-heading" className={styles.sectionHeading}>
            {t('shape')}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {forme.map((f, i) => (
              <span
                key={i}
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  padding: '0.25em 0.75em',
                  border: '0.0625rem solid #ccc',
                  color: '#444',
                  lineHeight: 1.5,
                }}
              >
                {f.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── 8. Stucchi consigliati ────────────────────────────────────────────── */}
      {stucchi.length > 0 && (
        <section className={styles.section} aria-labelledby="stucchi-heading">
          <h2 id="stucchi-heading" className={styles.sectionHeading}>
            {t('recommendedGrout')}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {stucchi.map((s, i) => (
              <span
                key={i}
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  padding: '0.25em 0.75em',
                  border: '0.0625rem solid #ccc',
                  color: '#444',
                  lineHeight: 1.5,
                }}
              >
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── 9. Manutenzione ──────────────────────────────────────────────────── */}
      {manutenzione && (
        <section className={styles.section} aria-labelledby="manutenzione-heading">
          <h2 id="manutenzione-heading" className={styles.sectionHeading}>
            {t('maintenance')}
          </h2>
          <div
            style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: manutenzione }}
          />
        </section>
      )}

      {/* ── 10. Documenti ────────────────────────────────────────────────────── */}
      {documenti.length > 0 && (
        <section className={styles.section} aria-labelledby="documenti-heading">
          <h2 id="documenti-heading" className={styles.sectionHeading}>
            {t('documents')}
          </h2>
          <ul className={styles.docList}>
            {documenti.map((doc, i) => {
              const docTitolo = getTextValue(doc.field_titolo_main);
              const docTipologia = getTextValue(doc.field_tipologia_documento);
              // field_collegamento_esterno may be a string URI or an object { uri, title }
              const extLinkRaw = doc.field_collegamento_esterno;
              const docLink =
                typeof extLinkRaw === 'string'
                  ? extLinkRaw
                  : extLinkRaw && typeof extLinkRaw === 'object'
                    ? (extLinkRaw as { uri?: string }).uri ?? null
                    : null;
              const allegato = doc.field_allegato?.entity?.uri?.value ?? null;
              const href = docLink || allegato;

              return (
                <li
                  key={doc.id ?? i}
                  className={styles.docItem}
                >
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
                      <p className={styles.label} style={{ margin: '0 0 0.125rem' }}>{docTipologia}</p>
                    )}
                    {docTitolo && (
                      <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9375rem' }}>
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

      {/* ── 11. Gallery ──────────────────────────────────────────────────────── */}
      {gallery.length > 0 && (
        <section
          className={styles.section}
          style={{ marginBottom: 0 }}
          aria-labelledby="gallery-heading"
        >
          <h2 id="gallery-heading" className={styles.sectionHeading}>
            {t('gallery')}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
              gap: '1rem',
            }}
          >
            {gallery.map((img, i) => (
              <DrupalImage
                key={i}
                field={img}
                alt={`${title ?? ''} ${i + 1}`}
                aspectRatio="1"
              />
            ))}
          </div>
        </section>
      )}

    </article>
  );
}
