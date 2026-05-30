import type { Strapi } from "@strapi/strapi";
import { releaseOrderReservation } from "../utils/stockReservations";
import {
  type BackgroundJobStats,
  formatError,
  runBackgroundJob,
} from "./backgroundJobRunner";

const MAX_CONSECUTIVE_FAILURES = 5;
let consecutiveFailures = 0;
const JOB_NAME = "expireStockReservations";
const DEFAULT_LOCK_TTL_MS = 5 * 60 * 1000;

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

type ExpireStockReservationsOptions = {
  batchSize?: number;
  now?: Date;
  graceSeconds?: number;
  lockTtlMs?: number;
};

async function expireStockReservationsBatch(
  strapi: Strapi,
  options: Required<Pick<ExpireStockReservationsOptions, "batchSize" | "now" | "graceSeconds">>
): Promise<BackgroundJobStats> {
  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let logsFailed = 0;
  const cutoff = new Date(options.now.getTime() - options.graceSeconds * 1000);

  const expiredOrders = (await strapi.entityService.findMany("api::order.order", {
    filters: {
      Status: "Paying",
      ReservationStatus: "Reserved",
      ReservedUntil: { $lt: cutoff },
    },
    fields: ["id"],
    limit: options.batchSize,
    sort: { ReservedUntil: "asc" },
  })) as any[];

  for (const o of expiredOrders || []) {
    const orderId = Number(o?.id);
    if (!Number.isFinite(orderId)) {
      skipped += 1;
      continue;
    }

    let shouldWriteExpiryLog = false;
    try {
      await strapi.db.transaction(async ({ trx }) => {
        const rel = await releaseOrderReservation(
          strapi as any,
          orderId,
          "Expired",
          trx,
          {
            requireOrderStatus: "Paying",
            expiresBefore: cutoff,
          }
        );
        if (rel.skipped) {
          skipped += 1;
          return;
        }
        if (!rel.success) {
          throw new Error(rel.error || "release_order_reservation_failed");
        }

        const order = await strapi.db.query("api::order.order").findOne({
          where: { id: orderId, Status: "Paying", ReservationStatus: "Expired" },
          populate: { contract: true },
          ...(trx ? { transacting: trx } : {}),
        });

        if (!order) {
          skipped += 1;
          return;
        }

        const orderCancelResult = await trx.raw(
          `UPDATE orders
           SET status = 'Cancelled'
           WHERE id = ?
             AND status = 'Paying'
             AND reservation_status = 'Expired'
           RETURNING id`,
          [orderId]
        );
        if ((orderCancelResult?.rows || []).length === 0) {
          skipped += 1;
          return;
        }

        const contractId =
          typeof order?.contract === "object" && order.contract
            ? Number(order.contract.id)
            : Number(order?.contract);
        if (Number.isFinite(contractId)) {
          await trx.raw(
            `UPDATE contracts
             SET status = 'Cancelled'
             WHERE id = ?`,
            [contractId]
          );
        }

        processed += 1;
        shouldWriteExpiryLog = true;
      });
    } catch (orderErr) {
      failed += 1;
      incrementMetric(strapi, "expire_stock_reservations_failures_total");
      strapi.log.error("expireStockReservations per-order transaction failed", {
        orderId,
        stage: "transaction",
        ...formatError(orderErr),
      });
      continue;
    }

    if (!shouldWriteExpiryLog) continue;

    try {
      await strapi.db.query("api::order-log.order-log").create({
        data: {
          order: orderId,
          Action: "Update",
          Description: "Reservation expired; order cancelled automatically",
          Changes: { ReservationStatus: "Expired" },
        },
      } as any);
    } catch (logErr) {
      logsFailed += 1;
      incrementMetric(strapi, "expire_stock_reservations_failures_total");
      strapi.log.error("Failed to create order-log for expired reservation", {
        orderId,
        stage: "post_commit_order_log",
        ...formatError(logErr),
      });
    }
  }

  return {
    scanned: expiredOrders?.length ?? 0,
    processed,
    skipped,
    failed,
    logsFailed,
    cutoff: cutoff.toISOString(),
  };
}

export async function runExpireStockReservationsTick(
  strapi: Strapi,
  options: ExpireStockReservationsOptions = {}
) {
  const batchSize = Math.max(
    1,
    Number(options.batchSize ?? process.env.STOCK_RESERVATION_EXPIRY_BATCH_SIZE ?? 100) || 100
  );
  const graceSeconds = Math.max(
    0,
    Number(
      options.graceSeconds ??
        process.env.STOCK_RESERVATION_EXPIRY_GRACE_SECONDS ??
        60
    ) || 0
  );
  const lockTtlMs = Math.max(30_000, options.lockTtlMs ?? DEFAULT_LOCK_TTL_MS);

  const result = await runBackgroundJob({
    strapi,
    jobName: JOB_NAME,
    lockTtlMs,
    run: () =>
      expireStockReservationsBatch(strapi, {
        batchSize,
        graceSeconds,
        now: options.now ?? new Date(),
      }),
  });

  if (result.status === "completed") {
    const hadFailures = Number(result.stats.failed || 0) > 0 || Number(result.stats.logsFailed || 0) > 0;
    if (hadFailures) {
      consecutiveFailures += 1;
    } else {
      consecutiveFailures = 0;
    }
  } else if (result.status === "failed") {
    consecutiveFailures += 1;
    incrementMetric(strapi, "expire_stock_reservations_failures_total");
  }

  if (consecutiveFailures === MAX_CONSECUTIVE_FAILURES) {
    incrementMetric(strapi, "expire_stock_reservations_failure_threshold_total");
    strapi.log.warn("expireStockReservations consecutive failure threshold exceeded", {
      consecutiveFailures,
      threshold: MAX_CONSECUTIVE_FAILURES,
    });
  }

  return result;
}

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

  const tick = async () => {
    await runExpireStockReservationsTick(strapi, { batchSize });
  };

  // Start shortly after boot, then every interval
  setTimeout(() => tick().catch(() => {}), 10_000);
  setInterval(() => tick().catch(() => {}), intervalMs);
}
