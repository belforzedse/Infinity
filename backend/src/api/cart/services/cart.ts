/**
 * cart service
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreService("api::cart.cart", ({ strapi }) => ({
  async getUserCart(userId: number) {
    // Find user's cart or create one if it doesn't exist
    let cart = await strapi.db.query("api::cart.cart").findOne({
      where: { user: userId },
      populate: {
        cart_items: {
          populate: {
            product_variation: {
              populate: {
                product_stock: true,
                product_variation_color: true,
                product_variation_size: true,
                product_variation_model: true,
                product: {
                  fields: ["Title", "SKU"],
                  populate: {
                    CoverImage: true,
                    product_main_category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      // Create new cart for user
      cart = await strapi.entityService.create("api::cart.cart", {
        data: {
          user: userId,
          Status: "Empty",
        },
      });
    }

    return cart;
  },

  async addCartItem(
    cartId: number,
    productVariationId: number,
    count: number = 1
  ) {
    // Check if item already exists in cart
    const existingItem = await strapi.db
      .query("api::cart-item.cart-item")
      .findOne({
        where: {
          cart: cartId,
          product_variation: productVariationId,
        },
      });

    // Get product variation details for price calculation
    const productVariation = await strapi.db
      .query("api::product-variation.product-variation")
      .findOne({
        where: { id: productVariationId },
        populate: {
          product: true,
          product_stock: true,
        },
      });

    // Check stock availability
    if (
      !productVariation?.product_stock ||
      productVariation.product_stock.Count < count
    ) {
      return { success: false, message: "Insufficient stock" };
    }

    const price = productVariation.Price || 0;

    if (existingItem) {
      // Update count and sum if item already exists
      const newCount = existingItem.Count + count;

      // Check stock for the updated count
      if (productVariation.product_stock.Count < newCount) {
        return {
          success: false,
          message: "Insufficient stock for requested quantity",
        };
      }

      const updatedItem = await strapi.entityService.update(
        "api::cart-item.cart-item",
        existingItem.id,
        {
          data: {
            Count: newCount,
            Sum: newCount * price,
          },
        }
      );

      return { success: true, data: updatedItem };
    } else {
      // Create new cart item
      const newItem = await strapi.entityService.create(
        "api::cart-item.cart-item",
        {
          data: {
            cart: cartId,
            product_variation: productVariationId,
            Count: count,
            Sum: count * price,
          },
        }
      );

      // Update cart status if it was Empty
      const cart = await strapi.db
        .query("api::cart.cart")
        .findOne({ where: { id: cartId } });
      if (cart.Status === "Empty") {
        await strapi.entityService.update("api::cart.cart", cartId, {
          data: { Status: "Pending" },
        });
      }

      return { success: true, data: newItem };
    }
  },

  async updateCartItem(cartItemId: number, count: number) {
    // Get cart item
    const cartItem = await strapi.db.query("api::cart-item.cart-item").findOne({
      where: { id: cartItemId },
      populate: {
        product_variation: {
          populate: {
            product_stock: true,
          },
        },
      },
    });

    if (!cartItem) {
      return { success: false, message: "Cart item not found" };
    }

    // Check stock availability
    if (
      !cartItem.product_variation?.product_stock ||
      cartItem.product_variation.product_stock.Count < count
    ) {
      return { success: false, message: "Insufficient stock" };
    }

    const price = cartItem.product_variation.Price || 0;

    // Update cart item
    const updatedItem = await strapi.entityService.update(
      "api::cart-item.cart-item",
      cartItemId,
      {
        data: {
          Count: count,
          Sum: count * price,
        },
      }
    );

    return { success: true, data: updatedItem };
  },

  async removeCartItem(cartItemId: number) {
    // Get cart item to find its cart
    const cartItem = await strapi.db.query("api::cart-item.cart-item").findOne({
      where: { id: cartItemId },
      populate: { cart: true },
    });

    if (!cartItem) {
      return { success: false, message: "Cart item not found" };
    }

    const cartId = cartItem.cart.id;

    // Delete cart item
    await strapi.entityService.delete("api::cart-item.cart-item", cartItemId);

    // Check if cart is now empty
    const remainingItems = await strapi.db
      .query("api::cart-item.cart-item")
      .count({
        where: { cart: cartId },
      });

    if (remainingItems === 0) {
      // Update cart status to Empty
      await strapi.entityService.update("api::cart.cart", cartId, {
        data: { Status: "Empty" },
      });
    }

    return { success: true };
  },

  async checkCartStock(userId: number) {
    const cart = await this.getUserCart(userId);

    if (!cart.cart_items || cart.cart_items.length === 0) {
      return { success: true, valid: true, message: "Cart is empty" };
    }

    const adjustments = [];
    const removals = [];

    // Check each item's stock
    for (const item of cart.cart_items) {
      if (!item.product_variation?.product_stock) {
        // Product has no stock information, remove from cart
        await this.removeCartItem(item.id);
        removals.push({
          cartItemId: item.id,
          productVariationId: item.product_variation?.id,
          message:
            "Product stock information not available, item removed from cart",
        });
        continue;
      }

      const available = item.product_variation.product_stock.Count;
      const requested = item.Count;

      if (available === 0) {
        // No stock available, remove from cart
        await this.removeCartItem(item.id);
        removals.push({
          cartItemId: item.id,
          productVariationId: item.product_variation.id,
          requested,
          available: 0,
          message: "Product is out of stock, item removed from cart",
        });
      } else if (available < requested) {
        // Not enough stock, adjust quantity
        await this.updateCartItem(item.id, available);
        adjustments.push({
          cartItemId: item.id,
          productVariationId: item.product_variation.id,
          requested,
          available,
          newQuantity: available,
          message: `Quantity reduced from ${requested} to ${available} due to limited stock`,
        });
      }
    }

    // Reload cart after adjustments
    const updatedCart = await this.getUserCart(userId);

    // An empty cart is considered valid
    const cartIsEmpty =
      !updatedCart.cart_items || updatedCart.cart_items.length === 0;

    return {
      success: true,
      valid: cartIsEmpty || (removals.length === 0 && adjustments.length === 0),
      cartIsEmpty,
      itemsRemoved: removals.length > 0 ? removals : undefined,
      itemsAdjusted: adjustments.length > 0 ? adjustments : undefined,
      cart: updatedCart,
    };
  },

  async finalizeCartToOrder(userId: number, shippingData: any) {
    // First check stock
    const stockCheck = await this.checkCartStock(userId);

    if (!stockCheck.valid) {
      return {
        success: false,
        message: "Stock issues prevent order creation",
        itemsRemoved: stockCheck.itemsRemoved,
        itemsAdjusted: stockCheck.itemsAdjusted,
        cart: stockCheck.cart,
      };
    }

    const cart = stockCheck.cart || (await this.getUserCart(userId));

    if (!cart.cart_items || cart.cart_items.length === 0) {
      return { success: false, message: "Cannot create order from empty cart" };
    }

    try {
      // Start transaction to ensure all operations succeed or fail together
      const result = await strapi.db.transaction(async ({ trx }) => {
        // Using enum values explicitly
        type OrderStatus =
          | "Paying"
          | "Started"
          | "Shipment"
          | "Done"
          | "Returned"
          | "Cancelled";
        type OrderType = "Manual" | "Automatic";
        type ContractStatus =
          | "Not Ready"
          | "Confirmed"
          | "Finished"
          | "Failed"
          | "Cancelled";
        type ContractType = "Cash" | "Credit";

        // Fetch shipping method to get shipping cost if not provided
        const shippingCost = shippingData.shippingCost
          ? parseInt(shippingData.shippingCost)
          : 0;
        let finalShippingCost = shippingCost;

        if (!shippingCost && shippingData.shippingId) {
          const shipping = await strapi.entityService.findOne(
            "api::shipping.shipping",
            shippingData.shippingId
          );
          if (shipping && shipping.Price) {
            finalShippingCost = shipping.Price;
          }
        }

        // Create new order with enum values
        const orderData = {
          user: userId,
          Status: "Paying" as OrderStatus,
          Date: new Date(),
          Type: "Automatic" as OrderType,
          shipping: shippingData.shippingId,
          ShippingCost: finalShippingCost,
          Description: shippingData.description || "",
          Note: shippingData.note || "",
          delivery_address: shippingData.addressId || undefined,
        };

        const order = await strapi.entityService.create("api::order.order", {
          data: orderData,
        });

        // Calculate subtotal for items
        let subtotal = 0;

        // Create order items from cart items
        for (const item of cart.cart_items) {
          const variation = item.product_variation;
          const itemPrice = variation.Price || 0;
          const itemCount = item.Count || 0;

          // Add to subtotal
          subtotal += itemPrice * itemCount;

          // Create order item
          await strapi.entityService.create("api::order-item.order-item", {
            data: {
              order: order.id,
              product_variation: variation.id,
              Count: item.Count,
              PerAmount: variation.Price || 0,
              ProductTitle: variation.product?.Title || "Unknown Product",
              ProductSKU: variation.product?.SKU || "Unknown SKU",
              product_color: variation.product_variation_color?.id,
              product_size: variation.product_variation_size?.id,
              product_variation_model: variation.product_variation_model?.id,
            },
          });

          // Update product stock (lifecycle will create the log)
          const stockId = variation.product_stock.id;
          const currentStock = variation.product_stock.Count;
          await strapi.entityService.update(
            "api::product-stock.product-stock",
            stockId,
            {
              data: {
                Count: currentStock - item.Count,
              },
            }
          );
        }

        // Check for applicable discounts
        let discountAmount = 0;

        // Find active general discounts
        const generalDiscounts = await strapi.entityService.findMany(
          "api::general-discount.general-discount",
          {
            filters: {
              IsActive: true,
              StartDate: { $lte: new Date() },
              EndDate: { $gte: new Date() },
            },
            sort: { createdAt: "desc" },
          }
        );

        // Apply first matching discount with type assertion to access properties
        for (const discount of generalDiscounts || []) {
          const discountData = discount as any;
          if (discountData.MinimumAmount <= subtotal) {
            if (discountData.IsPercentage) {
              discountAmount = (subtotal * discountData.Amount) / 100;
              if (
                discountData.MaxAmount &&
                discountAmount > discountData.MaxAmount
              ) {
                discountAmount = discountData.MaxAmount;
              }
            } else {
              discountAmount = discountData.Amount;
            }
            // No need to update order as DiscountAmount field doesn't exist in schema
            break; // Apply only one general discount
          }
        }

        // Calculate tax
        const taxPercent = 10; // Default tax percentage
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = (taxableAmount * taxPercent) / 100;

        // Add shipping cost to total
        const totalAmount =
          subtotal - discountAmount + taxAmount + finalShippingCost;

        // Create contract for the order
        const contractData = {
          local_user: userId,
          Type: "Cash" as ContractType,
          Status: "Not Ready" as ContractStatus,
          Amount: Math.round(totalAmount),
          Date: new Date(),
          TaxPercent: taxPercent,
          order: order.id,
        };

        const contract = await strapi.entityService.create(
          "api::contract.contract",
          {
            data: contractData,
          }
        );

        // Contract now has all financial details we need
        // No need to update the order with financial fields that don't exist in schema
        await strapi.entityService.update("api::order.order", order.id, {
          data: { contract: contract.id },
        });

        // Clear the cart by updating status to Empty
        type CartStatus = "Pending" | "Payment" | "Left" | "Empty";
        await strapi.entityService.update("api::cart.cart", cart.id, {
          data: { Status: "Empty" as CartStatus },
        });

        // Delete all cart items
        for (const item of cart.cart_items) {
          await strapi.entityService.delete(
            "api::cart-item.cart-item",
            item.id
          );
        }

        return {
          success: true,
          order,
          contract,
          financialSummary: {
            subtotal: Math.round(subtotal),
            discount: Math.round(discountAmount),
            tax: Math.round(taxAmount),
            shipping: Math.round(finalShippingCost),
            total: Math.round(totalAmount),
          },
        };
      });

      return result;
    } catch (error) {
      return {
        success: false,
        message: "Error creating order",
        error: error.message,
      };
    }
  },
}));
