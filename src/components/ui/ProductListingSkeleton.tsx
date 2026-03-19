/**
 * Shimmer skeleton for ProductListing — shown while products load.
 * Matches the grid layout of ProductListing (auto-fill, minmax 14rem).
 */
export function ProductListingSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
        gap: '1.5rem',
        flex: 1,
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            aspectRatio: '3/4',
            background:
              'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '0.25rem',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
