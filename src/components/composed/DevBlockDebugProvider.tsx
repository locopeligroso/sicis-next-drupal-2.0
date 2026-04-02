'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'sicis-debug-mode';

interface DevDebugState {
  enabled: boolean;
  hydrated: boolean;
}

const DevDebugContext = createContext<DevDebugState>({ enabled: false, hydrated: false });

export function useDevBlockDebug() {
  const { enabled, hydrated } = useContext(DevDebugContext);
  // Only show overlays after hydration to avoid SSR mismatch
  return hydrated && enabled;
}

export function DevBlockDebugProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount — avoids SSR mismatch
  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(STORAGE_KEY) === '1');
    } catch { /* SSR / incognito */ }
    setHydrated(true);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((v) => {
      const next = !v;
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch { /* noop */ }
      return next;
    });
  }, []);

  if (process.env.NODE_ENV !== 'development') return <>{children}</>;

  return (
    <DevDebugContext.Provider value={{ enabled, hydrated }}>
      {children}
      {/* ── Breakpoint indicator + toggle button (bottom-right, stacked) ── */}
      {hydrated && enabled && (
        <div
          style={{
            position: 'fixed',
            bottom: '2.5rem',
            right: '0.75rem',
            zIndex: 9999,
            background: 'rgb(0 0 0 / 0.8)',
            color: 'white',
            borderRadius: '0.25rem',
            padding: '0.125rem 0.5rem',
            fontFamily: 'monospace',
            fontSize: '0.6875rem',
            pointerEvents: 'none',
          }}
        >
          <span className="sm:hidden">base (&lt;640)</span>
          <span className="hidden sm:inline md:hidden">sm (640-767)</span>
          <span className="hidden md:inline lg:hidden">md (768-1023)</span>
          <span className="hidden lg:inline xl:hidden">lg (1024-1279)</span>
          <span className="hidden xl:inline 2xl:hidden">xl (1280-1535)</span>
          <span className="hidden 2xl:inline">2xl (1536+)</span>
        </div>
      )}
      <button
        onClick={toggle}
        style={{
          position: 'fixed',
          bottom: '0.75rem',
          right: '0.75rem',
          zIndex: 9999,
          background: hydrated && enabled ? 'rgb(22 163 74)' : 'rgb(64 64 64)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.375rem 0.75rem',
          fontSize: '0.6875rem',
          fontWeight: 700,
          fontFamily: 'monospace',
          cursor: 'pointer',
          opacity: 0.9,
          boxShadow: '0 2px 8px rgb(0 0 0 / 0.3)',
          transition: 'background 150ms',
        }}
      >
        {hydrated && enabled ? '\u25A0 Debug Mode' : '\u25A1 Debug Mode'}
      </button>
    </DevDebugContext.Provider>
  );
}
