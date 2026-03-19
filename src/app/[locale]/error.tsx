'use client';

import { useTranslations } from 'next-intl';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations('common');
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1.5rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: '#dc2626',
          margin: 0,
        }}
      >
        {t('error')}
      </h1>
      <p style={{ color: '#555', margin: 0, fontSize: '0.9375rem' }}>
        {error.message || t('error')}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '0.75rem 2rem',
          background: '#111',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.875rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        {t('retry')}
      </button>
    </main>
  );
}
