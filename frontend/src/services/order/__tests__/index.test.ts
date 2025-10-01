import OrderService, {
  verifyPayment,
  getOrderStatus,
  getOrderPaymentStatus,
  getMyOrders,
} from "../index";
import { apiClient } from "../../index";

jest.mock("../../index", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe("OrderService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("verifyPayment", () => {
    it("should verify payment successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Payment verified",
        orderId: 123,
        orderNumber: "ORD-123",
        paymentStatus: "paid",
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await verifyPayment(123, "REF123");

      expect(apiClient.get).toHaveBeenCalledWith(
        "/orders/verify-payment?orderId=123&refNum=REF123",
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle verification errors", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();
      (apiClient.get as jest.Mock).mockRejectedValue(new Error("Network error"));

      await expect(verifyPayment(123, "REF123")).rejects.toThrow("Network error");
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe("getOrderStatus", () => {
    it("should get order status successfully", async () => {
      const mockResponse = {
        id: 123,
        Status: "processing",
        OrderNumber: "ORD-123",
        PaymentStatus: "paid",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-02",
        Total: 100000,
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getOrderStatus(123);

      expect(apiClient.get).toHaveBeenCalledWith("/orders/123/status");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getOrderPaymentStatus", () => {
    it("should get payment status successfully", async () => {
      const mockResponse = {
        data: {
          success: true,
          orderId: 123,
          status: "paid",
          isPaid: true,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getOrderPaymentStatus(123);

      expect(apiClient.get).toHaveBeenCalledWith("/orders/123/payment-status");
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getMyOrders", () => {
    it("should fetch user orders successfully", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            Status: "delivered",
            Date: "2024-01-01",
            Type: "online",
            ShippingCost: 10000,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-02",
            order_items: [
              {
                id: 1,
                Count: 2,
                PerAmount: 50000,
                ProductTitle: "Test Product",
                ProductSKU: "SKU123",
                product_variation: {
                  id: 1,
                  product: {
                    id: 1,
                    Title: "Test Product",
                    cover_image: {
                      url: "/uploads/image.jpg",
                    },
                  },
                },
              },
            ],
            shipping: {
              id: 1,
              Title: "Post",
              Price: 10000,
            },
          },
        ],
        meta: {
          pagination: {
            page: 1,
            pageSize: 10,
            pageCount: 1,
            total: 1,
          },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getMyOrders(1, 10);

      expect(apiClient.get).toHaveBeenCalledWith("/orders/my-orders?page=1&pageSize=10");
      expect(result.data).toHaveLength(1);
      expect(result.meta.pagination.total).toBe(1);
    });

    it("should handle empty orders", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: [],
        meta: {
          pagination: {
            page: 1,
            pageSize: 10,
            pageCount: 1,
            total: 0,
          },
        },
      });

      const result = await getMyOrders();

      expect(result.data).toEqual([]);
      expect(result.meta.pagination.total).toBe(0);
    });

    it("should use default pagination values", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: [],
        meta: { pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 } },
      });

      await getMyOrders();

      expect(apiClient.get).toHaveBeenCalledWith("/orders/my-orders?page=1&pageSize=10");
    });

    it("should handle malformed response", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: null });

      const result = await getMyOrders();

      expect(result.data).toEqual([]);
    });
  });

  describe("generateAnipoBarcode", () => {
    it("should generate barcode successfully", async () => {
      const mockResponse = { barcode: "BARCODE123" };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await OrderService.generateAnipoBarcode(123, 1.5, 2);

      expect(apiClient.post).toHaveBeenCalledWith("/orders/123/anipo-barcode", {
        weight: 1.5,
        boxSizeId: 2,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should handle missing optional parameters", async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});

      await OrderService.generateAnipoBarcode(123);

      expect(apiClient.post).toHaveBeenCalledWith("/orders/123/anipo-barcode", {});
    });
  });
});
