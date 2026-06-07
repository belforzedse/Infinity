import type { ProductDataResponse, GenericRelationArray } from "@/services/super-admin/product/get";
import type { EditProductData } from "@/types/super-admin/products";
import type { TagResponseType, TagAttributes } from "@/services/super-admin/product/tag/get";

interface CategoryAttributes {
  Title: string;
  Slug: string;
  createdAt: string;
  updatedAt: string;
}

interface StrapiCategory {
  id: number;
  attributes: CategoryAttributes;
}

interface StrapiArrayResponse<T> {
  data: T[] | null;
}

interface StrapiTagData {
  id: number;
  attributes: TagAttributes;
}

interface VariationStockData {
  id: number;
  attributes?: {
    Count?: number;
  };
}

interface VariationData {
  id: number;
  attributes?: {
    IsPublished?: boolean;
    SKU?: string;
    Price?: number | string;
    DiscountPrice?: number | string | null;
    product_stock?: {
      data?: VariationStockData | null;
    };
    product_variation_color?: { data?: unknown | null };
    product_variation_size?: { data?: unknown | null };
    product_variation_model?: { data?: unknown | null };
  };
}

const safeNumber = (value: number | string | null | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function transformToProductData(strapiProduct: ProductDataResponse): EditProductData {
  // Extract CoverImage URL if it exists, otherwise use an empty string
  const coverImageUrl = {
    data: strapiProduct.CoverImage.data || null,
  };

  // Map each media item to its url. If no data, use an empty array.
  const mediaIds = strapiProduct.Media.data;

  // Transform product_main_category to categoryResponseType or null
  const mainCategory = strapiProduct.product_main_category.data as StrapiCategory | null;

  // Convert product_tags to TagResponseType array
  const productTags: TagResponseType[] = (
    strapiProduct.product_tags as unknown as GenericRelationArray<StrapiTagData>
  ).data.map((tag) => ({
    id: tag.id,
    attributes: tag.attributes,
  }));

  // Convert Files into an array of strings
  const files = strapiProduct.Files.data;

  // Transform product_other_categories into array of categoryResponseType
  const otherCategories = (
    (strapiProduct.product_other_categories as StrapiArrayResponse<StrapiCategory>).data || []
  ).map((category) => ({
    id: category.id,
    attributes: {
      Title: category.attributes.Title,
      Slug: category.attributes.Slug,
      createdAt: category.attributes.createdAt,
      updatedAt: category.attributes.updatedAt,
    },
  }));

  const productVariations = (strapiProduct.product_variations?.data || []) as VariationData[];
  const simpleVariation =
    productVariations.find((variation) => variation?.attributes?.IsPublished === true) ||
    productVariations[0];
  const hasOnlyRelationlessVariation =
    productVariations.length === 1 &&
    !simpleVariation?.attributes?.product_variation_color?.data &&
    !simpleVariation?.attributes?.product_variation_size?.data &&
    !simpleVariation?.attributes?.product_variation_model?.data;
  const isSimpleProduct =
    strapiProduct.IsSimpleProduct === true ||
    strapiProduct.ProductType === "Simple" ||
    hasOnlyRelationlessVariation;
  const productType = isSimpleProduct ? "Simple" : "Variable";
  const simpleVariationAttributes = simpleVariation?.attributes;
  const simpleStock = simpleVariationAttributes?.product_stock?.data;
  const simpleDiscountPrice = simpleVariationAttributes?.DiscountPrice;

  return {
    Title: strapiProduct.Title,
    CoverImage: coverImageUrl,
    Description: strapiProduct.Description,
    Status: "Active",
    ProductType: productType,
    IsSimpleProduct: isSimpleProduct,
    SimpleVariationId: simpleVariation?.id,
    SimpleStockId: simpleStock?.id,
    SimpleSKU: simpleVariationAttributes?.SKU || "",
    SimplePrice: safeNumber(simpleVariationAttributes?.Price, 0),
    SimpleDiscountPrice:
      simpleDiscountPrice === null || simpleDiscountPrice === undefined
        ? null
        : safeNumber(simpleDiscountPrice, 0),
    SimpleStock: safeNumber(simpleStock?.attributes?.Count, 0),
    SimpleIsPublished: simpleVariationAttributes?.IsPublished !== false,
    Weight: strapiProduct.Weight ?? 100,
    Media: mediaIds,
    product_main_category: mainCategory,
    product_tags: productTags,
    Files: files,
    product_other_categories: otherCategories,
  };
}
