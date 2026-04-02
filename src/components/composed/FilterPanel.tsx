import { cn } from '@/lib/utils';

interface FilterPanelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Fixed sidebar panel for filter/category navigation.
 *
 * Fixed to the left edge, full height below the navbar.
 * Content scrolls independently when taller than viewport.
 */
export function FilterPanel({ children, className }: FilterPanelProps) {
  return (
    <aside
      className={cn(
        'fixed top-0 left-0 bottom-0 w-[300px] border-r border-border bg-surface-1 overflow-y-auto px-(--spacing-content) pt-(--spacing-navbar) pb-6',
        className,
      )}
    >
      {children}
    </aside>
  );
}
