'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { fetchMenu, transformMenuToNavItems } from '@/lib/fetch-menu';
import type { MenuItem } from '@/lib/fetch-menu';
import MegaMenu from '@/components_legacy/MegaMenu';
import LanguageSwitcher from '@/components_legacy/LanguageSwitcher';

interface HeaderProps {
  locale: string;
  initialMenu?: MenuItem[];
}

export default function Header({ locale, initialMenu }: HeaderProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenu ?? []);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  // Fetch menu client-side if not provided as prop
  useEffect(() => {
    if (initialMenu) return;
    fetchMenu('main', locale).then((menu) => {
      if (menu) setMenuItems(transformMenuToNavItems(menu, locale));
    });
  }, [locale, initialMenu]);

  // Detect touch device once at mount — pointer media type doesn't change mid-session
  useEffect(() => {
    setIsTouch(!window.matchMedia('(pointer: fine)').matches);
  }, []);

  // Close mega-menu on outside click (touch only).
  // Listener is added AFTER React processes the state update that opened the menu,
  // so it does not intercept the tap that triggered the open. Safe by design.
  useEffect(() => {
    if (!isTouch || openIndex === null) return;
    const handleClickOutside = () => setOpenIndex(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isTouch, openIndex]);

  // Close mega-menu on Escape key
  useEffect(() => {
    if (openIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenIndex(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openIndex]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const startCloseTimer = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpenIndex(null), 150);
  }, [clearCloseTimer]);

  const handleNavMouseEnter = useCallback(
    (index: number) => {
      if (isTouch) return;
      clearCloseTimer();
      setOpenIndex(index);
    },
    [isTouch, clearCloseTimer],
  );

  const handleNavMouseLeave = useCallback(() => {
    if (isTouch) return;
    startCloseTimer();
  }, [isTouch, startCloseTimer]);

  const handleNavClick = useCallback(
    (e: React.MouseEvent, index: number, hasChildren: boolean) => {
      if (!isTouch || !hasChildren) return;
      e.preventDefault();
      e.stopPropagation(); // prevent outside-click handler from firing immediately
      setOpenIndex((prev) => (prev === index ? null : index));
    },
    [isTouch],
  );

  const handleMenuClose = useCallback(() => setOpenIndex(null), []);

  const isActiveItem = useCallback(
    (item: MenuItem) => {
      if (!item.url || item.url === `/${locale}`) return false;
      return pathname === item.url || pathname.startsWith(item.url + '/');
    },
    [pathname, locale],
  );

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#fff',
        borderBottom: '0.0625rem solid #e0e0e0',
      }}
    >
      <nav
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          height: '3.5rem',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <Link
          href={`/${locale}`}
          style={{
            fontWeight: 800,
            fontSize: '1.1rem',
            letterSpacing: '0.1em',
            color: '#111',
            textDecoration: 'none',
          }}
        >
          SICIS
        </Link>

        {/* Nav items */}
        <ul
          style={{
            display: 'flex',
            gap: '1.5rem',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            flex: 1,
          }}
        >
          {menuItems.map((item, i) => {
            const hasChildren = item.children.length > 0;
            const isOpen = openIndex === i;
            const isActive = isActiveItem(item);

            return (
              <li key={item.id}>
                <Link
                  href={item.url || `/${locale}`}
                  aria-haspopup={hasChildren ? 'true' : undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  onMouseEnter={() => handleNavMouseEnter(i)}
                  onMouseLeave={handleNavMouseLeave}
                  onClick={(e) => handleNavClick(e, i, hasChildren)}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: isActive ? '#000' : '#444',
                    textDecoration: 'none',
                    borderBottom: isActive
                      ? '0.125rem solid #000'
                      : '0.125rem solid transparent',
                    paddingBottom: '0.2rem',
                    display: 'block',
                  }}
                >
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Language switcher — pushed to far right by flex: 1 on <ul> */}
        <LanguageSwitcher currentLocale={locale} />

        {/* Mega-menu panel — anchored to <nav> (position: relative), not to <li> */}
        {openIndex !== null &&
          menuItems[openIndex]?.children.length > 0 && (
            <MegaMenu
              items={menuItems[openIndex].children}
              onClose={handleMenuClose}
              onMouseEnter={clearCloseTimer}
              onMouseLeave={startCloseTimer}
              locale={locale}
            />
          )}
      </nav>
    </header>
  );
}
