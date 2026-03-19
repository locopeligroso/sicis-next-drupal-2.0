import DrupalImage from '@/components_legacy/DrupalImage';
import ParagraphResolver from '@/components_legacy/blocks_legacy/ParagraphResolver';
import { getTextValue, getProcessedText } from '@/lib/field-helpers';

export default function Tag({ node }: { node: Record<string, unknown> }) {
  const title = getTextValue(node.field_titolo_main) || getTextValue(node.title);
  const body = getProcessedText(node.field_testo_main);
  const paragraphs = (node.field_blocchi as Record<string, unknown>[] | undefined) ?? [];

  return (
    <article style={{ maxWidth: '60rem', margin: '0 auto', padding: '2rem' }}>

      {title && (
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.2 }}>
          {title}
        </h1>
      )}

      <DrupalImage field={node.field_immagine} alt={title ?? ''} aspectRatio="16/9" style={{ marginBottom: '2rem' }} />

      {body && (
        <div
          style={{ lineHeight: 1.7, marginBottom: '2rem' }}
          dangerouslySetInnerHTML={{ __html: body }}
        />
      )}

      {paragraphs.map((p, i) => (
        <ParagraphResolver key={(p.id as string) ?? i} paragraph={p} />
      ))}
    </article>
  );
}
