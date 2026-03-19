import type { CSSProperties } from 'react';

export interface SpecItem {
  label: string;
  value: string | number | boolean | null | undefined;
  /** If true, render value as HTML (processed field) */
  html?: boolean;
}

interface SpecsProps {
  items: SpecItem[];
  title?: string;
}

export const sectionStyle: CSSProperties = {
  borderTop: '1px solid #e0e0e0',
  paddingTop: '2rem',
  marginTop: '2rem',
};

export const sectionHeadingStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#888',
  marginBottom: '1rem',
};

export const labelStyle: CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#aaa',
  margin: '0 0 0.25rem',
};

/**
 * Shared key-value specs table.
 * Replaces repeated spec rendering in all 5 product components.
 * Each product passes its own SpecItem[] config.
 */
export function Specs({ items, title = 'Specifiche' }: SpecsProps) {
  const visible = items.filter(
    (item) => item.value !== null && item.value !== undefined && item.value !== '',
  );
  if (!visible.length) return null;

  return (
    <section style={sectionStyle} aria-label={title}>
      <h2 style={sectionHeadingStyle}>{title}</h2>
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
          gap: '1rem 1.5rem',
        }}
      >
        {visible.map((item, i) => (
          <div key={i}>
            <dt style={labelStyle}>{item.label}</dt>
            {item.html ? (
              <dd
                style={{ margin: 0, fontSize: '0.9rem' }}
                dangerouslySetInnerHTML={{ __html: String(item.value) }}
              />
            ) : (
              <dd style={{ margin: 0, fontSize: '0.9rem' }}>
                {typeof item.value === 'boolean'
                  ? item.value ? '✓' : '✗'
                  : String(item.value)}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}
