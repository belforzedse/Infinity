import { apiClient } from "../index";
import { IMAGE_BASE_URL } from "@/constants/api";

// Simple cache implementation for orders
class OrderCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

const orderCache = new OrderCache();

/**
 * Interface for order payment verification
 */
export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  orderId: number;
  orderNumber: string;
  paymentStatus: string;
}

/**
 * Interface for order status check
 */
export interface OrderStatusResponse {
  id: number;
  Status: string;
  OrderNumber: string;
  PaymentStatus: string;
  createdAt: string;
  updatedAt: string;
  Total: number;
}

/**
 * Interface for order payment status check
 */
export interface OrderPaymentStatusResponse {
  success: boolean;
  orderId: number;
  status: string;
  isPaid: boolean;
}

/**
 * Interface for user's order list
 */
export interface OrderItem {
  id: number;
  Count: number;
  PerAmount: number;
  ProductTitle: string;
  ProductSKU: string;
  product_variation: {
    id: number;
    product: {
      id: number;
      Title: string;
      cover_image?: {
        url: string;
      };
    };
    product_color?: {
      id: number;
      Title: string;
    };
    product_size?: {
      id: number;
      Title: string;
    };
    product_variation_model?: {
      id: number;
      Title: string;
    };
  };
}

export interface Order {
  id: number;
  Status: string;
  Date: string;
  Type: string;
  ShippingCost: number;
  ShippingBarcode?: string;
  Description?: string;
  Note?: string;
  createdAt: string;
  updatedAt: string;
  order_items: OrderItem[];
  shipping: {
    id: number;
    Title: string;
    Price: number;
  };
}

export interface OrdersResponse {
  data: Order[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * Verify a payment after being redirected back from the payment gateway
 * @param orderId The order ID
 * @param refNum Reference number from payment gateway
 * @returns Payment verification result
 */
export const verifyPayment = async (
  orderId: number,
  refNum: string
): Promise<PaymentVerificationResponse> => {
  try {
    const response = await apiClient.get<PaymentVerificationResponse>(
      `/orders/verify-payment?orderId=${orderId}&refNum=${refNum}`
    );
    return response as any;
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    throw error;
  }
};

/**
 * Check the status of an order
 * @param orderId The order ID
 * @returns Order status information
 */
export const getOrderStatus = async (
  orderId: number
): Promise<OrderStatusResponse> => {
  try {
    const response = await apiClient.get<OrderStatusResponse>(
      `/orders/${orderId}/status`
    );
    return response as any;
  } catch (error: any) {
    console.error("Error getting order status:", error);
    throw error;
  }
};

/**
 * Check the payment status of an order
 * @param orderId The order ID
 * @returns Order payment status information
 */
export const getOrderPaymentStatus = async (
  orderId: number
): Promise<OrderPaymentStatusResponse> => {
  try {
    const response = await apiClient.get<OrderPaymentStatusResponse>(
      `/orders/${orderId}/payment-status`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error checking order payment status:", error);
    throw error;
  }
};

/**
 * Get the list of orders for the current user
 * @param page Page number for pagination
 * @param pageSize Number of orders per page
 * @returns List of user orders with pagination metadata
 */
export const getMyOrders = async (
  page: number = 1,
  pageSize: number = 10
): Promise<OrdersResponse> => {
  const cacheKey = `orders_${page}_${pageSize}`;

  // Check cache first
  const cachedData = orderCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await apiClient.get(
      `/orders/my-orders?page=${page}&pageSize=${pageSize}`
    );

    // Ensure response has the expected structure
    if (!response.data || !Array.isArray(response.data)) {
      return {
        data: [],
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: 1,
            total: 0,
          },
        },
      };
    }

    // Add full image URLs to order items
    const ordersWithFullImageUrls = (response.data as Order[]).map(
      (order: Order) => ({
        ...order,
        order_items: order.order_items.map((item: OrderItem) => ({
          ...item,
          product_variation: {
            ...item.product_variation,
            product: {
              ...item.product_variation.product,
              cover_image: item.product_variation.product.cover_image
                ? {
                    ...item.product_variation.product.cover_image,
                    url: getFullImageUrl(
                      item.product_variation.product.cover_image.url
                    ),
                  }
                : undefined,
            },
          },
        })),
      })
    );

    // Ensure meta has the expected structure
    const pagination = response.meta?.pagination || {
      page,
      pageSize,
      pageCount: 1,
      total: ordersWithFullImageUrls.length,
    };

    const result = {
      data: ordersWithFullImageUrls,
      meta: {
        pagination,
      },
    };

    // Cache the result
    orderCache.set(cacheKey, result);

    return result;
  } catch (error: any) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
};

/**
 * Helper function to get full image URL
 */
const getFullImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${IMAGE_BASE_URL}${url}`;
};

// Export all functions as a service object
const OrderService = {
  verifyPayment,
  getOrderStatus,
  getOrderPaymentStatus,
  getMyOrders,
  async generateAnipoBarcode(orderId: number, weight?: number, boxSizeId?: number): Promise<any> {
    try {
      const body: any = {};
      if (weight !== undefined) body.weight = weight;
      if (boxSizeId !== undefined) body.boxSizeId = boxSizeId;

      const res = await apiClient.post(`/orders/${orderId}/anipo-barcode`, body);
      return res as any;
    } catch (error: any) {
      console.error("Error generating Anipo barcode:", {
        error,
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        orderId,
        weight,
        boxSizeId
      });
      throw error;
    }
  },
};

export default OrderService;
