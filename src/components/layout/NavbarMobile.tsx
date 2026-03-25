'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MenuIcon, XIcon, ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import type { NavbarMenu } from '@/lib/navbar/types';
import { Button } from '@/components/ui/button';
import { locales } from '@/i18n/config';
import { getTranslatedPath } from '@/lib/get-translated-path';
import { cn } from '@/lib/utils';

interface NavbarMobileProps {
  locale: string;
  menu: NavbarMenu;
  barOnly?: boolean;
  overlayOnly?: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface SubNav {
  title: string;
  items: { label: string; url: string }[];
}

type SectionKey = 'explore' | 'filterFind' | 'projects' | 'info';

function hasChildren(menu: NavbarMenu, key: SectionKey): boolean {
  switch (key) {
    case 'explore':
      return menu.explore.items.length > 0;
    case 'filterFind':
      return menu.filterFind.items.length > 0;
    case 'projects':
      return menu.projects.items.length > 0;
    case 'info':
      return false; // Info has flat links, navigate directly
  }
}

function buildSubNav(menu: NavbarMenu, key: SectionKey, title: string): SubNav {
  switch (key) {
    case 'explore': {
      // Flatten all groups into a single list: group name as label, then items
      const items: SubNav['items'] = [];
      for (const group of menu.explore.items) {
        for (const item of group.items) {
          items.push({ label: item.title, url: item.url });
        }
      }
      return { title, items };
    }
    case 'filterFind': {
      // List category names as links
      return {
        title,
        items: menu.filterFind.items.map((cat) => ({
          label: cat.item.title,
          url: cat.item.url,
        })),
      };
    }
    case 'projects': {
      // List item titles as links
      return {
        title,
        items: menu.projects.items.map((item) => ({
          label: item.title,
          url: item.url,
        })),
      };
    }
    default:
      return { title, items: [] };
  }
}

const NAV_SECTIONS: SectionKey[] = ['explore', 'filterFind', 'projects', 'info'];

export function NavbarMobile({ locale, menu, barOnly, overlayOnly, isOpen, setIsOpen }: NavbarMobileProps) {
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [subNav, setSubNav] = useState<SubNav | null>(null);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSubNav(null);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSubNav(null);
  }, []);

  const handleNavItemClick = useCallback(
    (key: SectionKey) => {
      if (hasChildren(menu, key)) {
        const title = t(`${key}Label`);
        setSubNav(buildSubNav(menu, key, title));
      } else {
        // Info: navigate to first strategic link or just close
        const infoLinks = [
          ...menu.info.strategic,
          ...menu.info.corporate,
          ...menu.info.professional,
        ];
        if (infoLinks.length > 0) {
          close();
          router.push(infoLinks[0].url);
        } else {
          close();
        }
      }
    },
    [menu, t, close, router]
  );

  const handleLocaleChange = useCallback(
    async (targetLocale: string) => {
      if (targetLocale === locale) return;
      close();

      const drupalPath = pathname.replace(new RegExp(`^/${locale}`), '') || '/';
      const translatedPath = await getTranslatedPath(drupalPath, locale, targetLocale);
      const targetUrl = translatedPath ?? `/${targetLocale}${drupalPath === '/' ? '' : drupalPath}`;

      startTransition(() => {
        router.push(targetUrl);
      });
    },
    [locale, pathname, close, router, startTransition]
  );

  const overlay = isOpen ? (
    <div className="fixed inset-0 z-50 bg-[#111] flex flex-col animate-in fade-in duration-200">
      {/* Overlay Header */}
      <div className="flex items-center justify-between px-6 h-[56px] shrink-0">
        <Link href={`/${locale}`} className="shrink-0" onClick={close}>
          <img src="/images/logo.png" alt="SICIS" className="h-5 w-auto invert" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={close}
          aria-label="Close menu"
          className="text-white hover:bg-white/10"
        >
          <XIcon />
        </Button>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col px-6 pt-8 overflow-y-auto">
        {subNav === null ? (
          <nav className="flex flex-col gap-1">
            {NAV_SECTIONS.map((key, index) => {
              const withChildren = hasChildren(menu, key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleNavItemClick(key)}
                  className="text-left text-[28px] font-light text-white tracking-[1px] py-2 flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in fill-mode-both"
                  style={{ animationDelay: `${index * 50}ms`, animationDuration: '300ms' }}
                >
                  <span>{t(`${key}Label`)}</span>
                  {withChildren && (
                    <ArrowRightIcon className="size-5 text-white/60" />
                  )}
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="animate-in slide-in-from-right-8 fade-in duration-200">
            <button
              type="button"
              onClick={() => setSubNav(null)}
              className="flex items-center gap-2 text-white/60 text-sm mb-6"
            >
              <ArrowLeftIcon className="size-4" />
              <span>{subNav.title}</span>
            </button>
            <nav className="flex flex-col gap-3">
              {subNav.items.map((item) => (
                <Link
                  key={item.url}
                  href={item.url}
                  onClick={close}
                  className="text-[20px] text-white font-light"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Language switcher at bottom */}
      <div className={cn('px-6 pb-8 pt-4 shrink-0', isPending && 'opacity-50')}>
        <div className="flex items-center gap-4">
          {locales.map((loc) => {
            const isCurrent = loc === locale;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => handleLocaleChange(loc)}
                className={cn(
                  'text-sm uppercase tracking-widest',
                  isCurrent
                    ? 'text-white font-semibold'
                    : 'text-white/40'
                )}
              >
                {loc}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  ) : null;

  const bar = (
    <div className="flex items-center justify-between px-6 h-[56px]">
      <Link href={`/${locale}`} className="shrink-0">
        <img src="/images/logo.png" alt="SICIS" className="h-5 w-auto dark:invert" />
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon />
      </Button>
    </div>
  );

  if (barOnly) return bar;
  if (overlayOnly) return overlay;
  return <>{bar}{overlay}</>;
}
