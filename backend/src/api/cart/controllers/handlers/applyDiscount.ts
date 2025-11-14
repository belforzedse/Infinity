import { Strapi } from "@strapi/strapi";

export const applyDiscountHandler = (strapi: Strapi) => async (ctx: any) => {
  const { user } = ctx.state;
  const { code, shippingId, shippingCost } = ctx.request.body || {};

  try {
    if (!code || typeof code !== "string") {
      return ctx.badRequest("Discount code is required", {
        data: { success: false, error: "missing_code" },
      });
    }

    // Load user's current cart with items
    const cartService = strapi.service("api::cart.cart");
    const cart = await cartService.getUserCart(user.id);
    if (!cart?.cart_items?.length) {
      return ctx.badRequest("Cart is empty", {
        data: { success: false, error: "empty_cart" },
      });
    }

    // Compute subtotal from cart
    // Use DiscountPrice if available, otherwise fall back to Price (same logic as order item creation)
    let subtotal = 0;
    for (const item of cart.cart_items) {
      const price = item?.product_variation?.DiscountPrice ?? item?.product_variation?.Price ?? 0;
      const count = Number(item?.Count || 0);
      subtotal += Number(price) * count;
    }

    // Optional shipping cost to preview total
    const finalShipping = shippingCost ? Number(shippingCost) : 0;

    // Validate the coupon against Discount model
    const matching = await strapi.entityService.findMany(
      "api::discount.discount",
      {
        filters: {
          Code: code,
          IsActive: true,
          StartDate: { $lte: new Date() },
          EndDate: { $gte: new Date() },
          removedAt: { $null: true },
        },
        populate: {
          products: true,
          delivery_methods: true,
        },
        limit: 1,
      }
    );

    if (!matching?.length) {
      return ctx.badRequest("Invalid or expired discount code", {
        data: { success: false, error: "invalid_or_expired" },
      });
    }

    const coupon: any = matching[0];

    // Enforce usage limits (LimitUsage = 0 means unlimited)
    if (
      typeof coupon.LimitUsage === "number" &&
      typeof coupon.UsedTimes === "number" &&
      coupon.LimitUsage > 0 &&
      coupon.UsedTimes >= coupon.LimitUsage
    ) {
      strapi.log.warn("Discount code usage limit reached", {
        discountCode: code,
        discountId: coupon.id,
        limitUsage: coupon.LimitUsage,
        usedTimes: coupon.UsedTimes,
        userId: ctx.state?.user?.id,
      });
      return ctx.badRequest("Discount code usage limit reached", {
        data: { success: false, error: "usage_limit_reached" },
      });
    }

    // If coupon is scoped to specific products, restrict subtotal
    let eligibleSubtotal = subtotal;
    if (Array.isArray(coupon.products) && coupon.products.length > 0) {
      const productIds = new Set((coupon.products || []).map((p: any) => Number(p.id)));
      eligibleSubtotal = 0;
      for (const item of cart.cart_items) {
        const productId = Number(item?.product_variation?.product?.id);
        if (productIds.has(productId)) {
          const price =
            item?.product_variation?.DiscountPrice ??
            item?.product_variation?.Price ??
            0;
          const count = Number(item?.Count || 0);
          eligibleSubtotal += Number(price) * count;
        }
      }
      if (eligibleSubtotal <= 0) {
        return ctx.badRequest("Coupon doesn't apply to selected items", {
          data: { success: false, error: "no_eligible_items" },
        });
      }
    }

    // Cart total boundaries
    if (
      typeof coupon.MinCartTotal === "number" &&
      coupon.MinCartTotal > 0 &&
      subtotal < coupon.MinCartTotal
    ) {
      return ctx.badRequest("Cart total is below the minimum for this coupon", {
        data: { success: false, error: "below_min_cart_total" },
      });
    }
    if (
      typeof coupon.MaxCartTotal === "number" &&
      coupon.MaxCartTotal > 0 &&
      subtotal > coupon.MaxCartTotal
    ) {
      return ctx.badRequest("Cart total exceeds the allowed maximum for this coupon", {
        data: { success: false, error: "above_max_cart_total" },
      });
    }

    // Delivery method restriction
    if (coupon.delivery_methods?.length) {
      const normalizedShippingId =
        shippingId !== undefined && shippingId !== null ? Number(shippingId) : NaN;
      if (!normalizedShippingId || Number.isNaN(normalizedShippingId)) {
        return ctx.badRequest("Select a delivery method before applying this coupon", {
          data: { success: false, error: "shipping_required" },
        });
      }
      const allowedDelivery = coupon.delivery_methods.some(
        (method: any) => Number(method.id) === normalizedShippingId,
      );
      if (!allowedDelivery) {
        return ctx.badRequest("Coupon is not valid for the selected delivery method", {
          data: { success: false, error: "invalid_delivery_method" },
        });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.Type === "Discount") {
      // percentage
      discountAmount = (eligibleSubtotal * Number(coupon.Amount || 0)) / 100;
      if (
        typeof coupon.LimitAmount === "number" &&
        coupon.LimitAmount > 0 &&
        discountAmount > coupon.LimitAmount
      ) {
        discountAmount = coupon.LimitAmount;
      }
    } else {
      // Cash (fixed)
      discountAmount = Number(coupon.Amount || 0);
    }

    // Compose preview totals (no persistence here, tax disabled)
    const total = Math.max(subtotal - discountAmount + finalShipping, 0);

    // Re-check SnappPay eligibility with discounted total (convert toman → IRR)
    let snappEligible: any = null;
    let amountIRR: number | undefined;
    try {
      amountIRR = Math.round(total) * 10;
      const snappay = strapi.service("api::payment-gateway.snappay");
      snappEligible = await snappay.eligible(amountIRR);
      try {
        strapi.log.info("SnappPay eligible after apply-discount", {
          amountIRR,
          successful: snappEligible?.successful,
          eligible: snappEligible?.response?.eligible,
          error: snappEligible?.errorData,
        });
      } catch {}
    } catch (e) {
      strapi.log.error("Failed SnappPay eligibility check after discount", e);
    }

    // Log successful discount code validation
    strapi.log.info("Discount code successfully validated and previewed", {
      discountCode: code,
      discountId: coupon.id,
      discountType: coupon.Type,
      discountAmount: Number(coupon.Amount || 0),
      calculatedDiscount: Math.round(discountAmount),
      cartSubtotal: Math.round(subtotal),
      userId: ctx.state?.user?.id,
      cartItemsCount: cart?.cart_items?.length || 0,
    });

    return {
      data: {
        success: true,
        code,
        type: coupon.Type,
        amount: Number(coupon.Amount || 0),
        discount: Math.round(discountAmount),
        summary: {
          subtotal: Math.round(subtotal),
          eligibleSubtotal: Math.round(eligibleSubtotal),
          shipping: Math.round(finalShipping),
          total: Math.round(total),
        },
        snappEligible: snappEligible
          ? {
              successful: !!snappEligible.successful,
              eligible: !!snappEligible.response?.eligible,
              title: snappEligible.response?.title_message,
              description: snappEligible.response?.description,
              amountIRR,
            }
          : undefined,
      },
    };
  } catch (error: any) {
    return ctx.badRequest(error.message || "Invalid coupon", {
      data: { success: false, error: error.message },
    });
  }
};
