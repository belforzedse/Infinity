import { apiClient } from "./index";

export interface Province {
  id: number;
  attributes: {
    Title: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface City {
  id: number;
  attributes: {
    Title: string;
    Code: string;
    createdAt: string;
    updatedAt: string;
    shipping_province: {
      data: {
        id: number;
        attributes: {
          Title: string;
        };
      };
    };
  };
}

export interface ProvincesResponse {
  data: Province[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface CitiesResponse {
  data: City[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface LocationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
}

/**
 * Get all available provinces
 * @param params Optional parameters for pagination and sorting
 * @returns List of provinces
 */
export const getProvinces = async (params?: LocationParams): Promise<Province[]> => {
  // Build query parameters
  const queryParams: Record<string, string> = {};

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
  const endpoint = `/shipping-provinces${queryString ? `?${queryString}` : ""}`;

  try {
    const response = await apiClient.getPublic(endpoint);
    return response.data as Province[];
  } catch (error) {
    console.error("Error fetching provinces:", error);
    throw error;
  }
};

/**
 * Get cities, optionally filtered by province ID
 * @param provinceId Optional province ID to filter cities
 * @param params Optional parameters for pagination and sorting
 * @returns List of cities
 */
export const getCities = async (provinceId?: number, params?: LocationParams): Promise<City[]> => {
  // Build query parameters
  const queryParams: Record<string, string> = {};

  if (provinceId) {
    queryParams["filters[shipping_province][id][$eq]"] = provinceId.toString();
  }

  if (params?.page) {
    queryParams["pagination[page]"] = params.page.toString();
  }

  if (params?.pageSize) {
    queryParams["pagination[pageSize]"] = params.pageSize.toString();
  }

  if (params?.sort) {
    queryParams["sort"] = params.sort || "Title:asc";
  }

  // Always populate shipping_province
  queryParams["populate"] = "shipping_province";

  // Convert query params to URL parameters
  const queryString = new URLSearchParams(queryParams).toString();
  const endpoint = `/shipping-cities${queryString ? `?${queryString}` : ""}`;

  try {
    const response = await apiClient.getPublic(endpoint);
    return response.data as City[];
  } catch (error) {
    console.error("Error fetching cities:", error);
    throw error;
  }
};
