"use client";

import Button from "@/components/Kits/PLP/Button";
import ChatIcon from "../../Icons/ChatIcon";
import HeartIcon from "../../Icons/HeartIcon";
import ShareIcon from "../../Icons/ShareIcon";
import BasketIcon from "../../Icons/BasketIcon";
import { useState, useEffect, useRef } from "react";
import Select from "@/components/Kits/Form/Select";
import useProductLike from "@/hooks/useProductLike";
import useAddToCart from "@/hooks/useAddToCart";
import {
  hasStockForVariation,
  getAvailableStockCount,
} from "@/services/product/product";
import toast from "react-hot-toast";
import logger from "@/utils/logger";

const options = [
  { id: 1, name: "۱ عدد" },
  { id: 2, name: "۲ عدد" },
  { id: 3, name: "۳ عدد" },
  { id: 4, name: "۴ عدد" },
  { id: 5, name: "۵ عدد" },
];

/**
 * Props for the PDPHeroInfoAction component
 * @interface PDPHeroInfoActionProps
 * @property {string} productId - Unique identifier for the product
 * @property {string} name - Name of the product
 * @property {string} category - Product category
 * @property {number} price - Product price
 * @property {string} image - Product image URL
 * @property {string} [color] - Selected color variation (optional)
 * @property {string} [size] - Selected size variation (optional)
 * @property {string} [model] - Selected model variation (optional)
 * @property {string} [variationId] - Selected product variation ID (optional)
 * @property {boolean} [hasStock] - Whether product is in stock (defaults to true)
 * @property {any} [currentVariation] - Current variation data for stock validation
 */
interface PDPHeroInfoActionProps {
  productId: string;
  name: string;
  category: string;
  price: number;
  image: string;
  color?: string;
  size?: string;
  model?: string;
  variationId?: string;
  hasStock?: boolean;
  currentVariation?: any; // Add current variation data
}

/**
 * Product Detail Page Hero Action Component
 *
 * Renders the action buttons section of a product detail page, including:
 * - Add to cart functionality with quantity selection
 * - Share product button
 * - Add to favorites button
 * - Navigate to comments button
 *
 * Features:
 * - Real-time stock validation
 * - Quantity adjustment based on available stock
 * - Toast notifications for user feedback
 * - URL sharing with clipboard support
 *
 * @param {PDPHeroInfoActionProps} props Component props
 * @returns {JSX.Element} Rendered component
 */
