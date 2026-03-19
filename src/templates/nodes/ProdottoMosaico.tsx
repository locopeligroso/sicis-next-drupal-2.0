import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getTextValue, getProcessedText, getBoolValue } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';
import { getColorSwatch, formatRetinatura } from '@/lib/product-helpers';
import { getDrupalImageUrl } from '@/lib/drupal';
import DrupalImage from '@/components_legacy/DrupalImage';
import styles from '@/styles/product.module.css';
import type { ProdottoMosaico as ProdottoMosaicoType } from '@/types/drupal/entities';

export default async function ProdottoMosaico({ node }: { node: Record<string, unknown> }) {
  // Cast sicuro: il node-resolver passa Record<string,unknown>, ma il contenuto
  // è sempre un ProdottoMosaico deserializzato da Drupal JSON:API
  const typedNode = node as ProdottoMosaicoType;
  const t = await getTranslations('products');
  const tCommon = await getTranslations('common');

  const collezioneData = typedNode.field_collezione;
  const collezione = collezioneData?.name;
  const locale = typedNode.langcode ?? 'it';

  // ── Product fields with collection fallback ──
  // Product-level values override collection-level values when present.
  const title = getTextValue(typedNode.field_titolo_main);
  const body = getProcessedText(typedNode.field_testo_main)
    || getProcessedText(collezioneData?.field_testo)
    || null;
  const composizione = getTextValue(typedNode.field_composizione);
  const prezzoEu = typedNode.field_prezzo_eu ?? null;
  const prezzoUsa = typedNode.field_prezzo_usa ?? null;
  const prezzoOnDemand = typedNode.field_prezzo_on_demand ?? false;
  const noUsaStock = typedNode.field_no_usa_stock ?? false;
  const forma = Array.isArray(typedNode.field_forma) ? typedNode.field_forma[0]?.name : undefined;
  const finitura = Array.isArray(typedNode.field_finitura) ? typedNode.field_finitura[0]?.name : undefined;
  const colori = typedNode.field_colori ?? [];
  const stucchi = typedNode.field_stucco ?? [];
  const gallery = typedNode.field_gallery ?? [];

  return (
    <article style={{ maxWidth: '60rem', margin: '0 auto', padding: '2rem' }}>
      {/* Category label */}
      {typedNode.field_categoria && (() => {
        const cat = typedNode.field_categoria as Record<string, unknown>;
        const catTitle = (cat.title as string) ?? '';
        const catPath = (cat.path as { alias?: string })?.alias;
        if (!catTitle) return null;
        return catPath ? (
          <Link href={`/${locale}${catPath}`} style={{ fontSize: '0.8125rem', color: '#888', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-block', marginBottom: '0.5rem' }}>
            {catTitle}
          </Link>
        ) : (
          <p style={{ fontSize: '0.8125rem', color: '#888', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{catTitle}</p>
        );
      })()}

      {title && (
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{title}</h1>
      )}

      {/* Collection subtitle in hero */}
      {collezione && (
        <h2 style={{ fontSize: '1.125rem', fontWeight: 400, color: '#666', marginBottom: '1.5rem' }}>{collezione}</h2>
      )}

      {/* Main image */}
      <DrupalImage field={typedNode.field_immagine} alt={title ?? ''} aspectRatio="4/3" style={{ marginBottom: '2rem' }} />

      {/* Sample image */}
      {typedNode.field_immagine_campione ? (
        <div style={{ marginBottom: '2rem' }}>
          <p className={styles.label} style={{ margin: '0 0 0.5rem' }}>{t('sampleFormat')}</p>
          <DrupalImage field={typedNode.field_immagine_campione} alt={`${title ?? ''} - campione`} aspectRatio="1" style={{ maxWidth: '12rem' }} />
        </div>
      ) : null}

      {body && (
        <div style={{ lineHeight: 1.7, marginBottom: '2rem' }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }} />
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
          {collezioneData.field_immagine ? (
            <DrupalImage
              field={collezioneData.field_immagine}
              alt={collezione ?? ''}
              aspectRatio="16/9"
              style={{ marginBottom: '1.25rem', maxWidth: '24rem' }}
            />
          ) : null}

          {/* Technical specifications table */}
          {(() => {
            const boolLabel = (v: unknown) => v === true ? '✓' : v === false ? '✗' : null;
            const rows: { label: string; value: string | null }[] = [
              // Dimensions
              { label: t('tileSizeMm'), value: collezioneData.field_dimensione_tessera_mm ? `${collezioneData.field_dimensione_tessera_mm}${collezioneData.field_dimensione_tessera_inch ? ` (${collezioneData.field_dimensione_tessera_inch})` : ''}` : null },
              { label: t('sheetSizeMm'), value: collezioneData.field_dimensione_foglio_mm ? `${collezioneData.field_dimensione_foglio_mm}${collezioneData.field_dimensione_foglio_inch ? ` (${collezioneData.field_dimensione_foglio_inch})` : ''}` : null },
              { label: t('thicknessMm'), value: collezioneData.field_spessore_mm ? `${collezioneData.field_spessore_mm}${collezioneData.field_spessore_inch ? ` (${collezioneData.field_spessore_inch})` : ''}` : null },
              // Backing & grout
              { label: t('backing'), value: collezioneData.field_retinatura ? formatRetinatura(collezioneData.field_retinatura) : null },
              { label: t('groutConsumptionM2'), value: collezioneData.field_consumo_stucco_m2 != null ? `${collezioneData.field_consumo_stucco_m2} kg/m²${collezioneData.field_consumo_stucco_sqft != null ? ` (${collezioneData.field_consumo_stucco_sqft} sqft)` : ''}` : null },
              // Technical data with values
              { label: t('leadContent'), value: boolLabel(collezioneData.field_contenuto_piombo) },
              { label: t('waterAbsorption'), value: collezioneData.field_assorbimento_acqua ?? null },
              { label: t('lightResistance'), value: boolLabel(collezioneData.field_resistenza_luce) },
              { label: t('chemicalResistance'), value: boolLabel(collezioneData.field_resistenza_chimica) },
              { label: t('thermalExpansion'), value: collezioneData.field_espansione_termica ?? null },
              { label: t('thermalShockResistance'), value: boolLabel(collezioneData.field_resistenza_sbalzi_termici) },
              { label: t('frostResistance'), value: boolLabel(collezioneData.field_resistenza_gelo) },
              { label: t('surfaceAbrasion'), value: collezioneData.field_resistenza_abr_superficie ?? null },
              { label: t('massAbrasion'), value: collezioneData.field_resistenza_abr_massa ?? null },
              { label: t('stainResistance'), value: boolLabel(collezioneData.field_resistenza_macchie) },
              { label: t('slipResistance'), value: boolLabel(collezioneData.field_resistenza_scivolosita) },
              { label: t('slipResistanceGrip'), value: boolLabel(collezioneData.field_resistenza_scivol_perc) },
            ].filter(r => r.value !== null);

            if (rows.length === 0) return null;
            return (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem' }}>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem 0.75rem 0.5rem 0', fontSize: '0.8125rem', color: '#555', verticalAlign: 'top' }}>{r.label}</td>
                      <td style={{ padding: '0.5rem 0', fontWeight: 500, fontSize: '0.875rem' }}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </section>
      )}

      {/* Colors with swatches + Drupal images */}
      {colori.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p className={styles.label} style={{ margin: '0 0 0.75rem' }}>{t('colors')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {colori.map((c, i) => {
              const name = c.name ?? '';
              const colorImgUrl = getDrupalImageUrl((c as Record<string, unknown>).field_immagine);
              const swatch = getColorSwatch(name);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {colorImgUrl ? (
                    <img src={colorImgUrl} alt={name} style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', objectFit: 'cover', border: '0.0625rem solid rgba(0,0,0,0.12)', flexShrink: 0 }} />
                  ) : (
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
                  )}
                  {name && (
                    <span style={{ fontSize: '0.875rem', color: '#444' }}>{name}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grouts with swatch images */}
      {stucchi.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p className={styles.label} style={{ margin: '0 0 0.75rem' }}>{t('grout')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {stucchi.map((s, i) => {
              const stuccoImg = getDrupalImageUrl((s as Record<string, unknown>).field_immagine);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {stuccoImg && (
                    <img src={stuccoImg} alt={s.name ?? ''} style={{ width: '2rem', height: '2rem', borderRadius: '50%', objectFit: 'cover', border: '0.0625rem solid rgba(0,0,0,0.12)', flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: '0.875rem' }}>{s.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className={styles.section}>
        {prezzoOnDemand ? (
          <p style={{ fontStyle: 'italic', color: '#666', margin: 0 }}>{t('priceOnDemand')}</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {prezzoEu && <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{prezzoEu}€</p>}
            {!noUsaStock && (typedNode.field_prezzo_usa_sheet || typedNode.field_prezzo_usa_sqft) && (
              <div>
                {typedNode.field_prezzo_usa_sheet && (
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{typedNode.field_prezzo_usa_sheet}$ <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#666' }}>/ sheet</span></p>
                )}
                {typedNode.field_prezzo_usa_sqft && (
                  <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#666' }}>{typedNode.field_prezzo_usa_sqft}$ <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>/ sqft</span></p>
                )}
              </div>
            )}
          </div>
        )}
        {typedNode.field_campione && (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', color: '#555' }}>{t('sampleFormat')}: ✓</p>
        )}
        {noUsaStock && (
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#999' }}>{t('noUsaStock')}</p>
        )}
      </div>

      {/* Category */}
      {typedNode.field_categoria && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p className={styles.label} style={{ margin: '0 0 0.5rem' }}>{t('category')}</p>
          {(typedNode.field_categoria as Record<string, unknown>)?.path ? (
            <Link
              href={`/${locale}${((typedNode.field_categoria as Record<string, unknown>).path as { alias?: string })?.alias ?? ''}`}
              style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 500 }}
            >
              {((typedNode.field_categoria as Record<string, unknown>).title as string) ?? ''}
            </Link>
          ) : (
            <p style={{ margin: 0, fontWeight: 500 }}>{((typedNode.field_categoria as Record<string, unknown>).title as string) ?? ''}</p>
          )}
        </div>
      )}

      {/* Video */}
      {(() => {
        const videoUrl = getDrupalImageUrl(typedNode.field_video);
        if (!videoUrl) return null;
        return (
          <div style={{ marginBottom: '1.5rem' }}>
            <p className={styles.label} style={{ margin: '0 0 0.5rem' }}>Video</p>
            <video controls style={{ width: '100%', maxWidth: '40rem' }} src={videoUrl} />
          </div>
        );
      })()}

      {/* Utilizzi consigliati (dalla collezione) */}
      {collezioneData?.field_utilizzi && (
        <div className={styles.section}>
          <p className={styles.sectionHeading} style={{ margin: '0 0 0.5rem' }}>{t('recommendedUses')}</p>
          <div style={{ lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml((collezioneData.field_utilizzi as { processed?: string; value?: string }).processed ?? (collezioneData.field_utilizzi as { value?: string }).value ?? '') }} />
        </div>
      )}

      {/* Manutenzione (dalla collezione) */}
      {collezioneData?.field_manutenzione && (
        <div className={styles.section}>
          <p className={styles.sectionHeading} style={{ margin: '0 0 0.5rem' }}>{t('maintenance')}</p>
          <div style={{ lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml((collezioneData.field_manutenzione as { processed?: string; value?: string }).processed ?? (collezioneData.field_manutenzione as { value?: string }).value ?? '') }} />
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
      {/* ══════════════════════════════════════════════════════════════════
          HARDCODED CONTENT REFERENCE
          Content found on sicis.com (GLOBAL + US) not yet in this template.
          To be integrated when building Composed/Block components.
          Source: Drupal | Hardcoded (messages) | Static (asset) | Route | Logic
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{ marginTop: '3rem', padding: '1.5rem', background: '#fffbe6', border: '1px solid #e6d88a' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#8a7a2a' }}>⚠ Contenuti da integrare (riferimento sicis.com)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e6d88a', textAlign: 'left' }}>
              <th style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Elemento</th>
              <th style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Contenuto</th>
              <th style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Fonte</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Breadcrumb</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Mosaico &gt; Tinte unite &gt; Bianchi &gt; 550 Barrels</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Route</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Toggle immagine/video</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>&quot;principale&quot; / &quot;play video&quot;</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Hardcoded</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>CTA &quot;Richiedi informazioni&quot;</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Bottone che apre form modale contatto</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Hardcoded</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>CTA &quot;Request Sample&quot; (US)</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Bottone richiesta campione</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Hardcoded</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>CTA &quot;Get a Quote&quot; (US)</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Bottone richiesta preventivo</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Hardcoded</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Tab sezioni</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>&quot;Scheda tecnica&quot; / &quot;Download&quot; / &quot;Alternative&quot;</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Hardcoded</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Valori boolean</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>&quot;resistenti&quot; / &quot;assente&quot; (ora ✓/✗)</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Hardcoded</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Label unità prezzo</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>&quot;/ sheet&quot;, &quot;/ sqft&quot;, &quot;Starting at&quot;</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Hardcoded</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Label &quot;Video&quot;</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Intestazione sezione video</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Hardcoded</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Prodotti alternativi</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Carousel ~32 prodotti correlati (richiede query separata)</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Drupal (query)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Form richiesta informazioni</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Email, Nome, Cognome, Nazione, Professione, Richiesta, Privacy</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Hardcoded</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Stock status (US)</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>&quot;In stock&quot; + &quot;North America Warehouse&quot; (campo US-specific, non in Drupal stage)</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Drupal (US)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Quality badge (US)</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Immagine certificazione qualità USA</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Static</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>&quot;Discover what makes our Mosaic Unique&quot; (US)</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Link a PDF informativo</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Static</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Toggle unità metriche/imperiali</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>mm vs inches in base alla regione</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Logic</td>
            </tr>
            <tr>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Layout regionale</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>GLOBAL: no prezzo, 1 CTA / US: prezzo, 2 CTA, stock</td>
              <td style={{ padding: '0.4rem 0.5rem', color: '#333' }}>Logic</td>
            </tr>
          </tbody>
        </table>
      </section>
    </article>
  );
}
