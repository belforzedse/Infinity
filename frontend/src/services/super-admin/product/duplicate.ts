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
  Weight?: number;
  CleaningTips?: string;
  ReturnConditions?: string;
  Files?: StrapiRelationList;
  Media?: StrapiRelationList;
  CoverImage?: StrapiRelation;
  product_main_category?: StrapiRelation;
  product_tags?: StrapiRelationList;
  product_other_categories?: StrapiRelationList;
  product_variations?: StrapiRelationList;
  product_size_helper?: StrapiRelation;
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
      product_size_helper: true,
    });

    // Normalize to our safer ProductAttributes shape
    const originalData = originalProduct.data.attributes as unknown as ProductAttributes;

    // Prepare data for duplicate
    const duplicateData = {
      Title: `${originalData.Title} - کپی`,
      Description: originalData.Description,
      Status: originalData.Status,
      Weight: originalData.Weight ?? 100,
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
    const response = await apiClient.post<StrapiItem<ProductAttributes>>(
      ENDPOINTS.PRODUCT.PRODUCT,
      { data: duplicateData },
    );

    const newProductId = response.data.id;

    // Duplicate product variations
    if (originalData.product_variations?.data?.length) {
      const variationErrors: string[] = [];
      
      for (const variation of originalData.product_variations.data) {
        try {
          const variationResponse = await apiClient.get<any>(
            `/product-variations/${variation.id}?populate=*`,
          );

          // apiClient.get returns response.data, which is { data: { id, attributes } } from Strapi
          // So variationResponse is { data: { id, attributes } }
          const variationItem = variationResponse.data || variationResponse;
          const variationData = variationItem.attributes || variationItem;

          if (!variationData || !variationData.SKU) {
            console.warn(`Variation ${variation.id} missing SKU or data, skipping`);
            variationErrors.push(`Variation ${variation.id}: Missing SKU or data`);
            continue;
          }

          // Extract relation IDs properly
          const productVariationColor = variationData.product_variation_color?.data?.id || null;
          const productVariationSize = variationData.product_variation_size?.data?.id || null;
          const productVariationModel = variationData.product_variation_model?.data?.id || null;

          const newVariationData: any = {
            SKU: `${variationData.SKU}-copy-${Date.now()}`,
            Price: variationData.Price,
            DiscountPrice: variationData.DiscountPrice || null,
            IsPublished: false,
            product: newProductId,
          };

          // Only add relation fields if they exist
          if (productVariationColor !== null) {
            newVariationData.product_variation_color = productVariationColor;
          }
          if (productVariationSize !== null) {
            newVariationData.product_variation_size = productVariationSize;
          }
          if (productVariationModel !== null) {
            newVariationData.product_variation_model = productVariationModel;
          }

          const newVariationResponse = await apiClient.post<any>(
            `/product-variations`,
            { data: newVariationData },
          );

          // apiClient.post returns response.data, which is { data: { id, attributes } } from Strapi
          const newVariationItem = newVariationResponse.data || newVariationResponse;
          const newVariationId = newVariationItem.id || newVariationItem.data?.id;

          if (!newVariationId) {
            throw new Error(`Failed to get new variation ID from response`);
          }

          // Duplicate stock with 0 count
          if (variationData.product_stock?.data) {
            await apiClient.post<any>(
              `/product-stocks`,
              {
                data: {
                  Count: 0,
                  product_variation: newVariationId,
                },
              },
            );
          }
        } catch (variationError: any) {
          const errorMsg = variationError?.response?.data?.error?.message || variationError?.message || "Unknown error";
          console.error(`Failed to duplicate variation ${variation.id}:`, variationError);
          variationErrors.push(`Variation ${variation.id}: ${errorMsg}`);
          // Continue with next variation instead of failing entire operation
        }
      }

      // Log any variation errors but don't fail the entire operation
      if (variationErrors.length > 0) {
        console.warn(`Some variations failed to duplicate:`, variationErrors);
      }
    }

    // Duplicate size guide if it exists
    if (originalData.product_size_helper?.data) {
      try {
        const sizeHelperId = originalData.product_size_helper.data.id;
        const sizeHelperResponse = await apiClient.get<any>(
          `/product-size-helpers/${sizeHelperId}?populate=*`,
        );

        // apiClient.get returns response.data, which is { data: { id, attributes } } from Strapi
        const sizeHelperItem = sizeHelperResponse.data || sizeHelperResponse;
        const sizeHelperData = sizeHelperItem.attributes || sizeHelperItem;

        if (sizeHelperData?.Helper) {
          await apiClient.post<any>(
            `/product-size-helpers`,
            {
              data: {
                product: newProductId,
                Helper: sizeHelperData.Helper,
              },
            },
          );
        }
      } catch (sizeHelperError: any) {
        // Log error but don't fail the entire operation
        console.warn("Failed to duplicate size guide:", sizeHelperError);
      }
    }

    toast.success("محصول با موفقیت کپی شد");
    return { success: true, data: response.data, newProductId };
  } catch (error: any) {
    console.error("Product duplication error:", error);
    const errorMessage = error.response?.data?.error?.message || "خطا در کپی کردن محصول";
    toast.error(errorMessage);
    return { success: false, error };
  }
};
