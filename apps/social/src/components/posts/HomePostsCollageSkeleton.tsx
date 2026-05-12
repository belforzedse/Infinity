import {
  fluidMaxWidthCapPx,
  HOME_COLLAGE_SUBLG_MOBILE_LG_MAX_PX,
  POST_CARD_LAYOUTS,
} from "@/components/posts/post-card-variants";

const SM = POST_CARD_LAYOUTS["mobile-sm"];
const LG = POST_CARD_LAYOUTS["mobile-lg"];
const XL = POST_CARD_LAYOUTS.xl;
const DESKTOP_SM = POST_CARD_LAYOUTS.sm;

function CardPulseShell({
  aspectW,
  aspectH,
  maxWidthPx,
}: {
  aspectW: number;
  aspectH: number;
  /** Omit to let the shell grow with the grid track (sub-`lg` small tiles). */
  maxWidthPx?: number;
}) {
  return (
    <div className="w-full min-w-0" style={maxWidthPx != null ? { maxWidth: maxWidthPx } : undefined}>
      <div
        className="w-full animate-pulse rounded-[20px] bg-zinc-200/90"
        style={{ aspectRatio: `${aspectW} / ${aspectH}` }}
        aria-hidden
      />
      <div className="mt-2.5 flex h-9 w-full flex-row items-center justify-between px-1">
        <div className="size-9 shrink-0 animate-pulse rounded-lg bg-zinc-100" aria-hidden />
        <div className="flex gap-2">
          <div className="h-9 w-14 animate-pulse rounded-lg bg-zinc-100" aria-hidden />
          <div className="h-9 w-14 animate-pulse rounded-lg bg-zinc-100" aria-hidden />
        </div>
      </div>
    </div>
  );
}

/**
 * Homepage «پست ها» loading shell — mirrors collage breakpoints (storefront-style pulse blocks).
 */
export function HomePostsCollageSkeleton() {
  const xlCap = fluidMaxWidthCapPx("xl");
  const desktopSmCap = fluidMaxWidthCapPx("sm");

  return (
    <section
      className="flex w-full min-w-0 flex-col items-stretch gap-3 p-0 lg:gap-4"
      dir="rtl"
      aria-busy="true"
      aria-labelledby="home-posts-heading-skel"
    >
      <h2
        id="home-posts-heading-skel"
        className="self-stretch text-right font-peyda text-2xl font-bold leading-[21px] text-[#424242]"
      >
        پست ها
      </h2>

      {/* Tablet / mobile: 2 cols phone, 3 cols md–lg; capped large row */}
      <div
        className="grid w-full min-w-0 grid-cols-2 gap-x-2 gap-y-2 md:grid-cols-3 md:gap-x-2 md:gap-y-2 lg:hidden"
        dir="ltr"
      >
        {Array.from({ length: 3 }, (_, i) => (
          <div key={`sk-sm-a-${i}`} className="min-w-0 w-full">
            <CardPulseShell aspectW={SM.widthPx} aspectH={SM.imageHeightPx} />
          </div>
        ))}
        <div className="col-span-2 flex min-w-0 justify-center md:col-span-3">
          <div className="w-full min-w-0" style={{ maxWidth: HOME_COLLAGE_SUBLG_MOBILE_LG_MAX_PX }}>
            <CardPulseShell aspectW={LG.widthPx} aspectH={LG.imageHeightPx} />
          </div>
        </div>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={`sk-sm-b-${i}`} className="min-w-0 w-full">
            <CardPulseShell aspectW={SM.widthPx} aspectH={SM.imageHeightPx} />
          </div>
        ))}
      </div>

      {/* Desktop: 6-col dense band (subset of real grid) */}
      <div className="hidden w-full min-w-0 lg:block" dir="ltr">
        <div
          className="mx-auto grid w-full max-w-full justify-items-stretch px-0 [&>div]:min-w-0"
          style={{
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            columnGap: 6,
            rowGap: 8,
            gridAutoFlow: "dense",
          }}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={`d-sm-${i}`}
              style={{ gridColumn: "span 1", gridRow: "span 1" }}
              className="flex min-w-0 justify-center"
            >
              <CardPulseShell
                maxWidthPx={desktopSmCap}
                aspectW={DESKTOP_SM.widthPx}
                aspectH={DESKTOP_SM.imageHeightPx}
              />
            </div>
          ))}
          <div style={{ gridColumn: "span 2", gridRow: "span 2" }} className="flex min-w-0 justify-center">
            <CardPulseShell maxWidthPx={xlCap} aspectW={XL.widthPx} aspectH={XL.imageHeightPx} />
          </div>
          <div style={{ gridColumn: "span 1", gridRow: "span 1" }} className="flex min-w-0 justify-center">
            <CardPulseShell
              maxWidthPx={desktopSmCap}
              aspectW={DESKTOP_SM.widthPx}
              aspectH={DESKTOP_SM.imageHeightPx}
            />
          </div>
          <div style={{ gridColumn: "span 1", gridRow: "span 1" }} className="flex min-w-0 justify-center">
            <CardPulseShell
              maxWidthPx={desktopSmCap}
              aspectW={DESKTOP_SM.widthPx}
              aspectH={DESKTOP_SM.imageHeightPx}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
