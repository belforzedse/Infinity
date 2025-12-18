"use client";

import React, { useState, useCallback } from "react";
import StarIcon from "../../Icons/StarIcon";
import EmptyStarIcon from "../../Icons/EmptyStarIcon";
import MessagesIcon from "../../Icons/MessagesIcon";
import PDPCommentModal from "../CommentModal";
import type { ProductReview } from "@/services/product/product-review.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import PDPCommentAddSpecialOffer from "./SpecialOffer";
import { useRouter } from "next/navigation";
import type { ProductDetail } from "@/services/product/product";

type Props = {
  rating: number;
  rateCount: number;
  productId?: string;
  productReviews?: ProductReview[];
  productData?: ProductDetail;
  onReviewSubmitted?: () => void;
};

export default function PDPCommentAdd(props: Props) {
  const { productId, rating, rateCount, onReviewSubmitted, productData } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useCurrentUser();
  const router = useRouter();

  const handleCommentClose = useCallback(() => {
    setIsModalOpen(false);
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
  }, [onReviewSubmitted]);

  // Extract data for special offer card from productData
  const attrs = productData?.attributes || ({} as any);
  const discountPrice = attrs.DiscountPrice;
  const price = attrs.Price;
  const discount = attrs.Discount;
  const title = attrs.Title;
  const category = attrs.product_main_category?.data?.attributes?.Title || attrs.product_main_category?.data?.attributes?.Name || "";
  const imageSrc = attrs.CoverImage?.data?.attributes?.url || "/images/pdp/image-1.png";
  const hasDiscount = (discount && discount > 0) || (discountPrice && price && discountPrice < price);

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Rating Summary Card */}
        <div className="rounded-[16px] bg-[#FAFAF9] p-5 flex flex-col gap-[7px] items-end">
          <h4 className="text-[30px] font-normal text-[#404040] leading-[1.238]">دیدگاه و امتیاز خریداران</h4>
          
          <div className="flex items-center gap-1">
            <span className="text-[12px] text-[#262626]">از ۵</span>
            <span className="text-[20px] font-normal text-[#166534] leading-[1.238]">{rating.toFixed(1)}</span>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-[12px] text-[#262626]">
              (از مجموع امتیاز {rateCount} خریدار)
            </p>
            <div className="flex flex-row-reverse gap-[1px]">
              {[...Array(5)].map((_, i) => (
                i < Math.round(rating) ? <StarIcon key={i} className="h-3.5 w-3.5" /> : <EmptyStarIcon key={i} className="h-3.5 w-3.5" />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-center">
          <p className="text-[12px] text-[#737373] text-right w-full px-2">شما هم از تجربه خریدتون برامون بنویسین!</p>

          <button
            onClick={() => (user ? setIsModalOpen(true) : router.push("/auth"))}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#DB2777] py-1 px-3 h-[49px] text-[16px] font-normal text-white transition-all hover:bg-[#DB2777]/90 active:scale-[0.98]"
          >
            <MessagesIcon />
            <span>افزودن نظر</span>
          </button>
        </div>

        {/* Special Offer - dynamic from productData */}
        {hasDiscount && (
          <PDPCommentAddSpecialOffer
            discountPrice={discountPrice || 0}
            price={price || 0}
            discount={discount || 0}
            endOfferDate={attrs.DiscountEndDate ? new Date(attrs.DiscountEndDate) : undefined}
            title={title || ""}
            category={category || ""}
            imageSrc={imageSrc || ""}
          />
        )}
      </div>

      <PDPCommentModal
        productId={productId}
        commentCount={rateCount}
        isOpen={isModalOpen}
        onClose={handleCommentClose}
      />
    </>
  );
}
