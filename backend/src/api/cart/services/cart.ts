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

  async clearCart(userId: number) {
    const cart = await getOrCreateUserCart(strapi as any, userId);
    if (!cart?.id) {
      return { success: true };
    }

    const cartItems = cart.cart_items || [];
    for (const item of cartItems) {
      try {
        await strapi.entityService.delete("api::cart-item.cart-item", item.id);
      } catch (err) {
        strapi.log.error("Failed to remove cart item during clearCart", {
          cartItemId: item.id,
          error: err,
        });
      }
    }

    try {
      await strapi.entityService.update("api::cart.cart", cart.id, {
        data: { Status: "Empty" },
      });
    } catch (err) {
      strapi.log.error("Failed to update cart status during clearCart", err);
    }

    return { success: true };
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

        // Create order and items with transaction context for atomicity
        const { order, subtotal, createdItems } = await createOrderAndItems(
          strapi as any,
          userId,
          cart,
          finalShippingCost,
          shippingData.shippingId,
          shippingData.description,
          shippingData.note,
          shippingData.addressId,
          trx
        );

        strapi.log.info("Order and items created successfully", {
          orderId: order.id,
          itemsCreated: createdItems.length,
          subtotal,
        });

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

        /**
         * Automatic Anipo shipping overrides disabled.
         * Leaving previous implementation commented for future reference.
         */
        /*
        if (Number(shippingData.shippingId) !== 4) {
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
                await strapi.entityService.update(
                  "api::order.order",
                  order.id,
                  {
                    data: { ShippingCost: finalShippingCost },
                  }
                );
              } else {
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
                } catch (_) {}
              }
            }
          }
        }
        */

        let discountAmount = 0;
        let discountCode: string | undefined;
        let appliedGeneralDiscountId: number | undefined;

        if (shippingData?.discountCode) {
          discountCode = String(shippingData.discountCode);
          try {
            discountAmount = await computeCouponDiscount(
              strapi as any,
              userId,
              discountCode,
              subtotal,
              cart.cart_items,
              shippingData?.shippingId
            );
          } catch (discountError: any) {
            // Discount validation failed - throw error to prevent order creation
            const errorMsg = discountError.message || "Discount validation failed";
            throw new Error(errorMsg);
          }
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

        const totals = computeTotals(
          subtotal,
          discountAmount,
          finalShippingCost
        );

        const contract = await createContract(
          strapi as any,
          userId,
          Number(order.id),
          totals.total,
          0,
          trx
        );

        strapi.log.info("Contract created successfully", {
          contractId: contract.id,
          amount: totals.total,
          orderId: order.id,
        });

        // Persist discount metadata for admin adjustment flows
        await strapi.db.query("api::order.order").update({
          where: { id: order.id },
          data: {
            contract: contract.id,
            ShippingCost: finalShippingCost,
            DiscountCode: discountCode,
            AppliedGeneralDiscountId: appliedGeneralDiscountId,
            AppliedDiscountAmount: Math.round(discountAmount),
          },
          ...(trx ? { transacting: trx } : {}),
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
    } catch (error: any) {
      // Enhanced error logging with full context
      const errorContext = {
        userId,
        cartId: cart?.id,
        itemCount: cart?.cart_items?.length || 0,
        shippingData,
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
      };

      strapi.log.error("Order creation failed:", errorContext);
      console.error("=== ORDER CREATION FAILED ===");
      console.error("Error Message:", error.message);
      console.error("Error Code:", error.message?.split(":")[0]);
      console.error("Full Context:", JSON.stringify(errorContext, null, 2));

      // Parse error message to extract error code and details
      const errorMessage = error.message || "Unknown error";
      let errorCode = "UNKNOWN_ERROR";
      let userMessage = "خطا در ثبت سفارش";
      let details = {};

      // Extract error code if present (format: "ERROR_CODE: message")
      if (errorMessage.includes(":")) {
        const parts = errorMessage.split(":");
        errorCode = parts[0].trim();
        const errorDetail = parts.slice(1).join(":").trim();

        // Map error codes to user-friendly Persian messages
        switch (errorCode) {
          case "CART_EMPTY":
            userMessage = "سبد خرید شما خالی است";
            break;
          case "INVALID_ITEM":
            userMessage = "برخی از کالاهای سبد خرید معتبر نیستند";
            details = { detail: errorDetail };
            break;
          case "MISSING_PRODUCT_TITLE":
          case "MISSING_PRODUCT_SKU":
            userMessage = "اطلاعات برخی از کالاها ناقص است. لطفاً با پشتیبانی تماس بگیرید";
            details = { detail: errorDetail };
            break;
          case "INVALID_PRICE":
            userMessage = "قیمت برخی از کالاها نامعتبر است";
            details = { detail: errorDetail };
            break;
          case "ORDER_ITEM_CREATION_FAILED":
            userMessage = "خطا در ثبت اقلام سفارش";
            details = { detail: errorDetail };
            break;
          case "CONTRACT_CREATION_FAILED":
            userMessage = "خطا در ایجاد قرارداد";
            details = { detail: errorDetail };
            break;
          case "INVALID_AMOUNT":
            userMessage = "مبلغ سفارش نامعتبر است";
            break;
          case "INVALID_TAX_PERCENT":
            userMessage = "درصد مالیات نامعتبر است";
            break;
          default:
            userMessage = "خطا در ثبت سفارش. لطفاً مجدداً تلاش کنید";
        }
      }

      // Log to order-log if we have a userId for tracking
      try {
        await strapi.entityService.create("api::order-log.order-log", {
          data: {
            order: null,
            Action: "Create",
            Description: `Order creation failed: ${errorCode}`,
            Changes: {
              userId,
              errorCode,
              errorMessage,
              shippingId: shippingData?.shippingId,
              addressId: shippingData?.addressId,
            },
          },
        });
      } catch (logError) {
        // Swallow logging errors to avoid masking the original error
        strapi.log.error("Failed to log order creation failure", logError);
      }

      return {
        success: false,
        message: userMessage,
        error: errorMessage,
        errorCode,
        details,
        timestamp: new Date().toISOString(),
      };
    }
  },
}));
