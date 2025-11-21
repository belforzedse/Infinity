import type { Strapi } from "@strapi/strapi";

export type ManualSeverity = "info" | "success" | "warning" | "error";

export type ManualActivityParams = {
  resourceType: "Order" | "Product" | "User" | "Contract" | "Discount" | "Stock" | "Other";
  resourceId?: string | number | null;
  action: "Create" | "Update" | "Delete" | "Publish" | "Unpublish" | "Adjust" | "Other";
  title?: string;
  message?: string;
  messageEn?: string;
  severity?: ManualSeverity;
  changes?: Record<string, { from?: unknown; to?: unknown }>;
  description?: string;
  metadata?: Record<string, unknown>;
  performedBy?: {
    id?: number;
    name?: string | null;
    role?: string | null;
  };
  ip?: string | null;
  userAgent?: string | null;
};

export async function logManualActivity(
  strapi: Strapi,
  params: ManualActivityParams,
) {
  try {
    let performedByRole: string | undefined =
      typeof params.performedBy?.role === "string" ? params.performedBy.role : undefined;

    if (!performedByRole && params.performedBy?.id) {
      try {
        const user = await strapi.entityService.findOne(
          "plugin::users-permissions.user",
          params.performedBy.id,
          { populate: { role: true } },
        ) as any;
        if (user?.role?.name) {
          performedByRole = user.role.name;
        }
      } catch {
        // ignore
      }
    }

    await strapi.entityService.create(
      "api::manual-admin-activity.manual-admin-activity" as any,
      {
        data: {
          ResourceType: params.resourceType,
          Action: params.action,
          ResourceId: params.resourceId ? String(params.resourceId) : undefined,
          Title: params.title,
          Message: params.message,
          MessageEn: params.messageEn,
          Severity: params.severity || "info",
          Changes: params.changes || null,
          Description: params.description,
          Metadata: params.metadata,
          performed_by: params.performedBy?.id || undefined,
          PerformedByName:
            typeof params.performedBy?.name === "string" ? params.performedBy.name : undefined,
          PerformedByRole: performedByRole,
          IP: params.ip,
          UserAgent: params.userAgent,
        },
      },
    );
  } catch (error) {
    strapi.log.error("Failed to log manual admin activity", {
      error: error instanceof Error ? error.message : error,
      payload: params,
    });
  }
}

