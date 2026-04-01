export function ProductListingSkeleton() {
  return (
    <div className="mx-auto max-w-main px-4 py-8 animate-pulse">
      <div className="mb-6 h-8 w-48 rounded bg-muted" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-square rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
