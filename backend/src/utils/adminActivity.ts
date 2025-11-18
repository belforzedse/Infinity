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
    // Normalize name to always be a string (never an object)
    let performedByName: string = "System";
    let performedByRole: string | null = null;

    if (params.performedBy?.id) {
      // If we have a user ID, try to fetch the user to get name and role
      try {
        const user = await strapi.entityService.findOne(
          "plugin::users-permissions.user",
          params.performedBy.id,
          { fields: ["username", "email", "Phone"], populate: { role: true } }
        );

        if (user) {
          performedByName =
            user.username ||
            user.email ||
            user.Phone ||
            `User ${params.performedBy.id}`;
          
          // Extract role name if available
          if (user.role) {
            performedByRole =
              typeof user.role === "object" && user.role.name
                ? user.role.name
                : typeof user.role === "string"
                  ? user.role
                  : null;
          }
        } else {
          performedByName = params.performedBy.name
            ? String(params.performedBy.name)
            : `User ${params.performedBy.id}`;
        }
      } catch (userError) {
        // Fallback to provided name or User ID
        performedByName =
          params.performedBy.name && typeof params.performedBy.name === "string"
            ? params.performedBy.name
            : `User ${params.performedBy.id}`;
      }

      // Use provided role if we didn't fetch one
      if (!performedByRole && params.performedBy.role) {
        performedByRole =
          typeof params.performedBy.role === "string"
            ? params.performedBy.role
            : null;
      }
    } else if (params.performedBy?.name) {
      // If we only have a name (no ID), use it directly
      performedByName =
        typeof params.performedBy.name === "string"
          ? params.performedBy.name
          : String(params.performedBy.name);
      performedByRole =
        params.performedBy.role && typeof params.performedBy.role === "string"
          ? params.performedBy.role
          : null;
    }

    await strapi.entityService.create("api::admin-activity.admin-activity" as any, {
      data: {
        ResourceType: params.resourceType,
        Action: params.action,
        ResourceId: params.resourceId ? String(params.resourceId) : undefined,
        Description: params.description,
        Metadata: params.metadata,
        performed_by: params.performedBy?.id || undefined,
        PerformedByName: performedByName,
        PerformedByRole: performedByRole,
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

