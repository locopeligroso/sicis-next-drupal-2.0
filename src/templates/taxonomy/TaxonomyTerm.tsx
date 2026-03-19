import { sanitizeHtml } from '@/lib/sanitize';

export default function TaxonomyTerm({ node }: { node: Record<string, unknown> }) {
  const name = (node.name as string | undefined) ?? '';
  const description = (node.description as { processed?: string } | undefined)?.processed;
  return (
    <div style={{ maxWidth: '60rem', margin: '0 auto', padding: '2rem' }}>
      <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', background: '#f0f0f0', border: '0.0625rem solid #ddd', fontSize: '0.7rem', color: '#999', marginBottom: '1rem', borderRadius: '0.25rem' }}>Taxonomy Term</span>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem' }}>{name}</h1>
      {description && <div style={{ lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }} />}
    </div>
  );
}
