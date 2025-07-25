"use client";

import { useRef, useState } from "react";
import ChevronLeftIcon from "../../Icons/ChevronLeftIcon";
import ChevronRightIcon from "../../Icons/ChevronRightIcon";
import RulerIcon from "../../Icons/RulerIcon";
import PDPHeroSizeModal from "../SizeModal";
import { ProductSizeHelper } from "@/services/product/product";

type Props = {
  sizes: {
    id: string;
    title: string;
    variations: {
      title: string;
      value: string;
    }[];
  }[];
  onSizeChange?: (sizeId: string) => void;
  selectedSize?: string;
  sizeHelper?: ProductSizeHelper | null;
};

export default function PDPHeroInfoSize(props: Props) {
  const {
    sizes,
    onSizeChange,
    selectedSize: externalSelectedSize,
    sizeHelper,
  } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [internalSelectedSize, setInternalSelectedSize] = useState<string>(
    sizes[0]?.id || ""
  );

  // Use either the external selected size if provided, or the internal state
  const selectedSize =
    externalSelectedSize !== undefined
      ? externalSelectedSize
      : internalSelectedSize;

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
          <span className="text-foreground-primary text-xl">انتخاب سایز</span>

          <div
            className="flex items-center cursor-pointer"
            onClick={() => setOpenSizeModal(true)}
          >
            <span className="text-actions-link underline text-xs">
              راهنمای سایز
            </span>

            <RulerIcon />
          </div>
        </div>

        <div className="flex gap-1">
          <div
            className="w-5 h-5 flex items-center justify-center cursor-pointer"
            onClick={onPrevClick}
          >
            <ChevronRightIcon color="#262626" />
          </div>

          <div
            className="w-5 h-5 flex items-center justify-center cursor-pointer"
            onClick={onNextClick}
          >
            <ChevronLeftIcon color="#262626" />
          </div>
        </div>
      </div>

      <div ref={scrollContainerRef} className="overflow-x-hidden w-full">
        <div className="flex gap-2 w-fit">
          {sizes.map((size) => (
            <button
              key={size.id}
              className={`w-20 h-9 py-2 px-3 rounded-lg flex items-center justify-center ${
                size.id === selectedSize
                  ? "bg-background-primary text-foreground-primary border border-gray-300"
                  : "bg-background-secondary text-foreground-muted"
              }`}
              onClick={() => handleSizeClick(size.id)}
            >
              <span className="text-xs">{size.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
