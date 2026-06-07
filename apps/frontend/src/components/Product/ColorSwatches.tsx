import React from "react";
import clsx from "clsx";

export type ColorSwatch = string | { code: string; name?: string };

interface ColorSwatchesProps {
  colorCodes?: ColorSwatch[];
  colorsCount?: number;
  className?: string;
  maxVisible?: number;
  size?: "sm" | "md";
}

const HEX_COLOR_PATTERN =
  /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const FALLBACK_COLOR = "#CBD5E1";
const FALLBACK_LABEL = "Fallback color";

const isValidColor = (value: string): boolean => {
  const trimmed = value.trim();
  if (HEX_COLOR_PATTERN.test(trimmed)) return true;
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function") {
    return CSS.supports("color", trimmed);
  }
  return false;
};

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
          colorCodes.slice(0, maxVisible).map((color, index) => {
            const rawCode = typeof color === "string" ? color : color.code;
            const rawLabel = typeof color === "string" ? color : color.name ?? color.code;
            const isValid = isValidColor(rawCode);
            const validCode = isValid ? rawCode.trim() : FALLBACK_COLOR;
            const label = isValid ? rawLabel : FALLBACK_LABEL;

            return (
              <div
                key={`${rawCode}-${index}`}
                className={clsx(
                  "relative rounded-full border border-white shadow-sm overflow-hidden",
                  isSmall ? "h-4 w-4" : "h-5 w-5 border-2"
                )}
                style={{ backgroundColor: validCode, zIndex: maxVisible - index }}
                role="img"
                aria-label={label}
                title={label}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40"
                  aria-hidden="true"
                />
              </div>
            );
          })
        ) : (
          <>
            <div
              className={clsx(
                "relative rounded-full border border-white bg-gradient-to-r from-blue-600 to-blue-400 shadow-sm overflow-hidden",
                isSmall ? "h-4 w-4" : "h-5 w-5 border-2"
              )}
              style={{ zIndex: 3 }}
              role="img"
              aria-label="Blue gradient"
              title="Blue gradient"
            >
              <div
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40"
                aria-hidden="true"
              />
            </div>
            <div
              className={clsx(
                "relative rounded-full border border-white bg-gradient-to-r from-infinity-primary to-infinity-primary-light shadow-sm overflow-hidden",
                isSmall ? "h-4 w-4" : "h-5 w-5 border-2"
              )}
              style={{ zIndex: 2 }}
              role="img"
              aria-label="Pink gradient"
              title="Pink gradient"
            >
              <div
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40"
                aria-hidden="true"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ColorSwatches;
