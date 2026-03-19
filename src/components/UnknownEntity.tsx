import { getTextValue, getProcessedText } from '@/lib/field-helpers';

interface UnknownEntityProps {
  node: Record<string, unknown>;
}

export default function UnknownEntity({ node }: UnknownEntityProps) {
  const title =
    getTextValue(node.field_titolo_main) ||
    getTextValue(node.title) ||
    'Untitled';

  const body = getProcessedText(node.field_testo_main);

  return (
    <div style={{ maxWidth: '50rem', margin: '0 auto', padding: '2rem' }}>
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            border: '0.0625rem solid #f59e0b',
            background: '#fffbeb',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            borderRadius: '0.25rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
            ⚠️ No component mapped for type:{' '}
            <code>{node.type as string}</code>
          </p>
        </div>
      )}
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        {title}
      </h1>
      {body && (
        <div
          dangerouslySetInnerHTML={{ __html: body }}
          style={{ lineHeight: 1.7 }}
        />
      )}
    </div>
  );
}
