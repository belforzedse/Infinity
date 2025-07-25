"use client";

import PLPButton from "@/components/Kits/PLP/Button";
import SortDescIcon from "@/components/PLP/Icons/SortDescIcon";
import PDPCommentListItem from "./ListItem";
import { useState, useMemo } from "react";
import NoDataIcon from "../Icons/NoDataIcon";

export type ProductReview = {
  id: number;
  attributes: {
    Rate: number;
    Content: string;
    createdAt: string;
    user?: {
      data: {
        id: number;
        attributes: {
          Phone: string;
          user_info?: {
            data: {
              attributes: {
                FirstName: string;
                LastName: string;
              };
            };
          };
        };
      };
    };
    LikeCounts?: number;
    DislikeCounts?: number;
    product_review_replies?: {
      data: Array<{
        id: number;
        attributes: {
          Content: string;
          createdAt: string;
        };
      }>;
    };
  };
};

type SortOption = "newest" | "oldest" | "highestRating" | "lowestRating";

type Props = {
  reviews: ProductReview[];
};

export default function PDPCommentList({ reviews }: Props) {
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Helper function to safely parse date strings
  const safeParseDate = (dateString: string): Date => {
    try {
      return new Date(dateString);
    } catch (error) {
      console.error("Error parsing date:", error, dateString);
      return new Date(); // Return current date as fallback
    }
  };

  const sortedReviews = useMemo(() => {
    if (!reviews?.length) return [];

    return [...reviews].sort((a, b) => {
      if (sortOption === "newest") {
        return (
          safeParseDate(b.attributes.createdAt).getTime() -
          safeParseDate(a.attributes.createdAt).getTime()
        );
      } else if (sortOption === "oldest") {
        return (
          safeParseDate(a.attributes.createdAt).getTime() -
          safeParseDate(b.attributes.createdAt).getTime()
        );
      } else if (sortOption === "highestRating") {
        return b.attributes.Rate - a.attributes.Rate;
      } else if (sortOption === "lowestRating") {
        return a.attributes.Rate - b.attributes.Rate;
      }
      return 0;
    });
  }, [reviews, sortOption]);

  // Handle sort option selection
  const handleSortSelect = (option: SortOption) => {
    setSortOption(option);
    setShowSortOptions(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-3xl text-neutral-700 hidden md:block">
          {reviews?.length > 0
            ? "دیدگاه کاربران"
            : "شماهم دیدگاه خودتونو ثبت کنین"}
        </span>

        <div className="relative">
          <PLPButton
            className="w-full md:w-auto flex items-center justify-center"
            text={
              sortOption === "newest"
                ? "جدیدترین"
                : sortOption === "oldest"
                ? "قدیمی‌ترین"
                : sortOption === "highestRating"
                ? "بیشترین امتیاز"
                : "کمترین امتیاز"
            }
            rightIcon={<SortDescIcon className="w-6 h-6" />}
            onClick={() => setShowSortOptions(!showSortOptions)}
          />

          {showSortOptions && (
            <div className="absolute top-full right-0 mt-1 w-48 rounded-lg bg-white shadow-lg z-10 border border-gray-200">
              <ul className="py-1">
                <li
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    sortOption === "newest" ? "bg-gray-50 text-primary" : ""
                  }`}
                  onClick={() => handleSortSelect("newest")}
                >
                  جدیدترین
                </li>
                <li
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    sortOption === "oldest" ? "bg-gray-50 text-primary" : ""
                  }`}
                  onClick={() => handleSortSelect("oldest")}
                >
                  قدیمی‌ترین
                </li>
                <li
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    sortOption === "highestRating"
                      ? "bg-gray-50 text-primary"
                      : ""
                  }`}
                  onClick={() => handleSortSelect("highestRating")}
                >
                  بیشترین امتیاز
                </li>
                <li
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    sortOption === "lowestRating"
                      ? "bg-gray-50 text-primary"
                      : ""
                  }`}
                  onClick={() => handleSortSelect("lowestRating")}
                >
                  کمترین امتیاز
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {reviews?.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sortedReviews.map((review) => {
            // Fix userName extraction with proper null checks
            let userName = "کاربر مهمان"; // Default fallback

            const userInfo =
              review.attributes.user?.data?.attributes?.user_info?.data
                ?.attributes;
            if (userInfo && userInfo.FirstName && userInfo.LastName) {
              userName = `${userInfo.FirstName} ${userInfo.LastName}`.trim();
              // If we have an empty string after trimming, use phone number or default
              if (userName === "") {
                userName =
                  review.attributes.user?.data?.attributes?.Phone ||
                  "کاربر مهمان";
              }
            } else if (review.attributes.user?.data?.attributes?.Phone) {
              // If no name but has phone, use formatted phone number
              const phone = review.attributes.user.data.attributes.Phone;
              // Format as ****123 to hide part of the number
              userName =
                phone.length > 4
                  ? `${phone.slice(-4).padStart(phone.length, "*")}`
                  : phone;
            }

            const hasReply =
              !!review.attributes.product_review_replies?.data?.length;

            return (
              <PDPCommentListItem
                key={review.id}
                username={userName}
                date={safeParseDate(review.attributes.createdAt)}
                comment={review.attributes.Content || ""}
                rating={review.attributes.Rate}
                plusRating={review.attributes.LikeCounts || 0}
                minusRating={review.attributes.DislikeCounts || 0}
                {...(hasReply && {
                  reply: {
                    username: "پشتیبانی اینفینیتی",
                    date: safeParseDate(
                      review.attributes.product_review_replies?.data[0]
                        ?.attributes.createdAt || ""
                    ),
                    comment:
                      review.attributes.product_review_replies?.data[0]
                        ?.attributes.Content || "",
                    plusRating: 0,
                    minusRating: 0,
                  },
                })}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <NoDataIcon className="w-20 h-20 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            هنوز دیدگاهی ثبت نشده است
          </h3>
          <p className="text-gray-600 max-w-md mb-4">
            اولین نفری باشید که دیدگاه خود را درباره این محصول ثبت می‌کنید.
          </p>
        </div>
      )}
    </div>
  );
}
