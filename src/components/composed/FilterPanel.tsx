import { cn } from '@/lib/utils'

interface FilterPanelProps {
  children: React.ReactNode
  className?: string
}

/**
 * Glassmorphism panel — uses raw white/alpha values intentionally (not semantic
 * tokens) so the translucent backdrop‑blur effect works.  Values mirror the
 * Navbar (`src/components/layout/Navbar.tsx` line 22).
 */
export function FilterPanel({ children, className }: FilterPanelProps) {
  return (
    <aside
      className={cn(
        'w-[250px] shrink-0 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur-[20px]',
        'dark:border-white/10 dark:bg-[oklch(0.20_0_0/0.85)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.15)]',
        className,
      )}
    >
      {children}
    </aside>
  )
}
