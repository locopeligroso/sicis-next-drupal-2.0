import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { getProcessedText } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';
import { toDrupalLocale } from '@/i18n/config';

/**
 * BloccoE — provisional legacy block for "Info tecniche" sections.
 *
 * Renders a titled section with a grid of referenced entities (documents,
 * tutorials, pages). Each card links to the entity's alias.
 *
 * Drupal fields:
 *   field_titolo_formattato — HTML title (e.g. "<p>Documents</p>")
 *   field_elementi_tecnici  — array of referenced entities with:
 *     nid, type (documento|tutorial|page), field_titolo_main,
 *     aliases, field_collegamento_esterno, field_allegato,
 *     field_no_form, field_id_video
 */

interface ElementoTecnico {
  nid: number;
  type: string;
  field_titolo_main: string;
  aliases?: Record<string, string>;
  field_collegamento_esterno?: string | null;
  field_allegato?: string | null;
  field_no_form?: boolean;
  field_id_video?: string | null;
}

function getElementHref(
  el: ElementoTecnico,
  locale: string,
  drupalLocale: string,
): string | null {
  // External link (catalogs, etc.)
  if (el.field_collegamento_esterno) return el.field_collegamento_esterno;
  // PDF attachment
  if (el.field_allegato) return el.field_allegato;
  // Internal alias — use Drupal locale for alias lookup (us→en), Next.js locale for prefix
  const alias = el.aliases?.[drupalLocale] ?? el.aliases?.['it'];
  if (alias) return `/${locale}${alias}`;
  return null;
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    documento: 'Documento',
    tutorial: 'Tutorial',
    page: 'Pagina',
  };
  return labels[type] ?? type;
}

export default async function BloccoE({
  paragraph,
}: {
  paragraph: Record<string, unknown>;
}) {
  const locale = await getLocale();
  // Drupal aliases are keyed by Drupal locale (us → en)
  const drupalLocale = toDrupalLocale(locale);
  const titleHtml = getProcessedText(paragraph.field_titolo_formattato);
  const title = titleHtml
    ? titleHtml
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()
    : null;

  const elementi =
    (paragraph.field_elementi_tecnici as ElementoTecnico[] | null) ?? [];

  if (elementi.length === 0 && !title) return null;

  return (
    <section
      style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1rem',
      }}
    >
      {title && (
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          {title}
        </h3>
      )}

      {elementi.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(16rem, 1fr))',
            gap: '1rem',
          }}
        >
          {elementi.map((el) => {
            const href = getElementHref(el, locale, drupalLocale);
            const isExternal =
              href?.startsWith('http') || href?.endsWith('.pdf');

            const card = (
              <div
                key={el.nid}
                style={{
                  padding: '1.25rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#6b7280',
                  }}
                >
                  {getTypeLabel(el.type)}
                </span>
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  {el.field_titolo_main}
                </span>
                {el.field_id_video && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                    }}
                  >
                    Video
                  </span>
                )}
              </div>
            );

            if (href) {
              return isExternal ? (
                <a
                  key={el.nid}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {card}
                </a>
              ) : (
                <Link
                  key={el.nid}
                  href={href}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {card}
                </Link>
              );
            }

            return card;
          })}
        </div>
      ) : (
        title && (
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            Nessun elemento disponibile.
          </p>
        )
      )}
    </section>
  );
}
