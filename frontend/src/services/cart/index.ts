import { apiClient } from "../index";
// removed unused imports: ApiResponse, IMAGE_BASE_URL
import logger from "@/utils/logger";

// Types for API responses
export interface ImageFormat {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: string | null;
  size: number;
  width: number;
  height: number;
  sizeInBytes?: number;
}

export interface ImageFormats {
  large?: ImageFormat;
  small?: ImageFormat;
  medium?: ImageFormat;
  thumbnail?: ImageFormat;
}

export interface ImageResponse {
  id: number;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: ImageFormats;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: any | null;
  folderPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: number;
  Title: string;
  Slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItemResponse {
  id: number;
  Count: number;
  Sum: string | number;
  createdAt?: string;
  updatedAt?: string;
  product_variation: {
    id: number;
    IsPublished?: boolean;
    SKU?: string;
    Price: number | string;
    createdAt?: string;
    updatedAt?: string;
    product_stock: {
      id?: number;
      Count: number;
      createdAt?: string;
      updatedAt?: string;
    };
    product_variation_color?: {
      id: number;
      Title: string;
      ColorCode?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    product_variation_size?: {
      id: number;
      Title: string;
      createdAt?: string;
      updatedAt?: string;
    };
    product_variation_model?: {
      id: number;
      Title: string;
      createdAt?: string;
      updatedAt?: string;
    };
    product: {
      id?: number;
      Title: string;
      Description?: string;
      Status?: string;
      AverageRating?: number | null;
      RatingCount?: number | null;
      SKU?: string;
      category?: string;
      createdAt?: string;
      updatedAt?: string;
      CleaningTips?: string | null;
      ReturnConditions?: string | null;
      removedAt?: string | null;
      CoverImage?: ImageResponse;
      product_main_category?: ProductCategory;
    };
  };
}

export interface CartResponse {
  id: number;
  Status: string;
  cart_items: CartItemResponse[];
}

export interface CartStockCheckResponse {
  success: boolean;
  valid: boolean;
  cartIsEmpty?: boolean;
  itemsAdjusted?: Array<{
    cartItemId: number;
    productVariationId: number;
    requested: number;
    available: number;
    newQuantity: number;
    message: string;
  }>;
  itemsRemoved?: Array<{
    cartItemId: number;
    productVariationId: number;
    requested: number;
    available: number;
    message: string;
  }>;
  cart?: CartResponse;
  message?: string;
}

export interface AddItemRequest {
  productVariationId: number;
  count: number;
}

export interface UpdateItemRequest {
  cartItemId: number;
  count: number;
}

export interface FinalizeCartRequest {
  shipping: number;
  shippingCost: number;
  description?: string;
  note?: string;
  callbackURL?: string;
  addressId?: number;
  gateway?: "mellat" | "snappay";
  mobile?: string;
}

export interface FinalizeCartResponse {
  success: boolean;
  message: string;
  orderId: number;
  contractId?: number;
  redirectUrl?: string;
  refId?: string;
  financialSummary?: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
  };
  requestId?: string;
}

/**
 * Query SnappPay eligibility based on current cart and (optional) shipping
 */
export const getSnappEligible = async (
  params: { shippingId?: number; shippingCost?: number } = {},
): Promise<{
  eligible: boolean;
  title?: string;
  description?: string;
  amountIRR?: number;
}> => {
  const qs = new URLSearchParams();
  if (params.shippingId) qs.set("shippingId", String(params.shippingId));
  if (params.shippingCost) qs.set("shippingCost", String(params.shippingCost));
  const url = `/payment-gateway/snapp-eligible${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;
  const response = await apiClient.get<any>(url);
  // ApiClient may return either the raw Strapi wrapper or already-unwrapped data
  // Try common shapes in order
  const payload = response?.data?.data ?? response?.data ?? response;
  return payload || { eligible: false };
};

export interface CreateOrderRequest {
  shipping_address_id: number;
  shipping_method_id: number;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  orderId: number;
  orderNumber: string;
}

/**
 * Get the user's cart
 * @returns Cart response with items
 */
export const getUserCart = async (): Promise<CartResponse> => {
  const response = await apiClient.get<CartResponse>("/carts/me");
  return response.data;
};

/**
 * Add an item to the cart
 * @param productVariationId The ID of the product variation
 * @param count The quantity to add
 * @returns The added cart item
 */
export const addItemToCart = async (
  productVariationId: number,
  count: number,
): Promise<CartItemResponse> => {
  try {
    const response = await apiClient.post<CartItemResponse>("/carts/add-item", {
      productVariationId,
      count,
    });
    return response.data;
  } catch (error: any) {
    // Check if the error contains a message from the API
    if (error.error && error.error.message === "Not enough stock") {
      throw new Error("Not enough stock");
    } else if (error.message && error.message === "Not enough stock") {
      throw new Error("Not enough stock");
    }
    throw error;
  }
};

/**
 * Update the quantity of an item in the cart
 * @param cartItemId The ID of the cart item
 * @param count The new quantity
 * @returns The updated cart item
 */
export const updateCartItem = async (
  cartItemId: number,
  count: number,
): Promise<CartItemResponse> => {
  try {
    const response = await apiClient.put<CartItemResponse>(
      "/carts/update-item",
      {
        cartItemId,
        count,
      },
    );
    return response.data;
  } catch (error: any) {
    // Check if the error contains a message from the API
    if (error.error && error.error.message === "Not enough stock") {
      throw new Error("Not enough stock");
    } else if (error.message && error.message === "Not enough stock") {
      throw new Error("Not enough stock");
    }
    throw error;
  }
};

/**
 * Remove an item from the cart
 * @param cartItemId The ID of the cart item to remove
 * @returns Success message
 */
export const removeCartItem = async (
  cartItemId: number,
): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(
    `/carts/remove-item/${cartItemId}`,
  );
  return response as any;
};

/**
 * Check if all items in the cart have sufficient stock
 * @returns Stock check response
 */
export const checkCartStock = async (): Promise<CartStockCheckResponse> => {
  const response =
    await apiClient.get<CartStockCheckResponse>("/carts/check-stock");
  return response as any;
};

/**
 * Finalize the cart to create an order
 * @param data Shipping and order information
 * @returns Response with order ID
 */
export const finalizeCart = async (
  data: FinalizeCartRequest,
): Promise<FinalizeCartResponse> => {
  if (process.env.NODE_ENV !== "production") {
    logger.info("=== FINALIZE CART REQUEST ===");
    logger.info("Request data", { data });
  }

  const response = await apiClient.post<FinalizeCartResponse>(
    "/carts/finalize",
    data,
  );

  if (process.env.NODE_ENV !== "production") {
    logger.info("=== FINALIZE CART RAW RESPONSE ===");
    logger.info("Full response", { response });
    logger.info("Response.data", { data: response.data });
    logger.info("Response.data type", { type: typeof response.data });
  }

  return response.data;
};

/**
 * Create an order from the current cart
 * @param data Order creation data including shipping address and shipping method
 * @returns Order creation response with order ID and number
 * @note customer_name and customer_phone are optional and will be retrieved from the user profile if not provided
 */
export const createOrder = async (
  data: CreateOrderRequest,
): Promise<CreateOrderResponse> => {
  try {
    const response = await apiClient.post<CreateOrderResponse>(
      "/orders/create",
      data,
    );
    return response.data;
  } catch (error: any) {
    console.error("Error creating order:", error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error("Authentication required");
    }
    throw error;
  }
};

// Export all functions as a service object
const CartService = {
  getUserCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  checkCartStock,
  finalizeCart,
  createOrder,
  getSnappEligible,
};

export default CartService;
