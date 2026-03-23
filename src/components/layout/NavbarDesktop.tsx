'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SearchIcon } from 'lucide-react';
import type { NavbarMenu } from '@/lib/navbar/types';
import { Button } from '@/components/ui/button';
import { NavDarkModeToggle } from '@/components/composed/NavDarkModeToggle';
import { NavLanguageSwitcher } from '@/components/composed/NavLanguageSwitcher';
import { MegaMenuInfo } from '@/components/composed/MegaMenuInfo';
import { cn } from '@/lib/utils';

interface NavbarDesktopProps {
  locale: string;
  menu: NavbarMenu;
  openMenu: string | null;
  setOpenMenu: (key: string | null) => void;
}

const NAV_ITEMS = [
  { key: 'explore' },
  { key: 'filterFind' },
  { key: 'projects' },
  { key: 'info' },
] as const;

type NavItemKey = (typeof NAV_ITEMS)[number]['key'];

export function NavbarDesktop({
  locale,
  menu,
  openMenu,
  setOpenMenu,
}: NavbarDesktopProps) {
  const t = useTranslations('nav');
  const [isTouch, setIsTouch] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Detect touch vs pointer at mount
  useEffect(() => {
    setIsTouch(!window.matchMedia('(pointer: fine)').matches);
  }, []);

  // Close mega-menu on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenMenu(null);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setOpenMenu]);

  // Focus first link inside panel when mega-menu opens
  useEffect(() => {
    if (openMenu && panelRef.current) {
      const firstLink = panelRef.current.querySelector<HTMLElement>(
        'a, button, [tabindex="0"]'
      );
      if (firstLink) {
        firstLink.focus();
      }
    }
  }, [openMenu]);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const startCloseTimer = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 150);
  }, [clearCloseTimer, setOpenMenu]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleMouseEnter = useCallback(
    (key: string) => {
      if (isTouch) return;
      clearCloseTimer();
      setOpenMenu(key);
    },
    [isTouch, clearCloseTimer, setOpenMenu]
  );

  const handleMouseLeave = useCallback(() => {
    if (isTouch) return;
    startCloseTimer();
  }, [isTouch, startCloseTimer]);

  const handleClick = useCallback(
    (e: React.MouseEvent, key: string) => {
      if (!isTouch) return;
      e.preventDefault();
      setOpenMenu(openMenu === key ? null : key);
    },
    [isTouch, openMenu, setOpenMenu]
  );

  // Get the label for the currently open menu (for aria-label)
  const getActiveLabel = useCallback(
    (key: NavItemKey) => {
      return t(`${key}Label`);
    },
    [t]
  );

  return (
    <div>
      {/* Nav bar row */}
      <div className="flex items-center justify-between px-9 h-[72px]">
        {/* Left — Logo */}
        <Link href={`/${locale}`} className="shrink-0">
          <span className="text-sm font-bold tracking-[4px]">SICIS</span>
        </Link>

        {/* Center — Nav Items */}
        <nav className="flex items-center gap-8">
          {NAV_ITEMS.map(({ key }) => {
            const isActive = openMenu === key;
            const hasOpenMenu = openMenu !== null;

            return (
              <button
                key={key}
                type="button"
                aria-haspopup="true"
                aria-expanded={isActive}
                className={cn(
                  'flex flex-col items-center text-center transition-opacity duration-150',
                  hasOpenMenu && !isActive && 'opacity-35'
                )}
                onMouseEnter={() => handleMouseEnter(key)}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => handleClick(e, key)}
              >
                <span
                  className={cn(
                    'text-[11px] uppercase tracking-[2px]',
                    isActive
                      ? 'font-semibold text-foreground'
                      : 'text-foreground'
                  )}
                >
                  {t(`${key}Label`)}
                </span>
                <span className="text-[9px] text-muted-foreground mt-[3px]">
                  {t(`${key}Desc`)}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right — Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" disabled aria-label="Search">
            <SearchIcon data-icon />
          </Button>
          <NavDarkModeToggle />
          <NavLanguageSwitcher locale={locale} />
        </div>
      </div>

      {/* Mega-menu Panel Container */}
      <div
        className="grid transition-[grid-template-rows] duration-[250ms] ease-out"
        style={{ gridTemplateRows: openMenu ? '1fr' : '0fr' }}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={handleMouseLeave}
      >
        <div className="overflow-hidden">
          <div
            ref={panelRef}
            className={cn(
              'transition-opacity duration-150',
              openMenu ? 'opacity-100 delay-150' : 'opacity-0'
            )}
          >
            {openMenu && (
              <div
                role="region"
                aria-label={getActiveLabel(openMenu as NavItemKey)}
                className="max-h-[70vh] overflow-y-auto"
              >
                {openMenu === 'info' && <MegaMenuInfo menu={menu.info} />}
                {openMenu !== 'info' && (
                  <div className="p-10 text-sm text-muted-foreground">
                    Mega-menu: {openMenu}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
