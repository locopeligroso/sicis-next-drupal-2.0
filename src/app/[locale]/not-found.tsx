import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('common');
  const locale = await getLocale();
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
          fontSize: '5rem',
          fontWeight: 700,
          color: '#ccc',
          margin: 0,
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#555', margin: 0 }}>
        {t('notFound')}
      </p>
      <Link
        href={`/${locale}`}
        style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          background: '#111',
          color: '#fff',
          fontSize: '0.875rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        {t('backHome')}
      </Link>
    </main>
  );
}
