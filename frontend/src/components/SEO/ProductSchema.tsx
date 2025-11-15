import { ProductDetail } from "@/services/product/product";
import { IMAGE_BASE_URL } from "@/constants/api";

interface ProductSchemaProps {
  product: ProductDetail;
  slug: string;
}

export function ProductSchema({ product, slug }: ProductSchemaProps) {
  const title = product?.attributes?.Title || "محصول";
  const description = product?.attributes?.Description || title;
  const imageUrl = product?.attributes?.CoverImage?.data?.attributes?.url
    ? `${IMAGE_BASE_URL}${product.attributes.CoverImage.data.attributes.url}`
    : undefined;

  // Get price info from variations if available
  const variations = product?.attributes?.product_variations?.data || [];
  const prices = variations
    .map((v: any) => {
      const price = parseFloat(v?.attributes?.Price || "0");
      const discountPrice = parseFloat(v?.attributes?.DiscountPrice || "0");
      return discountPrice > 0 ? discountPrice : price;
    })
    .filter((p) => p > 0);

  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const currentPrice = minPrice || maxPrice || 0;

  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: title,
    description: description.slice(0, 300),
    image: imageUrl,
    url: `https://infinitycolor.org/pdp/${slug}`,
    brand: {
      "@type": "Brand",
      name: "اینفینیتی",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "IRR",
      lowPrice: minPrice.toString(),
      highPrice: maxPrice.toString(),
      offerCount: variations.length,
      availability: variations.length > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product?.attributes?.RatingCount && product?.attributes?.RatingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: (product?.attributes?.AverageRating || 0).toString(),
            ratingCount: product?.attributes?.RatingCount?.toString(),
          }
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
