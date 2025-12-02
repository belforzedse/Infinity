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
    <div
      className={clsx("glass-pill flex items-center gap-2 px-2 py-1", className)}
    >
      {showArrows && (
        <button
          type="button"
          aria-label="Next"
          onClick={onPrev}
          className={clsx(
            "mx-1 mt-1 rounded-full p-1 text-[28px] text-pink-500 transition hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/50",
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
                ? "w-12 bg-pink-500/70 backdrop-blur-[0.2px] ring-[0.5px] ring-white/35"
                : "w-4 bg-pink-500/20",
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
            "mx-1 mt-1 rounded-full p-1 text-[28px] text-pink-500 transition hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/50",
            arrowClassName,
          )}
        >
          ›
        </button>
      )}
    </div>
  );
}
