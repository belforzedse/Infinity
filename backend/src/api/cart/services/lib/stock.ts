import type { Strapi } from "@strapi/strapi";

/**
 * Stock interface for type safety
 * Properties can be number or string (from database/API responses)
 * Use validateAndNormalizeStock to convert to NormalizedStock for type-safe operations
 */
export interface Stock {
  Count?: number | string;
  ReservedCount?: number | string;
}

/**
 * Normalized Stock interface with guaranteed numeric properties
 * Use this type after validating/normalizing Stock objects
 */
export interface NormalizedStock {
  Count: number;
  ReservedCount: number;
}

/**
 * Validates and normalizes a Stock object, converting numeric strings to numbers
 * and ensuring all values are valid non-negative numbers.
 *
 * This function should be used whenever a Stock object is created or consumed
 * to ensure type safety and catch invalid data early.
 *
 * @param stock - The stock object to validate and normalize (can be Stock, unknown, or null/undefined)
 * @returns Object with validation result and normalized stock values
 *
 * @example
 * ```typescript
 * const result = validateAndNormalizeStock(stockFromDatabase);
 * if (!result.isValid) {
 *   throw new Error(result.error);
 * }
 * const normalized = result.stock; // NormalizedStock with guaranteed number types
 * ```
 */
export const validateAndNormalizeStock = (
  stock: Stock | unknown | null | undefined
): {
  isValid: boolean;
  error?: string;
  stock?: NormalizedStock;
} => {
  if (!stock || typeof stock !== "object") {
    return {
      isValid: false,
      error: "Stock record is invalid or missing",
    };
  }

  const stockObj = stock as Record<string, unknown>;

  // Helper to validate and normalize a numeric value
  const normalizeNumericValue = (
    value: unknown,
    fieldName: string
  ): { isValid: boolean; error?: string; value?: number } => {
    if (value === undefined || value === null) {
      return { isValid: true, value: 0 };
    }

    if (typeof value === "number") {
      if (!Number.isFinite(value) || value < 0) {
        return {
          isValid: false,
          error: `Invalid ${fieldName} value: ${value} (must be a non-negative finite number)`,
        };
      }
      return { isValid: true, value };
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") {
        return { isValid: true, value: 0 };
      }
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return {
          isValid: false,
          error: `Invalid ${fieldName} value: "${value}" (must be a numeric string representing a non-negative number)`,
        };
      }
      return { isValid: true, value: parsed };
    }

    return {
      isValid: false,
      error: `Invalid ${fieldName} type: ${typeof value} (expected number or numeric string)`,
    };
  };

  // Validate and normalize Count
  const countValidation = normalizeNumericValue(stockObj.Count, "Count");
  if (!countValidation.isValid) {
    return {
      isValid: false,
      error: countValidation.error,
    };
  }

  // Validate and normalize ReservedCount
  const reservedCountValidation = normalizeNumericValue(
    stockObj.ReservedCount,
    "ReservedCount"
  );
  if (!reservedCountValidation.isValid) {
    return {
      isValid: false,
      error: reservedCountValidation.error,
    };
  }

  return {
    isValid: true,
    stock: {
      Count: countValidation.value ?? 0,
      ReservedCount: reservedCountValidation.value ?? 0,
    },
  };
};

export const isStockSufficient = (available?: number, requested?: number) => {
  const a = Number(available || 0);
  const r = Number(requested || 0);
  return a >= r && r > 0;
};

/**
 * Get available stock count (Count - ReservedCount)
 * Uses validateAndNormalizeStock to ensure type safety
 * @param stock - Stock object (may have string or number values)
 * @returns Available stock count (non-negative number)
 */
export const getAvailableStockCount = (stock: Stock | null | undefined): number => {
  const validation = validateAndNormalizeStock(stock);
  if (!validation.isValid || !validation.stock) {
    // If validation fails, return 0 to be safe (no stock available)
    return 0;
  }
  const { Count, ReservedCount } = validation.stock;
  return Math.max(0, Count - ReservedCount);
};

const rawSql = async (
  strapi: Strapi,
  sql: string,
  bindings: any[],
  trx?: any
) => {
  if (trx?.raw) {
    return trx.raw(sql, bindings);
  }
  return strapi.db.connection.raw(sql, bindings);
};

/**
 * Atomically decrement stock with race condition protection
 * Uses raw SQL UPDATE with WHERE clause to ensure stock doesn't go negative
 * @returns {Promise<{success: boolean, newCount?: number, error?: string}>}
 */
