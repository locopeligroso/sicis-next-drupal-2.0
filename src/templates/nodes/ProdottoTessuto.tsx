import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import DrupalImage from '@/components_legacy/DrupalImage';
import { getDrupalImageUrl } from '@/lib/drupal/image';
import { getTextValue, getProcessedText } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';
import styles from '@/styles/product.module.css';
import type { ProdottoTessuto as ProdottoTessutoType } from '@/types/drupal/entities';

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

// ── Finitura tessuto type ─────────────────────────────────────────────────────
interface FinituraItem {
  id?: string;
  name?: string;
  field_codice_colore?: unknown;
  field_etichetta?: unknown;
  field_testo?: unknown;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default async function ProdottoTessuto({
  node,
}: {
  node: Record<string, unknown>;
}) {
  // Cast sicuro: il node-resolver passa Record<string,unknown>, ma il contenuto
  // è sempre un ProdottoTessuto deserializzato da Drupal JSON:API
  const typedNode = node as ProdottoTessutoType;
  const t = await getTranslations('products');
  const tCommon = await getTranslations('common');

  const title = getTextValue(typedNode.field_titolo_main) || typedNode.title;
  const body = getProcessedText(typedNode.field_testo_main);
  const locale = typedNode.langcode ?? 'it';

  // ── Attribute fields (on node, no include needed) ─────────────────────────
  const altezzaCm = typedNode.field_altezza_cm ?? null;
  const altezzaInch = typedNode.field_altezza_inch ?? null;
  const peso = typedNode.field_peso ?? null;
  // field_composizione non è nel schema ProdottoTessuto — accesso sicuro via cast
  const composizione = getProcessedText(
    (typedNode as Record<string, unknown>).field_composizione,
  );
  const utilizzo = typedNode.field_utilizzo ?? undefined;
  const densitaAnnodatura = typedNode.field_densita_annodatura ?? null;
  const dimensioniCm = typedNode.field_dimensioni_cm ?? null;
  const dimensioniInch = typedNode.field_dimensioni_inch ?? null;
  const spessore = typedNode.field_spessore ?? null;

  // ── Pricing ───────────────────────────────────────────────────────────────
  // field_prezzo_eu/usa su Tessuto sono string | null (non { value } wrapper)
  const prezzoEu = typedNode.field_prezzo_eu ?? null;
  const prezzoUsa = typedNode.field_prezzo_usa ?? null;

  // ── Taxonomy arrays ───────────────────────────────────────────────────────
  const colori = typedNode.field_colori ?? [];
  // field_finiture_tessuto and field_tipologia_tessuto have cardinality=1 in Drupal
  // → deserialized as single object, not array. Normalize to array.
  const finiture = (
    Array.isArray(typedNode.field_finiture_tessuto)
      ? typedNode.field_finiture_tessuto
      : typedNode.field_finiture_tessuto
        ? [typedNode.field_finiture_tessuto]
        : []
  ) as FinituraItem[];
  const tipologie = (
    Array.isArray(typedNode.field_tipologia_tessuto)
      ? typedNode.field_tipologia_tessuto
      : typedNode.field_tipologia_tessuto
        ? [typedNode.field_tipologia_tessuto]
        : []
  ) as Array<{ name?: string }>;
  const manutenzione = typedNode.field_indicazioni_manutenzione ?? [];

  // ── Categoria parent ──────────────────────────────────────────────────────
  const categoriaData = typedNode.field_categoria;
  const categoriaName =
    getTextValue(categoriaData?.field_titolo_main) ||
    ((categoriaData as Record<string, unknown> | undefined)?.title as
      | string
      | undefined);
  const categoriaBody = getProcessedText(categoriaData?.field_testo_main);
  const categoriaAlias = (categoriaData as Record<string, unknown> | undefined)
    ?.path as { alias?: string } | undefined;
  const categoriaPath = categoriaAlias?.alias;

  // ── Media ─────────────────────────────────────────────────────────────────
  const gallery = typedNode.field_gallery ?? [];
  const galleryIntro = typedNode.field_gallery_intro ?? [];

  // ── Documents ─────────────────────────────────────────────────────────────
  const documenti = (typedNode.field_documenti ?? []) as DocItem[];

  // ── Derived ───────────────────────────────────────────────────────────────
  const hasDimensions =
    altezzaCm ||
    altezzaInch ||
    peso ||
    densitaAnnodatura ||
    dimensioniCm ||
    dimensioniInch ||
    spessore;
  const tipologiaLabel = tipologie
    .map((t) => t.name)
    .filter(Boolean)
    .join(' · ');

  return (
    <article>
      {/* ── 1. Title + tipologia ─────────────────────────────────────────────── */}
      {title && (
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
      )}
      {tipologiaLabel && (
        <p
          style={{
            fontSize: '0.875rem',
            color: '#888',
            margin: '0 0 1.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {tipologiaLabel}
        </p>
      )}

      {/* ── 2. Colori (pill badges) ──────────────────────────────────────────── */}
      {colori.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {colori.map((c, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.8125rem',
                padding: '0.25em 0.75em',
                border: '0.0625rem solid #ccc',
                color: '#444',
                lineHeight: 1.5,
              }}
            >
              {c.name}
            </span>
          ))}
        </div>
      )}

      {/* ── 3. Main image ────────────────────────────────────────────────────── */}
      <DrupalImage
        field={typedNode.field_immagine_anteprima}
        alt={title ?? ''}
        aspectRatio="4/3"
        style={{ marginBottom: '2rem' }}
      />

      {/* ── 4. Composizione tessile ──────────────────────────────────────────── */}
      {composizione && (
        <section
          className={styles.section}
          aria-labelledby="composizione-heading"
        >
          <h2 id="composizione-heading" className={styles.sectionHeading}>
            {t('composition')}
          </h2>
          <div
            style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(composizione) }}
          />
        </section>
      )}

      {/* ── 5. Specifiche tecniche (altezza, peso, utilizzo) ─────────────────── */}
      {(hasDimensions || utilizzo) && (
        <section
          className={styles.section}
          aria-labelledby="specifiche-heading"
        >
          <h2 id="specifiche-heading" className={styles.sectionHeading}>
            {t('technicalSpecs')}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
              gap: '1.25rem',
            }}
          >
            {altezzaCm && (
              <div>
                <p className={styles.label}>{t('heightCm')}</p>
                <div
                  style={{ margin: 0, fontWeight: 500 }}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(String(altezzaCm)),
                  }}
                />
              </div>
            )}
            {altezzaInch && (
              <div>
                <p className={styles.label}>{t('heightInch')}</p>
                <div
                  style={{ margin: 0, fontWeight: 500 }}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(String(altezzaInch)),
                  }}
                />
              </div>
            )}
            {peso && (
              <div>
                <p className={styles.label}>{t('weightGm2')}</p>
                <div
                  style={{ margin: 0, fontWeight: 500 }}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(String(peso)),
                  }}
                />
              </div>
            )}
            {utilizzo && (
              <div>
                <p className={styles.label}>{t('usage')}</p>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}
                >
                  {utilizzo}
                </p>
              </div>
            )}
            {densitaAnnodatura && (
              <div>
                <p className={styles.label}>{t('knottingDensity')}</p>
                <p style={{ margin: 0, fontWeight: 500 }}>
                  {densitaAnnodatura}
                </p>
              </div>
            )}
            {dimensioniCm && (
              <div>
                <p className={styles.label}>{t('dimensions')} (cm)</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{dimensioniCm}</p>
              </div>
            )}
            {dimensioniInch && (
              <div>
                <p className={styles.label}>{t('dimensions')} (inch)</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{dimensioniInch}</p>
              </div>
            )}
            {spessore && (
              <div>
                <p className={styles.label}>{t('thickness')}</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{spessore}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 6. Prezzi ────────────────────────────────────────────────────────── */}
      {(prezzoEu || prezzoUsa) && (
        <section className={styles.section} aria-labelledby="prezzo-heading">
          <h2 id="prezzo-heading" className={styles.sectionHeading}>
            {t('price')}
          </h2>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'baseline' }}>
            {prezzoEu && (
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                {Number(prezzoEu).toLocaleString('it-IT')}€
              </p>
            )}
            {prezzoUsa && (
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                {Number(prezzoUsa).toLocaleString('en-US')}$
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── 7. Categoria parent ──────────────────────────────────────────────── */}
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
                  marginBottom: '0.75rem',
                }}
              >
                {categoriaName}
              </Link>
            ) : (
              <p
                style={{
                  fontWeight: 600,
                  fontSize: '1.125rem',
                  margin: '0 0 0.75rem',
                }}
              >
                {categoriaName}
              </p>
            ))}
          <DrupalImage
            field={(categoriaData as Record<string, unknown>).field_immagine}
            alt={categoriaName ?? ''}
            aspectRatio="16/9"
            style={{ marginBottom: '0.75rem', maxWidth: '24rem' }}
          />
          {categoriaBody && (
            <div
              style={{ lineHeight: 1.7, color: '#444' }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(categoriaBody) }}
            />
          )}
        </section>
      )}

      {/* ── 7. Finiture tessuto ──────────────────────────────────────────────── */}
      {finiture.length > 0 && (
        <section className={styles.section} aria-labelledby="finiture-heading">
          <h2 id="finiture-heading" className={styles.sectionHeading}>
            {t('finishes')}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
              gap: '1rem',
            }}
          >
            {finiture.map((f, i) => {
              const codice = getTextValue(f.field_codice_colore);
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
                  {codice && (
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'block',
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        background: codice.startsWith('#')
                          ? codice
                          : `#${codice}`,
                        border: '0.0625rem solid rgba(0,0,0,0.12)',
                        marginBottom: '0.5rem',
                      }}
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

      {/* ── 8. Gallery ───────────────────────────────────────────────────────── */}
      {(gallery.length > 0 || galleryIntro.length > 0) && (
        <section className={styles.section} aria-labelledby="gallery-heading">
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
            {[...galleryIntro, ...gallery].map((img, i) => (
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

      {/* ── 9. Indicazioni manutenzione ──────────────────────────────────────── */}
      {manutenzione.length > 0 && (
        <section
          className={styles.section}
          aria-labelledby="manutenzione-heading"
        >
          <h2 id="manutenzione-heading" className={styles.sectionHeading}>
            {t('maintenanceInstructions')}
          </h2>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            {manutenzione.map((m, i) => {
              const imgUrl = getDrupalImageUrl(
                (m as Record<string, unknown>).field_immagine,
              );
              return (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8125rem',
                    padding: '0.375rem 0.75rem',
                    border: '0.0625rem solid #e0e0e0',
                    color: '#444',
                    lineHeight: 1.4,
                  }}
                >
                  {imgUrl && (
                    <img
                      src={imgUrl}
                      alt=""
                      style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        objectFit: 'contain',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {m.name}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── 10. Documenti ────────────────────────────────────────────────────── */}
      {documenti.length > 0 && (
        <section
          className={styles.section}
          style={{ marginBottom: 0 }}
          aria-labelledby="documenti-heading"
        >
          <h2 id="documenti-heading" className={styles.sectionHeading}>
            {t('documents')}
          </h2>
          <ul className={styles.docList}>
            {documenti.map((doc, i) => {
              const docTitolo = getTextValue(doc.field_titolo_main);
              const docTipologia = getTextValue(doc.field_tipologia_documento);
              const extLinkRaw = doc.field_collegamento_esterno;
              const docLink =
                typeof extLinkRaw === 'string'
                  ? extLinkRaw
                  : extLinkRaw && typeof extLinkRaw === 'object'
                    ? ((extLinkRaw as { uri?: string }).uri ?? null)
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

      {/* ── Testo descrittivo (body) ─────────────────────────────────────────── */}
      {body && (
        <section className={styles.section} aria-labelledby="body-heading">
          <h2 id="body-heading" className={styles.sectionHeading}>
            {t('description')}
          </h2>
          <div
            style={{ lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
          />
        </section>
      )}
    </article>
  );
}
