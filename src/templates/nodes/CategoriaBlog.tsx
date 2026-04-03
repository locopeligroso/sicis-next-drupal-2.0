import DrupalImage from '@/components_legacy/DrupalImage';
import ParagraphResolver from '@/components_legacy/blocks_legacy/ParagraphResolver';
import { getTitle, getBody } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';

export default function CategoriaBlog({ node }: { node: Record<string, unknown> }) {
  const title = getTitle(node);
  const body = getBody(node);
  const paragraphs = (node.field_blocchi as Record<string, unknown>[] | undefined) ?? [];

  return (
    <article style={{ maxWidth: '60rem', margin: '0 auto', padding: '2rem' }}>
      {/* Wireframe label */}
      <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#f0f0f0', border: '0.0625rem solid #ddd', fontSize: '0.75rem', color: '#888', marginBottom: '1rem', borderRadius: '0.25rem' }}>
        Categoria Blog
      </div>

      <DrupalImage field={node.field_immagine} alt={title ?? ''} aspectRatio="16/9" style={{ marginBottom: '2rem' }} />

      {body && (
        <div
          style={{ lineHeight: 1.7, marginBottom: '2rem' }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
        />
      )}

      {paragraphs.map((p, i) => (
        <ParagraphResolver key={(p.id as string) ?? i} paragraph={p} pageTitle={title ?? undefined} />
      ))}
    </article>
  );
}
