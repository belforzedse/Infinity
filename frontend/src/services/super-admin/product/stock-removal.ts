import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";

export interface StockRemovalResult {
  success: boolean;
  totalProductsProcessed: number;
  totalVariationsUpdated: number;
  message: string;
}

// Persian terms to search for
const PERSIAN_TERMS = ['کیف', 'کفش', 'صندل', 'کتونی'];

export const removeStockForPersianTermProducts = async (): Promise<StockRemovalResult> => {
  try {
    const allMatchingProducts: any[] = [];
    let page = 1;
    const pageSize = 100;

    // Search for products containing Persian terms
    while (true) {
      const endpoint = `/products?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate[0]=product_variations&populate[1]=product_variations.product_stock&filters[Status][$eq]=Active`;

      const response = await apiClient.get(endpoint, {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      });

      const products = response.data?.data || [];

      if (products.length === 0) {
        break;
      }

      // Filter products that contain any of the Persian terms in their title
      const matchingProducts = products.filter((product: any) => {
        const title = product.attributes?.Title || '';
        return PERSIAN_TERMS.some(term => title.includes(term));
      });

      allMatchingProducts.push(...matchingProducts);

      // Check if we have more pages
      const totalPages = Math.ceil((response.data?.meta?.pagination?.total || 0) / pageSize);
      if (page >= totalPages) {
        break;
      }

      page++;
    }

    if (allMatchingProducts.length === 0) {
      return {
        success: true,
        totalProductsProcessed: 0,
        totalVariationsUpdated: 0,
        message: 'هیچ محصولی با عبارات مورد نظر یافت نشد'
      };
    }

    // Remove stock for all matching products
    let totalVariationsUpdated = 0;

    for (const product of allMatchingProducts) {
      const variations = product.attributes?.product_variations?.data || [];

      for (const variation of variations) {
        const stockData = variation.attributes?.product_stock?.data;

        if (stockData && stockData.id) {
          try {
            await apiClient.put(
              `/product-stocks/${stockData.id}`,
              {
                data: { Count: 0 }
              },
              {
                headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }
              }
            );

            totalVariationsUpdated++;
          } catch (error) {
            console.error(`Failed to remove stock for variation ${variation.id}:`, error);
          }
        }
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const message = `موجودی ${totalVariationsUpdated} تنوع از ${allMatchingProducts.length} محصول حاوی کلمات (${PERSIAN_TERMS.join('، ')}) با موفقیت حذف شد`;

    return {
      success: true,
      totalProductsProcessed: allMatchingProducts.length,
      totalVariationsUpdated,
      message
    };

  } catch (error: any) {
    console.error('Error removing stock for Persian term products:', error);

    const errorMessage = error.response?.data?.error?.message || 'خطا در حذف موجودی محصولات';

    return {
      success: false,
      totalProductsProcessed: 0,
      totalVariationsUpdated: 0,
      message: errorMessage
    };
  }
};