'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/i18n/config';
import { getTranslatedPath } from '@/lib/get-translated-path';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavLanguageSwitcherProps {
  locale: string;
  className?: string;
}

export function NavLanguageSwitcher({ locale, className }: NavLanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  const handleLocaleChange = async (targetLocale: string) => {
    if (targetLocale === locale) {
      close();
      return;
    }
    close();

    // Strip current locale prefix from pathname to get the Drupal path
    const drupalPath = pathname.replace(new RegExp(`^/${locale}`), '') || '/';

    const translatedPath = await getTranslatedPath(drupalPath, locale, targetLocale);
    const targetUrl = translatedPath ?? `/${targetLocale}${drupalPath === '/' ? '' : drupalPath}`;

    startTransition(() => {
      router.push(targetUrl);
    });
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'text-xs font-bold tracking-widest uppercase',
          isPending && 'opacity-50',
        )}
      >
        {locale.toUpperCase()}
      </Button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute top-full right-0 z-50 mt-1 min-w-16 overflow-hidden rounded-md border border-border bg-background py-1 shadow-md"
        >
          {locales.map((loc) => {
            const isCurrent = loc === locale;
            return (
              <li key={loc} role="option" aria-selected={isCurrent}>
                <button
                  onClick={() => handleLocaleChange(loc)}
                  className={cn(
                    'block w-full px-4 py-1.5 text-center text-xs tracking-widest uppercase transition-colors',
                    isCurrent
                      ? 'font-bold text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {loc.toUpperCase()}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
