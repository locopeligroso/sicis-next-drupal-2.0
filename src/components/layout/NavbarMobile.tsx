'use client';

import type { NavbarMenu } from '@/lib/navbar/types';

interface NavbarMobileProps {
  locale: string;
  menu: NavbarMenu;
}

export function NavbarMobile({ locale: _locale, menu: _menu }: NavbarMobileProps) {
  return (
    <div className="flex items-center justify-between px-6 h-[56px]">
      <span className="text-sm font-bold tracking-[4px]">SICIS</span>
      <span className="text-xs text-muted-foreground">&#9776;</span>
    </div>
  );
}
