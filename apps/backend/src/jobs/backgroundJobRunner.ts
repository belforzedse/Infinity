import os from "os";
import type { Strapi } from "@strapi/strapi";

const ERROR_STACK_LIMIT = 4_000;
const runningJobs = new Set<string>();

export type BackgroundJobStats = Record<string, number | string | boolean | null | undefined>;

export type BackgroundJobRunResult =
  | {
      status: "completed";
      durationMs: number;
      stats: BackgroundJobStats;
    }
  | {
      status: "skipped";
      durationMs: number;
      skippedReason: "in_process" | "distributed_lock";
      stats: BackgroundJobStats;
    }
  | {
      status: "failed";
      durationMs: number;
      error: ReturnType<typeof formatError>;
      stats: BackgroundJobStats;
    };

type RunBackgroundJobOptions = {
  strapi: Strapi;
  jobName: string;
  lockTtlMs: number;
  run: () => Promise<BackgroundJobStats>;
};

export function formatError(error: unknown) {
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

function getOwner() {
  return [
    process.env.HOSTNAME,
    os.hostname(),
    process.pid,
    Math.random().toString(36).slice(2),
  ]
    .filter(Boolean)
    .join(":");
}

function isPostgresConnection(strapi: Strapi) {
  const client = String(
    (strapi.db.connection as any)?.client?.config?.client ||
      (strapi.db.connection as any)?.client?.dialect ||
      process.env.DATABASE_CLIENT ||
      ""
  ).toLowerCase();

  return client === "" || client.includes("pg") || client.includes("postgres");
}

async function acquireDistributedLock(
  strapi: Strapi,
  jobName: string,
  owner: string,
  lockTtlMs: number
) {
  if (!isPostgresConnection(strapi)) {
    strapi.log.warn("Background job distributed lock skipped for non-PostgreSQL database", {
      jobName,
      databaseClient: process.env.DATABASE_CLIENT,
    });
    return true;
  }

  const lockedUntil = new Date(Date.now() + lockTtlMs);
  const result = await strapi.db.connection.raw(
    `INSERT INTO background_job_locks (name, owner, locked_until, updated_at)
     VALUES (?, ?, ?, NOW())
     ON CONFLICT (name) DO UPDATE
     SET owner = EXCLUDED.owner,
         locked_until = EXCLUDED.locked_until,
         updated_at = NOW()
     WHERE background_job_locks.locked_until <= NOW()
     RETURNING name`,
    [jobName, owner, lockedUntil]
  );

  return (result?.rows || []).length > 0;
}

async function releaseDistributedLock(strapi: Strapi, jobName: string, owner: string) {
  if (!isPostgresConnection(strapi)) return;

  await strapi.db.connection.raw(
    `UPDATE background_job_locks
     SET locked_until = NOW(),
         updated_at = NOW()
     WHERE name = ?
       AND owner = ?`,
    [jobName, owner]
  );
}

export async function runBackgroundJob({
  strapi,
  jobName,
  lockTtlMs,
  run,
}: RunBackgroundJobOptions): Promise<BackgroundJobRunResult> {
  const startedAt = Date.now();

  if (runningJobs.has(jobName)) {
    const result: BackgroundJobRunResult = {
      status: "skipped",
      skippedReason: "in_process",
      durationMs: 0,
      stats: { skipped: 1 },
    };
    strapi.log.info(`${jobName} job skipped`, result);
    return result;
  }

  const owner = getOwner();
  let lockAcquired = false;
  runningJobs.add(jobName);

  try {
    lockAcquired = await acquireDistributedLock(strapi, jobName, owner, lockTtlMs);
    if (!lockAcquired) {
      const result: BackgroundJobRunResult = {
        status: "skipped",
        skippedReason: "distributed_lock",
        durationMs: Date.now() - startedAt,
        stats: { skipped: 1 },
      };
      strapi.log.info(`${jobName} job skipped`, result);
      return result;
    }

    const stats = await run();
    const result: BackgroundJobRunResult = {
      status: "completed",
      durationMs: Date.now() - startedAt,
      stats,
    };
    strapi.log.info(`${jobName} job completed`, result);
    return result;
  } catch (error) {
    const result: BackgroundJobRunResult = {
      status: "failed",
      durationMs: Date.now() - startedAt,
      error: formatError(error),
      stats: { failed: 1 },
    };
    strapi.log.error(`${jobName} job failed`, result);
    return result;
  } finally {
    if (lockAcquired) {
      try {
        await releaseDistributedLock(strapi, jobName, owner);
      } catch (releaseError) {
        strapi.log.warn(`${jobName} distributed lock release failed`, {
          jobName,
          owner,
          ...formatError(releaseError),
        });
      }
    }
    runningJobs.delete(jobName);
  }
}

export function __resetBackgroundJobGuardsForTests() {
  runningJobs.clear();
}
