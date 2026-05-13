export function ProfileFormSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      {/* Page heading — back button (lg only) + title */}
      <div className="flex items-center gap-3">
        <div className="hidden size-9 shrink-0 rounded-sm skeleton-shimmer-light lg:block" aria-hidden />
        <div className="skeleton-shimmer h-7 w-48 rounded-lg" aria-hidden />
      </div>

      {/* 2-column field grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`space-y-2 ${i === 2 ? "sm:col-span-2" : ""}`}>
            <div className="skeleton-shimmer-light h-4 w-20 rounded" aria-hidden />
            <div className="skeleton-shimmer h-11 w-full rounded-xl" aria-hidden />
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <div className="skeleton-shimmer h-11 w-32 rounded-full" aria-hidden />
      </div>
    </div>
  );
}
