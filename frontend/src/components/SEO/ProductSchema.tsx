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

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://infinitycolor.org";

  const schema: Record<string, any> = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: title,
    description: description.slice(0, 300),
    image: imageUrl,
    url: `${SITE_URL}/pdp/${slug}`,
    brand: {
      "@type": "Brand",
      name: "اینفینیتی",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "IRR",
      lowPrice: minPrice > 0 ? minPrice.toString() : "0",
      highPrice: maxPrice > 0 ? maxPrice.toString() : "0",
      offerCount: variations.length,
      availability: variations.length > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    itemCondition: "https://schema.org/NewCondition", // Default to new - safe default
  };

  // Add category if main category exists
  if (product?.attributes?.product_main_category?.data?.attributes?.Title) {
    schema.category = product.attributes.product_main_category.data.attributes.Title;
  } else if (product?.attributes?.product_main_category?.data?.attributes?.Name) {
    schema.category = product.attributes.product_main_category.data.attributes.Name;
  }

  // Add additionalProperty for product attributes (size, color) if they exist in variations
  const additionalProperties: Array<{ "@type": string; name: string; value: string }> = [];

  // Collect unique colors from variations
  const uniqueColors = new Set<string>();
  variations.forEach((v: any) => {
    const color = v?.attributes?.product_variation_color?.data?.attributes?.Title;
    if (color) {
      uniqueColors.add(color);
    }
  });
  uniqueColors.forEach((color) => {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "رنگ",
      value: color,
    });
  });

  // Collect unique sizes from variations
  const uniqueSizes = new Set<string>();
  variations.forEach((v: any) => {
    const size = v?.attributes?.product_variation_size?.data?.attributes?.Title;
    if (size) {
      uniqueSizes.add(size);
    }
  });
  uniqueSizes.forEach((size) => {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "سایز",
      value: size,
    });
  });

  // Only add additionalProperty if we have properties
  if (additionalProperties.length > 0) {
    schema.additionalProperty = additionalProperties;
  }

  // Only add aggregateRating if it exists and has valid data
  if (product?.attributes?.RatingCount && product?.attributes?.RatingCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (product?.attributes?.AverageRating || 0).toString(),
      ratingCount: product?.attributes?.RatingCount?.toString(),
    };
  }

  // Add SKU if available from product ID or slug
  if (product?.id) {
    schema.sku = product.id.toString();
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
