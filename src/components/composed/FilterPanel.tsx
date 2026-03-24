import { cn } from '@/lib/utils'

interface FilterPanelProps {
  children: React.ReactNode
  className?: string
}

/**
 * Side panel anchored to the left edge, full height from top of page.
 * Uses -mt-[92px] + pt-[92px] to cancel the layout's navbar offset
 * and extend the panel background to the very top of the viewport.
 */
export function FilterPanel({ children, className }: FilterPanelProps) {
  return (
    <aside
      className={cn(
        'w-[250px] shrink-0 border-r border-border bg-surface-1 -mt-[92px] pt-[92px] min-h-screen',
        className,
      )}
    >
      <div className="p-4">
        {children}
      </div>
    </aside>
  )
}
