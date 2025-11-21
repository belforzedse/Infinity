import { resolveAuditActor } from "../../../../utils/audit";
import { logAdminActivity, logAdminProductEdit } from "../../../../utils/adminActivity";

type AuditAction = "Create" | "Update" | "Delete";

function diffChanges(
  previous: Record<string, any>,
  current: Record<string, any>
) {
  const changes: Record<string, { from: any; to: any }> = {};
  const keys = new Set([
    ...Object.keys(previous || {}),
    ...Object.keys(current || {}),
  ]);
  for (const key of keys) {
    if (
      key === "updatedAt" ||
      key === "createdAt" ||
      key === "id" ||
      key === "documentId"
    )
      continue;
    const beforeVal = previous?.[key];
    const afterVal = current?.[key];
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changes[key] = { from: beforeVal, to: afterVal };
    }
  }
  return changes;
}

export default {
  async afterCreate(event) {
    const { result } = event;
    if (!result?.id) return;
    const actor = resolveAuditActor(event as any);

    await strapi.entityService.create("api::product-log.product-log" as any, {
      data: {
        product: result.id,
        performed_by: actor.userId,
        PerformedBy: actor.label || undefined,
        IP: actor.ip || undefined,
        UserAgent: actor.userAgent || undefined,
        Action: "Create" as AuditAction,
        Description: "Product created",
      },
    });

    await logAdminActivity(strapi as any, {
      resourceType: "Product",
      resourceId: result.id,
      action: "Create",
      description: "محصول ایجاد شد",
      metadata: {
        productId: result.id,
        title: result.Title,
      },
      performedBy: {
        id: actor.userId || undefined,
        name: actor.label || undefined,
        role: null,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  },

  async beforeUpdate(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;

    const previous = await strapi.entityService.findOne(
      "api::product.product",
      id,
      {
        fields: [
          "Title",
          "Status",
          "Description",
          "AverageRating",
          "RatingCount",
          "CleaningTips",
          "ReturnConditions",
        ],
        populate: { product_main_category: true, product_tags: true },
      }
    );

    event.state = { ...(event.state || {}), previousProduct: previous };
  },

  async afterUpdate(event) {
    const { result, state } = event as any;
    if (!result?.id) return;
    const actor = resolveAuditActor(event as any);

    const previous = state?.previousProduct || {};
    const current = await strapi.entityService.findOne(
      "api::product.product",
      result.id,
      {
        fields: [
          "Title",
          "Status",
          "Description",
          "AverageRating",
          "RatingCount",
          "CleaningTips",
          "ReturnConditions",
        ],
        populate: { product_main_category: true, product_tags: true },
      }
    );

    const changes = diffChanges(previous, current);
    if (Object.keys(changes).length === 0) return;

    await strapi.entityService.create("api::product-log.product-log" as any, {
      data: {
        product: result.id,
        performed_by: actor.userId,
        PerformedBy: actor.label || undefined,
        IP: actor.ip || undefined,
        UserAgent: actor.userAgent || undefined,
        Action: "Update" as AuditAction,
        Changes: changes,
        Description: "Product updated",
      },
    });

    // Log with enhanced admin activity if actor is an admin
    if (actor.userId) {
      try {
        await logAdminProductEdit(
          strapi as any,
          result.id,
          changes,
          actor.userId,
          actor.ip || null,
          actor.userAgent || null,
        );
      } catch (activityError) {
        strapi.log.error("Failed to log admin activity for product edit", {
          productId: result.id,
          error: (activityError as Error).message,
        });
      }
    }

    // Also keep the legacy logAdminActivity call for backward compatibility
    await logAdminActivity(strapi as any, {
      resourceType: "Product",
      resourceId: result.id,
      action: "Update",
      description: "محصول بروزرسانی شد",
      metadata: {
        productId: result.id,
        changes,
      },
      performedBy: {
        id: actor.userId || undefined,
        name: actor.label || undefined,
        role: null,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  },

  async beforeDelete(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;
    event.state = { ...(event.state || {}), deletingProductId: id };
  },

  async afterDelete(event) {
    const id = (event as any)?.state?.deletingProductId;
    if (!id) return;
    const actor = resolveAuditActor(event as any);

    // Try to create product-log, but don't fail if product relation validation fails
    // (since the product was just deleted, the relation won't exist)
    try {
      await strapi.entityService.create("api::product-log.product-log" as any, {
        data: {
          product: id,
          performed_by: actor.userId,
          PerformedBy: actor.label || undefined,
          IP: actor.ip || undefined,
          UserAgent: actor.userAgent || undefined,
          Action: "Delete" as AuditAction,
          Description: "Product deleted",
        },
      });
    } catch (error: any) {
      // If validation fails because product doesn't exist (expected after deletion),
      // log a warning but don't fail the deletion
      if (error?.message?.includes("relation") || error?.message?.includes("do not exist")) {
        strapi.log.warn(
          `Product log creation skipped for deleted product ${id}: relation validation failed (expected)`
        );
      } else {
        // Re-throw unexpected errors
        strapi.log.error(`Failed to create product log for deleted product ${id}:`, error);
      }
    }

    await logAdminActivity(strapi as any, {
      resourceType: "Product",
      resourceId: id,
      action: "Delete",
      description: "محصول حذف شد",
      metadata: {
        productId: id,
      },
      performedBy: {
        id: actor.userId || undefined,
        name: actor.label || undefined,
        role: null,
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  },
};
