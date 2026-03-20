'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MobileFilterTriggerProps {
  activeFilterCount: number
  totalCount?: number
  children: React.ReactNode
}

export function MobileFilterTrigger({
  activeFilterCount,
  totalCount,
  children,
}: MobileFilterTriggerProps) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('filters')

  return (
    <>
      {/* FAB — visible only below md breakpoint */}
      <Button
        className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full shadow-lg md:hidden"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal data-icon="inline-start" className="size-4" />
        {activeFilterCount > 0
          ? t('activeCount', { count: activeFilterCount })
          : t('title')}
      </Button>

      {/* Sheet drawer from left */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex flex-col p-0">
          <SheetTitle className="sr-only">{t('title')}</SheetTitle>

          {/* Scrollable filter content */}
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-4">{children}</div>
          </ScrollArea>

          {/* Sticky footer */}
          <div className="sticky bottom-0 border-t bg-background p-4">
            <Button className="w-full" onClick={() => setOpen(false)}>
              {t('showResults', { count: totalCount ?? 0 })}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
