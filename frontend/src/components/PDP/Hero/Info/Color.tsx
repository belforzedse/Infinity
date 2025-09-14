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

  const [internalSelectedColor, setInternalSelectedColor] = useState<string>(
    colors[0]?.id || ""
  );

  // Use either the external selected color if provided, or the internal state
  const selectedColor =
    externalSelectedColor !== undefined
      ? externalSelectedColor
      : internalSelectedColor;

  const handleColorClick = (colorId: string) => {
    setInternalSelectedColor(colorId);
    if (onColorChange) {
      onColorChange(colorId);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-foreground-primary text-xl">انتخاب رنگ</span>

      <div className="flex gap-4 items-center">
        {colors.map((color) => {
          const isSelected = color.id === selectedColor;
          const isDisabled = disabledColorIds.includes(color.id);
          return (
            <div key={color.id} className="flex items-center">
              {isSelected ? (
                <div className="flex gap-1 items-center p-1 rounded-3xl border border-gray-300">                                                               
                  <div
                    className="w-7 h-7 rounded-full"
                    style={{ backgroundColor: color.colorCode }}
                  />

                  <span className="text-sm text-foreground-primary">
                    {color.title}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => (isDisabled ? undefined : handleColorClick(color.id))}
                  className={`w-7 h-7 rounded-full ${
                    isDisabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  style={{ backgroundColor: color.colorCode }}
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  title={isDisabled ? "ناموجود" : color.title}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
