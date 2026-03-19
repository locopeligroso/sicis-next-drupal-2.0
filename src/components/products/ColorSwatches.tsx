import type { CSSProperties } from 'react';
import { COLOR_MAP, getColorSwatch } from '@/lib/product-helpers';

// Re-export for backward compatibility with any existing consumers
export { COLOR_MAP, getColorSwatch };

interface ColorItem {
  id?: string;
  name?: string;
}

interface ColorSwatchesProps {
  colors: ColorItem[];
  title?: string;
  activeColor?: string;
}

const sectionStyle: CSSProperties = {
  borderTop: '1px solid #e0e0e0',
  paddingTop: '2rem',
  marginTop: '2rem',
};

const headingStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#888',
  marginBottom: '1rem',
};

/**
 * Shared color swatches component.
 * Replaces near-identical implementations in ProdottoMosaico and ProdottoPixall.
 */
export function ColorSwatches({ colors, title = 'Colori', activeColor }: ColorSwatchesProps) {
  if (!colors.length) return null;

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>{title}</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {colors.map((color, i) => {
          const name = color.name ?? '';
          const swatch = getColorSwatch(name);
          const isActive = activeColor === name;
          const isGradient = swatch.startsWith('linear-gradient');

          return (
            <div
              key={color.id ?? i}
              title={name}
              aria-label={name}
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background: swatch,
                border: isActive ? '2px solid #333' : '1px solid #ddd',
                boxShadow: isActive ? '0 0 0 2px #fff, 0 0 0 4px #333' : undefined,
                cursor: 'default',
                flexShrink: 0,
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
