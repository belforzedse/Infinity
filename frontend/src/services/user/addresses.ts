import { apiClient } from "@/services";
import { HTTP_STATUS } from "@/constants/api";
import { handleAuthErrors } from "@/utils/auth";

// Use the central auth error handler instead of local implementation
const handleAuthError = (error: any) => {
  handleAuthErrors(error);
  throw error;
};

export interface ShippingProvince {
  id: number;
  Title: string;
}

export interface ShippingCity {
  id: number;
  Title: string;
  Code: string;
  shipping_province: ShippingProvince;
}

export interface UserAddress {
  id: number;
  PostalCode: string;
  Description: string;
  FullAddress: string;
  createdAt: string;
  shipping_city: ShippingCity;
}

export interface UserAddressesResponse {
  data: UserAddress[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface AddAddressRequest {
  PostalCode: string;
  Description?: string;
  FullAddress: string;
  shipping_city: number;
}

export const getUserAddresses = async (): Promise<UserAddress[]> => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    const response = await apiClient.get("/local-user-addresses/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data as UserAddress[];
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    handleAuthError(error);
    throw error;
  }
};

export const addUserAddress = async (
  address: AddAddressRequest
): Promise<UserAddress> => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("Authentication required");
  }

  // Validate postal code is 10 digits
  if (!/^\d{10}$/.test(address.PostalCode)) {
    throw new Error("Postal code must be a 10-digit number");
  }

  // Validate full address is not empty
  if (!address.FullAddress || address.FullAddress.trim() === "") {
    throw new Error("Full address is required");
  }

  // Validate shipping city is provided
  if (!address.shipping_city) {
    throw new Error("Shipping city is required");
  }

  try {
    const response = await apiClient.post(
      "/local-user-addresses/create",
      address,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data as UserAddress;
  } catch (error) {
    console.error("Error adding user address:", error);
    handleAuthError(error);
    throw error;
  }
};

export const updateUserAddress = async (
  id: number,
  address: AddAddressRequest
): Promise<UserAddress> => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    const response = await apiClient.put(
      `/local-user-addresses/${id}`,
      address,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data as UserAddress;
  } catch (error) {
    console.error("Error updating user address:", error);
    handleAuthError(error);
    throw error;
  }
};

export const deleteUserAddress = async (id: number): Promise<void> => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("Authentication required");
  }

  try {
    await apiClient.delete(`/local-user-addresses/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error deleting user address:", error);
    handleAuthError(error);
    throw error;
  }
};
