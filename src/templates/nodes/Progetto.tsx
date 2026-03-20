import Link from 'next/link';
import DrupalImage from '@/components_legacy/DrupalImage';
import ParagraphResolver from '@/components_legacy/blocks_legacy/ParagraphResolver';
import { getTextValue, getProcessedText } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';

export default function Progetto({ node }: { node: Record<string, unknown> }) {
  const title =
    getTextValue(node.field_titolo_main) || getTextValue(node.title);
  const body = getProcessedText(node.field_testo_main);
  const paragraphs =
    (node.field_blocchi as Record<string, unknown>[] | undefined) ?? [];

  const categoria = node.field_categoria_progetto as
    | Record<string, unknown>
    | undefined;
  const categoriaName = categoria?.name as string | undefined;
  const categoriaAlias = (
    categoria?.path as Record<string, unknown> | undefined
  )?.alias as string | undefined;

  return (
    <article style={{ maxWidth: '60rem', margin: '0 auto', padding: '2rem' }}>
      {categoriaName && (
        <p style={{ marginBottom: '0.75rem' }}>
          {categoriaAlias ? (
            <Link
              href={categoriaAlias}
              style={{
                display: 'inline-block',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-primary, inherit)',
                textDecoration: 'none',
              }}
            >
              {categoriaName}
            </Link>
          ) : (
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-primary, inherit)',
              }}
            >
              {categoriaName}
            </span>
          )}
        </p>
      )}

      {title && (
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
      )}

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

      {paragraphs.map((p, i) => (
        <ParagraphResolver key={(p.id as string) ?? i} paragraph={p} />
      ))}
    </article>
  );
}
