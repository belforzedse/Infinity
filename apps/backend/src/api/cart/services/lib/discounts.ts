import type { Strapi } from "@strapi/strapi";

export const computeCouponDiscount = async (
  strapi: Strapi,
  userId: number,
  code: string,
  subtotal: number,
  cartItems: any[],
  shippingId?: number | null
) => {
  if (!code) return 0;
  const matches = await strapi.entityService.findMany(
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
  if (!matches?.length) {
    throw new Error(`INVALID_OR_EXPIRED_COUPON: کد تخفیف "${code}" معتبر نیست یا منقضی شده است`);
  }
  const coupon: any = matches[0];
  let eligibleSubtotal = subtotal;
  if (Array.isArray(coupon.products) && coupon.products.length > 0) {
    const productIds = new Set(
      (coupon.products || []).map((p: any) => Number(p.id))
    );
    eligibleSubtotal = 0;
    for (const item of cartItems) {
      const productId = Number(item?.product_variation?.product?.id);
      if (productIds.has(productId)) {
        const price = Number(
          item?.product_variation?.DiscountPrice ??
            item?.product_variation?.Price ??
            0
        );
        const count = Number(item?.Count || 0);
        eligibleSubtotal += price * count;
      }
    }
    if (eligibleSubtotal <= 0) {
      throw new Error(`NO_ELIGIBLE_ITEMS: هیچ کالای واجد شرط در سبد خرید یافت نشد`);
    }
  }

  if (
    typeof coupon.MinCartTotal === "number" &&
    coupon.MinCartTotal > 0 &&
    subtotal < coupon.MinCartTotal
  ) {
    throw new Error(`BELOW_MINIMUM_CART: حداقل مبلغ سفارش ${coupon.MinCartTotal} تومان است`);
  }
  if (
    typeof coupon.MaxCartTotal === "number" &&
    coupon.MaxCartTotal > 0 &&
    subtotal > coupon.MaxCartTotal
  ) {
    throw new Error(`ABOVE_MAXIMUM_CART: حداکثر مبلغ سفارش ${coupon.MaxCartTotal} تومان است`);
  }
  if (coupon.delivery_methods?.length) {
    const normalizedShippingId =
      shippingId !== undefined && shippingId !== null
        ? Number(shippingId)
        : NaN;
    if (!normalizedShippingId || Number.isNaN(normalizedShippingId)) {
      throw new Error(`SHIPPING_REQUIRED_FOR_COUPON: این کد تخفیف نیاز به انتخاب روش ارسال خاصی دارد`);
    }
    const allowedDelivery = coupon.delivery_methods.some(
      (method: any) => Number(method.id) === normalizedShippingId
    );
    if (!allowedDelivery) {
      throw new Error(`INVALID_DELIVERY_METHOD: این کد تخفیف برای روش ارسال انتخاب شده معتبر نیست`);
    }
  }

  if (coupon.Type === "Discount") {
    let discountAmount = (eligibleSubtotal * Number(coupon.Amount || 0)) / 100;
    if (
      typeof coupon.LimitAmount === "number" &&
      coupon.LimitAmount > 0 &&
      discountAmount > coupon.LimitAmount
    ) {
      discountAmount = coupon.LimitAmount;
    }
    console.log("DEBUG: Coupon discount calculation", {
      code,
      couponType: coupon.Type,
      couponAmount: coupon.Amount,
      couponLimitAmount: coupon.LimitAmount,
      subtotalPassed: subtotal,
      eligibleSubtotal,
      isProductSpecific: coupon.products?.length > 0,
      calculatedDiscount: discountAmount,
    });
    return discountAmount;
  }

  console.log("DEBUG: Fixed amount coupon", {
    code,
    couponType: coupon.Type,
    couponAmount: Number(coupon.Amount || 0),
  });
  return Number(coupon.Amount || 0);
};

export const findFirstActiveGeneralDiscount = async (strapi: Strapi) => {
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
  return (generalDiscounts || []) as any[];
};