export const decrementStockAtomic = async (
  strapi: Strapi,
  stockId: number,
  decrementBy: number,
  trx?: any
): Promise<{ success: boolean; newCount?: number; error?: string }> => {
  try {
    const quantity = Number(decrementBy);
    if (quantity <= 0) {
      return { success: false, error: "Decrement amount must be positive" };
    }

    // Use raw SQL for atomic decrement with stock validation
    // Note: Strapi converts camelCase to snake_case, so "Count" becomes "count"
    const result = await rawSql(
      strapi,
      `UPDATE product_stocks
       SET count = count - ?
       WHERE id = ? AND count >= ?
       RETURNING count`,
      [quantity, stockId, quantity],
      trx
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

      const validation = validateAndNormalizeStock(stock);
      if (!validation.isValid || !validation.stock) {
        strapi.log.error("Invalid stock data structure", {
          stockId,
          error: validation.error,
          stock,
        });
        return {
          success: false,
          error: validation.error || "Invalid stock record structure",
        };
      }

      return {
        success: false,
        error: `Insufficient stock: requested ${quantity}, available ${validation.stock.Count}`,
      };
    }

    return { success: true, newCount: rows[0].count };
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
 * Atomically reserve stock (does not change Count; increments ReservedCount).
 * Ensures (Count - ReservedCount) stays non-negative under concurrency.
 */
export const reserveStockAtomic = async (
  strapi: Strapi,
  stockId: number,
  reserveBy: number,
  trx?: any
): Promise<{ success: boolean; newReservedCount?: number; error?: string }> => {
  try {
    const quantity = Number(reserveBy);
    if (quantity <= 0) {
      return { success: false, error: "Reserve amount must be positive" };
    }

    const result = await rawSql(
      strapi,
      `UPDATE product_stocks
       SET reserved_count = COALESCE(reserved_count, 0) + ?
       WHERE id = ?
         AND (count - COALESCE(reserved_count, 0)) >= ?
       RETURNING reserved_count`,
      [quantity, stockId, quantity],
      trx
    );

    const rows = result.rows || [];
    if (rows.length === 0) {
      const stock = await strapi.entityService.findOne(
        "api::product-stock.product-stock",
        stockId
      );
      if (!stock) return { success: false, error: "Stock record not found" };
      return {
        success: false,
        error: `Insufficient stock for reservation: requested ${quantity}, available ${getAvailableStockCount(stock)}`,
      };
    }

    return { success: true, newReservedCount: rows[0].reserved_count };
  } catch (error) {
    strapi.log.error("Failed to reserve stock atomically", {
      stockId,
      reserveBy,
      error: (error as Error).message,
    });
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`,
    };
  }
};

/**
 * Atomically release reserved stock (decrements ReservedCount; does not change Count).
 */
export const releaseReservedStockAtomic = async (
  strapi: Strapi,
  stockId: number,
  releaseBy: number,
  trx?: any
): Promise<{ success: boolean; newReservedCount?: number; error?: string }> => {
  try {
    const quantity = Number(releaseBy);
    if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
      return {
        success: false,
        error: `Invalid quantity: must be a finite positive integer, got ${releaseBy}`
      };
    }

    const result = await rawSql(
      strapi,
      `UPDATE product_stocks
       SET reserved_count = COALESCE(reserved_count, 0) - ?
       WHERE id = ?
         AND COALESCE(reserved_count, 0) >= ?
       RETURNING reserved_count`,
      [quantity, stockId, quantity],
      trx
    );

    const rows = result.rows || [];
    if (rows.length === 0) {
      const stock = await strapi.entityService.findOne(
        "api::product-stock.product-stock",
        stockId
      );
      if (!stock) return { success: false, error: "Stock record not found" };

      const validation = validateAndNormalizeStock(stock);
      if (!validation.isValid || !validation.stock) {
        strapi.log.error("Invalid stock data structure", {
          stockId,
          error: validation.error,
          stock,
        });
        return {
          success: false,
          error: validation.error || "Invalid stock record structure",
        };
      }

      const reservedCount = validation.stock.ReservedCount;
      return {
        success: false,
        error: `Insufficient reserved stock to release: requested ${quantity}, reserved ${reservedCount}`,
      };
    }

    return { success: true, newReservedCount: rows[0].reserved_count };
  } catch (error) {
    strapi.log.error("Failed to release reserved stock atomically", {
      stockId,
      releaseBy,
      error: (error as Error).message,
    });
    return {
      success: false,
      error: `Database error: ${(error as Error).message}`,
    };
  }
};

/**
 * Atomically consume a reservation on payment success:
 * decrements Count and ReservedCount together.
 */
export const consumeReservedStockAtomic = async (
  strapi: Strapi,
  stockId: number,
  consumeBy: number,
  trx?: any
): Promise<{
  success: boolean;
  newCount?: number;
  newReservedCount?: number;
  error?: string;
}> => {
  try {
    const quantity = Number(consumeBy);
    if (quantity <= 0) return { success: true };

    const result = await rawSql(
      strapi,
      `UPDATE product_stocks
       SET count = count - ?,
           reserved_count = COALESCE(reserved_count, 0) - ?
       WHERE id = ?
         AND count >= ?
         AND COALESCE(reserved_count, 0) >= ?
       RETURNING count, reserved_count`,
      [quantity, quantity, stockId, quantity, quantity],
      trx
    );

    const rows = result.rows || [];
    if (rows.length === 0) {
      const stock = await strapi.entityService.findOne(
        "api::product-stock.product-stock",
        stockId
      );
      if (!stock) return { success: false, error: "Stock record not found" };

      const validation = validateAndNormalizeStock(stock);
      if (!validation.isValid || !validation.stock) {
        strapi.log.error("Invalid stock data structure", {
          stockId,
          error: validation.error,
          stock,
        });
        return {
          success: false,
          error: validation.error || "Invalid stock record structure",
        };
      }

      const reservedCount = validation.stock.ReservedCount;
      return {
        success: false,
        error: `Reservation missing/insufficient to consume: requested ${quantity}, reserved ${reservedCount}`,
      };
    }

    return {
      success: true,
      newCount: rows[0].count,
      newReservedCount: rows[0].reserved_count,
    };
  } catch (error) {
    strapi.log.error("Failed to consume reserved stock atomically", {
      stockId,
      consumeBy,
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
