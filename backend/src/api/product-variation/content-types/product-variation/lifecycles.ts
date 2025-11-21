import { resolveAuditActor } from "../../../../utils/audit";
import { logManualActivity } from "../../../../utils/manualAdminActivity";

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

    await strapi.entityService.create(
      "api::product-variation-log.product-variation-log" as any,
      {
        data: {
          product_variation: result.id,
          performed_by: actor.userId,
          PerformedBy: actor.label || undefined,
          IP: actor.ip || undefined,
          UserAgent: actor.userAgent || undefined,
          Action: "Create" as AuditAction,
          Description: "Product variation created",
        },
      }
    );

    if (actor.userId) {
      await logManualActivity(strapi, {
        resourceType: "Product",
        resourceId: result.product || undefined,
        action: "Create",
        title: "محصول-ورژن جدید ایجاد شد",
        message: `ورژن جدید برای محصول ${result.product} ایجاد شد`,
        messageEn: `Product variation #${result.id} created`,
        severity: "success",
        metadata: { variationId: result.id, sku: result.SKU },
        performedBy: { id: actor.userId },
        ip: actor.ip,
        userAgent: actor.userAgent,
      });
    }
  },

  async beforeUpdate(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;

    const previous = await strapi.entityService.findOne(
      "api::product-variation.product-variation",
      id,
      {
        fields: ["IsPublished", "SKU", "Price", "DiscountPrice"],
        populate: {
          product: true,
          product_variation_color: true,
          product_variation_size: true,
          product_variation_model: true,
        },
      }
    );

    event.state = {
      ...(event.state || {}),
      previousProductVariation: previous,
    };
  },

  async afterUpdate(event) {
    const { result, state } = event as any;
    if (!result?.id) return;
    const actor = resolveAuditActor(event as any);

    const previous = state?.previousProductVariation || {};
    const current = await strapi.entityService.findOne(
      "api::product-variation.product-variation",
      result.id,
      {
        fields: ["IsPublished", "SKU", "Price", "DiscountPrice"],
        populate: {
          product: true,
          product_variation_color: true,
          product_variation_size: true,
          product_variation_model: true,
        },
      }
    );

    const changes = diffChanges(previous, current);
    if (Object.keys(changes).length === 0) return;

    await strapi.entityService.create(
      "api::product-variation-log.product-variation-log" as any,
      {
        data: {
          product_variation: result.id,
          performed_by: actor.userId,
          PerformedBy: actor.label || undefined,
          IP: actor.ip || undefined,
          UserAgent: actor.userAgent || undefined,
          Action: "Update" as AuditAction,
          Changes: changes,
          Description: "Product variation updated",
        },
      }
    );

    if (actor.userId) {
      await logManualActivity(strapi, {
        resourceType: "Product",
        resourceId: result.product || undefined,
        action: "Update",
        title: "ورژن محصول ویرایش شد",
        message: `ورژن #${result.id} محصول ${result.product} بروزرسانی شد`,
        messageEn: `Product variation #${result.id} updated`,
        severity: "info",
        changes,
        metadata: { variationId: result.id },
        performedBy: { id: actor.userId },
        ip: actor.ip,
        userAgent: actor.userAgent,
      });
    }
  },

  async beforeDelete(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;
    event.state = { ...(event.state || {}), deletingProductVariationId: id };
  },

  async afterDelete(event) {
    const id = (event as any)?.state?.deletingProductVariationId;
    if (!id) return;
    const actor = resolveAuditActor(event as any);

    await strapi.entityService.create(
      "api::product-variation-log.product-variation-log" as any,
      {
        data: {
          product_variation: id,
          performed_by: actor.userId,
          PerformedBy: actor.label || undefined,
          IP: actor.ip || undefined,
          UserAgent: actor.userAgent || undefined,
          Action: "Delete" as AuditAction,
          Description: "Product variation deleted",
        },
      }
    );

    if (actor.userId) {
      await logManualActivity(strapi, {
        resourceType: "Product",
        resourceId: null,
        action: "Delete",
        title: "ورژن محصول حذف شد",
        message: `ورژن ${id} محصول حذف شد`,
        messageEn: `Product variation #${id} deleted`,
        severity: "warning",
        metadata: { variationId: id },
        performedBy: { id: actor.userId },
        ip: actor.ip,
        userAgent: actor.userAgent,
      });
    }
  },
};
