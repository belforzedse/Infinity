import { Header } from "@/components/Header";
import { PostDetailSkeleton } from "@/components/ui/skeletons/PostDetailSkeleton";

export default function PostDetailLoading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main
        className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-8 pt-3 sm:px-6 lg:px-[60px] lg:pb-12 lg:pt-6"
        dir="rtl"
      >
        {/* Title + back-button row placeholder */}
        <div className="flex w-full flex-row items-center justify-between gap-3">
          <div className="skeleton-shimmer h-6 w-48 min-w-0 flex-1 rounded-lg" aria-hidden />
          <div className="skeleton-shimmer-light size-9 shrink-0 rounded-xl" aria-hidden />
        </div>

        {/* Desktop: post card left, related posts right */}
        <div className="hidden w-full min-w-0 lg:block">
          <div
            dir="ltr"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
              columnGap: 6,
              rowGap: 8,
              gridAutoFlow: "dense",
              alignItems: "start",
            }}
          >
            {/* Post card: 2 cols */}
            <div style={{ gridColumn: "span 2" }}>
              <PostDetailSkeleton />
            </div>
            {/* Related placeholder cards: 4 cols × 2 rows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{ gridColumn: "span 1", gridRow: "span 1" }}
                className="flex min-w-0 justify-center"
              >
                <div className="w-full min-w-0">
                  <div
                    className="skeleton-shimmer w-full rounded-[20px]"
                    style={{ aspectRatio: "236 / 317" }}
                    aria-hidden
                  />
                  <div className="mt-2.5 flex h-9 w-full items-center justify-between px-1">
                    <div className="skeleton-shimmer-light size-9 rounded-lg" aria-hidden />
                    <div className="flex gap-2">
                      <div className="skeleton-shimmer-light h-9 w-12 rounded-lg" aria-hidden />
                      <div className="skeleton-shimmer-light h-9 w-12 rounded-lg" aria-hidden />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: stacked */}
        <div className="flex w-full flex-col gap-6 lg:hidden">
          <PostDetailSkeleton />
        </div>
      </main>
    </div>
  );
}
