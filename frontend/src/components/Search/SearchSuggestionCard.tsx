import Image from "next/image";
import { faNum } from "@/utils/faNum";
import type { FC, ReactNode } from "react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export interface SearchSuggestionCardProps {
  id: number;
  title: string;
  price?: number;
  discountPrice?: number;
  discount?: number;
  category?: string;
  image?: string;
  isAvailable?: boolean;
  onClick: () => void;
  index: number;
  isActive?: boolean;
  query?: string;
}

const SearchSuggestionCard: FC<SearchSuggestionCardProps> = ({
  id,
  title,
  price,
  discountPrice,
  discount,
  category,
  image,
  isAvailable = true,
  onClick,
  index,
  isActive = false,
  query = "",
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hasPrice = price !== undefined && price !== null;
  const hasDiscountPrice = discountPrice !== undefined && discountPrice !== null;
  const isDiscounted =
    hasPrice &&
    hasDiscountPrice &&
    Number(discountPrice) > 0 &&
    Number(price) > Number(discountPrice);
  const computedDiscount = isDiscounted
    ? Math.round(((Number(price) - Number(discountPrice)) / Number(price)) * 100)
    : undefined;
  const showDiscount = (discount ?? computedDiscount ?? 0) > 0;

  const highlightedTitle = useMemo<ReactNode>(() => {
    if (!query) return title;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matcher = new RegExp(`(${escaped})`, "gi");
    const parts = title.split(matcher);
    const lowerQuery = query.toLowerCase();
    return parts.map((part, idx) =>
      part.toLowerCase() === lowerQuery
        ? (
            <mark key={`${id}-${idx}`} className="bg-transparent px-0 text-pink-600">
              {part}
            </mark>
          )
        : part,
    );
  }, [id, query, title]);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`w-full border-b border-gray-100 p-3 text-right transition-colors last:border-b-0 ${
        isActive ? "bg-pink-50" : "hover:bg-gray-50"
      }`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.03 }}
      whileHover={{
        backgroundColor: isActive ? "rgba(252, 231, 243, 1)" : "rgba(249, 250, 251, 1)",
      }}
      whileTap={{ scale: 0.98 }}
      role="option"
      aria-selected={isActive}
      title={title}
    >
      <div className="flex items-center gap-3">
        {/* Product Image */}
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {/* Shimmer placeholder */}
          {!imgLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300" />
          )}
          {image && !imgError ? (
            <Image
              src={image}
              alt={title}
              width={48}
              height={48}
              sizes="48px"
              quality={60}
              priority={index < 3}
              loading={index < 3 ? "eager" : "lazy"}
              className={`h-full w-full object-cover transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoadingComplete={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                <path
                  d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col">
            {/* Category */}
            {category && <span className="text-xs mb-0.5 truncate text-gray-500">{category}</span>}

            {/* Title */}
            <h4 className="text-sm mb-1 line-clamp-1 font-medium text-gray-900">{highlightedTitle}</h4>

            {/* Price */}
            <div className="flex items-center gap-2">
              {!isAvailable ? (
                <span className="text-sm text-red-600">ناموجود</span>
              ) : hasPrice ? (
                <div className="flex items-center gap-2">
                  {isDiscounted && (
                    <>
                      <span className="text-sm font-medium text-pink-600">
                        {faNum(discountPrice)} تومان
                      </span>
                      <span className="text-xs text-gray-500 line-through">{faNum(price)}</span>
                    </>
                  )}
                  {!isDiscounted && (
                    <span className="text-sm font-medium text-gray-700">{faNum(price)} تومان</span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-500">محصول</span>
              )}
            </div>
          </div>
        </div>

        {/* Discount Badge */}
        {showDiscount && (
          <div className="flex-shrink-0">
            <div className="text-xs rounded-full bg-red-500 px-2 py-1 text-white">
              {faNum(discount ?? computedDiscount!)}%
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
};

export default SearchSuggestionCard;
