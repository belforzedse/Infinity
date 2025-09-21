"use client";

import PLPButton from "@/components/Kits/PLP/Button";
import EmptyStarIcon from "../../Icons/EmptyStarIcon";
import StarIcon from "../../Icons/StarIcon";
import MessagesIcon from "../../Icons/MessagesIcon";
import { useState, useMemo, useCallback } from "react";
import PDPCommentModal from "../CommentModal";
import { ProductReview } from "../List";
import { useRouter } from "next/navigation";

type Props = {
  rating: number;
  rateCount: number;
  productId?: string;
  productReviews?: ProductReview[];
};

export default function PDPCommentAdd(props: Props) {
  const { productId, productReviews = [] } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const hasReviews = productReviews.length > 0;

  // Calculate the exact average rating from all reviews if available
  const calculatedRating = useMemo(() => {
    if (!hasReviews) {
      return 0;
    }

    // Use type assertion to access the Rate field
    const totalRating = productReviews.reduce((sum, review) => {
      // Handle both possible field names for backward compatibility
      const reviewRate = (review.attributes as any).Rate || (review.attributes as any).Rating || 0;
      return sum + reviewRate;
    }, 0);

    return totalRating / productReviews.length;
  }, [productReviews, hasReviews]);

  // Calculate rating distribution (how many 5-star, 4-star, etc.)
  const ratingDistribution = useMemo(() => {
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    productReviews.forEach((review) => {
      // Handle both possible field names for backward compatibility
      const rating = (review.attributes as any).Rate || (review.attributes as any).Rating || 0;
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++;
      }
    });

    return distribution;
  }, [productReviews]);

  // Calculate percentages for distribution bars
  const getPercentage = (count: number) => {
    if (!hasReviews) return 0;
    return (count / productReviews.length) * 100;
  };

  // Format rating to one decimal place if we have reviews
  const formattedRating = hasReviews ? calculatedRating.toFixed(1) : "0.0";

  // Use actual review count
  const actualReviewCount = productReviews.length;

  // Refresh the page after a successful review submission to update the data
  const handleCommentClose = useCallback(() => {
    setIsModalOpen(false);
    // Refresh the page to get updated reviews (we can't refresh server component data directly)
    router.refresh();
  }, [router]);

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 rounded-3xl bg-background-secondary p-5">
          <span className="text-3xl text-neutral-700">دیدگاه و امتیاز خریداران</span>

          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xl text-green-800">{formattedRating}</span>
                <span className="text-xs text-foreground-primary">از ۵</span>
              </div>

              <div className="flex flex-row-reverse items-center gap-1">
                {new Array(5)
                  .fill(0)
                  .map((_, index) =>
                    !hasReviews || index + 1 > Math.round(calculatedRating) ? (
                      <EmptyStarIcon key={index} />
                    ) : (
                      <StarIcon key={index} />
                    ),
                  )}
              </div>

              <span className="text-xs mt-1 text-foreground-primary">
                {hasReviews ? `(از مجموع ${actualReviewCount} نظر)` : "(هنوز دیدگاهی ثبت نشده است)"}
              </span>
            </div>

            {hasReviews && (
              <div className="w-full flex-1 md:w-auto">
                <div className="flex w-full flex-col gap-1.5">
                  {[5, 4, 3, 2, 1].map((starCount) => (
                    <div key={starCount} className="flex items-center gap-2">
                      <div className="flex flex-row-reverse gap-0.5">
                        {Array(starCount)
                          .fill(0)
                          .map((_, i) => (
                            <StarIcon key={i} className="h-3 w-3" />
                          ))}
                      </div>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-yellow-500"
                          style={{
                            width: `${getPercentage(
                              ratingDistribution[starCount as keyof typeof ratingDistribution],
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs w-8 text-center text-gray-500">
                        {ratingDistribution[starCount as keyof typeof ratingDistribution]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasReviews && (
              <div className="mt-2 flex flex-1 items-center justify-center text-center md:mt-0">
                <p className="text-sm text-gray-500">
                  اولین نفری باشید که دیدگاه خود را برای این محصول ثبت می‌کنید
                </p>
              </div>
            )}
          </div>
        </div>

        <span className="text-xs text-neutral-500">شما هم از تجربه خریدتون برامون بنویسین!</span>

        <PLPButton
          text="افزودن نظر"
          leftIcon={<MessagesIcon />}
          variant="primary"
          className="text-base flex w-full items-center justify-center rounded-xl !bg-actions-primary !text-gray-100"
          onClick={() => setIsModalOpen(true)}
        />
      </div>

      <PDPCommentModal
        productId={productId}
        commentCount={actualReviewCount}
        isOpen={isModalOpen}
        onClose={handleCommentClose}
      />
    </>
  );
}
