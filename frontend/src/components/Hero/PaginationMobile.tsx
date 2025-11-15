import React from "react";
import clsx from "clsx";

type MobilePaginationProps = {
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

export default function PaginationMobile({
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
}: MobilePaginationProps) {
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      {showArrows && (
        <button
          type="button"
          aria-label="Previous"
          onClick={onPrev}
          className={clsx(
            "text-lg mx-1 rounded-full p-1 text-pink-500 transition hover:bg-pink-50",
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
              "rounded-full transition-all",
              i === index
                ? (dotActiveClassName ?? "h-1.5 w-5 bg-pink-600")
                : (dotClassName ?? "h-1.5 w-1.5 bg-pink-200"),
            )}
          />
        ))}
      </div>

      {showArrows && (
        <button
          type="button"
          aria-label="Next"
          onClick={onNext}
          className={clsx(
            "text-lg mx-1 rounded-full p-1 text-pink-500 transition hover:bg-pink-50",
            arrowClassName,
          )}
        >
          ›
        </button>
      )}
    </div>
  );
}
