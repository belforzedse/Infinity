import { RedisClient } from "../../../index";

type HealthCheckStatus = "ok" | "fail" | "skipped";

async function pingDatabase(): Promise<HealthCheckStatus> {
  try {
    await strapi.db.connection.raw("SELECT 1");
    return "ok";
  } catch (error) {
    strapi.log.error("Healthcheck database ping failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return "fail";
  }
}

async function pingRedis(): Promise<HealthCheckStatus> {
  if (!process.env.REDIS_URL) return "skipped";

  try {
    const client = await RedisClient;
    const response = await client.ping();
    return response === "PONG" ? "ok" : "fail";
  } catch (error) {
    strapi.log.error("Healthcheck redis ping failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return "fail";
  }
}

export default {
  async check(ctx: any) {
    const db = await pingDatabase();
    const redis = await pingRedis();
    const ok = db === "ok";

    ctx.status = ok ? 200 : 503;
    ctx.body = {
      ok,
      service: "strapi",
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        db,
        redis,
      },
    };
  },
};
