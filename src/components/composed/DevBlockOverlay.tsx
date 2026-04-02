'use client';

import { useDevBlockDebug } from './DevBlockDebugProvider';

/**
 * Dev-only visual overlay that highlights block boundaries and names.
 * Green dashed border = DS block, red dashed border = legacy block.
 * Toggled via the floating "Debug Mode" button (DevBlockDebugProvider).
 *
 * Uses suppressHydrationWarning because the debug context state may differ
 * between server render (always false) and client navigation (persisted via
 * localStorage). This is acceptable for a dev-only debug tool.
 */
interface DevBlockOverlayProps {
  name: string;
  status: 'ds' | 'legacy';
  children: React.ReactNode;
}

export function DevBlockOverlay({
  name,
  status,
  children,
}: DevBlockOverlayProps) {
  if (process.env.NODE_ENV !== 'development') return <>{children}</>;

  return (
    <DevBlockOverlayInner name={name} status={status}>
      {children}
    </DevBlockOverlayInner>
  );
}

function DevBlockOverlayInner({
  name,
  status,
  children,
}: DevBlockOverlayProps) {
  const enabled = useDevBlockDebug();

  const borderColor =
    status === 'ds' ? 'rgb(34 197 94 / 0.5)' : 'rgb(239 68 68 / 0.5)';
  const badgeBg =
    status === 'ds' ? 'rgb(22 163 74)' : 'rgb(220 38 38)';

  return (
    <div
      suppressHydrationWarning
      style={{
        position: 'relative',
        outline: enabled ? `1px dashed ${borderColor}` : 'none',
        outlineOffset: enabled ? '-2px' : '0',
      }}
    >
      <span
        suppressHydrationWarning
        onClick={enabled ? () => navigator.clipboard.writeText(name) : undefined}
        style={{
          position: 'absolute',
          top: '0.25rem',
          right: '0.25rem',
          background: badgeBg,
          color: 'white',
          fontSize: '0.5625rem',
          fontWeight: 700,
          padding: '0.0625rem 0.375rem',
          borderRadius: '0.25rem',
          zIndex: 50,
          fontFamily: 'monospace',
          letterSpacing: '0.025em',
          whiteSpace: 'nowrap',
          pointerEvents: enabled ? 'auto' : 'none',
          cursor: enabled ? 'copy' : undefined,
          lineHeight: 1.4,
          opacity: enabled ? 0.85 : 0,
          visibility: enabled ? 'visible' : 'hidden',
        }}
      >
        {status === 'legacy' ? '\u26A0 ' : '\u2713 '}
        {name}
      </span>
      {children}
    </div>
  );
}
