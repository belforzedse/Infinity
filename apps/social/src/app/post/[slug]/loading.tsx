import { Header } from "@/components/Header";
import { SocialContainer } from "@/components/SocialContainer";
import { POST_CARD_LAYOUTS, fluidMaxWidthCapPx } from "@/components/posts/post-card-variants";
import { PostDetailSkeleton } from "@/components/ui/skeletons/PostDetailSkeleton";
import { StoriesRailSkeleton } from "@/components/ui/skeletons/StoriesRailSkeleton";

const SM = POST_CARD_LAYOUTS.sm;
const XL = POST_CARD_LAYOUTS.xl;

function RelatedPostSkeletonCard({
  aspectW,
  aspectH,
  maxWidth,
}: {
  aspectW: number;
  aspectH: number;
  maxWidth?: number;
}) {
  return (
    <div className="w-full min-w-0" style={maxWidth != null ? { maxWidth } : undefined}>
      <div
        className="skeleton-shimmer w-full rounded-[20px]"
        style={{ aspectRatio: `${aspectW} / ${aspectH}` }}
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
  );
}

export default function PostDetailLoading() {
  const smCap = fluidMaxWidthCapPx("sm");
  const xlCap = fluidMaxWidthCapPx("xl");

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <SocialContainer
        as="main"
        className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-3 lg:pb-12 lg:pt-6"
        dir="rtl"
      >
        <section>
          <StoriesRailSkeleton />
        </section>

        <div className="flex w-full flex-row items-center justify-between gap-3">
          <div className="skeleton-shimmer h-6 w-48 min-w-0 flex-1 rounded-lg" aria-hidden />
          <div className="skeleton-shimmer-light size-9 shrink-0 rounded-xl" aria-hidden />
        </div>

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
            <aside
              className="min-w-0"
              dir="rtl"
              style={{ gridColumn: "4 / span 3", gridRow: "1 / span 4" }}
            >
              <PostDetailSkeleton />
            </aside>

            <div
              style={{ gridColumn: "span 2", gridRow: "span 2" }}
              className="flex min-w-0 justify-center"
            >
              <RelatedPostSkeletonCard maxWidth={xlCap} aspectW={XL.widthPx} aspectH={XL.imageHeightPx} />
            </div>

            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{ gridColumn: "span 1", gridRow: "span 1" }}
                className="flex min-w-0 justify-center"
              >
                <RelatedPostSkeletonCard maxWidth={smCap} aspectW={SM.widthPx} aspectH={SM.imageHeightPx} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col gap-6 lg:hidden">
          <PostDetailSkeleton />
        </div>
      </SocialContainer>
    </div>
  );
}
