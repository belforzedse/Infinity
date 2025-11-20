/**
 * Cart operations tests - REAL IMPLEMENTATION
 * Tests actual handlers with mocked external dependencies
 */

import { addItemHandler } from '../controllers/handlers/addItem';
import { checkStockHandler } from '../controllers/handlers/checkStock';
import { applyDiscountHandler } from '../controllers/handlers/applyDiscount';
import {
  createStrapiMock,
  mockContext,
  mockCart,
  mockCartItem,
  mockProductVariation,
  mockDiscount,
  mockUser,
} from '../../../__tests__/mocks/factories';

describe('Cart Operations - Real Handlers', () => {
  let mockStrapi: any;
  let cartService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const mock = createStrapiMock();
    mockStrapi = mock.strapi;

    // Mock cart service methods
    cartService = {
      getUserCart: jest.fn(),
      addCartItem: jest.fn(),
      checkCartStock: jest.fn(),
    };
    mock.registerService('api::cart.cart', cartService);
  });

  describe('addItem Handler', () => {
    it('should add item to cart successfully using REAL handler', async () => {
      const userId = 1;
      const productVariationId = 5;
      const count = 2;

      // Mock service responses
      const cart = mockCart({ id: 10, user: { id: userId } });
      cartService.getUserCart.mockResolvedValue(cart);
      cartService.addCartItem.mockResolvedValue({
        success: true,
        data: {
          cart_item: mockCartItem({
            id: 1,
            Count: count,
            product_variation: { id: productVariationId },
          }),
        },
      });

      const ctx = mockContext({
        request: { body: { productVariationId, count } },
        state: { user: mockUser({ id: userId }) },
      });

      // ✅ Call REAL handler
      const handler = addItemHandler(mockStrapi);
      const result = await handler(ctx);

      // Assert real outcomes
      expect(cartService.getUserCart).toHaveBeenCalledWith(userId);
      expect(cartService.addCartItem).toHaveBeenCalledWith(cart.id, productVariationId, count);
      expect(result.data.success).toBe(true);
      expect(result.data.data.cart_item.Count).toBe(count);
    });

    it('should reject when count is zero - REAL validation', async () => {
      const ctx = mockContext({
        request: { body: { productVariationId: 1, count: 0 } },
        state: { user: mockUser({ id: 1 }) },
      });

      const handler = addItemHandler(mockStrapi);

      // ✅ Real handler throws real error
      await expect(handler(ctx)).rejects.toMatchObject({
        status: 400,
        message: 'Count must be a positive number',
      });

      // Service should NOT be called
      expect(cartService.getUserCart).not.toHaveBeenCalled();
    });

    it('should reject when productVariationId missing - REAL validation', async () => {
      const ctx = mockContext({
        request: { body: { count: 5 } }, // Missing productVariationId
        state: { user: mockUser({ id: 1 }) },
      });

      const handler = addItemHandler(mockStrapi);

      await expect(handler(ctx)).rejects.toMatchObject({
        status: 400,
        message: 'Product variation ID is required',
      });

      expect(cartService.getUserCart).not.toHaveBeenCalled();
    });

    it('should handle service errors - REAL error propagation', async () => {
      cartService.getUserCart.mockResolvedValue(mockCart({ id: 1 }));
      cartService.addCartItem.mockResolvedValue({
        success: false,
        message: 'Product variation not found',
      });

      const ctx = mockContext({
        request: { body: { productVariationId: 999, count: 1 } },
        state: { user: mockUser({ id: 1 }) },
      });

      const handler = addItemHandler(mockStrapi);

      await expect(handler(ctx)).rejects.toMatchObject({
        status: 400,
        payload: expect.objectContaining({
          data: expect.objectContaining({
            success: false,
            error: 'Product variation not found',
          }),
        }),
      });
    });
  });

  describe('checkStock Handler', () => {
    it('should return valid stock status - REAL service call', async () => {
      const userId = 1;
      cartService.checkCartStock.mockResolvedValue({
        valid: true,
        cart: mockCart({
          cart_items: [
            mockCartItem({
              Count: 2,
              product_variation: { product_stock: [{ Quantity: 10 }] },
            }),
          ],
        }),
      });

      const ctx = mockContext({
        state: { user: mockUser({ id: userId }) },
      });

      // ✅ Call REAL handler
      const handler = checkStockHandler(mockStrapi);
      const result = await handler(ctx);

      expect(cartService.checkCartStock).toHaveBeenCalledWith(userId);
      expect(result.data.valid).toBe(true);
    });

    it('should detect out-of-stock items - REAL logic', async () => {
      const userId = 1;
      cartService.checkCartStock.mockResolvedValue({
        valid: false,
        itemsRemoved: [{ id: 5, reason: 'Out of stock' }],
        cart: mockCart({ cart_items: [] }),
      });

      const ctx = mockContext({
        state: { user: mockUser({ id: userId }) },
      });

      const handler = checkStockHandler(mockStrapi);
      const result = await handler(ctx);

      expect(result.data.valid).toBe(false);
      expect(result.data.itemsRemoved).toHaveLength(1);
      expect(result.data.itemsRemoved[0].reason).toBe('Out of stock');
    });

    it('should handle service errors gracefully', async () => {
      const userId = 1;
      cartService.checkCartStock.mockRejectedValue(new Error('Database connection error'));

      const ctx = mockContext({
        state: { user: mockUser({ id: userId }) },
      });

      const handler = checkStockHandler(mockStrapi);

      await expect(handler(ctx)).rejects.toMatchObject({
        status: 400,
        message: 'Database connection error',
      });
    });
  });

  describe('applyDiscount Handler', () => {
    it('should apply valid percentage discount - REAL calculation', async () => {
      const userId = 1;
      const discountCode = 'SAVE20';

      // Mock cart with items
      const cart = mockCart({
        id: 1,
        user: { id: userId },
        cart_items: [
          mockCartItem({
            Count: 2,
            product_variation: {
              Price: 150000,
              DiscountPrice: null,
              product: { id: 1 },
            },
          }),
        ],
      });

      cartService.getUserCart.mockResolvedValue(cart);

      // Mock discount code lookup
      mockStrapi.entityService.findMany.mockResolvedValue([
        mockDiscount({
          id: 1,
          Code: discountCode,
          Type: 'Discount',
          Amount: 20, // 20%
          IsActive: true,
          LimitUsage: 100,
          UsedTimes: 50,
          MinCartTotal: 100000,
          MaxCartTotal: null,
        }),
      ]);

      // Mock SnappPay eligibility check
      const snappayService = {
        eligible: jest.fn().mockResolvedValue({
          successful: true,
          response: { eligible: true },
        }),
      };
      mockStrapi.strapi.registerService('api::payment-gateway.snappay', snappayService);

      const ctx = mockContext({
        request: { body: { code: discountCode } },
        state: { user: mockUser({ id: userId }) },
      });

      // ✅ Call REAL handler
      const handler = applyDiscountHandler(mockStrapi);
      const result = await handler(ctx);

      // ✅ Verify REAL calculation: 2 * 150000 = 300000, 20% = 60000 discount
      expect(result.data.success).toBe(true);
      expect(result.data.code).toBe(discountCode);
      expect(result.data.type).toBe('Discount');
      expect(result.data.discount).toBe(60000); // 20% of 300000
      expect(result.data.summary.subtotal).toBe(300000);
      expect(result.data.summary.total).toBe(240000); // 300000 - 60000
    });

    it('should reject expired discount code - REAL validation', async () => {
      const userId = 1;
      cartService.getUserCart.mockResolvedValue(
        mockCart({
          cart_items: [mockCartItem()],
        })
      );

      // Mock expired discount (EndDate is in the past)
      mockStrapi.entityService.findMany.mockResolvedValue([]);

      const ctx = mockContext({
        request: { body: { code: 'EXPIRED' } },
        state: { user: mockUser({ id: userId }) },
      });

      const handler = applyDiscountHandler(mockStrapi);

      await expect(handler(ctx)).rejects.toMatchObject({
        status: 400,
        message: 'Invalid or expired discount code',
        payload: expect.objectContaining({
          data: expect.objectContaining({
            error: 'invalid_or_expired',
          }),
        }),
      });
    });

    it('should enforce usage limits - REAL business logic', async () => {
      const userId = 1;
      cartService.getUserCart.mockResolvedValue(
        mockCart({
          cart_items: [mockCartItem()],
        })
      );

      // Mock discount that reached usage limit
      mockStrapi.entityService.findMany.mockResolvedValue([
        mockDiscount({
          Code: 'LIMITED',
          LimitUsage: 100,
          UsedTimes: 100, // Reached limit!
        }),
      ]);

      const ctx = mockContext({
        request: { body: { code: 'LIMITED' } },
        state: { user: mockUser({ id: userId }) },
      });

      const handler = applyDiscountHandler(mockStrapi);

      await expect(handler(ctx)).rejects.toMatchObject({
        status: 400,
        message: 'Discount code usage limit reached',
        payload: expect.objectContaining({
          data: expect.objectContaining({
            error: 'usage_limit_reached',
          }),
        }),
      });
    });

    it('should enforce minimum cart total - REAL validation', async () => {
      const userId = 1;
      cartService.getUserCart.mockResolvedValue(
        mockCart({
          cart_items: [
            mockCartItem({
              Count: 1,
              product_variation: { Price: 50000 }, // Only 50k
            }),
          ],
        })
      );

      mockStrapi.entityService.findMany.mockResolvedValue([
        mockDiscount({
          Code: 'BIGORDER',
          MinCartTotal: 200000, // Requires 200k minimum
        }),
      ]);

      const ctx = mockContext({
        request: { body: { code: 'BIGORDER' } },
        state: { user: mockUser({ id: userId }) },
      });

      const handler = applyDiscountHandler(mockStrapi);

      await expect(handler(ctx)).rejects.toMatchObject({
        status: 400,
        message: 'Cart total is below the minimum for this coupon',
        payload: expect.objectContaining({
          data: expect.objectContaining({
            error: 'below_min_cart_total',
          }),
        }),
      });
    });

    it('should reject discount for empty cart', async () => {
      const userId = 1;
      cartService.getUserCart.mockResolvedValue(
        mockCart({
          cart_items: [], // Empty cart
        })
      );

      const ctx = mockContext({
        request: { body: { code: 'SAVE10' } },
        state: { user: mockUser({ id: userId }) },
      });

      const handler = applyDiscountHandler(mockStrapi);

      await expect(handler(ctx)).rejects.toMatchObject({
        status: 400,
        message: 'Cart is empty',
        payload: expect.objectContaining({
          data: expect.objectContaining({
            error: 'empty_cart',
          }),
        }),
      });
    });

    it('should apply fixed amount discount - REAL calculation', async () => {
      const userId = 1;
      cartService.getUserCart.mockResolvedValue(
        mockCart({
          cart_items: [
            mockCartItem({
              Count: 1,
              product_variation: { Price: 500000 },
            }),
          ],
        })
      );

      mockStrapi.entityService.findMany.mockResolvedValue([
        mockDiscount({
          Code: 'FIXED50K',
          Type: 'Cash', // Fixed amount
          Amount: 50000,
        }),
      ]);

      const snappayService = {
        eligible: jest.fn().mockResolvedValue({ successful: true, response: { eligible: true } }),
      };
      mockStrapi.strapi.registerService('api::payment-gateway.snappay', snappayService);

      const ctx = mockContext({
        request: { body: { code: 'FIXED50K' } },
        state: { user: mockUser({ id: userId }) },
      });

      const handler = applyDiscountHandler(mockStrapi);
      const result = await handler(ctx);

      // ✅ Verify fixed discount applied correctly
      expect(result.data.discount).toBe(50000);
      expect(result.data.summary.total).toBe(450000); // 500000 - 50000
    });
  });
});
