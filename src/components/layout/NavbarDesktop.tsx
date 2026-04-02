'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SearchIcon } from 'lucide-react';
import type { NavbarMenu } from '@/lib/navbar/types';
import { Button } from '@/components/ui/button';
import { NavDarkModeToggle } from '@/components/composed/NavDarkModeToggle';
import { NavLanguageSwitcher } from '@/components/composed/NavLanguageSwitcher';
import { SampleCartBadge } from '@/components/composed/SampleCartBadge';
import { MegaMenuInfo } from '@/components/composed/MegaMenuInfo';
import { MegaMenuExplore } from '@/components/composed/MegaMenuExplore';
import { MegaMenuFilterFind } from '@/components/composed/MegaMenuFilterFind';
import { MegaMenuProjects } from '@/components/composed/MegaMenuProjects';
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  // Crossfade state for switching between menus
  const [displayedMenu, setDisplayedMenu] = useState<string | null>(null);
  const [contentVisible, setContentVisible] = useState(false);
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (switchTimerRef.current) {
      clearTimeout(switchTimerRef.current);
      switchTimerRef.current = null;
    }

    if (openMenu) {
      if (!displayedMenu) {
        // Opening from closed: show content, then fade in
        setDisplayedMenu(openMenu);
        requestAnimationFrame(() => setContentVisible(true));
      } else if (openMenu !== displayedMenu) {
        // Switching: fade out (100ms), swap, fade in (200ms)
        // Content fully visible at ~300ms = same as height transition end
        setContentVisible(false);
        switchTimerRef.current = setTimeout(() => {
          setDisplayedMenu(openMenu);
          requestAnimationFrame(() => setContentVisible(true));
        }, 100);
      }
    } else {
      // Closing: fade out, then remove content after animation
      setContentVisible(false);
      switchTimerRef.current = setTimeout(() => {
        setDisplayedMenu(null);
      }, 300);
    }

    return () => {
      if (switchTimerRef.current) {
        clearTimeout(switchTimerRef.current);
      }
    };
  }, [openMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  // Measure content height after displayedMenu changes
  useEffect(() => {
    if (displayedMenu && contentRef.current) {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          setPanelHeight(contentRef.current.scrollHeight);
        }
      });
    }
  }, [displayedMenu]);

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

  // Focus first link inside panel only on keyboard navigation (Tab)
  // Mouse/touch users won't get auto-focus; keyboard users will
  // reach the panel naturally via Tab order

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
    [isTouch, clearCloseTimer, setOpenMenu],
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
    [isTouch, openMenu, setOpenMenu],
  );

  // Get the label for the currently open menu (for aria-label)
  const getActiveLabel = useCallback(
    (key: NavItemKey) => {
      return t(`${key}Label`);
    },
    [t],
  );

  return (
    <div onMouseLeave={handleMouseLeave}>
      {/* Nav bar row */}
      <div className="flex items-center justify-between px-9 h-[72px]">
        {/* Left — Logo */}
        <Link href={`/${locale}`} className="shrink-0">
          <img
            src="/images/logo.png"
            alt="SICIS"
            className="h-5 w-auto dark:invert"
          />
        </Link>

        {/* Center — Nav Items */}
        <nav className="flex items-center gap-12">
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
                  'flex flex-col items-start text-left transition-opacity duration-150',
                  hasOpenMenu && !isActive && 'opacity-35',
                )}
                onMouseEnter={() => handleMouseEnter(key)}
                onClick={(e) => handleClick(e, key)}
              >
                <span
                  className={cn(
                    'text-[12px] uppercase tracking-[2px]',
                    isActive
                      ? 'font-semibold text-foreground'
                      : 'text-foreground',
                  )}
                >
                  {t(`${key}Label`)}
                </span>
                <span className="text-[10px] text-muted-foreground mt-[3px]">
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
          <SampleCartBadge />
          <NavDarkModeToggle />
          <NavLanguageSwitcher locale={locale} />
        </div>
      </div>

      {/* Mega-menu Panel Container */}
      <div
        className="overflow-hidden rounded-b-4xl transition-[height] duration-300 ease-in-out"
        style={{ height: openMenu ? panelHeight : 0 }}
        onMouseEnter={clearCloseTimer}
      >
        <div
          ref={contentRef}
          className={cn(
            'transition-opacity ease-in-out',
            contentVisible
              ? 'opacity-100 duration-400 delay-100'
              : 'opacity-0 duration-100',
          )}
        >
          {displayedMenu && (
            <div
              role="region"
              aria-label={getActiveLabel(displayedMenu as NavItemKey)}
              className="border-t border-border/60 max-h-[70vh] overflow-y-auto"
            >
              {displayedMenu === 'explore' && (
                <MegaMenuExplore menu={menu.explore} />
              )}
              {displayedMenu === 'filterFind' && (
                <MegaMenuFilterFind menu={menu.filterFind} />
              )}
              {displayedMenu === 'projects' && (
                <MegaMenuProjects menu={menu.projects} />
              )}
              {displayedMenu === 'info' && <MegaMenuInfo menu={menu.info} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
