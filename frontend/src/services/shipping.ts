import { apiClient } from "./index";

export interface ShippingMethod {
  id: number;
  attributes: {
    Title: string;
    Price: number;
    IsActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ShippingMethodsResponse {
  data: ShippingMethod[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface ShippingMethodsParams {
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sort?: string;
}

/**
 * Get available shipping methods
 * @param params Optional parameters for filtering and pagination
 * @returns List of available shipping methods
 */
export const getShippingMethods = async (
  params?: ShippingMethodsParams,
): Promise<ShippingMethod[]> => {
  // Build query parameters
  const queryParams: Record<string, string> = {};

  if (params?.isActive !== undefined) {
    queryParams["filters[IsActive][$eq]"] = params.isActive.toString();
  }

  if (params?.page) {
    queryParams["pagination[page]"] = params.page.toString();
  }

  if (params?.pageSize) {
    queryParams["pagination[pageSize]"] = params.pageSize.toString();
  }

  if (params?.sort) {
    queryParams["sort"] = params.sort;
  }

  // Convert query params to URL parameters
  const queryString = new URLSearchParams(queryParams).toString();
  const endpoint = `/shippings${queryString ? `?${queryString}` : ""}`;

  try {
    const response = await apiClient.getPublic(endpoint);
    return response.data as ShippingMethod[];
  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    throw error;
  }
};
