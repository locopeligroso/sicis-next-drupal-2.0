import ParagraphResolver from '@/components_legacy/blocks_legacy/ParagraphResolver';
import { getTextValue } from '@/lib/field-helpers';

export default function LandingPage({ node }: { node: Record<string, unknown> }) {
  const title = getTextValue(node.title);
  const paragraphs = (node.field_blocchi as Record<string, unknown>[] | undefined) ?? [];

  return (
    <div>
      {paragraphs.map((p, i) => (
        <ParagraphResolver key={(p.id as string) ?? i} paragraph={p} pageTitle={title ?? undefined} />
      ))}
    </div>
  );
}
