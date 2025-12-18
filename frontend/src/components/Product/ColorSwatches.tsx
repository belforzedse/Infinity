import React from "react";
import clsx from "clsx";

interface ColorSwatchesProps {
  colorCodes?: string[];
  colorsCount?: number;
  className?: string;
  maxVisible?: number;
  size?: "sm" | "md";
}

const ColorSwatches: React.FC<ColorSwatchesProps> = ({
  colorCodes,
  colorsCount,
  className,
  maxVisible = 3,
  size = "md",
}) => {
  if (!colorsCount || colorsCount <= 0) return null;

  const isSmall = size === "sm";

  return (
    <div
      className={clsx(
        "flex items-center backdrop-blur-sm shadow-md",
        isSmall
          ? "gap-1 rounded-xl bg-stone-50/90 px-1.5 py-0.5"
          : "gap-1.5 rounded-2xl bg-stone-50/90 px-2 py-1",
        className
      )}
    >
      <span
        className={clsx(
          "font-bold text-neutral-800",
          isSmall ? "text-xs" : "text-sm"
        )}
      >
        {colorsCount > 9 ? "9+" : colorsCount}
      </span>
      <div
        className={clsx(
          "flex items-center rtl:space-x-reverse",
          isSmall ? "-space-x-1.5" : "-space-x-2"
        )}
      >
        {colorCodes && colorCodes.length > 0 ? (
          colorCodes.slice(0, maxVisible).map((code, index) => (
            <div
              key={`${code}-${index}`}
              className={clsx(
                "relative rounded-full border border-white shadow-sm overflow-hidden",
                isSmall ? "h-4 w-4" : "h-5 w-5 border-2"
              )}
              style={{ backgroundColor: code, zIndex: maxVisible - index }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40" />
            </div>
          ))
        ) : (
          <>
            <div
              className={clsx(
                "relative rounded-full border border-white bg-gradient-to-r from-blue-600 to-blue-400 shadow-sm overflow-hidden",
                isSmall ? "h-4 w-4" : "h-5 w-5 border-2"
              )}
              style={{ zIndex: 3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40" />
            </div>
            <div
              className={clsx(
                "relative rounded-full border border-white bg-gradient-to-r from-pink-600 to-pink-400 shadow-sm overflow-hidden",
                isSmall ? "h-4 w-4" : "h-5 w-5 border-2"
              )}
              style={{ zIndex: 2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ColorSwatches;
