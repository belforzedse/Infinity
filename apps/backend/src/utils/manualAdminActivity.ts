import type { Strapi } from "@strapi/strapi";

import { recordAdminAudit } from "./adminAudit";

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

/**
 * Backwards-compatible shim. All admin-audit writes now flow through the single gated writer
 * `recordAdminAudit`, which records an entry only when the actor is a verified admin. Existing
 * callers that pass `performedBy.id` continue to work and are now gated automatically.
 */
export async function logManualActivity(
  strapi: Strapi,
  params: ManualActivityParams,
) {
  await recordAdminAudit(strapi, {
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    action: params.action,
    title: params.title,
    message: params.message,
    messageEn: params.messageEn,
    severity: params.severity,
    changes: params.changes,
    description: params.description,
    metadata: params.metadata,
    ip: params.ip,
    userAgent: params.userAgent,
    actor: params.performedBy?.id
      ? {
          id: params.performedBy.id,
          name: params.performedBy.name ?? undefined,
          role: params.performedBy.role ?? undefined,
        }
      : undefined,
  });
}
