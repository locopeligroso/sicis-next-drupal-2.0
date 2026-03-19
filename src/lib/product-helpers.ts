/**
 * Shared helpers per i componenti prodotto.
 * Centralizza COLOR_MAP, getColorSwatch, RETINATURA_LABELS e formatRetinatura
 * che erano duplicati in ProdottoMosaico.tsx, ProdottoPixall.tsx
 * e in src/components/products/ColorSwatches.tsx.
 *
 * Single source of truth — importare da qui in tutti i componenti prodotto.
 */

export const COLOR_MAP: Record<string, string> = {
  'Red / Orange': '#e05a2b',
  'Red': '#cc2200',
  'Orange': '#f07020',
  'Yellow': '#f5c800',
  'Yellow / Gold': '#d4a800',
  'Yellow / Orange': '#f09020',
  'Yellow / Green': '#8ab820',
  'Green': '#3a8a3a',
  'Deep green': '#1a5a1a',
  'Blue': '#1a5fa8',
  'Deep Blue': '#0a2a78',
  'Light Blue': '#5ab4e0',
  'Light green / Aquamarine': '#40c0a0',
  'Turquoise': '#00b0a0',
  'Violet': '#7040a0',
  'Pink': '#e060a0',
  'White': '#f5f5f5',
  'Black': '#1a1a1a',
  'Grey': '#888888',
  'Gray': '#888888',
  'Grigio': '#888888',
  'Brown': '#8b5e3c',
  'Beige': '#d4b896',
  'Gold': '#c8a000',
  'Silver': '#a0a8b0',
  'Multicolor': 'linear-gradient(135deg, #e05a2b, #f5c800, #3a8a3a, #1a5fa8)',
};

/**
 * Returns the CSS color value (hex or gradient) for a Drupal taxonomy color name.
 *
 * Resolution order:
 * 1. Exact match in `COLOR_MAP`
 * 2. Longest partial match (case-insensitive substring) — prefers more specific keys
 * 3. Fallback: `'#ccc'`
 *
 * @param name - Drupal taxonomy term name (e.g. `'Murano Smalto'`, `'Red / Orange'`)
 * @returns CSS color string — hex (e.g. `'#cc2200'`) or CSS gradient for multicolor
 * @example
 * getColorSwatch('Red')        // → '#cc2200'
 * getColorSwatch('Multicolor') // → 'linear-gradient(135deg, ...)'
 * getColorSwatch('')           // → '#ccc'
 * getColorSwatch('Unknown')    // → '#ccc'
 */
export function getColorSwatch(name: string): string {
  if (!name) return '#ccc';
  if (COLOR_MAP[name]) return COLOR_MAP[name];
  // Trova il match parziale più specifico (chiave più lunga)
  let bestMatch: string | null = null;
  let bestKeyLength = 0;
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (
      name.toLowerCase().includes(key.toLowerCase()) &&
      key.length > bestKeyLength
    ) {
      bestMatch = val;
      bestKeyLength = key.length;
    }
  }
  return bestMatch ?? '#ccc';
}

export const RETINATURA_LABELS: Record<string, string> = {
  on_fiber_mesh: 'Rete in fibra',
  paper_to_remove: 'Carta da rimuovere',
  no_backing: 'Senza supporto',
  on_paper: 'Su carta',
};

/**
 * Formats a Drupal `field_retinatura` machine value into a human-readable label.
 *
 * Uses `RETINATURA_LABELS` for known values. Returns the raw value unchanged
 * for unmapped keys (forward-compatible with new Drupal values).
 * Returns an empty string for `null`, `undefined`, or empty input.
 *
 * @param value - Drupal field value (e.g. `'on_fiber_mesh'`, `'no_backing'`)
 * @returns Human-readable label (e.g. `'Rete in fibra'`) or empty string
 * @example
 * formatRetinatura('on_fiber_mesh')    // → 'Rete in fibra'
 * formatRetinatura('paper_to_remove')  // → 'Carta da rimuovere'
 * formatRetinatura('unknown_value')    // → 'unknown_value'
 * formatRetinatura(null)               // → ''
 */
export function formatRetinatura(value: string | null | undefined): string {
  if (!value) return '';
  return RETINATURA_LABELS[value] ?? value;
}
