import CartService from "../index";
import { apiClient } from "../../index";

// Mock the API client
jest.mock("../../index", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("CartService", () => {
  const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
  const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
  const mockPut = apiClient.put as jest.MockedFunction<typeof apiClient.put>;
  const mockDelete = apiClient.delete as jest.MockedFunction<typeof apiClient.delete>;

  beforeEach(() => {
    mockGet.mockClear();
    mockPost.mockClear();
    mockPut.mockClear();
    mockDelete.mockClear();
  });

  describe("getUserCart", () => {
    it("fetches user cart successfully", async () => {
      const mockCartData = {
        id: 1,
        items: [
          {
            id: 1,
            productVariationId: 123,
            count: 2,
            price: 1000,
          },
        ],
        totalPrice: 2000,
      };

      mockGet.mockResolvedValueOnce({ data: mockCartData });

      const result = await CartService.getUserCart();

      expect(mockGet).toHaveBeenCalledWith("/carts/me");
      expect(result).toEqual(mockCartData);
    });

    it("handles API errors when fetching cart", async () => {
      const error = new Error("Unauthorized");
      mockGet.mockRejectedValueOnce(error);

      await expect(CartService.getUserCart()).rejects.toThrow("Unauthorized");
    });
  });

  describe("addItemToCart", () => {
    it("adds item to cart successfully", async () => {
      const addItemRequest = {
        productVariationId: 123,
        count: 2,
      };
      const mockResponse = { success: true, itemId: 456 };

      mockPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await CartService.addItemToCart(addItemRequest);

      expect(mockPost).toHaveBeenCalledWith("/carts/items", addItemRequest);
      expect(result).toEqual(mockResponse);
    });

    it("handles validation errors when adding item", async () => {
      const addItemRequest = {
        productVariationId: 123,
        count: 0, // Invalid count
      };
      const error = new Error("Invalid count");

      mockPost.mockRejectedValueOnce(error);

      await expect(CartService.addItemToCart(addItemRequest)).rejects.toThrow("Invalid count");
    });
  });

  describe("updateCartItem", () => {
    it("updates cart item successfully", async () => {
      const updateRequest = {
        cartItemId: 456,
        count: 3,
      };
      const mockResponse = { success: true };

      mockPut.mockResolvedValueOnce({ data: mockResponse });

      const result = await CartService.updateCartItem(updateRequest);

      expect(mockPut).toHaveBeenCalledWith("/carts/items/456", { count: 3 });
      expect(result).toEqual(mockResponse);
    });

    it("handles errors when updating non-existent item", async () => {
      const updateRequest = {
        cartItemId: 999,
        count: 3,
      };
      const error = new Error("Item not found");

      mockPut.mockRejectedValueOnce(error);

      await expect(CartService.updateCartItem(updateRequest)).rejects.toThrow("Item not found");
    });
  });

  describe("removeCartItem", () => {
    it("removes cart item successfully", async () => {
      const cartItemId = 456;
      const mockResponse = { success: true };

      mockDelete.mockResolvedValueOnce({ data: mockResponse });

      const result = await CartService.removeCartItem(cartItemId);

      expect(mockDelete).toHaveBeenCalledWith("/carts/items/456");
      expect(result).toEqual(mockResponse);
    });

    it("handles errors when removing non-existent item", async () => {
      const cartItemId = 999;
      const error = new Error("Item not found");

      mockDelete.mockRejectedValueOnce(error);

      await expect(CartService.removeCartItem(cartItemId)).rejects.toThrow("Item not found");
    });
  });

  describe("checkCartStock", () => {
    it("checks cart stock successfully", async () => {
      const mockStockResponse = {
        allItemsInStock: true,
        outOfStockItems: [],
      };

      mockGet.mockResolvedValueOnce({ data: mockStockResponse });

      const result = await CartService.checkCartStock();

      expect(mockGet).toHaveBeenCalledWith("/carts/check-stock");
      expect(result).toEqual(mockStockResponse);
    });

    it("handles out of stock items", async () => {
      const mockStockResponse = {
        allItemsInStock: false,
        outOfStockItems: [{ itemId: 123, productName: "Test Product" }],
      };

      mockGet.mockResolvedValueOnce({ data: mockStockResponse });

      const result = await CartService.checkCartStock();

      expect(result.allItemsInStock).toBe(false);
      expect(result.outOfStockItems).toHaveLength(1);
    });
  });

  describe("finalizeCart", () => {
    it("finalizes cart successfully", async () => {
      const finalizeRequest = {
        addressId: 123,
        paymentMethodId: 456,
        shippingMethodId: 789,
      };
      const mockResponse = {
        orderId: 999,
        totalAmount: 5000,
        paymentUrl: "https://payment.example.com",
      };

      mockPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await CartService.finalizeCart(finalizeRequest);

      expect(mockPost).toHaveBeenCalledWith("/carts/finalize", finalizeRequest);
      expect(result).toEqual(mockResponse);
    });

    it("handles errors during cart finalization", async () => {
      const finalizeRequest = {
        addressId: 123,
        paymentMethodId: 456,
        shippingMethodId: 789,
      };
      const error = new Error("Payment processing failed");

      mockPost.mockRejectedValueOnce(error);

      await expect(CartService.finalizeCart(finalizeRequest)).rejects.toThrow("Payment processing failed");
    });
  });

  describe("applyDiscount", () => {
    it("applies discount code successfully", async () => {
      const discountCode = "SAVE20";
      const mockResponse = {
        success: true,
        discountAmount: 1000,
        newTotal: 4000,
      };

      mockPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await CartService.applyDiscount(discountCode);

      expect(mockPost).toHaveBeenCalledWith("/carts/apply-discount", { code: discountCode });
      expect(result).toEqual(mockResponse);
    });

    it("handles invalid discount code", async () => {
      const discountCode = "INVALID";
      const error = new Error("Invalid discount code");

      mockPost.mockRejectedValueOnce(error);

      await expect(CartService.applyDiscount(discountCode)).rejects.toThrow("Invalid discount code");
    });
  });

  describe("getShippingPreview", () => {
    it("gets shipping preview successfully", async () => {
      const addressId = 123;
      const mockResponse = {
        shippingMethods: [
          { id: 1, name: "Standard", price: 50000, estimatedDays: 3 },
          { id: 2, name: "Express", price: 100000, estimatedDays: 1 },
        ],
      };

      mockGet.mockResolvedValueOnce({ data: mockResponse });

      const result = await CartService.getShippingPreview(addressId);

      expect(mockGet).toHaveBeenCalledWith(`/carts/shipping-preview?addressId=${addressId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getSnappEligible", () => {
    it("checks Snapp eligibility successfully", async () => {
      const mockResponse = {
        eligible: true,
        estimatedDeliveryTime: "45 minutes",
      };

      mockGet.mockResolvedValueOnce({ data: mockResponse });

      const result = await CartService.getSnappEligible();

      expect(mockGet).toHaveBeenCalledWith("/carts/snapp-eligible");
      expect(result).toEqual(mockResponse);
    });

    it("handles non-eligible areas", async () => {
      const mockResponse = {
        eligible: false,
        reason: "Area not covered",
      };

      mockGet.mockResolvedValueOnce({ data: mockResponse });

      const result = await CartService.getSnappEligible();

      expect(result.eligible).toBe(false);
      expect(result.reason).toBe("Area not covered");
    });
  });

  it("exports all required cart service methods", () => {
    const expectedMethods = [
      "getUserCart",
      "addItemToCart",
      "updateCartItem",
      "removeCartItem",
      "checkCartStock",
      "finalizeCart",
      "getSnappEligible",
      "getShippingPreview",
      "applyDiscount",
    ];

    expectedMethods.forEach((method) => {
      expect(CartService).toHaveProperty(method);
      expect(typeof CartService[method as keyof typeof CartService]).toBe("function");
    });
  });
});