"use client";

import { useRef, useState } from "react";
import ChevronLeftIcon from "../../Icons/ChevronLeftIcon";
import ChevronRightIcon from "../../Icons/ChevronRightIcon";
import RulerIcon from "../../Icons/RulerIcon";
import PDPHeroSizeModal from "../SizeModal";
import type { ProductSizeHelper } from "@/services/product/product";
import SpecTable from "../../SpecTable";

type Props = {
  sizes: {
    id: string;
    title: string;
    available?: boolean; // Add availability flag
    stock?: number; // Optional stock count
    variations: {
      title: string;
      value: string;
      stock?: number; // Optional stock per variation
    }[];
  }[];
  onSizeChange?: (sizeId: string) => void;
  selectedSize?: string;
  sizeHelper?: ProductSizeHelper | null;
  disabledSizeIds?: string[]; // Keep as fallback
};

export default function PDPHeroInfoSize(props: Props) {
  const {
    sizes,
    onSizeChange,
    selectedSize: externalSelectedSize,
    sizeHelper,
    disabledSizeIds = [],
  } = props;

  // Automatically determine disabled sizes based on availability
  const getDisabledSizeIds = () => {
    const autoDisabled = sizes
      .filter((size) => {
        // Check if size is explicitly marked as unavailable
        if (size.available === false) return true;

        // Check if size has no stock
        if (size.stock !== undefined && size.stock <= 0) return true;

        // Check if all variations are out of stock
        const hasAvailableVariations = size.variations.some(
          (variation) => variation.stock === undefined || variation.stock > 0,
        );

        return !hasAvailableVariations;
      })
      .map((size) => size.id);

    // Combine with manually disabled sizes
    return Array.from(new Set([...autoDisabled, ...disabledSizeIds]));
  };

  const actualDisabledSizeIds = getDisabledSizeIds();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [internalSelectedSize, setInternalSelectedSize] = useState<string>(sizes[0]?.id || "");

  // Use either the external selected size if provided, or the internal state
  const selectedSize =
    externalSelectedSize !== undefined ? externalSelectedSize : internalSelectedSize;

  const [openSizeModal, setOpenSizeModal] = useState<boolean>(false);

  const onNextClick = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: "smooth",
      });
    }
  };

  const onPrevClick = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: "smooth",
      });
    }
  };

  const handleSizeClick = (sizeId: string) => {
    // Double check - prevent clicks on disabled sizes
    if (actualDisabledSizeIds.includes(sizeId)) {
      return;
    }

    setInternalSelectedSize(sizeId);
    if (onSizeChange) {
      onSizeChange(sizeId);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <PDPHeroSizeModal
        open={openSizeModal}
        onClose={() => setOpenSizeModal(false)}
        sizeHelper={sizeHelper}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl text-foreground-primary">انتخاب سایز</span>

          <div className="flex cursor-pointer items-center" onClick={() => setOpenSizeModal(true)}>
            <span className="text-xs text-actions-link underline">راهنمای سایز</span>

            <RulerIcon />
          </div>
        </div>

        <div className="flex gap-1">
          <div
            className="flex h-5 w-5 cursor-pointer items-center justify-center"
            onClick={onPrevClick}
          >
            <ChevronRightIcon color="#262626" />
          </div>

          <div
            className="flex h-5 w-5 cursor-pointer items-center justify-center"
            onClick={onNextClick}
          >
            <ChevronLeftIcon color="#262626" />
          </div>
        </div>
      </div>

      <div ref={scrollContainerRef} className="w-full overflow-x-hidden">
        <div className="flex w-fit gap-2">
          {sizes.map((size) => {
            const isSelected = size.id === selectedSize;
            const isDisabled = actualDisabledSizeIds.includes(size.id);
            return (
              <button
                type="button"
                key={size.id}
                className={`flex h-9 w-20 items-center justify-center rounded-lg px-3 py-2 transition-all duration-200 ${
                  isDisabled
                    ? "pointer-events-none cursor-not-allowed bg-gray-100 text-gray-400 line-through opacity-60"
                    : isSelected
                      ? "border border-gray-300 bg-background-primary text-foreground-primary shadow-sm"
                      : "bg-background-secondary text-foreground-muted hover:bg-gray-50"
                }`}
                onClick={() => handleSizeClick(size.id)}
                disabled={isDisabled}
                aria-disabled={isDisabled}
                title={isDisabled ? "ناموجود" : size.title}
              >
                <span className="text-xs">{size.title}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
