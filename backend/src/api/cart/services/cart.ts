/**
 * cart service
 */

import { factories } from "@strapi/strapi";
import { getOrCreateUserCart } from "./lib/get-user-cart";
import { resolveShippingCost, createOrderAndItems } from "./lib/order";
import {
  computeCouponDiscount,
  findFirstActiveGeneralDiscount,
} from "./lib/discounts";
import { computeTotals } from "./lib/financials";
import { createContract } from "./lib/contract";
import { addCartItemOp } from "./ops/addCartItem";
import { updateCartItemOp } from "./ops/updateCartItem";
import { removeCartItemOp } from "./ops/removeCartItem";
import { checkCartStockOp } from "./ops/checkCartStock";

export default factories.createCoreService("api::cart.cart", ({ strapi }) => ({
  async getUserCart(userId: number) {
    return getOrCreateUserCart(strapi as any, userId);
  },

  async addCartItem(
    cartId: number,
    productVariationId: number,
    count: number = 1
  ) {
    return addCartItemOp(strapi as any, cartId, productVariationId, count);
  },

  async updateCartItem(cartItemId: number, count: number) {
    return updateCartItemOp(strapi as any, cartItemId, count);
  },

  async removeCartItem(cartItemId: number) {
    return removeCartItemOp(strapi as any, cartItemId);
  },

  async checkCartStock(userId: number) {
    return checkCartStockOp(strapi as any, userId);
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

        // Resolve base shipping cost (will be replaced by Anipo for non-4)
        let finalShippingCost = await resolveShippingCost(
          strapi as any,
          shippingData.shippingId,
          shippingData.shippingCost
        );

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

        // TODO: Ensure all entityService calls inside finalize use the same transaction context (trx) for atomicity
        const { order, subtotal } = await createOrderAndItems(
          strapi as any,
          userId,
          cart,
          finalShippingCost,
          shippingData.shippingId,
          shippingData.description,
          shippingData.note,
          shippingData.addressId
        );

        // Always compute and persist order shipping weight from items (in grams)
        let totalWeight = 0;
        for (const item of cart.cart_items) {
          const product = item?.product_variation?.product;
          const weight = Number(product?.Weight ?? 100) || 100;
          const count = Number(item?.Count || 0);
          totalWeight += weight * count;
        }
        if (totalWeight <= 0) totalWeight = 100;
        try {
          await strapi.entityService.update("api::order.order", order.id, {
            data: { ShippingWeight: totalWeight } as any,
          });
        } catch (_) {}

        // Replace shipping cost using Anipo for non-4 (buy-in-person)
        if (Number(shippingData.shippingId) !== 4) {
          // Load address for codes
          if (shippingData.addressId) {
            const address: any = await strapi.entityService.findOne(
              "api::local-user-address.local-user-address",
              Number(shippingData.addressId),
              {
                populate: {
                  shipping_city: { populate: { shipping_province: true } },
                },
              }
            );
            const cityCode = Number(address?.shipping_city?.Code || 0);
            if (cityCode) {
              const anipo: any = strapi.service("api::shipping.anipo");
              const preview = await anipo.barcodePrice({
                cityCode,
                weight: totalWeight,
                sum: subtotal,
                isnonstandard: 0,
                smsservice: 0,
              });
              if (preview?.ok && typeof preview.price === "number") {
                finalShippingCost = Math.max(0, Math.floor(preview.price));
                // Persist new shipping cost on order
                await strapi.entityService.update(
                  "api::order.order",
                  order.id,
                  {
                    data: { ShippingCost: finalShippingCost },
                  }
                );
              } else {
                // Log why Anipo-based shipping override was skipped for observability
                try {
                  await strapi.entityService.create(
                    "api::order-log.order-log",
                    {
                      data: {
                        order: order.id,
                        Action: "Update",
                        Description: `Anipo shipping preview unavailable/skipped: ${String(
                          preview?.error || "no_price"
                        )}`,
                        PerformedBy: String(userId),
                      },
                    }
                  );
                } catch (_) {
                  // Swallow logging errors to avoid affecting checkout flow
                }
              }
            }
          }
        }

        let discountAmount = 0;
        let discountCode: string | undefined;
        let appliedGeneralDiscountId: number | undefined;

        if (shippingData?.discountCode) {
          discountCode = String(shippingData.discountCode);
          discountAmount = await computeCouponDiscount(
            strapi as any,
            userId,
            discountCode,
            subtotal,
            cart.cart_items
          );
        }

        // If no coupon applied, find active general discounts
        if (!discountAmount) {
          const generalDiscounts = await findFirstActiveGeneralDiscount(
            strapi as any
          );
          for (const discount of generalDiscounts) {
            const d: any = discount;
            if (d.MinimumAmount <= subtotal) {
              appliedGeneralDiscountId = d.id;
              if (d.IsPercentage) {
                discountAmount = (subtotal * d.Amount) / 100;
                if (d.MaxAmount && discountAmount > d.MaxAmount) {
                  discountAmount = d.MaxAmount;
                }
              } else {
                discountAmount = d.Amount;
              }
              break;
            }
          }
        }

        const taxPercent = 10;
        const totals = computeTotals(
          subtotal,
          discountAmount,
          taxPercent,
          finalShippingCost
        );

        const contract = await createContract(
          strapi as any,
          userId,
          Number(order.id),
          totals.total,
          taxPercent
        );

        // Persist discount metadata for admin adjustment flows
        await strapi.entityService.update("api::order.order", order.id, {
          data: {
            contract: contract.id,
            ShippingCost: finalShippingCost,
            DiscountCode: discountCode,
            AppliedGeneralDiscountId: appliedGeneralDiscountId,
            AppliedDiscountAmount: Math.round(discountAmount),
          },
        });

        // Note: Do not clear the cart here. Cart will be cleared only after
        // a successful payment gateway request in the controller.

        return {
          success: true,
          order,
          contract,
          financialSummary: totals,
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
