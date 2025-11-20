import type { Strapi } from "@strapi/strapi";

export const isStockSufficient = (available?: number, requested?: number) => {
  const a = Number(available || 0);
  const r = Number(requested || 0);
  return a >= r && r > 0;
};

/**
 * Atomically decrement stock with race condition protection
 * Uses raw SQL UPDATE with WHERE clause to ensure stock doesn't go negative
 * @returns {Promise<{success: boolean, newCount?: number, error?: string}>}
 */
export const decrementStockAtomic = async (
  strapi: Strapi,
  stockId: number,
  decrementBy: number
): Promise<{ success: boolean; newCount?: number; error?: string }> => {
  try {
    const quantity = Number(decrementBy);
    if (quantity <= 0) {
      return { success: false, error: "Decrement amount must be positive" };
    }

    // Use raw SQL for atomic decrement with stock validation
    const result = await strapi.db.connection.raw(
      `UPDATE product_stocks
       SET "Count" = "Count" - ?
       WHERE id = ? AND "Count" >= ?
       RETURNING "Count"`,
      [quantity, stockId, quantity]
    );

    // Check if any rows were updated
    const rows = result.rows || [];
    if (rows.length === 0) {
      // No rows updated means either stock doesn't exist or insufficient stock
      const stock = await strapi.entityService.findOne(
        "api::product-stock.product-stock",
        stockId
      );

      if (!stock) {
        return { success: false, error: "Stock record not found" };
      }

      return {
        success: false,
        error: `Insufficient stock: requested ${quantity}, available ${stock.Count}`,
      };
    }

    return { success: true, newCount: rows[0].Count };
  } catch (error) {
    strapi.log.error("Failed to decrement stock atomically", {
      stockId,
      decrementBy,
      error: (error as Error).message,
    });
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`,
    };
  }
};

/**
 * Legacy non-atomic decrement - DEPRECATED
 * Use decrementStockAtomic instead to prevent race conditions
 * @deprecated
 */
export const decrementStock = async (
  strapi: Strapi,
  stockId: number,
  currentCount: number,
  decrementBy: number
) => {
  strapi.log.warn(
    "Using deprecated decrementStock - please migrate to decrementStockAtomic"
  );
  await strapi.entityService.update(
    "api::product-stock.product-stock",
    stockId,
    {
      data: { Count: currentCount - decrementBy },
    }
  );
};
