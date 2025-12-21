import { computeDiscountForVariation } from "@/utils/discounts";
import type { DiscountVariationInput } from "@/utils/discounts";
import { getAvailableStockCountFromRelation } from "@/utils/stock";

interface ImageAttributes {
  url?: string;
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
  reservedCount?: number;
  ReservedCount?: number;
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
  return getAvailableStockCountFromRelation(attrs.product_stock) > 0;
};

/**
 * Formats product image URLs from Strapi attributes
 * @param product Product object with attributes
 * @param includeMedia Whether to include additional media images (usually for desktop)
 * @param baseUrl Base URL for images
 * @returns Array of filtered image URLs
 */
export function getProductImages(
  product: Product,
  includeMedia: boolean,
  baseUrl: string
): string[] {
  const coverImageUrl = product.attributes?.CoverImage?.data?.attributes?.url
    ? `${baseUrl}${product.attributes.CoverImage.data.attributes.url}`
    : "";

  const mediaImages =
    includeMedia && product.attributes?.Media?.data
      ? product.attributes.Media.data
          .filter(
            (m: MediaItem) => m.attributes?.mime?.startsWith("image/") && m.attributes?.url
          )
          .map((m: MediaItem) => `${baseUrl}${m.attributes?.url}`)
          .filter((url): url is string => Boolean(url))
      : [];

  return [coverImageUrl, ...mediaImages].filter(Boolean);
}

export const hasAvailableStock = (product: ProductWithVariations): boolean => {
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
