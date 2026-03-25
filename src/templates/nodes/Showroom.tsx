import { getTextValue, getProcessedText } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';
import { getDrupalImageUrl } from '@/lib/drupal';

export default function Showroom({ node }: { node: Record<string, unknown> }) {
  const title =
    getTextValue(node.field_titolo_main) || getTextValue(node.title);
  const body = getProcessedText(node.field_testo_main);

  // Showroom-specific fields
  const address = node.field_indirizzo as string | undefined;
  const city = node.field_citta as string | undefined;
  const phone = node.field_telefono as string | undefined;
  const email = node.field_indirizzo_email as string | undefined;
  const mapsUrl = node.field_collegamento_gmaps as string | undefined;
  const externalUrl = node.field_collegamento_esterno as string | undefined;

  // Gallery images (array of resolved file entities)
  const gallery =
    (node.field_gallery as Record<string, unknown>[] | undefined) ?? [];
  const firstImageUrl =
    gallery.length > 0 ? getDrupalImageUrl(gallery[0]) : null;

  return (
    <article style={{ maxWidth: '60rem', margin: '0 auto', padding: '2rem' }}>
      {/* Hero image from gallery */}
      {firstImageUrl ? (
        <div
          style={{
            aspectRatio: '16/9',
            overflow: 'hidden',
            background: '#f5f5f5',
            marginBottom: '2rem',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={firstImageUrl}
            alt={title ?? ''}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            aspectRatio: '16/9',
            background: '#f5f5f5',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ccc',
          }}
        >
          No image
        </div>
      )}

      {body && (
        <div
          style={{ lineHeight: 1.7, marginBottom: '2rem' }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
        />
      )}

      {/* Contact info */}
      {(address || phone || email) && (
        <div
          style={{
            borderTop: '1px solid #eee',
            paddingTop: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          {address && (
            <p
              style={{
                margin: '0 0 0.5rem',
                fontSize: '0.9375rem',
                color: '#444',
              }}
            >
              <strong>Indirizzo:</strong> {address}
            </p>
          )}
          {city && (
            <p
              style={{
                margin: '0 0 0.5rem',
                fontSize: '0.9375rem',
                color: '#444',
              }}
            >
              <strong>Città:</strong> {city}
            </p>
          )}
          {phone && (
            <p
              style={{
                margin: '0 0 0.5rem',
                fontSize: '0.9375rem',
                color: '#444',
              }}
            >
              <strong>Tel:</strong>{' '}
              <a
                href={`tel:${phone}`}
                style={{ color: '#111', textDecoration: 'underline' }}
              >
                {phone}
              </a>
            </p>
          )}
          {email && (
            <p
              style={{
                margin: '0 0 0.5rem',
                fontSize: '0.9375rem',
                color: '#444',
              }}
            >
              <strong>Email:</strong>{' '}
              <a
                href={`mailto:${email}`}
                style={{ color: '#111', textDecoration: 'underline' }}
              >
                {email}
              </a>
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.875rem',
                  color: '#111',
                  textDecoration: 'underline',
                }}
              >
                Ottieni indicazioni
              </a>
            )}
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.875rem',
                  color: '#111',
                  textDecoration: 'underline',
                }}
              >
                Anteprima
              </a>
            )}
          </div>
        </div>
      )}

      {/* Gallery grid */}
      {gallery.length > 1 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
            gap: '0.5rem',
            marginBottom: '2rem',
          }}
        >
          {gallery.slice(1).map((img, i) => {
            const url = getDrupalImageUrl(img);
            if (!url) return null;
            return (
              <div
                key={i}
                style={{
                  aspectRatio: '4/3',
                  overflow: 'hidden',
                  background: '#f5f5f5',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${title} ${i + 2}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
