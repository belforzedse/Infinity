import type { Strapi } from "@strapi/strapi";

const MAX_CONSECUTIVE_FAILURES = 5;
let consecutiveFailures = 0;
const ERROR_STACK_LIMIT = 2_000;

function formatError(error: unknown) {
  const asRecord = (error && typeof error === "object" ? error : {}) as {
    message?: unknown;
    code?: unknown;
    stack?: unknown;
  };

  const message =
    typeof asRecord.message === "string"
      ? asRecord.message
      : error instanceof Error
        ? error.message
        : String(error);

  const code =
    typeof asRecord.code === "string" || typeof asRecord.code === "number"
      ? asRecord.code
      : undefined;

  const stack =
    typeof asRecord.stack === "string"
      ? asRecord.stack.slice(0, ERROR_STACK_LIMIT)
      : undefined;

  return { message, code, stack };
}

/**
 * Clears isReserveOrder and reserveExpiresAt on orders whose reserve window has expired.
 * Runs every 5-10 minutes. Orders become normal "Started" orders ready for admin to ship.
 */
export function startExpireReserveOrdersJob(strapi: Strapi) {
  const enabled =
    String(process.env.ENABLE_RESERVE_ORDER_EXPIRY_JOB || "true").toLowerCase() !== "false";
  if (!enabled) return;

  const intervalMinutes = Number(process.env.RESERVE_ORDER_EXPIRY_JOB_INTERVAL_MINUTES || 5);
  const intervalMs = Math.max(1, Number.isFinite(intervalMinutes) ? intervalMinutes : 5) * 60 * 1000;

  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const now = new Date();
      const expiredOrders = await strapi.db.query("api::order.order").findMany({
        where: {
          isReserveOrder: true,
          reserveExpiresAt: { $lte: now.toISOString() },
        },
        select: ["id", "reserveGroupId"],
      });

      const groupIds = [
        ...new Set(
          (expiredOrders || [])
            .map((o: { reserveGroupId?: string | null }) => o.reserveGroupId)
            .filter((g): g is string => !!g)
        ),
      ];

      for (const groupId of groupIds) {
        const groupOrders = await strapi.db.query("api::order.order").findMany({
          where: { reserveGroupId: groupId },
          select: ["id"],
        });
        for (const o of groupOrders || []) {
          await strapi.entityService.update("api::order.order", o.id, {
            data: {
              isReserveOrder: false,
              reserveExpiresAt: null,
            },
          });
        }
        strapi.log.info("Reserve order group expired", { groupId, orderCount: groupOrders?.length ?? 0 });
      }
      consecutiveFailures = 0;
    } catch (e) {
      consecutiveFailures += 1;
      strapi.log.error("expireReserveOrders job failed", {
        ...formatError(e),
        consecutiveFailures,
      });
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        strapi.log.warn("expireReserveOrders consecutive failure threshold exceeded", {
          consecutiveFailures,
          threshold: MAX_CONSECUTIVE_FAILURES,
        });
      }
    } finally {
      running = false;
    }
  };

  setTimeout(() => tick().catch(() => {}), 30_000);
  setInterval(() => tick().catch(() => {}), intervalMs);
}
