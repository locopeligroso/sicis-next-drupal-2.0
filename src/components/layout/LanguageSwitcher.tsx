'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/i18n/config';
import { getTranslatedPath } from '@/lib/get-translated-path';

interface LanguageSwitcherProps {
  currentLocale: string;
}

const LOCALE_LABELS: Record<string, string> = {
  it: 'IT',
  en: 'EN',
  fr: 'FR',
  de: 'DE',
  es: 'ES',
  ru: 'RU',
};

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = async (targetLocale: string) => {
    if (targetLocale === currentLocale) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);

    // Strip current locale prefix from pathname to get the Drupal path
    // e.g. /it/mosaico/antigua → /mosaico/antigua
    const drupalPath = pathname.replace(new RegExp(`^/${currentLocale}`), '') || '/';

    // Strategy 1: Ask Drupal for the translated entity URL (works for nodes + taxonomy terms)
    // Strategy 2 (fallback): Simple locale prefix swap — preserves listing pages, filter pages, etc.
    //   e.g. /en/mosaic/blends → /it/mosaic/blends (getSectionConfig handles both 'mosaic' and 'mosaico')
    const translatedPath = await getTranslatedPath(drupalPath, currentLocale, targetLocale);
    const targetUrl = translatedPath ?? `/${targetLocale}${drupalPath === '/' ? '' : drupalPath}`;

    startTransition(() => {
      router.push(targetUrl);
    });
  };

  return (
    <div
      style={{ position: 'relative', marginLeft: 'auto' }}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Current locale trigger */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#444',
          padding: '0.25rem 0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          opacity: isPending ? 0.5 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {LOCALE_LABELS[currentLocale] ?? currentLocale.toUpperCase()}
        <span style={{ fontSize: '0.55rem', color: '#999' }}>▾</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: '#fff',
            border: '0.0625rem solid #e0e0e0',
            borderTop: '0.125rem solid #111',
            boxShadow: '0 0.5rem 1rem rgba(0,0,0,0.08)',
            listStyle: 'none',
            margin: 0,
            padding: '0.5rem 0',
            minWidth: '4rem',
            zIndex: 200,
          }}
        >
          {locales.map((locale) => (
            <li key={locale} role="option" aria-selected={locale === currentLocale}>
              <button
                onClick={() => handleLocaleChange(locale)}
                style={{
                  width: '100%',
                  background: locale === currentLocale ? '#f5f5f5' : 'none',
                  border: 'none',
                  cursor: locale === currentLocale ? 'default' : 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: locale === currentLocale ? 700 : 400,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: locale === currentLocale ? '#111' : '#666',
                  padding: '0.4rem 1rem',
                  textAlign: 'left',
                  display: 'block',
                  transition: 'background 0.1s, color 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (locale !== currentLocale) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#f9f9f9';
                    (e.currentTarget as HTMLButtonElement).style.color = '#000';
                  }
                }}
                onMouseLeave={(e) => {
                  if (locale !== currentLocale) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'none';
                    (e.currentTarget as HTMLButtonElement).style.color = '#666';
                  }
                }}
              >
                {LOCALE_LABELS[locale]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
