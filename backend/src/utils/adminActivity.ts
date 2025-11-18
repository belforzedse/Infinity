import type { Strapi } from "@strapi/strapi";

export type AdminActivityParams = {
  resourceType: "Order" | "Product" | "User" | "Contract" | "Discount" | "Stock" | "Other";
  resourceId?: string | number | null;
  action: "Create" | "Update" | "Delete" | "Publish" | "Unpublish" | "Adjust" | "Other";
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

export async function logAdminActivity(
  strapi: Strapi,
  params: AdminActivityParams,
) {
  try {
    const performedByName =
      params.performedBy?.name ||
      params.performedBy?.id
        ? `User ${params.performedBy?.id}`
        : "System";

    await strapi.entityService.create("api::admin-activity.admin-activity" as any, {
      data: {
        ResourceType: params.resourceType,
        Action: params.action,
        ResourceId: params.resourceId ? String(params.resourceId) : undefined,
        Description: params.description,
        Metadata: params.metadata,
        performed_by: params.performedBy?.id || undefined,
        PerformedByName: performedByName,
        PerformedByRole: params.performedBy?.role,
        IP: params.ip,
        UserAgent: params.userAgent,
      },
    });
  } catch (error) {
    strapi.log.error("Failed to log admin activity", {
      error: error instanceof Error ? error.message : error,
      payload: params,
    });
  }
}

