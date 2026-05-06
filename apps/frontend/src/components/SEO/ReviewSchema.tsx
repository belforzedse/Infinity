import type { ProductReview } from "@/services/product/product-review.service";
import { safeJsonLd } from "@/utils/seo";
import { resolveProductReviewUserDisplayName } from "@/utils/productReviewAuthorName";

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
      const authorName = resolveProductReviewUserDisplayName(review.user, review.user?.Phone);
      const reviewDate = review.createdAt
        ? new Date(review.createdAt).toISOString()
        : undefined;

      return {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: authorName,
        },
        datePublished: reviewDate,
        reviewBody: review.Content || "",
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.Rate?.toString() || "0",
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
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}



