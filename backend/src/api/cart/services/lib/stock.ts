import type { Strapi } from "@strapi/strapi";

export const isStockSufficient = (available?: number, requested?: number) => {
  const a = Number(available || 0);
  const r = Number(requested || 0);
  return a >= r && r > 0;
};

export const decrementStock = async (
  strapi: Strapi,
  stockId: number,
  currentCount: number,
  decrementBy: number
) => {
  await strapi.entityService.update(
    "api::product-stock.product-stock",
    stockId,
    {
      data: { Count: currentCount - decrementBy },
    }
  );
};
