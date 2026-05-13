import { POST_CARD_LAYOUTS, fluidMaxWidthCapPx } from "@/components/posts/post-card-variants";

const SM = POST_CARD_LAYOUTS.sm;
const XL = POST_CARD_LAYOUTS.xl;

function SkeletonCard({ aspectW, aspectH, maxWidth }: { aspectW: number; aspectH: number; maxWidth?: number }) {
  return (
    <div className="w-full min-w-0" style={maxWidth != null ? { maxWidth } : undefined}>
      <div
        className="skeleton-shimmer w-full rounded-[20px]"
        style={{ aspectRatio: `${aspectW} / ${aspectH}` }}
        aria-hidden
      />
      <div className="mt-2.5 flex h-9 w-full flex-row items-center justify-between px-1">
        <div className="skeleton-shimmer-light size-9 shrink-0 rounded-lg" aria-hidden />
        <div className="flex gap-2">
          <div className="skeleton-shimmer-light h-9 w-12 rounded-lg" aria-hidden />
          <div className="skeleton-shimmer-light h-9 w-12 rounded-lg" aria-hidden />
        </div>
      </div>
    </div>
  );
}

/** Mirrors the 6-column dense grid used by `PostDetailRelatedLayout` on `lg+`. */
export function RelatedPostsSkeleton() {
  const smCap = fluidMaxWidthCapPx("sm");
  const xlCap = fluidMaxWidthCapPx("xl");

  return (
    <div
      aria-busy="true"
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
      {/* xl card — spans 2 cols × 2 rows */}
      <div style={{ gridColumn: "span 2", gridRow: "span 2" }} className="flex min-w-0 justify-center">
        <SkeletonCard maxWidth={xlCap} aspectW={XL.widthPx} aspectH={XL.imageHeightPx} />
      </div>

      {/* 8 small cards */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ gridColumn: "span 1", gridRow: "span 1" }} className="flex min-w-0 justify-center">
          <SkeletonCard maxWidth={smCap} aspectW={SM.widthPx} aspectH={SM.imageHeightPx} />
        </div>
      ))}
    </div>
  );
}
