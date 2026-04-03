import { getTranslations } from 'next-intl/server';
import DrupalImage from '@/components_legacy/DrupalImage';
import { getTitle, getBody } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';
import { getDrupalImageUrl } from '@/lib/drupal';

export default async function Documento({
  node,
}: {
  node: Record<string, unknown>;
}) {
  const tCommon = await getTranslations('common');

  const title =
    getTitle(node);
  const body = getBody(node);
  const allegato = node.field_allegato as Record<string, unknown> | undefined;
  const allegatoUrl = getDrupalImageUrl(allegato);

  return (
    <article style={{ maxWidth: '60rem', margin: '0 auto', padding: '2rem' }}>
      <DrupalImage
        field={node.field_immagine}
        alt={title ?? ''}
        aspectRatio="16/9"
        style={{ marginBottom: '2rem' }}
      />

      {body && (
        <div
          style={{ lineHeight: 1.7, marginBottom: '2rem' }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
        />
      )}

      {allegatoUrl && (
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #eee',
          }}
        >
          <a
            href={allegatoUrl}
            download
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#111',
              textDecoration: 'underline',
              textUnderlineOffset: 'var(--underline-offset, 3px)',
            }}
          >
            {tCommon('download')}
          </a>
        </div>
      )}
    </article>
  );
}
