import type { CSSProperties } from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import DrupalImage from '@/components_legacy/DrupalImage';
import { getTextValue, getProcessedText } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';
import styles from '@/styles/product.module.css';
import type { ProdottoVetrite as ProdottoVetriteType } from '@/types/drupal/entities';

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

// ── Labeled value helper ──────────────────────────────────────────────────────
function LabeledValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className={styles.label}>{label}</p>
      <p style={{ margin: 0, fontWeight: 500 }}>{value}</p>
    </div>
  );
}

// ── HTML block helper ─────────────────────────────────────────────────────────
function HtmlBlock({ html, style }: { html: string; style?: CSSProperties }) {
  return (
    <div
      style={{ lineHeight: 1.7, ...style }}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default async function ProdottoVetrite({ node }: { node: Record<string, unknown> }) {
  // Cast sicuro: il node-resolver passa Record<string,unknown>, ma il contenuto
  // è sempre un ProdottoVetrite deserializzato da Drupal JSON:API
  const typedNode = node as ProdottoVetriteType;
  const t = await getTranslations('products');
  const tCommon = await getTranslations('common');

  const title = getTextValue(typedNode.field_titolo_main) || typedNode.title;
  const locale = typedNode.langcode ?? 'it';

  // ── Collezione parent ─────────────────────────────────────────────────────
  const collezioneData = typedNode.field_collezione;
  const collezione = collezioneData?.name;

  // ── Testo descrittivo con fallback alla collezione ────────────────────────
  const bodyProduct = getProcessedText(typedNode.field_testo_main);
  const bodyCollezione = getProcessedText(collezioneData?.field_testo);
  const body = bodyProduct || bodyCollezione; // fallback: se il prodotto non ha testo, usa quello della collezione

  // ── Taxonomy arrays ───────────────────────────────────────────────────────
  const colori = typedNode.field_colori ?? [];
  const finiture = typedNode.field_finiture ?? [];
  const texture = typedNode.field_texture ?? [];

  // ── Pricing ───────────────────────────────────────────────────────────────
  // field_prezzo_eu/usa in Vetrite è { value: string } | null | undefined
  const prezzoEu = typedNode.field_prezzo_eu?.value ?? null;
  const prezzoUsa = typedNode.field_prezzo_usa?.value ?? null;
  const prezzoOnDemand = typedNode.field_prezzo_on_demand ?? false;
  const noUsaStock = typedNode.field_no_usa_stock ?? false;

  // ── Media ─────────────────────────────────────────────────────────────────
  const gallery = typedNode.field_gallery ?? [];

  // ── Collezione — campi tecnici ────────────────────────────────────────────
  const collDimensioniCm = collezioneData?.field_dimensioni_cm;
  const collDimensioniInch = collezioneData?.field_dimensioni_inch;
  const collDimensioniExtraCm = collezioneData?.field_dimensioni_extra_cm;
  const collDimensioniExtraInch = collezioneData?.field_dimensioni_extra_inch;
  const collSpessoreMm = collezioneData?.field_spessore_mm;
  const collSpessoreInch = collezioneData?.field_spessore_inch;
  const collSpessoreExtraMm = collezioneData?.field_spessore_extra_mm;
  const collSpessoreExtraInch = collezioneData?.field_spessore_extra_inch;
  const collFormatoCampione = collezioneData?.field_formato_campione;
  const collTrattamenti = getProcessedText(collezioneData?.field_trattamenti_extra);
  const collLastreSpeciali = getProcessedText(collezioneData?.field_lastre_speciali);
  const collVetriSpeciali = getProcessedText(collezioneData?.field_vetri_speciali);
  const collUtilizzi = getProcessedText(collezioneData?.field_utilizzi);
  const collManutenzione = getProcessedText(collezioneData?.field_manutenzione);
  const collDocumenti = (collezioneData?.field_documenti as DocItem[] | undefined) ?? [];

  // ── Dimensioni prodotto (override collezione) ─────────────────────────────
  const prodDimensioniCm = typedNode.field_dimensioni_cm ?? undefined;
  const prodDimensioniInch = typedNode.field_dimensioni_inch ?? undefined;
  const prodPatternCm = typedNode.field_dimensione_pattern_cm ?? undefined;
  const prodPatternInch = typedNode.field_dimensione_pattern_inch ?? undefined;
  const prodFormatoCampione = typedNode.field_formato_campione ?? undefined;

  const dimCm = prodDimensioniCm || collDimensioniCm;
  const dimInch = prodDimensioniInch || collDimensioniInch;
  const formatoCampione = prodFormatoCampione || collFormatoCampione;

  const hasDimensions = dimCm || dimInch || collDimensioniExtraCm || collDimensioniExtraInch
    || collSpessoreMm || collSpessoreInch || collSpessoreExtraMm || collSpessoreExtraInch
    || prodPatternCm || prodPatternInch || formatoCampione;

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

      {/* ── 3. Testo descrittivo (prodotto o fallback collezione) ─────────────── */}
      {body && (
        <div style={{ lineHeight: 1.7, marginBottom: '2rem', color: bodyProduct ? '#333' : '#555' }}>
          <HtmlBlock html={body} />
          {!bodyProduct && bodyCollezione && (
            <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.5rem', fontStyle: 'italic' }}>
              Descrizione della collezione {collezione}
            </p>
          )}
        </div>
      )}

      {/* ── 4. Sezione collezione ─────────────────────────────────────────────── */}
      {collezioneData && (
        <section className={styles.section} aria-labelledby="collezione-heading">
          <h2 id="collezione-heading" className={styles.sectionHeading}>{t('collection')}</h2>

          {collezione && (
            collezioneData.path?.alias ? (
              <Link
                href={`/${locale}${collezioneData.path.alias}`}
                style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}
              >
                {collezione}
              </Link>
            ) : (
              <p style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem' }}>{collezione}</p>
            )
          )}

          {collezioneData.field_immagine ? (
            <DrupalImage
              field={collezioneData.field_immagine}
              alt={collezione ?? ''}
              aspectRatio="16/9"
              style={{ marginBottom: '1.25rem', maxWidth: '24rem' }}
            />
          ) : null}
        </section>
      )}

      {/* ── 5. Spessori ──────────────────────────────────────────────────────── */}
      {(collSpessoreMm || collSpessoreInch || collSpessoreExtraMm || collSpessoreExtraInch) && (
        <section className={styles.section} aria-labelledby="spessori-heading">
          <h2 id="spessori-heading" className={styles.sectionHeading}>{t('thickness')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: '1.25rem' }}>
            {collSpessoreMm && <LabeledValue label={t('thicknessMm')} value={collSpessoreMm} />}
            {collSpessoreInch && <LabeledValue label={t('thicknessInch')} value={collSpessoreInch} />}
            {collSpessoreExtraMm && <LabeledValue label={t('thicknessExtraMm')} value={collSpessoreExtraMm} />}
            {collSpessoreExtraInch && <LabeledValue label={t('thicknessExtraInch')} value={collSpessoreExtraInch} />}
          </div>
        </section>
      )}

      {/* ── 6. Dimensioni lastra ─────────────────────────────────────────────── */}
      {hasDimensions && (
        <section className={styles.section} aria-labelledby="dimensioni-heading">
          <h2 id="dimensioni-heading" className={styles.sectionHeading}>{t('slabDimensions')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: '1.25rem' }}>
            {dimCm && <LabeledValue label={t('dimensionsCm')} value={dimCm} />}
            {dimInch && <LabeledValue label={t('dimensionsInch')} value={dimInch} />}
            {collDimensioniExtraCm && <LabeledValue label={t('dimensionsExtraCm')} value={collDimensioniExtraCm} />}
            {collDimensioniExtraInch && <LabeledValue label={t('dimensionsExtraInch')} value={collDimensioniExtraInch} />}
            {prodPatternCm && <LabeledValue label={t('patternCm')} value={prodPatternCm} />}
            {prodPatternInch && <LabeledValue label={t('patternInch')} value={prodPatternInch} />}
            {formatoCampione && <LabeledValue label={t('sampleFormat')} value={formatoCampione} />}
          </div>
        </section>
      )}

      {/* ── 7. Trattamenti extra ─────────────────────────────────────────────── */}
      {collTrattamenti && (
        <section className={styles.section} aria-labelledby="trattamenti-heading">
          <h2 id="trattamenti-heading" className={styles.sectionHeading}>{t('extraTreatments')}</h2>
          <HtmlBlock html={collTrattamenti} />
        </section>
      )}

      {/* ── 8. Lastre speciali ───────────────────────────────────────────────── */}
      {collLastreSpeciali && (
        <section className={styles.section} aria-labelledby="lastre-heading">
          <h2 id="lastre-heading" className={styles.sectionHeading}>{t('specialSlabs')}</h2>
          <HtmlBlock html={collLastreSpeciali} />
        </section>
      )}

      {/* ── 9. Vetri speciali ────────────────────────────────────────────────── */}
      {collVetriSpeciali && (
        <section className={styles.section} aria-labelledby="vetri-heading">
          <h2 id="vetri-heading" className={styles.sectionHeading}>{t('specialGlass')}</h2>
          <HtmlBlock html={collVetriSpeciali} />
        </section>
      )}

      {/* ── 10. Finiture ─────────────────────────────────────────────────────── */}
      {finiture.length > 0 && (
        <section className={styles.section} aria-labelledby="finiture-heading">
          <h2 id="finiture-heading" className={styles.sectionHeading}>{t('finishes')}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {finiture.map((f, i) => (
              <span
                key={i}
                style={{ fontSize: '0.875rem', fontWeight: 500, padding: '0.25em 0.75em', border: '0.0625rem solid #ccc', color: '#444', lineHeight: 1.5 }}
              >
                {f.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── 11. Colori ───────────────────────────────────────────────────────── */}
      {(colori.length > 0 || texture.length > 0) && (
        <section className={styles.section} aria-labelledby="colori-heading">
          <h2 id="colori-heading" className={styles.sectionHeading}>{t('colors')}</h2>
          {colori.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: texture.length > 0 ? '1rem' : 0 }}>
              {colori.map((c, i) => (
                <span key={i} style={{ fontSize: '0.875rem', padding: '0.25em 0.75em', border: '0.0625rem solid #ccc', color: '#444', lineHeight: 1.5 }}>
                  {c.name}
                </span>
              ))}
            </div>
          )}
          {texture.length > 0 && (
            <div>
              <p className={styles.label}>{t('texture')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {texture.map((t, i) => (
                  <span key={i} style={{ fontSize: '0.875rem', padding: '0.25em 0.75em', border: '0.0625rem solid #ccc', color: '#444', lineHeight: 1.5 }}>
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── 12. Utilizzi consigliati ─────────────────────────────────────────── */}
      {collUtilizzi && (
        <section className={styles.section} aria-labelledby="utilizzi-heading">
          <h2 id="utilizzi-heading" className={styles.sectionHeading}>{t('recommendedUses')}</h2>
          <HtmlBlock html={collUtilizzi} />
        </section>
      )}

      {/* ── 13. Manutenzione ─────────────────────────────────────────────────── */}
      {collManutenzione && (
        <section className={styles.section} aria-labelledby="manutenzione-heading">
          <h2 id="manutenzione-heading" className={styles.sectionHeading}>{t('maintenance')}</h2>
          <HtmlBlock html={collManutenzione} />
        </section>
      )}

      {/* ── 14. Prezzi ───────────────────────────────────────────────────────── */}
      {(prezzoEu || prezzoUsa || prezzoOnDemand) && (
        <section className={styles.section} aria-labelledby="prezzo-heading">
          <h2 id="prezzo-heading" className={styles.sectionHeading}>{t('price')}</h2>
          {prezzoOnDemand ? (
            <p style={{ fontStyle: 'italic', color: '#666', margin: 0 }}>{t('priceOnDemand')}</p>
          ) : (
            <div style={{ display: 'flex', gap: '2rem' }}>
              {prezzoEu && <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{prezzoEu}€</p>}
              {prezzoUsa && !noUsaStock && <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{prezzoUsa}$</p>}
            </div>
          )}
        </section>
      )}

      {/* ── 15. Documenti ────────────────────────────────────────────────────── */}
      {collDocumenti.length > 0 && (
        <section className={styles.section} aria-labelledby="documenti-heading">
          <h2 id="documenti-heading" className={styles.sectionHeading}>{t('documents')}</h2>
          <ul className={styles.docList}>
            {collDocumenti.map((doc, i) => {
              const docTitolo = getTextValue(doc.field_titolo_main);
              const docTipologia = getTextValue(doc.field_tipologia_documento);
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
                    <DrupalImage field={doc.field_immagine} alt={docTitolo ?? ''} aspectRatio="1" style={{ width: '3rem', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {docTipologia && <p className={styles.label} style={{ margin: '0 0 0.125rem' }}>{docTipologia}</p>}
                    {docTitolo && <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9375rem' }}>{docTitolo}</p>}
                  </div>
                  {href && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${tCommon('download')} ${docTitolo ?? 'documento'}`}
                      style={{ fontSize: '0.8125rem', color: '#333', textDecoration: 'underline', flexShrink: 0 }}
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

      {/* ── 16. Gallery ──────────────────────────────────────────────────────── */}
      {gallery.length > 0 && (
        <section className={styles.section} style={{ marginBottom: 0 }} aria-labelledby="gallery-heading">
          <h2 id="gallery-heading" className={styles.sectionHeading}>{t('gallery')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: '1rem' }}>
            {gallery.map((img, i) => (
              <DrupalImage key={i} field={img} alt={`${title ?? ''} ${i + 1}`} aspectRatio="1" />
            ))}
          </div>
        </section>
      )}

    </article>
  );
}
