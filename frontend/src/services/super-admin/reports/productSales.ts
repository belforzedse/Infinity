import { apiClient } from "@/services";
import { formatQueryParams } from "@/utils/api";

export async function getProductSales(params: { start?: string; end?: string }) {
  const query = formatQueryParams({ ...(params as any), debug: 1 });
  const res = await apiClient.get(`/reports/product-sales${query}`);
  return (res as any).data as Array<{
    productVariationId: number;
    productTitle: string;
    productSKU: string;
    totalCount: number;
    totalRevenue: number;
  }>;
}
