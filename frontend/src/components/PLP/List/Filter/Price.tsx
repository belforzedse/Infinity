"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// TODO: Evaluate using a lighter range slider or native `<input type="range">`
const Slider = dynamic(() => import("rc-slider"), { ssr: false });

interface PriceFilterProps {
  minPrice?: number;
  maxPrice?: number;
  minPriceValue?: number;
  maxPriceValue?: number;
  onPriceChange?: (min: number, max: number) => void;
}

const PriceFilter = ({
  minPrice = 200000,
  maxPrice = 500000,
  minPriceValue,
  maxPriceValue,
  onPriceChange,
}: PriceFilterProps) => {
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);
  const [inputValues, setInputValues] = useState({
    min: formatPrice(minPrice),
    max: formatPrice(maxPrice),
  });

  useEffect(() => {
    import("rc-slider/assets/index.css");
  }, []);

  useEffect(() => {
    setPriceRange([minPriceValue || minPrice, maxPriceValue || maxPrice]);
    setInputValues({
      min: formatPrice(minPriceValue || minPrice),
      max: formatPrice(maxPriceValue || maxPrice),
    });
  }, [minPriceValue, maxPriceValue, minPrice, maxPrice]);

  const handleSliderChange = (value: number | number[]) => {
    if (!Array.isArray(value)) return;

    setPriceRange([value[0], value[1]]);
    setInputValues({
      min: formatPrice(value[0]),
      max: formatPrice(value[1]),
    });
    onPriceChange?.(value[0], value[1]);
  };

  function formatPrice(price: number) {
    return `${(price / 1000).toLocaleString("fa-IR")}`;
  }

  function parsePrice(value: string): number {
    return parseInt(value.replace(/[^0-9]/g, "")) * 1000;
  }

  const handleInputChange = (value: string, isMin: boolean) => {
    const newValue = parsePrice(value);
    if (isNaN(newValue)) return;

    const newRange: [number, number] = isMin
      ? [Math.min(newValue, priceRange[1]), priceRange[1]]
      : [priceRange[0], Math.max(newValue, priceRange[0])];

    setPriceRange(newRange);
    setInputValues({
      min: isMin ? value : formatPrice(newRange[0]),
      max: isMin ? formatPrice(newRange[1]) : value,
    });
    onPriceChange?.(newRange[0], newRange[1]);
  };

  return (
    <div className="flex w-full flex-col gap-y-8">
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-row-reverse items-center justify-between gap-1">
          <div className="w-[92px] rounded-lg border border-slate-200 bg-white py-1">
            <input
              type="text"
              value={inputValues.max}
              placeholder={`${formatPrice(maxPrice)} هزار تومان`}
              onChange={(e) => handleInputChange(e.target.value, false)}
              className="text-xs w-full text-center text-neutral-400 focus:outline-none"
            />
          </div>
          <span className="text-xs text-neutral-800">تا</span>
          <div className="w-[92px] rounded-lg border border-slate-200 bg-white py-1">
            <input
              type="text"
              value={inputValues.min}
              placeholder={`${formatPrice(minPrice)} هزار تومان`}
              onChange={(e) => handleInputChange(e.target.value, true)}
              className="text-xs w-full text-center text-neutral-400 focus:outline-none"
            />
          </div>
          <span className="text-xs text-neutral-800">شروع از</span>
        </div>

        <div className="px-1.5 py-4">
          <Slider
            range
            min={minPrice}
            max={maxPrice}
            step={1000}
            value={[priceRange[0], priceRange[1]]}
            onChange={handleSliderChange}
            reverse
            pushable={20000}
            allowCross={false}
            railStyle={{ backgroundColor: "#EAEDF0", height: 2 }}
            trackStyle={[{ backgroundColor: "#090909", height: 2 }]}
            handleStyle={[
              {
                backgroundColor: "#090909",
                border: "2px solid white",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                opacity: 1,
                width: 12,
                height: 12,
                marginTop: -5,
                zIndex: 1,
              },
              {
                backgroundColor: "#090909",
                border: "2px solid white",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                opacity: 1,
                width: 12,
                height: 12,
                marginTop: -5,
                zIndex: 2,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default PriceFilter;
