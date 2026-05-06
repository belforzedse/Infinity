"use client";
import { useState } from "react";

type Props = {
  colors: {
    id: string;
    title: string;
    colorCode: string;
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

  // Use either the external selected color if provided, or the internal state
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
      <span className="text-xl text-foreground-primary">انتخاب رنگ</span>

      <div
        className="flex items-center gap-4"
        role="radiogroup"
        aria-label="انتخاب رنگ محصول"
      >
        {colors.map((color) => {
          const isSelected = color.id === selectedColor;
          const isDisabled = disabledColorIds.includes(color.id);
          return (
            <div key={color.id} className="flex items-center">
              {isSelected ? (
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-3xl border border-gray-300 p-1"
                  aria-pressed="true"
                  aria-label={`رنگ انتخاب شده: ${color.title}`}
                  disabled
                >
                  <div
                    className="h-7 w-7 rounded-full"
                    style={{ backgroundColor: color.colorCode }}
                    aria-hidden="true"
                  />

                  <span className="text-sm text-foreground-primary">{color.title}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => (isDisabled ? undefined : handleColorClick(color.id))}
                  className="relative flex h-7 w-7 items-center justify-center rounded-full border transition-colors"
                  style={{
                    backgroundColor: isDisabled ? "#f3f4f6" : color.colorCode,
                    borderColor: isDisabled ? "#d1d5db" : "#e5e7eb",
                  }}
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  aria-label={isDisabled ? `رنگ ${color.title} ناموجود` : `انتخاب رنگ ${color.title}`}
                  aria-pressed="false"
                  title={isDisabled ? "ناموجود" : color.title}
                >
                  {isDisabled && (
                    <>
                      <span className="absolute inset-0 rounded-full opacity-60" />
                      <span className="absolute h-0.5 w-4 bg-[rgba(0,0,0,0.55)] rotate-45" />
                      <span className="absolute h-0.5 w-4 bg-[rgba(0,0,0,0.55)] -rotate-45" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
