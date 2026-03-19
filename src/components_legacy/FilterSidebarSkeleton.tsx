/**
 * Shimmer skeleton for FilterSidebar — shown while filter options load.
 * Matches the sidebar width (16.25rem) used in the filter-page-grid layout.
 */
export function FilterSidebarSkeleton() {
  return (
    <aside style={{ width: '16.25rem', flexShrink: 0 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '8rem',
            background:
              'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '0.25rem',
            marginBottom: '1rem',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </aside>
  );
}
