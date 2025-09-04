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
    sizes[0]?.id || "",
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
          <span className="text-xl text-foreground-primary">انتخاب سایز</span>

          <div
            className="flex cursor-pointer items-center"
            onClick={() => setOpenSizeModal(true)}
          >
            <span className="text-xs text-actions-link underline">
              راهنمای سایز
            </span>

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
          {sizes.map((size) => (
            <button
              key={size.id}
              className={`flex h-9 w-20 items-center justify-center rounded-lg px-3 py-2 ${
                size.id === selectedSize
                  ? "border border-gray-300 bg-background-primary text-foreground-primary"
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
