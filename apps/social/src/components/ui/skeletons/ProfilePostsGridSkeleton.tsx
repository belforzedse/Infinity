export function ProfilePostsGridSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6" dir="rtl" aria-busy="true">
      {/* Title row + tabs placeholder */}
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title + back-button row */}
        <div className="flex flex-row items-center gap-3">
          <div className="skeleton-shimmer h-7 w-36 rounded-lg" aria-hidden />
          <div className="hidden size-9 rounded-xl skeleton-shimmer-light lg:block" aria-hidden />
        </div>
        {/* Tabs pill */}
        <div className="skeleton-shimmer-light h-12 w-full rounded-2xl sm:w-48" aria-hidden />
      </div>

      {/* Uniform 2/3/4-col grid — mirrors ProfilePostsPage grid at line 393 */}
      <div className="grid w-full grid-flow-dense grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
        {/* One large 2×2 tile */}
        <div className="col-span-2 row-span-2 min-w-0">
          <div
            className="w-full skeleton-shimmer rounded-[20px]"
            style={{ aspectRatio: "1 / 1" }}
            aria-hidden
          />
        </div>
        {/* 8 regular tiles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="min-w-0">
            <div
              className="w-full skeleton-shimmer rounded-[20px]"
              style={{ aspectRatio: "1 / 1" }}
              aria-hidden
            />
          </div>
        ))}
      </div>
    </div>
  );
}
