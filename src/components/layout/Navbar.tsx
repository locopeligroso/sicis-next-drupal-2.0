'use client';

import { useState } from 'react';
import type { NavbarMenu } from '@/lib/navbar/types';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { NavbarDesktop } from './NavbarDesktop';
import { NavbarMobile } from './NavbarMobile';

interface NavbarProps {
  locale: string;
  menu: NavbarMenu;
}

export function Navbar({ locale, menu }: NavbarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { isVisible } = useScrollDirection({ forceVisible: openMenu !== null });

  return (
    <>
      <nav
        className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-main overflow-hidden rounded-4xl border border-white/60 bg-white/90 shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur-[20px] transition-transform duration-300 ease-in-out dark:border-white/10 dark:bg-[oklch(0.20_0_0/0.85)]"
        style={{
          transform: isVisible
            ? 'translateY(0)'
            : 'translateY(calc(-100% - 16px))',
        }}
      >
        {/* Desktop */}
        <div className="hidden lg:block">
          <NavbarDesktop
            locale={locale}
            menu={menu}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
          />
        </div>

        {/* Mobile bar only (inside floating container) */}
        <div className="lg:hidden">
          <NavbarMobile locale={locale} menu={menu} barOnly />
        </div>
      </nav>

      {/* Mobile overlay (outside nav to avoid overflow-hidden clipping) */}
      <div className="lg:hidden">
        <NavbarMobile locale={locale} menu={menu} overlayOnly />
      </div>
    </>
  );
}
