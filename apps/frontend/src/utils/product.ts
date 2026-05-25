import { PRODUCT_BOOST_KEYWORDS } from "@/constants/productKeywords";
import { computeDiscountForVariation } from "@/utils/discounts";
import type { DiscountVariationInput } from "@/utils/discounts";

interface ImageAttributes {
  url?: string;
  mime?: string; // Added for video support
}

interface MediaAttributes extends ImageAttributes {
  mime?: string;
}

interface ImageData {
  data?: {
    attributes?: ImageAttributes;
  } | null;
}

interface MediaItem {
  attributes?: MediaAttributes;
}

interface MediaCollection {
  data?: MediaItem[] | null;
}

interface ProductAttributes {
  CoverImage?: ImageData;
  Media?: MediaCollection;
}

interface Product {
  attributes?: ProductAttributes;
}

interface StockAttributes {
  Count?: number;
}

interface ProductStock {
  data?: {
    attributes?: StockAttributes;
  } | null;
}

interface GeneralDiscountAttributes {
  Amount?: number;
}

interface GeneralDiscountItem {
  attributes?: GeneralDiscountAttributes;
}

interface GeneralDiscountCollection {
  data?: GeneralDiscountItem[] | null;
}

interface ProductVariationAttributes {
  Price?: string | number;
  DiscountPrice?: string | number;
  IsPublished?: boolean;
  general_discounts?: GeneralDiscountCollection;
  product_stock?: ProductStock;
}

export interface ProductVariation {
  attributes?: ProductVariationAttributes;
}

interface ProductWithVariations {
  attributes?: {
    IsAvailable?: boolean | null;
    product_variations?: {
      data?: ProductVariation[] | null;
    } | null;
  };
}

const getVariations = (product: ProductWithVariations): ProductVariation[] => {
  const variations = product.attributes?.product_variations?.data;
  return Array.isArray(variations) ? variations : [];
};

const isVariationInStock = (variation?: ProductVariation): boolean => {
  const attrs = variation?.attributes;
  if (!attrs?.IsPublished) return false;
  const stockCount = attrs.product_stock?.data?.attributes?.Count;
  return typeof stockCount === "number" && stockCount > 0;
};

/**
 * Formats product image URLs from Strapi attributes
 * Filters out videos to maintain performance in product listings
 * @param product Product object with attributes
 * @param includeMedia Whether to include additional media images (usually for desktop)
 * @param baseUrl Base URL for images
 * @returns Array of filtered image URLs (videos excluded for performance)
 */
export function getProductImages(
  product: Product,
  includeMedia: boolean,
  baseUrl: string
): string[] {
  // Only include CoverImage if it's an image (exclude videos for PLP performance)
  const coverImage = product.attributes?.CoverImage?.data?.attributes;
  const coverImageUrl =
    coverImage?.url && coverImage?.mime?.startsWith("image/")
      ? `${baseUrl}${coverImage.url}`
      : "";

  const mediaImages =
    includeMedia && product.attributes?.Media?.data
      ? product.attributes.Media.data
          .filter(
            (m: MediaItem) => m.attributes?.mime?.startsWith("image/") && m.attributes?.url
          )
          .map((m: MediaItem) => `${baseUrl}${m.attributes?.url}`)
          .filter((url): url is string => Boolean(url))
          .slice(0, 3)
      : [];

  return [coverImageUrl, ...mediaImages].filter(Boolean).slice(0, 4);
}

export const hasAvailableStock = (product: ProductWithVariations): boolean => {
  if (typeof product.attributes?.IsAvailable === "boolean") {
    return product.attributes.IsAvailable;
  }

  return getVariations(product).some((variation) => isVariationInStock(variation));
};

export const getFirstValidVariation = (
  product: ProductWithVariations,
): ProductVariation | undefined => {
  return getVariations(product).find((variation) => {
    const price = variation.attributes?.Price;
    return price && parseInt(price.toString()) > 0;
  });
};

