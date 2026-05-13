export function StoriesRailSkeleton() {
  return (
    <section
      className="flex w-full flex-col items-end gap-5 p-0"
      dir="rtl"
      aria-busy="true"
      aria-hidden
    >
      {/* Heading placeholder — mirrors "داستان ها" */}
      <div className="skeleton-shimmer h-6 w-28 self-stretch rounded-lg" />

      {/* Avatar row — matches StoriesRail min-heights */}
      <div className="w-full overflow-hidden">
        <div className="flex min-h-[188px] flex-row items-stretch justify-start gap-4 lg:min-h-0 lg:h-20 lg:items-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shrink-0">
              {/* Mobile: 129×188 portrait card */}
              <div
                className="skeleton-shimmer rounded-[10px] lg:hidden"
                style={{ width: 129, height: 188 }}
                aria-hidden
              />
              {/* Desktop: 80×80 circle */}
              <div
                className="hidden skeleton-shimmer rounded-full lg:block"
                style={{ width: 80, height: 80 }}
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
