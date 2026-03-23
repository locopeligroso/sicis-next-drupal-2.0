'use client';

import type { NavbarMenu } from '@/lib/navbar/types';

interface NavbarDesktopProps {
  locale: string;
  menu: NavbarMenu;
  openMenu: string | null;
  setOpenMenu: (key: string | null) => void;
}

export function NavbarDesktop({
  locale: _locale,
  menu: _menu,
  openMenu: _openMenu,
  setOpenMenu: _setOpenMenu,
}: NavbarDesktopProps) {
  return (
    <div className="flex items-center justify-between px-9 h-[72px]">
      <span className="text-sm font-bold tracking-[4px]">SICIS</span>
      <span className="text-xs text-muted-foreground">
        Desktop navbar placeholder
      </span>
    </div>
  );
}
