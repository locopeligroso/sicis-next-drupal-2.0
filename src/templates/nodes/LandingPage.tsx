import ParagraphResolver from '@/components_legacy/blocks_legacy/ParagraphResolver';

export default function LandingPage({ node }: { node: Record<string, unknown> }) {
  const paragraphs = (node.field_blocchi as Record<string, unknown>[] | undefined) ?? [];

  return (
    <div>
      {paragraphs.map((p, i) => (
        <ParagraphResolver key={(p.id as string) ?? i} paragraph={p} />
      ))}
    </div>
  );
}