export default function PDPHeroInfoAction({
  productId = "",
  name = "",
  category = "",
  price = 0,
  image = "",
  color,
  size,
  model,
  variationId,
  hasStock = true,
  currentVariation,
}: PDPHeroInfoActionProps) {
  const [showShareToast, setShowShareToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Initialize product like hook
  const { isLiked, isLoading, toggleLike } = useProductLike({
    productId,
  });

  // Initialize add to cart hook
  const { quantity, setQuantity, isAdding, isInCart, addToCart } = useAddToCart(
    {
      productId,
      name,
      category,
      price,
      image,
      color,
      size,
      model,
      variationId,
    },
  );

  // Get available stock count for current variation
  const availableStock = currentVariation
    ? getAvailableStockCount(currentVariation)
    : 0;

  // Validate if selected quantity is available
  /**
   * Validates if requested quantity is available in stock
   * @param {number} requestedQuantity - Quantity to validate
   * @returns {boolean} True if quantity is available, false otherwise
   */
  const validateQuantity = (requestedQuantity: number): boolean => {
    if (!currentVariation) {
      return false;
    }

    return hasStockForVariation(currentVariation, requestedQuantity);
  };

  // Enhanced add to cart handler with stock validation
  /**
   * Handles adding items to cart with stock validation
   * @param {number} requestedQuantity - Quantity to add to cart
   */
  const handleAddToCart = (requestedQuantity: number = 1) => {
    if (process.env.NODE_ENV !== "production") {
      logger.info("=== ADD TO CART DEBUG ===");
      logger.info("Requested quantity", { requestedQuantity });
      logger.info("Current variation ID being sent to cart", { variationId });
      logger.info("Current variation object we're checking stock for", {
        currentVariation,
      });
      logger.info("Available stock count", { availableStock });
    }

    // Validate stock before adding to cart
    if (!validateQuantity(requestedQuantity)) {
      if (process.env.NODE_ENV !== "production") {
        logger.info("❌ Stock validation failed");
      }
      toast.error(`موجودی کافی نیست. موجودی فعلی: ${availableStock} عدد`);
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      logger.info("✅ Stock validation passed - calling addToCart");
      logger.info("Product details being sent to cart", {
        productId,
        name,
        category,
        price,
        image,
        color,
        size,
        model,
        variationId,
      });
      logger.info("=== END ADD TO CART DEBUG ===");
    }

    // Call the original add to cart function
    addToCart(requestedQuantity);
  };

  // Handle share button click
  /**
   * Handles sharing product URL via clipboard
   * Shows toast notification on success
   */
  const handleShare = () => {
    const currentUrl = window.location.href;

    // Use the clipboard API
    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        // Show toast message
        setShowShareToast(true);

        // Clear previous timeout if exists
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }

        // Hide toast after 3 seconds
        toastTimeoutRef.current = setTimeout(() => {
          setShowShareToast(false);
        }, 3000);
      })
      .catch((error) => {
        console.error("Failed to copy URL:", error);
      });
  };

  // Handle scroll to comments
  /**
   * Scrolls to product comments section
   * Uses data attribute if available, falls back to class selector
   */
  const handleScrollToComments = () => {
    // Find the comments section element
    const commentsSection = document.querySelector("[data-comments-section]");

    if (commentsSection) {
      // Scroll to the comments section with smooth behavior
      commentsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      // If the element doesn't exist with the data attribute, try to find it by component name
      const pdpCommentElement = document.querySelector(
        ".flex.gap-4.flex-col-reverse.md\\:flex-row",
      );

      if (pdpCommentElement) {
        pdpCommentElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Handle quantity change
  /**
   * Handles quantity selection changes with stock validation
   * Shows error toast if selected quantity exceeds available stock
   * @param {any} option - Selected quantity option
   */
  const handleQuantityChange = (option: any) => {
    const newQuantity = option.id;

    // Validate the new quantity against available stock
    if (!validateQuantity(newQuantity)) {
      toast.error(`موجودی کافی نیست. موجودی فعلی: ${availableStock} عدد`);
      return;
    }

    setQuantity(newQuantity);
  };

  // Generate options based on available stock (limit to max 5 or available stock)
  /**
   * Generates quantity options based on available stock
   * Limits maximum options to 5 or available stock, whichever is lower
   * @returns {Array<{id: number, name: string}>} Array of quantity options
   */
  const generateQuantityOptions = () => {
    const maxOptions = Math.min(5, availableStock);
    return Array.from({ length: maxOptions }, (_, i) => ({
      id: i + 1,
      name: `${i + 1} عدد`,
    }));
  };

  const dynamicOptions =
    availableStock > 0 ? generateQuantityOptions() : options;

  // Find the current option based on quantity
  const currentOption =
    dynamicOptions.find((opt) => opt.id === quantity) || null;

  return (
    <div className="relative flex flex-col items-center gap-3 md:flex-row">
      <div className="flex w-full items-center gap-3 md:w-auto">
        <button
          className="flex h-12 flex-1 items-center justify-center rounded-xl shadow-md md:w-12 md:flex-auto"
          onClick={handleShare}
          aria-label="کپی لینک محصول"
        >
          <ShareIcon />
        </button>

        <button
          className="flex h-12 flex-1 items-center justify-center rounded-xl shadow-md md:w-12 md:flex-auto"
          onClick={handleScrollToComments}
          aria-label="مشاهده نظرات"
        >
          <ChatIcon />
        </button>

        <button
          className={`flex h-12 flex-1 items-center justify-center rounded-xl shadow-md md:w-12 md:flex-auto ${
            isLoading ? "cursor-wait opacity-50" : ""
          }`}
          onClick={toggleLike}
          disabled={isLoading}
          aria-label={
            isLiked ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"
          }
        >
          <HeartIcon
            filled={isLiked}
            className={isLiked ? "text-pink-600" : "text-neutral-800"}
          />
        </button>
      </div>

      <div className="flex w-full flex-1 gap-3">
        {!hasStock ? (
          <Button
            className="text-base flex flex-1 cursor-not-allowed items-center justify-center rounded-xl bg-gray-400 py-3 text-white"
            text="ناموجود"
            disabled={true}
          />
        ) : !isInCart ? (
          <Button
            className={`text-base flex flex-1 items-center justify-center rounded-xl bg-actions-primary py-3 !text-gray-100 ${
              isAdding ? "cursor-wait opacity-50" : ""
            }`}
            text="افزودن به سبد خرید"
            variant="primary"
            leftIcon={<BasketIcon />}
            onClick={
              isAdding
                ? undefined
                : () => {
                    handleAddToCart(1); // Pass 1 as initial quantity
                  }
            }
          />
        ) : (
          <>
            <Button
              className="text-base flex flex-1 items-center justify-center rounded-xl bg-actions-primary py-3 !text-gray-100"
              text="افزودن"
              variant="primary"
              leftIcon={<BasketIcon />}
              onClick={() => handleAddToCart(quantity)}
            />
            <Select
              className="w-[126px]"
              options={dynamicOptions}
              value={currentOption}
              onChange={handleQuantityChange}
              placeholder="تعداد"
            />
          </>
        )}
      </div>

      {showShareToast && (
        <div className="text-sm absolute -top-12 left-1/2 -translate-x-1/2 transform rounded-lg bg-black bg-opacity-80 px-4 py-2 text-white">
          لینک کپی شد
        </div>
      )}
    </div>
  );
}
