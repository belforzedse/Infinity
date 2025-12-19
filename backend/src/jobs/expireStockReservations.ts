import type { Strapi } from "@strapi/strapi";
import { releaseOrderReservation } from "../utils/stockReservations";

const MAX_CONSECUTIVE_FAILURES = 5;
let consecutiveFailures = 0;

const incrementMetric = (
  strapi: Strapi,
  name: string
) => {
  const metrics = (strapi as any).metrics;
  if (!metrics) return;
  if (typeof metrics.increment === "function") {
    metrics.increment(name);
    return;
  }
  if (typeof metrics.counter === "function") {
    const counter = metrics.counter(name);
    if (counter?.inc) {
      counter.inc();
      return;
    }
  }
  if (metrics?.counter?.inc) {
    metrics.counter.inc();
  }
};

export function startExpireStockReservationsJob(strapi: Strapi) {
  const enabled =
    String(process.env.ENABLE_STOCK_RESERVATION_EXPIRY_JOB || "true").toLowerCase() !== "false";
  if (!enabled) return;

  const intervalSeconds = Number(process.env.STOCK_RESERVATION_EXPIRY_JOB_INTERVAL_SECONDS || 60);
  const intervalMs = Math.max(10, Number.isFinite(intervalSeconds) ? intervalSeconds : 60) * 1000;

  const batchSize = Math.max(
    1,
    Number(process.env.STOCK_RESERVATION_EXPIRY_BATCH_SIZE || 100) || 100
  );

  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const now = new Date();
      const expiredOrders = (await strapi.entityService.findMany("api::order.order", {
        filters: {
          Status: "Paying",
          ReservationStatus: "Reserved",
          ReservedUntil: { $lt: now },
        },
        fields: ["id"],
        limit: batchSize,
        sort: { ReservedUntil: "asc" },
      })) as any[];

      for (const o of expiredOrders || []) {
        const orderId = Number(o?.id);
        if (!Number.isFinite(orderId)) continue;

        await strapi.db.transaction(async ({ trx }) => {
          const rel = await releaseOrderReservation(
            strapi as any,
            orderId,
            "Expired",
            trx
          );
          if (rel.skipped) return;

          // Mark order + contract cancelled (idempotent)
          const order = await strapi.db.query("api::order.order").findOne({
            where: { id: orderId },
            populate: { contract: true },
            ...(trx ? { transacting: trx } : {}),
          });

          await strapi.db.query("api::order.order").update({
            where: { id: orderId },
            data: { Status: "Cancelled" },
            ...(trx ? { transacting: trx } : {}),
          });

          const contractId =
            typeof order?.contract === "object" && order.contract
              ? Number(order.contract.id)
              : Number(order?.contract);
          if (Number.isFinite(contractId)) {
            await strapi.db.query("api::contract.contract").update({
              where: { id: contractId },
              data: { Status: "Cancelled" },
              ...(trx ? { transacting: trx } : {}),
            });
          }

          try {
            await strapi.db.query("api::order-log.order-log").create({
              data: {
                order: orderId,
                Action: "Update",
                Description: "Reservation expired; order cancelled automatically",
                Changes: { ReservationStatus: "Expired" },
              },
              ...(trx ? { transacting: trx } : {}),
            } as any);
          } catch (logErr) {
            strapi.log.error("Failed to create order-log for expired reservation", { orderId, error: logErr });
          }
        });
      }
      consecutiveFailures = 0;
    } catch (e) {
      consecutiveFailures += 1;
      incrementMetric(strapi, "expire_stock_reservations_failures_total");
      strapi.log.error("expireStockReservations job failed", {
        error: e,
        consecutiveFailures,
      });
      if (consecutiveFailures === MAX_CONSECUTIVE_FAILURES) {
        incrementMetric(strapi, "expire_stock_reservations_failure_threshold_total");
        strapi.log.warn("expireStockReservations consecutive failure threshold exceeded", {
          consecutiveFailures,
          threshold: MAX_CONSECUTIVE_FAILURES,
        });
      }
    } finally {
      running = false;
    }
  };

  // Start shortly after boot, then every interval
  setTimeout(() => tick().catch(() => {}), 10_000);
  setInterval(() => tick().catch(() => {}), intervalMs);
}
