import type { Strapi } from "@strapi/strapi";
import type {
  ApiOrderOrder,
  ApiOrderItemOrderItem,
  ApiProductVariationProductVariation,
  ApiProductStockProductStock,
} from "../../types/generated/contentTypes";
import {
  consumeReservedStockAtomic,
  releaseReservedStockAtomic,
} from "../api/cart/services/lib/stock";

type ReservationTransition = "Released" | "Expired" | "Consumed";

/**
 * Valid reservation status values
 */
type ReservationStatus = "Reserved" | "Released" | "Consumed" | "Expired";

/**
 * Order fields needed for reservation status checks
 */
type OrderReservationFields = {
  id: number;
  ReservationStatus: ApiOrderOrder["attributes"]["ReservationStatus"];
  ReservedUntil: ApiOrderOrder["attributes"]["ReservedUntil"];
} | null;

/**
 * Type guard to validate and narrow ReservationStatus
 */
function isValidReservationStatus(
  value: unknown
): value is ReservationStatus {
  return (
    typeof value === "string" &&
    (value === "Reserved" ||
      value === "Released" ||
      value === "Consumed" ||
      value === "Expired")
  );
}

/**
 * Safely parse ReservedUntil value to Date or return null
 * Handles string (ISO format), number (timestamp), Date object, null, or undefined
 */
function parseReservedUntil(
  value: unknown
): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    // Validate the Date object
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    if (value.trim() === "") {
      return null;
    }
    try {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  }

  if (typeof value === "number") {
    try {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * ProductVariation with populated product_stock relation
 */
type ProductVariationWithStock = Omit<
  ApiProductVariationProductVariation["attributes"],
  "product_stock"
> & {
  id: number;
  product_stock: ApiProductStockProductStock["attributes"] & { id: number } | null;
};

/**
 * OrderItem with populated product_variation (including product_stock)
 */
type OrderItemWithVariationAndStock = Omit<
  ApiOrderItemOrderItem["attributes"],
  "product_variation"
> & {
  id: number;
  product_variation: ProductVariationWithStock | null;
};

/**
 * Order with populated order_items (including nested product_variation and product_stock)
 */
type OrderWithItems = Omit<ApiOrderOrder["attributes"], "order_items"> & {
  id: number;
  order_items: OrderItemWithVariationAndStock[];
};

const rawSql = async (
  strapi: Strapi,
  sql: string,
  bindings: any[],
  trx?: any
) => {
  if (trx?.raw) return trx.raw(sql, bindings);
  return strapi.db.connection.raw(sql, bindings);
};

const loadOrderItemsWithStocks = async (
  strapi: Strapi,
  orderId: number,
  trx?: any
): Promise<OrderWithItems | null> => {
  return strapi.db.query("api::order.order").findOne({
    where: { id: orderId },
    populate: {
      order_items: {
        populate: {
          product_variation: { populate: { product_stock: true } },
        },
      },
    },
    ...(trx ? { transacting: trx } : {}),
  });
};

const transitionReservationStatus = async (
  strapi: Strapi,
  orderId: number,
  next: ReservationTransition,
  trx?: any,
  options?: { requireNotExpired?: boolean }
): Promise<{ transitioned: boolean }> => {
  const requireNotExpired = options?.requireNotExpired === true;
  const extraClause = requireNotExpired ? " AND reserved_until >= NOW()" : "";

  const res = await rawSql(
    strapi,
    `UPDATE orders
     SET reservation_status = ?,
         reserved_until = NULL
     WHERE id = ?
       AND reservation_status = 'Reserved'${extraClause}
     RETURNING id`,
    [next, orderId],
    trx
  );

  const rows = res.rows || [];
  return { transitioned: rows.length > 0 };
};

export async function releaseOrderReservation(
  strapi: Strapi,
  orderId: number,
  reason: "Released" | "Expired",
  trx?: any
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  if (!trx) {
    return strapi.db.transaction(async ({ trx }) =>
      releaseOrderReservation(strapi, orderId, reason, trx)
    );
  }

  try {
    const { transitioned } = await transitionReservationStatus(
      strapi,
      orderId,
      reason,
      trx
    );
    if (!transitioned) return { success: true, skipped: true };

    const order = await loadOrderItemsWithStocks(strapi, orderId, trx);
    const items = order?.order_items || [];

    for (const it of items) {
      const stockId = it?.product_variation?.product_stock?.id;
      const qty = Number(it?.Count || 0);
      if (!stockId || qty <= 0) continue;

      const result = await releaseReservedStockAtomic(
        strapi,
        Number(stockId),
        qty,
        trx
      );
      if (!result.success) {
        throw new Error(result.error || "release_reserved_failed");
      }
    }

    return { success: true };
  } catch (e: any) {
    strapi.log.error("releaseOrderReservation failed", {
      orderId,
      reason,
      error: e?.message || e,
    });
    return { success: false, error: e?.message || String(e) };
  }
}

export async function consumeOrderReservation(
  strapi: Strapi,
  orderId: number,
  trx?: any
): Promise<{ success: boolean; skipped?: boolean; expired?: boolean; error?: string }> {
  if (!trx) {
    return strapi.db.transaction(async ({ trx }) =>
      consumeOrderReservation(strapi, orderId, trx)
    );
  }

  try {
    const { transitioned } = await transitionReservationStatus(
      strapi,
      orderId,
      "Consumed",
      trx,
      { requireNotExpired: true }
    );
    if (!transitioned) {
      // Either already processed, not reserved, or expired.
      // Query order to check reservation status and expiration
      const order = await strapi.db.query("api::order.order").findOne({
        where: { id: orderId },
        ...(trx ? { transacting: trx } : {}),
      });

      if (!order) {
        return { success: true, skipped: true, expired: false };
      }

      // Extract and validate reservation fields using type guards
      const status = order.ReservationStatus;
      const reservedUntil = order.ReservedUntil;

      // Use type guard to validate status before comparison
      const isValidStatus = isValidReservationStatus(status);
      const isReserved = isValidStatus && status === "Reserved";

      // Safely parse ReservedUntil date
      const until = parseReservedUntil(reservedUntil);

      // Check if reservation expired (status is Reserved and date is in the past)
      const expired = isReserved && until !== null && until.getTime() < Date.now();

      return { success: true, skipped: true, expired: !!expired };
    }

    const order = await loadOrderItemsWithStocks(strapi, orderId, trx);
    const items = order?.order_items || [];

    for (const it of items) {
      const stockId = it?.product_variation?.product_stock?.id;
      const qty = Number(it?.Count || 0);
      if (!stockId || qty <= 0) continue;

      const result = await consumeReservedStockAtomic(
        strapi,
        Number(stockId),
        qty,
        trx
      );
      if (!result.success) {
        throw new Error(result.error || "consume_reserved_failed");
      }
    }

    return { success: true };
  } catch (e: any) {
    strapi.log.error("consumeOrderReservation failed", {
      orderId,
      error: e?.message || e,
    });
    return { success: false, error: e?.message || String(e) };
  }
}
