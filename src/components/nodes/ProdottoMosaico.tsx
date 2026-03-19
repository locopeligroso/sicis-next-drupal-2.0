import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getTextValue, getProcessedText, getBoolValue } from '@/lib/field-helpers';
import { getColorSwatch, formatRetinatura } from '@/lib/product-helpers';
import DrupalImage from '@/components/DrupalImage';
import type { TermMosaicoCollezione } from '@/types/drupal/entities';
import type { ProdottoMosaico as ProdottoMosaicoType } from '@/types/drupal/products/mosaico';
import styles from '@/styles/product.module.css';

export default async function ProdottoMosaico({ node }: { node: Record<string, unknown> }) {
  // Cast sicuro: il node-resolver passa Record<string,unknown>, ma il contenuto
  // è sempre un ProdottoMosaico deserializzato da Drupal JSON:API
  const typedNode = node as ProdottoMosaicoType;
  const t = await getTranslations('products');
  const tCommon = await getTranslations('common');

  const title = getTextValue(typedNode.field_titolo_main);
  const body = getProcessedText(typedNode.field_testo_main);
  // field_composizione non è nel schema ProdottoMosaico — accesso sicuro via cast
  const composizione = getTextValue((typedNode as Record<string, unknown>).field_composizione);
  const prezzoEu = typedNode.field_prezzo_eu ?? null;
  const prezzoUsa = typedNode.field_prezzo_usa ?? null;
  const prezzoOnDemand = typedNode.field_prezzo_on_demand ?? false;
  const noUsaStock = typedNode.field_no_usa_stock ?? false;
  const collezioneData = typedNode.field_collezione as TermMosaicoCollezione | undefined | null;
  const collezione = collezioneData?.name;
  const locale = typedNode.langcode ?? 'it';
  const forma = Array.isArray(typedNode.field_forma) ? typedNode.field_forma[0]?.name : undefined;
  const finitura = Array.isArray(typedNode.field_finitura) ? typedNode.field_finitura[0]?.name : undefined;
  const colori = typedNode.field_colori ?? [];
  const stucchi = typedNode.field_stucco ?? [];
  const gallery = typedNode.field_gallery ?? [];

  return (
    <article style={{ maxWidth: '60rem', margin: '0 auto', padding: '2rem' }}>
      {title && (
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem' }}>{title}</h1>
      )}

      {/* Main image */}
      <DrupalImage field={typedNode.field_immagine} alt={title ?? ''} aspectRatio="4/3" style={{ marginBottom: '2rem' }} />

      {body && (
        <div style={{ lineHeight: 1.7, marginBottom: '2rem' }} dangerouslySetInnerHTML={{ __html: body }} />
      )}

      {/* Attributes grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))', gap: '1.5rem', marginBottom: '2rem', paddingTop: '1.5rem', borderTop: '0.0625rem solid #eee' }}>
        {forma && (
          <div>
            <p className={styles.label}>{t('shape')}</p>
            <p style={{ margin: 0, fontWeight: 500 }}>{forma}</p>
          </div>
        )}
        {finitura && (
          <div>
            <p className={styles.label}>{t('finish')}</p>
            <p style={{ margin: 0, fontWeight: 500 }}>{finitura}</p>
          </div>
        )}
        {composizione && (
          <div>
            <p className={styles.label}>{t('composition')}</p>
            <p style={{ margin: 0, fontWeight: 500 }}>{composizione}</p>
          </div>
        )}
      </div>

      {/* Collection technical details */}
      {collezioneData && (
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>
            {t('collection')}
          </h2>

          {/* Collection name as link */}
          {collezioneData.path?.alias ? (
            <Link
              href={`/${locale}${collezioneData.path.alias}`}
              style={{ fontSize: '1.125rem', fontWeight: 600, color: 'inherit', textDecoration: 'underline', display: 'inline-block', marginBottom: '1rem' }}
            >
              {collezione}
            </Link>
          ) : (
            <p style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem' }}>{collezione}</p>
          )}

          {/* Collection image */}
          {collezioneData.field_immagine && (
            <DrupalImage
              field={collezioneData.field_immagine}
              alt={collezione ?? ''}
              aspectRatio="16/9"
              style={{ marginBottom: '1.25rem', maxWidth: '24rem' }}
            />
          )}

          {/* Dimensions grid */}
          {(collezioneData.field_dimensione_tessera_mm || collezioneData.field_dimensione_foglio_mm || collezioneData.field_spessore_mm) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {collezioneData.field_dimensione_tessera_mm && (
                <div>
                  <p className={styles.label}>{t('tileSize')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{collezioneData.field_dimensione_tessera_mm}</p>
                </div>
              )}
              {collezioneData.field_dimensione_foglio_mm && (
                <div>
                  <p className={styles.label}>{t('sheetSize')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{collezioneData.field_dimensione_foglio_mm}</p>
                </div>
              )}
              {collezioneData.field_spessore_mm && (
                <div>
                  <p className={styles.label}>{t('thickness')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{collezioneData.field_spessore_mm}</p>
                </div>
              )}
            </div>
          )}

          {/* Retinatura */}
          {collezioneData.field_retinatura && (
            <div style={{ marginBottom: '1.25rem' }}>
              <p className={styles.label}>{t('backing')}</p>
              <p style={{ margin: 0, fontWeight: 500 }}>
                {formatRetinatura(collezioneData.field_retinatura)}
              </p>
            </div>
          )}

          {/* Resistance badges */}
          {(() => {
            const resistances: { key: keyof TermMosaicoCollezione; label: string }[] = [
              { key: 'field_resistenza_gelo', label: t('frostResistance') },
              { key: 'field_resistenza_chimica', label: t('chemicalResistance') },
              { key: 'field_resistenza_luce', label: t('lightResistance') },
              { key: 'field_resistenza_macchie', label: t('stainResistance') },
              { key: 'field_resistenza_sbalzi_termici', label: t('thermalShockResistance') },
              { key: 'field_resistenza_scivolosita', label: t('slipResistance') },
            ];
            const active = resistances.filter(r => collezioneData[r.key] === true);
            if (active.length === 0) return null;
            return (
              <div style={{ marginBottom: '1.25rem' }}>
                <p className={styles.label} style={{ margin: '0 0 0.5rem' }}>{t('resistances')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {active.map(r => (
                    <span
                      key={r.key}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        padding: '0.25em 0.625em',
                        border: '0.0625rem solid #ccc',
                        color: '#444',
                        lineHeight: 1.4,
                      }}
                    >
                      {r.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Water absorption & surface abrasion */}
          {(collezioneData.field_assorbimento_acqua || collezioneData.field_resistenza_abr_superficie) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: '1rem' }}>
              {collezioneData.field_assorbimento_acqua && (
                <div>
                  <p className={styles.label}>{t('waterAbsorption')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{collezioneData.field_assorbimento_acqua}</p>
                </div>
              )}
              {collezioneData.field_resistenza_abr_superficie && (
                <div>
                  <p className={styles.label}>{t('surfaceAbrasion')}</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{collezioneData.field_resistenza_abr_superficie}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Colors with swatches */}
      {colori.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p className={styles.label} style={{ margin: '0 0 0.75rem' }}>{t('colors')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {colori.map((c, i) => {
              const name = c.name ?? '';
              const swatch = getColorSwatch(name);
              const isGradient = swatch.startsWith('linear-gradient');
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
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

      {/* Grouts */}
      {stucchi.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p className={styles.label} style={{ margin: '0 0 0.5rem' }}>{t('grout')}</p>
          <p style={{ margin: 0 }}>{stucchi.map(s => s.name).join(', ')}</p>
        </div>
      )}

      {/* Pricing */}
      <div className={styles.section}>
        {prezzoOnDemand ? (
          <p style={{ fontStyle: 'italic', color: '#666', margin: 0 }}>{t('priceOnDemand')}</p>
        ) : (
          <div style={{ display: 'flex', gap: '2rem' }}>
            {prezzoEu && <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{prezzoEu}€</p>}
            {prezzoUsa && !noUsaStock && <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{prezzoUsa}$</p>}
          </div>
        )}
      </div>

      {/* Utilizzi consigliati (dalla collezione) */}
      {collezioneData?.field_utilizzi && (
        <div className={styles.section}>
          <p className={styles.sectionHeading} style={{ margin: '0 0 0.5rem' }}>{t('recommendedUses')}</p>
          <div style={{ lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: (collezioneData.field_utilizzi as { processed?: string; value?: string }).processed ?? (collezioneData.field_utilizzi as { value?: string }).value ?? '' }} />
        </div>
      )}

      {/* Manutenzione (dalla collezione) */}
      {collezioneData?.field_manutenzione && (
        <div className={styles.section}>
          <p className={styles.sectionHeading} style={{ margin: '0 0 0.5rem' }}>{t('maintenance')}</p>
          <div style={{ lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: (collezioneData.field_manutenzione as { processed?: string; value?: string }).processed ?? (collezioneData.field_manutenzione as { value?: string }).value ?? '' }} />
        </div>
      )}

      {/* Documenti download (dalla collezione) */}
      {(() => {
        const docs = (collezioneData?.field_documenti as Array<{ id?: string; title?: unknown; field_titolo_main?: unknown; field_tipologia_documento?: unknown; field_collegamento_esterno?: unknown; field_immagine?: unknown; field_allegato?: { entity?: { uri?: { value?: string } } } }> | undefined) ?? [];
        if (!docs.length) return null;
        return (
          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t('documents')}</p>
            <ul className={styles.docList}>
              {docs.map((doc, i) => {
                const docTitolo = getTextValue(doc.field_titolo_main) || getTextValue(doc.title);
                const docTipologia = getTextValue(doc.field_tipologia_documento);
                const extLinkRaw = doc.field_collegamento_esterno;
                const docLink = typeof extLinkRaw === 'string' ? extLinkRaw : extLinkRaw && typeof extLinkRaw === 'object' ? (extLinkRaw as { uri?: string }).uri ?? null : null;
                const allegato = doc.field_allegato?.entity?.uri?.value ?? null;
                const href = docLink || allegato;
                return (
                  <li key={doc.id ?? i} className={styles.docItem}>
                    {!!doc.field_immagine && <DrupalImage field={doc.field_immagine} alt={docTitolo ?? ''} aspectRatio="1" style={{ width: '3rem', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {docTipologia && <p className={styles.label} style={{ margin: '0 0 0.125rem' }}>{docTipologia}</p>}
                      {docTitolo && <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9375rem' }}>{docTitolo}</p>}
                    </div>
                    {href && <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem', color: '#333', textDecoration: 'underline', flexShrink: 0 }}>{tCommon('download')}</a>}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })()}

      {/* Gallery */}
      {gallery.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: '1rem', paddingTop: '1.5rem', borderTop: '0.0625rem solid #eee' }}>
          {gallery.map((img, i) => (
            <DrupalImage key={i} field={img} alt={`${title ?? ''} ${i + 1}`} aspectRatio="1" />
          ))}
        </div>
      )}
    </article>
  );
}
