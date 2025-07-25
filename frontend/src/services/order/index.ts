import { apiClient } from "../index";
import { IMAGE_BASE_URL } from "@/constants/api";

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

    return {
      data: ordersWithFullImageUrls,
      meta: {
        pagination,
      },
    };
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
};

export default OrderService;
