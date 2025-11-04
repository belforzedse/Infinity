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
        populate: { local_users: true, product_variations: true },
        limit: 1,
      }
    );

    if (!matching?.length) {
      return ctx.badRequest("Invalid or expired discount code", {
        data: { success: false, error: "invalid_or_expired" },
      });
    }

    const coupon: any = matching[0];

    // Enforce usage limits
    if (
      typeof coupon.LimitUsage === "number" &&
      typeof coupon.UsedTimes === "number" &&
      coupon.LimitUsage >= 0 &&
      coupon.UsedTimes >= coupon.LimitUsage
    ) {
      return ctx.badRequest("Discount code usage limit reached", {
        data: { success: false, error: "usage_limit_reached" },
      });
    }

    // If coupon is scoped to specific users, ensure current user is allowed
    if (coupon.local_users?.length) {
      const allowed = coupon.local_users.some((u: any) => u.id === user.id);
      if (!allowed) {
        return ctx.badRequest("You are not eligible for this code", {
          data: { success: false, error: "not_eligible_user" },
        });
      }
    }

    // If coupon is scoped to specific product variations, restrict subtotal to those lines
    let eligibleSubtotal = subtotal;
    if (coupon.product_variations?.length) {
      const eligibleIds = new Set(
        coupon.product_variations.map((p: any) => p.id)
      );
      eligibleSubtotal = 0;
      for (const item of cart.cart_items) {
        const variationId = item?.product_variation?.id;
        if (eligibleIds.has(variationId)) {
          // Use DiscountPrice if available, otherwise fall back to Price (same logic as order item creation)
          const price = item?.product_variation?.DiscountPrice ?? item?.product_variation?.Price ?? 0;
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
