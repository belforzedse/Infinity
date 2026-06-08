import React from "react";
import clsx from "clsx";

type HeroPaginationProps = {
  total: number;
  index: number;
  onDotClick?: (i: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
  showArrows?: boolean;
  className?: string;
  dotClassName?: string;
  dotActiveClassName?: string;
  arrowClassName?: string;
};

export default function HeroPagination({
  total,
  index,
  onDotClick,
  onNext,
  onPrev,
  showArrows = true,
  className,
  dotClassName,
  dotActiveClassName,
  arrowClassName,
}: HeroPaginationProps) {
  return (
    <div className={clsx("glass-pill flex items-center gap-1.5 px-1.5 py-0.5", className)}>
      {showArrows && (
        <button
          type="button"
          aria-label="Next"
          onClick={onPrev}
          className={clsx(
            "mx-0.5 mt-0.5 rounded-full p-0.5 text-[24px] leading-none text-infinity-primary transition hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary-lighter/50",
            arrowClassName,
          )}
        >
          ‹
        </button>
      )}

      <div className="flex items-center gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <button
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            key={i}
            onClick={() => onDotClick?.(i)}
            className={clsx(
              "h-1.5 rounded-full transition-all",
              i === index
                ? "w-12 bg-infinity-primary/70 ring-[0.5px] ring-white/35 backdrop-blur-[0.2px]"
                : "w-4 bg-infinity-primary/20",
              i === index ? dotActiveClassName : dotClassName,
            )}
          />
        ))}
      </div>

      {showArrows && (
        <button
          type="button"
          aria-label="Previous"
          onClick={onNext}
          className={clsx(
            "mx-0.5 mt-0.5 rounded-full p-0.5 text-[24px] leading-none text-infinity-primary transition hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary-lighter/50",
            arrowClassName,
          )}
        >
          ›
        </button>
      )}
    </div>
  );
}
