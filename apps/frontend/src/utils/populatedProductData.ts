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

  return {
    Title: strapiProduct.Title,
    CoverImage: coverImageUrl,
    Description: strapiProduct.Description,
    Status: "Active",
    Weight: strapiProduct.Weight ?? 100,
    Media: mediaIds,
    product_main_category: mainCategory,
    product_tags: productTags,
    Files: files,
    product_other_categories: otherCategories,
  };
}
