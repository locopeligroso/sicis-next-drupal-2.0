import { cn } from '@/lib/utils';

interface FilterPanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Sticky sidebar panel for filter/category navigation.
 *
 * Uses CSS `position: sticky` — sticks below the navbar on scroll.
 * When content is taller than viewport, scrolls independently via overflow-y.
 * No JavaScript scroll listeners needed.
 */
export function FilterPanel({ children, className }: FilterPanelProps) {
  return (
    <aside
      className={cn(
        'w-[300px] shrink-0 border-r border-border bg-surface-1',
        className,
      )}
    >
      <div className="sticky top-[calc(72px+2rem)] max-h-[calc(100dvh-72px-2rem)] overflow-y-auto px-(--spacing-content) py-6">
        {children}
      </div>
    </aside>
  );
}
