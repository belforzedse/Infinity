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
      className={clsx(
        "py-1backdrop-blur-md flex items-center gap-2 rounded-2xl bg-white/80 px-2",
        className,
      )}
    >
      {showArrows && (
        <button
          type="button"
          aria-label="Next"
          onClick={onNext}
          className={clsx(
            "mx-1 rounded-full p-1 text-pink-600 transition hover:bg-pink-50",
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
              i === index ? "w-6 bg-pink-600" : "w-2 bg-gray-300",
              i === index ? dotActiveClassName : dotClassName,
            )}
          />
        ))}
      </div>

      {showArrows && (
        <button
          type="button"
          aria-label="Previous"
          onClick={onPrev}
          className={clsx(
            "mx-1 rounded-full p-1 text-pink-600 transition hover:bg-pink-50",
            arrowClassName,
          )}
        >
          ›
        </button>
      )}
    </div>
  );
}
