import type { Strapi } from "@strapi/strapi";
import {
  type BackgroundJobStats,
  runBackgroundJob,
} from "./backgroundJobRunner";

const MAX_CONSECUTIVE_FAILURES = 5;
let consecutiveFailures = 0;
const JOB_NAME = "expireReserveOrders";
const DEFAULT_LOCK_TTL_MS = 10 * 60 * 1000;

type ExpireReserveOrdersOptions = {
  batchSize?: number;
  now?: Date;
  lockTtlMs?: number;
};

async function expireReserveOrdersBatch(
  strapi: Strapi,
  options: Required<Pick<ExpireReserveOrdersOptions, "batchSize" | "now">>
): Promise<BackgroundJobStats> {
  const groupRows = await strapi.db.connection.raw(
    `SELECT reserve_group_id AS "reserveGroupId",
            COUNT(*)::int AS "expiredOrderCount"
     FROM orders
     WHERE is_reserve_order = true
       AND reserve_expires_at <= ?
       AND reserve_group_id IS NOT NULL
     GROUP BY reserve_group_id
     ORDER BY MIN(reserve_expires_at) ASC
     LIMIT ?`,
    [options.now, options.batchSize]
  );

  let groupsProcessed = 0;
  let ordersUpdated = 0;
  let skipped = 0;
  const groups = groupRows?.rows || [];

  for (const group of groups) {
    const groupId = String(group?.reserveGroupId || "").trim();
    if (!groupId) {
      skipped += 1;
      continue;
    }

    const updated = await strapi.db.connection.raw(
      `UPDATE orders
       SET is_reserve_order = false,
           reserve_expires_at = NULL,
           updated_at = NOW()
       WHERE reserve_group_id = ?
         AND is_reserve_order = true
         AND reserve_expires_at <= ?
       RETURNING id`,
      [groupId, options.now]
    );

    const updatedCount = updated?.rows?.length || 0;
    if (updatedCount === 0) {
      skipped += 1;
      continue;
    }

    groupsProcessed += 1;
    ordersUpdated += updatedCount;
    strapi.log.info("Reserve order group expired", {
      groupId,
      orderCount: updatedCount,
    });
  }

  return {
    groupsFound: groups.length,
    groupsProcessed,
    ordersUpdated,
    skipped,
    cutoff: options.now.toISOString(),
  };
}

export async function runExpireReserveOrdersTick(
  strapi: Strapi,
  options: ExpireReserveOrdersOptions = {}
) {
  const batchSize = Math.max(
    1,
    Number(options.batchSize ?? process.env.RESERVE_ORDER_EXPIRY_BATCH_SIZE ?? 100) || 100
  );
  const lockTtlMs = Math.max(30_000, options.lockTtlMs ?? DEFAULT_LOCK_TTL_MS);

  const result = await runBackgroundJob({
    strapi,
    jobName: JOB_NAME,
    lockTtlMs,
    run: () =>
      expireReserveOrdersBatch(strapi, {
        batchSize,
        now: options.now ?? new Date(),
      }),
  });

  if (result.status === "completed") {
    consecutiveFailures = 0;
  } else if (result.status === "failed") {
    consecutiveFailures += 1;
  }

  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    strapi.log.warn("expireReserveOrders consecutive failure threshold exceeded", {
      consecutiveFailures,
      threshold: MAX_CONSECUTIVE_FAILURES,
    });
  }

  return result;
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

  const batchSize = Math.max(
    1,
    Number(process.env.RESERVE_ORDER_EXPIRY_BATCH_SIZE || 100) || 100
  );

  const tick = async () => {
    await runExpireReserveOrdersTick(strapi, { batchSize });
  };

  setTimeout(() => tick().catch(() => {}), 30_000);
  setInterval(() => tick().catch(() => {}), intervalMs);
}
