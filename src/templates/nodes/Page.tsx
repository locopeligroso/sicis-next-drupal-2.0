import ParagraphResolver from '@/components_legacy/blocks_legacy/ParagraphResolver';
import { getTitle, getBody } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';

export default function Page({ node }: { node: Record<string, unknown> }) {
  const title = getTitle(node);
  const body = getBody(node);
  const paragraphs = (node.field_blocchi as Record<string, unknown>[] | undefined) ?? [];

  return (
    <article className="flex flex-col gap-(--spacing-section) overflow-x-hidden [&>*]:w-full">
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
