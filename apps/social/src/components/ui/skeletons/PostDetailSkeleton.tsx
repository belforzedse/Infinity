export function PostDetailSkeleton() {
  return (
    <article
      className="w-full min-w-0 rounded-[32px] bg-white px-3 pb-4 pt-2 shadow-[0_18px_45px_rgba(61,76,110,0.06)] sm:px-5 lg:px-2"
      aria-busy="true"
      dir="rtl"
    >
      {/* Carousel placeholder */}
      <div
        className="skeleton-shimmer w-full rounded-[28px]"
        style={{ aspectRatio: "4 / 5" }}
        aria-hidden
      />

      {/* Action row: bookmark + counts */}
      <div dir="ltr" className="mt-3 flex items-center justify-between px-1">
        <div className="skeleton-shimmer-light size-10 rounded-xl" aria-hidden />
        <div className="flex flex-row items-center gap-4">
          <div className="skeleton-shimmer-light h-7 w-24 rounded-full" aria-hidden />
          <div className="skeleton-shimmer-light h-7 w-20 rounded-full" aria-hidden />
        </div>
      </div>

      {/* Title + caption */}
      <div className="mt-2 space-y-2 px-1">
        <div className="skeleton-shimmer h-6 w-2/3 rounded-lg" aria-hidden />
        <div className="skeleton-shimmer-light h-4 w-1/2 rounded" aria-hidden />
      </div>

      {/* Comments header */}
      <div className="mt-8 flex flex-row items-center justify-between gap-3 px-1">
        <div className="skeleton-shimmer-light h-11 w-32 rounded-full" aria-hidden />
        <div className="skeleton-shimmer h-6 w-28 rounded-lg" aria-hidden />
      </div>

      {/* Comment placeholders */}
      <div className="mt-4 space-y-4 px-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-row items-start gap-3">
            <div className="skeleton-shimmer size-[42px] shrink-0 rounded-full" aria-hidden />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <div className="skeleton-shimmer h-3.5 w-1/4 rounded" aria-hidden />
              <div className="skeleton-shimmer-light h-3 w-3/4 rounded" aria-hidden />
              <div className="skeleton-shimmer-light h-3 w-1/2 rounded" aria-hidden />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
