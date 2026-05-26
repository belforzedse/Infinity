import type { Strapi } from "@strapi/strapi";
import { COMMERCE_PURGE_CONFIRMATION } from "../services/commerce-maintenance";

export default ({ strapi }: { strapi: Strapi }) => ({
  async purge(ctx) {
    const body = ctx.request.body || {};
    const dryRun = body.dryRun !== false;
    const confirmation = typeof body.confirmation === "string" ? body.confirmation : undefined;

    if (!dryRun && confirmation !== COMMERCE_PURGE_CONFIRMATION) {
      return ctx.badRequest("Invalid confirmation string", {
        data: {
          code: "INVALID_CONFIRMATION",
          confirmationRequired: COMMERCE_PURGE_CONFIRMATION,
        },
      });
    }

    try {
      const user = ctx.state?.user;
      const result = await strapi
        .service("api::commerce-maintenance.commerce-maintenance")
        .purgeCommerceData({
          dryRun,
          confirmation,
          performedBy: {
            id: user?.id ? Number(user.id) : undefined,
            role: user?.role?.name || null,
          },
          ip: ctx.request.ip || ctx.ip || null,
          userAgent: ctx.request.headers?.["user-agent"] || null,
        });

      ctx.body = { data: result };
    } catch (error: any) {
      if (error?.code === "INVALID_CONFIRMATION") {
        return ctx.badRequest("Invalid confirmation string", {
          data: {
            code: "INVALID_CONFIRMATION",
            confirmationRequired: COMMERCE_PURGE_CONFIRMATION,
          },
        });
      }

      strapi.log.error("Commerce data purge failed", {
        dryRun,
        performedBy: ctx.state?.user?.id,
        error: error?.message || error,
      });

      return ctx.badRequest("Commerce data purge failed", {
        data: {
          code: "COMMERCE_PURGE_FAILED",
          error: error?.message || String(error),
        },
      });
    }
  },
});
