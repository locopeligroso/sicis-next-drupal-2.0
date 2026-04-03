'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import type { NavbarMenu } from '@/lib/navbar/types';
import { Button } from '@/components/ui/button';
import { NavDarkModeToggle } from '@/components/composed/NavDarkModeToggle';
import { NavLanguageSwitcher } from '@/components/composed/NavLanguageSwitcher';
import { SampleCartBadge } from '@/components/composed/SampleCartBadge';
import { MegaMenuSection } from '@/components/composed/MegaMenuSection';
import { cn } from '@/lib/utils';

interface NavbarDesktopProps {
  locale: string;
  menu: NavbarMenu;
  openMenu: string | null;
  setOpenMenu: (key: string | null) => void;
}

export function NavbarDesktop({
  locale,
  menu,
  openMenu,
  setOpenMenu,
}: NavbarDesktopProps) {
  const [isTouch, setIsTouch] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        setDisplayedMenu(openMenu);
        requestAnimationFrame(() => setContentVisible(true));
      } else if (openMenu !== displayedMenu) {
        setContentVisible(false);
        switchTimerRef.current = setTimeout(() => {
          setDisplayedMenu(openMenu);
          requestAnimationFrame(() => setContentVisible(true));
        }, 100);
      }
    } else {
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

  useEffect(() => {
    setIsTouch(!window.matchMedia('(pointer: fine)').matches);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenMenu(null);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setOpenMenu]);

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

  // Find the active section for aria-label
  const activeSection = menu.sections.find((s) => s.title === displayedMenu);

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

        {/* Center — Nav Items (CMS-driven) */}
        <nav className="flex items-center gap-12">
          {menu.sections.map((section) => {
            const key = section.title;
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
                  {section.title}
                </span>
                {section.description && (
                  <span className="text-[10px] text-muted-foreground mt-[3px]">
                    {section.description}
                  </span>
                )}
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
          {activeSection && (
            <div
              role="region"
              aria-label={activeSection.title}
              className="border-t border-border/60 max-h-[70vh] overflow-y-auto"
            >
              <MegaMenuSection section={activeSection} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
