import type { ProductReview } from "@/components/PDP/Comment/List";

interface ReviewSchemaProps {
  productName: string;
  productUrl: string;
  averageRating: number;
  reviewCount: number;
  reviews: ProductReview[];
}

export function ReviewSchema({
  productName,
  productUrl,
  averageRating,
  reviewCount,
  reviews,
}: ReviewSchemaProps) {
  if (reviewCount === 0 || averageRating === 0) {
    return null;
  }

  // Get author name from review
  const getAuthorName = (review: ProductReview): string => {
    const userInfo = review.attributes?.user?.data?.attributes?.user_info?.data?.attributes;
    if (userInfo?.FirstName || userInfo?.LastName) {
      return `${userInfo.FirstName || ""} ${userInfo.LastName || ""}`.trim();
    }
    return "کاربر مهمان";
  };

  // Build aggregate rating
  const aggregateRating = {
    "@type": "AggregateRating",
    ratingValue: averageRating.toString(),
    reviewCount: reviewCount.toString(),
    bestRating: "5",
    worstRating: "1",
  };

  // Build individual reviews (limit to 10 most recent for performance)
  const individualReviews = reviews
    .slice(0, 10)
    .map((review) => {
      const authorName = getAuthorName(review);
      const reviewDate = review.attributes?.createdAt
        ? new Date(review.attributes.createdAt).toISOString()
        : undefined;

      return {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: authorName,
        },
        datePublished: reviewDate,
        reviewBody: review.attributes?.Content || "",
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.attributes?.Rate?.toString() || "0",
          bestRating: "5",
          worstRating: "1",
        },
      };
    })
    .filter((review) => review.reviewBody && review.datePublished);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    url: productUrl,
    aggregateRating,
    ...(individualReviews.length > 0 && {
      review: individualReviews,
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}



