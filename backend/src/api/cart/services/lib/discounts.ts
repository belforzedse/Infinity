import type { Strapi } from "@strapi/strapi";

export const computeCouponDiscount = async (
  strapi: Strapi,
  userId: number,
  code: string,
  subtotal: number,
  cartItems: any[]
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
      populate: { local_users: true, product_variations: true },
      limit: 1,
    }
  );
  if (!matches?.length) return 0;
  const coupon: any = matches[0];
  if (
    coupon.local_users?.length &&
    !coupon.local_users.some((u: any) => u.id === userId)
  ) {
    return 0;
  }

  let eligibleSubtotal = subtotal;
  if (coupon.product_variations?.length) {
    const eligibleIds = new Set(
      coupon.product_variations.map((p: any) => p.id)
    );
    eligibleSubtotal = 0;
    for (const item of cartItems) {
      if (eligibleIds.has(item?.product_variation?.id)) {
        const price = Number(item?.product_variation?.Price || 0);
        const count = Number(item?.Count || 0);
        eligibleSubtotal += price * count;
      }
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
    return discountAmount;
  }

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
