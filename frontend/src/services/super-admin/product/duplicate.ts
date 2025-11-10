import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import { toast } from "react-hot-toast";
import { getProduct } from "./get";

// --- Generic Strapi response wrappers ---
interface StrapiItem<T = any> {
  id: number;
  attributes: T;
}

interface StrapiRelation<T = any> {
  data: StrapiItem<T> | null;
}

interface StrapiRelationList<T = any> {
  data: StrapiItem<T>[];
}

interface ProductAttributes {
  Title: string;
  Description?: string;
  Status?: string;
  CleaningTips?: string;
  ReturnConditions?: string;
  Files?: StrapiRelationList;
  Media?: StrapiRelationList;
  CoverImage?: StrapiRelation;
  product_main_category?: StrapiRelation;
  product_tags?: StrapiRelationList;
  product_other_categories?: StrapiRelationList;
  product_variations?: StrapiRelationList;
}

// --- Main function ---
export const duplicateProduct = async (productId: string) => {
  try {
    // Get the original product with all relations
    const originalProduct = await getProduct(productId, {
      Files: true,
      Media: true,
      CoverImage: true,
      product_main_category: true,
      product_tags: true,
      product_variations: true,
      product_other_categories: true,
    });

    // Normalize to our safer ProductAttributes shape
    const originalData = originalProduct.data.attributes as unknown as ProductAttributes;

    // Prepare data for duplicate
    const duplicateData = {
      Title: `${originalData.Title} - کپی`,
      Description: originalData.Description,
      Status: originalData.Status,
      CleaningTips: originalData.CleaningTips,
      ReturnConditions: originalData.ReturnConditions,
      Files: originalData.Files?.data?.map((file) => file.id) || [],
      Media: originalData.Media?.data?.map((media) => media.id) || [],
      CoverImage: originalData.CoverImage?.data?.id || null,
      product_main_category: originalData.product_main_category?.data?.id || null,
      product_tags: originalData.product_tags?.data?.map((tag) => tag.id) || [],
      product_other_categories:
        originalData.product_other_categories?.data?.map((cat) => cat.id) || [],
    };

    // Create duplicate product
    const response = await apiClient.post<{ data: StrapiItem<ProductAttributes> }>(
      ENDPOINTS.PRODUCT.PRODUCT,
      { data: duplicateData },
    );

    const newProductId = response.data.data.id;

    // Duplicate product variations
    if (originalData.product_variations?.data?.length) {
      for (const variation of originalData.product_variations.data) {
        try {
          const variationResponse = await apiClient.get<{ data: StrapiItem<any> }>(
            `/product-variations/${variation.id}?populate=*`,
          );

          const variationData = variationResponse.data.data.attributes;

          const newVariationData = {
            SKU: `${variationData.SKU}-copy-${Date.now()}`,
            Price: variationData.Price,
            DiscountPrice: variationData.DiscountPrice,
            IsPublished: false,
            product: newProductId,
            ...Object.fromEntries(
              Object.entries(variationData).filter(
                ([key]) =>
                  !["id", "createdAt", "updatedAt", "product", "product_stock"].includes(key),
              ),
            ),
          };

          const newVariationResponse = await apiClient.post<{ data: StrapiItem<any> }>(
            `/product-variations`,
            { data: newVariationData },
          );

          // Duplicate stock with 0 count
          if (variationData.product_stock?.data) {
            await apiClient.post<{ data: StrapiItem<any> }>(
              `/product-stocks`,
              {
                data: {
                  Count: 0,
                  product_variation: newVariationResponse.data.data.id,
                },
              },
            );
          }
        } catch (variationError) {
          console.error(`Failed to duplicate variation ${variation.id}:`, variationError);
        }
      }
    }

    toast.success("محصول با موفقیت کپی شد");
    return { success: true, data: response.data.data, newProductId };
  } catch (error: any) {
    console.error("Product duplication error:", error);
    const errorMessage = error.response?.data?.error?.message || "خطا در کپی کردن محصول";
    toast.error(errorMessage);
    return { success: false, error };
  }
};
