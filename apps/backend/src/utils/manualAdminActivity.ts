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

async function getAdminIdentity(strapi: Strapi, userId?: number) {
  if (!userId) return { name: null, role: null };

  try {
    const user = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      userId,
      {
        populate: { user_info: true, role: true },
      },
    ) as any;

    if (!user) return { name: null, role: null };

    const role =
      (user.role && typeof user.role?.name === "string" ? user.role.name : null) || null;

    const info = user.user_info;
    const fullName = info?.FirstName || info?.LastName
      ? `${info?.FirstName || ""} ${info?.LastName || ""}`.trim()
      : null;

    const fallback =
      user.username || user.email || user.phone || (userId ? `User ${userId}` : null);

    return { name: fullName || fallback, role };
  } catch {
    return { name: null, role: null };
  }
}

export async function logManualActivity(
  strapi: Strapi,
  params: ManualActivityParams,
) {
  try {
    let name = typeof params.performedBy?.name === "string" ? params.performedBy.name : undefined;
    let role = typeof params.performedBy?.role === "string" ? params.performedBy.role : undefined;

    if ((!name || !role) && params.performedBy?.id) {
      const resolved = await getAdminIdentity(strapi, params.performedBy.id);
      if (!name) name = resolved.name || undefined;
      if (!role) role = resolved.role || undefined;
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
          PerformedByName: name,
          PerformedByRole: role,
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

