"use client";
import { useState } from "react";

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const isValidHex = (c?: string | null): c is string => !!c && HEX_PATTERN.test(c.trim());

type Props = {
  colors: {
    id: string;
    title: string;
    colorCode: string | null | undefined;
  }[];
  onColorChange?: (colorId: string) => void;
  selectedColor?: string;
  disabledColorIds?: string[];
};

export default function PDPHeroInfoColor(props: Props) {
  const {
    colors,
    onColorChange,
    selectedColor: externalSelectedColor,
    disabledColorIds = [],
  } = props;

  const [internalSelectedColor, setInternalSelectedColor] = useState<string>(colors[0]?.id || "");

  const selectedColor =
    externalSelectedColor !== undefined ? externalSelectedColor : internalSelectedColor;

  const handleColorClick = (colorId: string) => {
    setInternalSelectedColor(colorId);
    if (onColorChange) {
      onColorChange(colorId);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-foreground-primary text-xl">انتخاب رنگ</span>

      <div
        className="flex max-w-full flex-nowrap items-center gap-4 overflow-x-auto overflow-y-visible px-1 py-1"
        role="radiogroup"
        aria-label="انتخاب رنگ محصول"
      >
        {colors.map((color) => {
          const isSelected = color.id === selectedColor;
          const isDisabled = disabledColorIds.includes(color.id);
          const hasSwatch = isValidHex(color.colorCode);

          if (hasSwatch) {
            // ── Swatch-style button (color has a valid hex code) ──
            return (
              <div key={color.id} className="flex shrink-0 items-center">
                {isSelected ? (
                  <button
                    type="button"
                    className="flex shrink-0 items-center gap-1 rounded-3xl border border-gray-300 p-1"
                    aria-pressed="true"
                    aria-label={`رنگ انتخاب شده: ${color.title}`}
                    disabled
                  >
                    <div
                      className="h-7 w-7 rounded-full"
                      style={{ backgroundColor: color.colorCode! }}
                      aria-hidden="true"
                    />
                    <span className="text-foreground-primary text-sm">{color.title}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => (isDisabled ? undefined : handleColorClick(color.id))}
                    className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors"
                    style={{
                      backgroundColor: isDisabled ? "#f3f4f6" : color.colorCode!,
                      borderColor: isDisabled ? "#d1d5db" : "#e5e7eb",
                    }}
                    disabled={isDisabled}
                    aria-disabled={isDisabled}
                    aria-label={
                      isDisabled ? `رنگ ${color.title} ناموجود` : `انتخاب رنگ ${color.title}`
                    }
                    aria-pressed="false"
                    title={isDisabled ? "ناموجود" : color.title}
                  >
                    {isDisabled && (
                      <>
                        <span className="absolute inset-0 rounded-full opacity-60" />
                        <span className="absolute h-0.5 w-4 rotate-45 bg-[rgba(0,0,0,0.55)]" />
                        <span className="absolute h-0.5 w-4 -rotate-45 bg-[rgba(0,0,0,0.55)]" />
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          }

          // ── Text/model-style button (hex-less color) ──
          return (
            <div key={color.id} className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => (isDisabled ? undefined : handleColorClick(color.id))}
                className="shrink-0 rounded-3xl px-3 py-1 text-sm transition-colors"
                style={
                  isDisabled
                    ? {
                        opacity: 0.5,
                        textDecoration: "line-through",
                        cursor: "not-allowed",
                        border: "1px solid #e2e8f0",
                      }
                    : isSelected
                      ? {
                          backgroundColor: "#0f172a",
                          color: "#fff",
                          border: "1px solid #0f172a",
                        }
                      : {
                          border: "1px solid #e2e8f0",
                        }
                }
                disabled={isDisabled}
                aria-disabled={isDisabled}
                aria-pressed={isSelected ? "true" : "false"}
                aria-label={
                  isDisabled ? `رنگ ${color.title} ناموجود` : `انتخاب رنگ ${color.title}`
                }
                title={isDisabled ? "ناموجود" : color.title}
              >
                {color.title}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
