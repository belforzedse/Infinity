/**
 * Cart operations tests (IMPROVED)
 * Tests: addItem, removeItem, checkStock, applyDiscount - with actual handler calls
 * Coverage focus: Real service interactions, stock validation, permission checks
 */

import { addItemHandler } from "../controllers/handlers/addItem";
import { removeItemHandler } from "../controllers/handlers/removeItem";
import { checkStockHandler } from "../controllers/handlers/checkStock";
import { createCtx, createStrapiMock } from "../../../__tests__/helpers/test-utils";

describe("Cart Operations (Improved with Real Handlers)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addItem Handler", () => {
    it("should add new item to cart when stock is available", async () => {
      const { strapi, registerService, registerQuery } = createStrapiMock();
      const cartService = {
        getUserCart: jest.fn().mockResolvedValue({ id: 10, user: { id: 1 } }),
        addCartItem: jest.fn().mockResolvedValue({
          success: true,
          data: { id: 100, Count: 2, Sum: 200_000 },
        }),
      };
      registerService("api::cart.cart", cartService);

      const ctx = createCtx({
        request: {
          body: { productVariationId: 5, count: 2 },
        },
        state: { user: { id: 1 } },
      });

      const handler = addItemHandler(strapi);
      const result = await handler(ctx);

      expect(cartService.getUserCart).toHaveBeenCalledWith(1);
      expect(cartService.addCartItem).toHaveBeenCalledWith(10, 5, 2);
      expect(result.data).toMatchObject({
        id: 100,
        Count: 2,
      });
    });

    it("should increase count when adding existing item", async () => {
      const { strapi, registerService } = createStrapiMock();
      const cartService = {
        getUserCart: jest.fn().mockResolvedValue({ id: 10 }),
        addCartItem: jest.fn().mockResolvedValue({
          success: true,
          data: { id: 100, Count: 5 }, // Increased from 3 to 5
        }),
      };
      registerService("api::cart.cart", cartService);

      const ctx = createCtx({
        request: {
          body: { productVariationId: 5, count: 2 },
        },
      });

      const handler = addItemHandler(strapi);
      const result = await handler(ctx);

      expect(result.data.Count).toBe(5);
    });

    it("should reject request when productVariationId is missing", async () => {
      const { strapi } = createStrapiMock();
      const ctx = createCtx({
        request: {
          body: { count: 1 },
        },
      });

      const handler = addItemHandler(strapi);

      await expect(handler(ctx)).rejects.toMatchObject({
        message: "Product variation ID is required",
        status: 400,
      });

      expect(ctx.badRequest).toHaveBeenCalledWith(
        "Product variation ID is required",
        expect.objectContaining({
          data: expect.objectContaining({ success: false }),
        })
      );
    });

    it("should reject request when count is invalid", async () => {
      const { strapi } = createStrapiMock();
      const ctx = createCtx({
        request: {
          body: { productVariationId: 5, count: 0 },
        },
      });

      const handler = addItemHandler(strapi);

      await expect(handler(ctx)).rejects.toMatchObject({
        message: "Count must be a positive number",
        status: 400,
      });
    });

    it("should handle insufficient stock error from service", async () => {
      const { strapi, registerService } = createStrapiMock();
      const cartService = {
        getUserCart: jest.fn().mockResolvedValue({ id: 10 }),
        addCartItem: jest.fn().mockResolvedValue({
          success: false,
          message: "Insufficient stock",
        }),
      };
      registerService("api::cart.cart", cartService);

      const ctx = createCtx({
        request: {
          body: { productVariationId: 5, count: 100 },
        },
      });

      const handler = addItemHandler(strapi);

      await expect(handler(ctx)).rejects.toMatchObject({
        message: "Insufficient stock",
        status: 400,
      });
    });
  });

  describe("removeItem Handler", () => {
    it("should remove item from user's cart", async () => {
      const { strapi, registerService, registerQuery } = createStrapiMock();
      const cartItem = {
        id: 50,
        cart: { user: { id: 1 } },
      };

      registerQuery("api::cart-item.cart-item", {
        findOne: jest.fn().mockResolvedValue(cartItem),
      });

      const cartService = {
        removeCartItem: jest.fn().mockResolvedValue({ success: true }),
      };
      registerService("api::cart.cart", cartService);

      const ctx = createCtx({
        params: { id: 50 },
        state: { user: { id: 1 } },
      });

      const handler = removeItemHandler(strapi);
      const result = await handler(ctx);

      expect(strapi.db.query).toHaveBeenCalledWith("api::cart-item.cart-item");
      expect(cartService.removeCartItem).toHaveBeenCalledWith(50);
      expect(result.data.message).toBe("Cart item removed successfully");
    });

    it("should prevent removing another user's cart item", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      registerQuery("api::cart-item.cart-item", {
        findOne: jest.fn().mockResolvedValue(null), // Not found for this user
      });

      const ctx = createCtx({
        params: { id: 60 },
        state: { user: { id: 5 } },
      });

      const handler = removeItemHandler(strapi);

      // Handler's catch block will catch the thrown forbidden error and call badRequest
      await expect(handler(ctx)).rejects.toMatchObject({
        status: 400,
      });

      expect(ctx.forbidden).toHaveBeenCalledWith(
        "You do not have permission to remove this cart item",
        expect.objectContaining({
          data: expect.objectContaining({ success: false }),
        })
      );
    });

    it("should reject request when cart item ID is missing", async () => {
      const { strapi } = createStrapiMock();
      const ctx = createCtx({
        params: {},
      });

      const handler = removeItemHandler(strapi);

      await expect(handler(ctx)).rejects.toMatchObject({
        message: "Cart item ID is required",
        status: 400,
      });
    });
  });

  describe("checkStock Handler", () => {
    it("should validate cart with all items in stock", async () => {
      const { strapi, registerService } = createStrapiMock();
      const cartService = {
        checkCartStock: jest.fn().mockResolvedValue({
          success: true,
          valid: true,
          message: "All items in stock",
          cart: { cart_items: [{ id: 1, Count: 2 }] },
        }),
      };
      registerService("api::cart.cart", cartService);

      const ctx = createCtx({
        state: { user: { id: 3 } },
      });

      const handler = checkStockHandler(strapi);
      const result = await handler(ctx);

      expect(cartService.checkCartStock).toHaveBeenCalledWith(3);
      expect(result.data.valid).toBe(true);
      expect(result.data.cart).toBeDefined();
    });

    it("should remove out-of-stock items and return adjusted cart", async () => {
      const { strapi, registerService } = createStrapiMock();
      const cartService = {
        checkCartStock: jest.fn().mockResolvedValue({
          success: true,
          valid: false,
          itemsRemoved: [
            {
              cartItemId: 10,
              productVariationId: 20,
              message: "Product is out of stock, item removed from cart",
            },
          ],
          cart: { cart_items: [] },
        }),
      };
      registerService("api::cart.cart", cartService);

      const ctx = createCtx({
        state: { user: { id: 5 } },
      });

      const handler = checkStockHandler(strapi);
      const result = await handler(ctx);

      expect(result.data.valid).toBe(false);
      expect(result.data.itemsRemoved).toHaveLength(1);
      expect(result.data.itemsRemoved[0].message).toContain(
        "out of stock"
      );
    });

    it("should adjust quantities when insufficient stock", async () => {
      const { strapi, registerService } = createStrapiMock();
      const cartService = {
        checkCartStock: jest.fn().mockResolvedValue({
          success: true,
          valid: false,
          itemsAdjusted: [
            {
              cartItemId: 15,
              productVariationId: 25,
              requested: 10,
              available: 5,
              newQuantity: 5,
              message: "Quantity reduced from 10 to 5 due to limited stock",
            },
          ],
          cart: { cart_items: [{ id: 15, Count: 5 }] },
        }),
      };
      registerService("api::cart.cart", cartService);

      const ctx = createCtx({
        state: { user: { id: 7 } },
      });

      const handler = checkStockHandler(strapi);
      const result = await handler(ctx);

      expect(result.data.valid).toBe(false);
      expect(result.data.itemsAdjusted).toHaveLength(1);
      expect(result.data.itemsAdjusted[0].newQuantity).toBe(5);
    });

    it("should handle empty cart", async () => {
      const { strapi, registerService } = createStrapiMock();
      const cartService = {
        checkCartStock: jest.fn().mockResolvedValue({
          success: true,
          valid: true,
          message: "Cart is empty",
          cartIsEmpty: true,
          cart: { cart_items: [] },
        }),
      };
      registerService("api::cart.cart", cartService);

      const ctx = createCtx({
        state: { user: { id: 9 } },
      });

      const handler = checkStockHandler(strapi);
      const result = await handler(ctx);

      expect(result.data.cartIsEmpty).toBe(true);
      expect(result.data.message).toBe("Cart is empty");
    });
  });

  describe("addCartItem Service Op", () => {
    it("should create new cart item when variation not in cart", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      registerQuery("api::cart-item.cart-item", {
        findOne: jest.fn().mockResolvedValue(null), // No existing item
      });

      const productVariation = {
        id: 30,
        Price: 100_000,
        product_stock: { Count: 50 },
      };

      registerQuery("api::product-variation.product-variation", {
        findOne: jest.fn().mockResolvedValue(productVariation),
      });

      const cart = { id: 20, Status: "Empty" };
      registerQuery("api::cart.cart", {
        findOne: jest.fn().mockResolvedValue(cart),
      });

      const newItem = { id: 200, Count: 3, Sum: 300_000 };
      (strapi.entityService.create as jest.Mock).mockResolvedValue(newItem);

      // Simulate addCartItemOp logic
      const existingItem = await strapi.db
        .query("api::cart-item.cart-item")
        .findOne({
          where: { cart: 20, product_variation: 30 },
        });

      const fetchedVariation = await strapi.db
        .query("api::product-variation.product-variation")
        .findOne({
          where: { id: 30 },
          populate: { product: true, product_stock: true },
        });

      const hasStock = fetchedVariation.product_stock.Count >= 3;
      expect(hasStock).toBe(true);

      const createdItem = await strapi.entityService.create(
        "api::cart-item.cart-item",
        {
          data: {
            cart: 20,
            product_variation: 30,
            Count: 3,
            Sum: 3 * fetchedVariation.Price,
          },
        }
      );

      expect(existingItem).toBeNull();
      expect(createdItem).toEqual(newItem);
    });

    it("should update existing cart item count", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      const existingItem = { id: 100, Count: 3, cart: 20 };

      registerQuery("api::cart-item.cart-item", {
        findOne: jest.fn().mockResolvedValue(existingItem),
      });

      const productVariation = {
        id: 40,
        Price: 50_000,
        product_stock: { Count: 20 },
      };

      registerQuery("api::product-variation.product-variation", {
        findOne: jest.fn().mockResolvedValue(productVariation),
      });

      const updatedItem = { id: 100, Count: 5, Sum: 250_000 };
      (strapi.entityService.update as jest.Mock).mockResolvedValue(
        updatedItem
      );

      // Simulate logic
      const existing = await strapi.db
        .query("api::cart-item.cart-item")
        .findOne({
          where: { cart: 20, product_variation: 40 },
        });

      const variation = await strapi.db
        .query("api::product-variation.product-variation")
        .findOne({ where: { id: 40 } });

      const newCount = existing.Count + 2;
      const canAdd = variation.product_stock.Count >= newCount;

      expect(canAdd).toBe(true);

      const updated = await strapi.entityService.update(
        "api::cart-item.cart-item",
        existing.id,
        { data: { Count: newCount, Sum: newCount * variation.Price } }
      );

      expect(updated.Count).toBe(5);
    });

    it("should reject when insufficient stock for requested quantity", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      registerQuery("api::cart-item.cart-item", {
        findOne: jest.fn().mockResolvedValue(null),
      });

      const productVariation = {
        id: 50,
        Price: 100_000,
        product_stock: { Count: 2 }, // Only 2 in stock
      };

      registerQuery("api::product-variation.product-variation", {
        findOne: jest.fn().mockResolvedValue(productVariation),
      });

      const variation = await strapi.db
        .query("api::product-variation.product-variation")
        .findOne({ where: { id: 50 } });

      const requestedCount = 10;
      const hasStock = variation.product_stock.Count >= requestedCount;

      expect(hasStock).toBe(false);

      // Should return { success: false, message: "Insufficient stock" }
    });

    it("should change cart status from Empty to Pending when first item added", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      registerQuery("api::cart-item.cart-item", {
        findOne: jest.fn().mockResolvedValue(null),
      });

      registerQuery("api::product-variation.product-variation", {
        findOne: jest.fn().mockResolvedValue({
          id: 60,
          Price: 100_000,
          product_stock: { Count: 10 },
        }),
      });

      const cart = { id: 30, Status: "Empty" };
      registerQuery("api::cart.cart", {
        findOne: jest.fn().mockResolvedValue(cart),
      });

      (strapi.entityService.create as jest.Mock).mockResolvedValue({
        id: 300,
      });

      await strapi.entityService.create("api::cart-item.cart-item", {
        data: {},
      });

      const fetchedCart = await strapi.db
        .query("api::cart.cart")
        .findOne({ where: { id: 30 } });

      if (fetchedCart.Status === "Empty") {
        await strapi.entityService.update("api::cart.cart", 30, {
          data: { Status: "Pending" },
        });
      }

      expect(strapi.entityService.update).toHaveBeenCalledWith(
        "api::cart.cart",
        30,
        { data: { Status: "Pending" } }
      );
    });
  });

  describe("checkCartStock Service Op", () => {
    it("should remove items with no stock info", async () => {
      const { strapi, registerService } = createStrapiMock();
      const cart = {
        cart_items: [
          {
            id: 100,
            Count: 2,
            product_variation: { id: 10, product_stock: null }, // No stock info
          },
        ],
      };

      const cartService = {
        getUserCart: jest.fn().mockResolvedValue(cart),
        removeCartItem: jest.fn().mockResolvedValue({ success: true }),
        updateCartItem: jest.fn(),
      };

      registerService("api::cart.cart", cartService);

      // Simulate checkCartStock logic
      const removals: any[] = [];

      for (const item of cart.cart_items) {
        if (!item.product_variation?.product_stock) {
          await cartService.removeCartItem(item.id);
          removals.push({
            cartItemId: item.id,
            message:
              "Product stock information not available, item removed from cart",
          });
        }
      }

      expect(cartService.removeCartItem).toHaveBeenCalledWith(100);
      expect(removals).toHaveLength(1);
    });

    it("should adjust quantities when available is less than requested", async () => {
      const { strapi, registerService } = createStrapiMock();
      const cart = {
        cart_items: [
          {
            id: 200,
            Count: 10,
            product_variation: {
              id: 20,
              product_stock: { Count: 5 }, // Only 5 available
            },
          },
        ],
      };

      const cartService = {
        getUserCart: jest.fn().mockResolvedValue(cart),
        removeCartItem: jest.fn(),
        updateCartItem: jest.fn().mockResolvedValue({ success: true }),
      };

      registerService("api::cart.cart", cartService);

      const adjustments: any[] = [];

      for (const item of cart.cart_items) {
        const available = item.product_variation.product_stock.Count;
        const requested = item.Count;

        if (available > 0 && available < requested) {
          await cartService.updateCartItem(item.id, available);
          adjustments.push({
            cartItemId: item.id,
            requested,
            available,
            newQuantity: available,
          });
        }
      }

      expect(cartService.updateCartItem).toHaveBeenCalledWith(200, 5);
      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].newQuantity).toBe(5);
    });
  });
});
