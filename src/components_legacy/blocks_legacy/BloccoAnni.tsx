import { getProcessedText } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';
import { getDrupalImageUrl, fetchParagraph } from '@/lib/drupal';

interface ElementoBloccoAnni {
  field_anno?: string;
  field_testo?: { processed?: string; value?: string };
  field_immagine?: Record<string, unknown>;
  [key: string]: unknown;
}

export default async function BloccoAnni({ paragraph }: { paragraph: Record<string, unknown> }) {
  // Secondary fetch to resolve nested field_anni elements with their images
  const enriched =
    paragraph.type && paragraph.id
      ? await fetchParagraph(paragraph as { type: string; id: string; [key: string]: unknown })
      : paragraph;
  const data = enriched ?? paragraph;

  const sectionTitle = getProcessedText(data.field_testo);
  const yearStart = data.field_anno as string | undefined;
  const yearEnd = data.field_anno_2 as string | undefined;
  const items = (data.field_anni as ElementoBloccoAnni[] | undefined) ?? [];

  return (
    <section style={{ padding: '3rem 0', borderBottom: '1px solid #eee' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 2rem' }}>
        {/* Section header: year range + title */}
        {(yearStart || sectionTitle) && (
          <div style={{ marginBottom: '2rem' }}>
            {yearStart && (
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#999', marginBottom: '0.5rem' }}>
                <span>{yearStart}</span>
                {yearEnd && <span>–</span>}
                {yearEnd && <span>{yearEnd}</span>}
              </div>
            )}
            {sectionTitle && (
              <h2
                style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3, margin: 0 }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(sectionTitle) }}
              />
            )}
          </div>
        )}

        {/* Timeline items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {items.map((item, i) => {
            const year = item.field_anno || '';
            const text = item.field_testo?.processed || item.field_testo?.value || '';
            const imageUrl = getDrupalImageUrl(item.field_immagine);

            return (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: imageUrl ? '1fr 1fr' : '1fr',
                  gap: '2rem',
                  alignItems: 'start',
                }}
              >
                {imageUrl && (
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: '#f5f5f5' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={year}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                )}
                <div>
                  {year && (
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ccc', margin: '0 0 0.5rem' }}>
                      {year}
                    </p>
                  )}
                  {text && (
                    <div
                      style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: '#444' }}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