export const getVariationPriceDetails = (
  variation?: ProductVariation,
  options: { requirePositiveGeneralDiscount?: boolean } = {},
): { price: number; discount?: number; discountPrice?: number } => {
  const price = parseInt(variation?.attributes?.Price?.toString() || "0");
  const generalDiscounts = variation?.attributes?.general_discounts?.data;
  const requirePositiveGeneralDiscount = options.requirePositiveGeneralDiscount === true;
  let discountPrice = undefined;
  let discount = undefined;

  if (generalDiscounts && generalDiscounts.length > 0) {
    const discountAmount = generalDiscounts[0].attributes?.Amount;
    const shouldApplyGeneralDiscount = requirePositiveGeneralDiscount
      ? typeof discountAmount === "number" && discountAmount > 0
      : true;

    if (shouldApplyGeneralDiscount) {
      discount = discountAmount;
      discountPrice = Math.round(price * (1 - (discountAmount as number) / 100));
    }
  } else if (variation?.attributes?.DiscountPrice) {
    discountPrice = parseInt(variation.attributes.DiscountPrice.toString());
    const hasDiscount = discountPrice && discountPrice < price;
    discount = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : undefined;
  }

  return { price, discount, discountPrice };
};

export const getProductPrimaryPricing = (
  product: ProductWithVariations,
  options: { requirePositiveGeneralDiscount?: boolean } = {},
): {
  price: number;
  discount?: number;
  discountPrice?: number;
  variation?: ProductVariation;
} => {
  const variation = getFirstValidVariation(product);
  const pricing = getVariationPriceDetails(variation, options);
  return { ...pricing, variation };
};

const toDiscountVariationInput = (
  variation?: ProductVariation,
): DiscountVariationInput => {
  const attrs = variation?.attributes;
  if (!attrs) return {};
  
  // Transform general_discounts to match VariationLike format
  const generalDiscounts = attrs.general_discounts?.data
    ? {
        data: attrs.general_discounts.data.map((item) => ({
          id: undefined,
          attributes: item.attributes as Record<string, unknown> | undefined,
        })),
      }
    : undefined;

  return {
    ...attrs,
    general_discounts: generalDiscounts,
  };
};

export const getMinInStockVariationPrice = (product: ProductWithVariations): number => {
  let minPrice = Infinity;

  for (const variation of getVariations(product)) {
    if (!isVariationInStock(variation)) continue;

    const discountResult = computeDiscountForVariation(
      toDiscountVariationInput(variation),
    );
    const finalPrice =
      discountResult?.finalPrice || parseFloat(variation.attributes?.Price?.toString() || "0");

    if (finalPrice > 0 && finalPrice < minPrice) {
      minPrice = finalPrice;
    }
  }

  return minPrice === Infinity ? 0 : minPrice;
};

/** True if product title contains any PRODUCT_BOOST_KEYWORDS (case-insensitive). Used for جدیدترین ها, تخفیف های وسوسه انگیز sort boost. */
export function productTitleMatchesKeywords(
  product: { attributes?: { Title?: string } },
): boolean {
  const title = product.attributes?.Title ?? "";
  if (!title) return false;
  const lower = title.toLowerCase();
  return PRODUCT_BOOST_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

/** @deprecated Use productTitleMatchesKeywords. Kept for backward compatibility. */
export const productTitleHasG = productTitleMatchesKeywords;

/** CreatedAt timestamp for sorting; 0 if missing. Accepts any product-like object (PLP Product, API response, etc.). */
export function getProductCreatedAt(product: object): number {
  const p = product as Record<string, unknown>;
  const attrs = p.attributes;
  const d =
    (attrs &&
      typeof attrs === "object" &&
      (attrs as Record<string, unknown>).createdAt) ??
    p.createdAt;
  return typeof d === "string" ? new Date(d).getTime() : 0;
}
