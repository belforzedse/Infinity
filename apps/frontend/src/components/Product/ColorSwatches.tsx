import React from "react";
import clsx from "clsx";
import { faNum } from "@/utils/faNum";

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
  maxVisible = 2,
  size = "md",
}) => {
  const isSmall = size === "sm";
  const validCodes =
    colorCodes?.filter((color) => {
      const rawCode = typeof color === "string" ? color : color.code;
      return rawCode && isValidColor(rawCode);
    }) ?? [];

  const totalCount = colorsCount && colorsCount > 0 ? colorsCount : validCodes.length;
  const visibleSwatches = validCodes.slice(0, maxVisible);
  const remaining =
    totalCount > visibleSwatches.length ? totalCount - visibleSwatches.length : 0;

  return (
    <div
      className={clsx("product-card-color-badge", isSmall ? "gap-1" : "gap-1.5", className)}
      role="img"
      aria-label={
        totalCount > 0
          ? `${faNum(totalCount)} رنگ`
          : "پیش‌نمایش رنگ"
      }
    >
      <div
        className={clsx(
          "flex items-center rtl:space-x-reverse",
          isSmall ? "-space-x-1" : "-space-x-1.5",
        )}
      >
        {visibleSwatches.length > 0 ? (
          visibleSwatches.map((color, index) => {
            const rawCode = typeof color === "string" ? color : color.code;
            const rawLabel = typeof color === "string" ? color : (color.name ?? color.code);
            const validCode = rawCode.trim();

            return (
              <div
                key={`${validCode}-${index}`}
                className={clsx(
                  "relative overflow-hidden rounded-full border border-white shadow-sm",
                  isSmall ? "h-3.5 w-3.5" : "h-4 w-4",
                )}
                style={{ backgroundColor: validCode, zIndex: maxVisible - index }}
                title={rawLabel}
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
                "relative overflow-hidden rounded-full border border-white bg-gradient-to-r from-amber-200 to-amber-400 shadow-sm",
                isSmall ? "h-3.5 w-3.5" : "h-4 w-4",
              )}
              style={{ zIndex: 2 }}
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40"
                aria-hidden="true"
              />
            </div>
            <div
              className={clsx(
                "relative overflow-hidden rounded-full border border-white bg-gradient-to-r from-infinity-primary to-infinity-primary-light shadow-sm",
                isSmall ? "h-3.5 w-3.5" : "h-4 w-4",
              )}
              style={{ zIndex: 1 }}
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40"
                aria-hidden="true"
              />
            </div>
          </>
        )}
      </div>
      {remaining > 0 && (
        <span
          className={clsx(
            "font-medium text-white",
            isSmall ? "text-[10px]" : "text-xs",
          )}
        >
          +{faNum(remaining)}
        </span>
      )}
    </div>
  );
};

export default ColorSwatches;
