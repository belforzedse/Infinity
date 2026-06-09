import { resolveAuditActor } from "../../../../utils/audit";
import {
  recordAdminAudit,
  markProductEditedByAdmin,
} from "../../../../utils/adminAudit";
import { asEntityId } from "../../../../utils/lastEdited";
import { scheduleHomeProductsRevalidation } from "../../../../utils/homepageRevalidation";

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

    const createProductId = asEntityId(result.product) ?? undefined;
    const createProductLabel =
      typeof result.product === "object"
        ? result.product?.Title || result.product?.Name
        : undefined;

    const recordedCreate = await recordAdminAudit(strapi, {
      event,
      resourceType: "Product",
      resourceId: createProductId,
      action: "Create",
      title: "محصول-ورژن جدید ایجاد شد",
      message: `ورژن جدید برای محصول ${createProductLabel || createProductId || "نامشخص"} ایجاد شد`,
      messageEn: `Product variation #${result.id} created for product ${createProductLabel || createProductId || "unknown"}`,
      severity: "success",
      metadata: { variationId: result.id, sku: result.SKU },
    });
    if (recordedCreate) await markProductEditedByAdmin(strapi, createProductId);
    scheduleHomeProductsRevalidation("product-variation-create", {
      variationId: result.id,
      productId: createProductId,
    });
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

    const updateProductId =
      asEntityId(result.product) ?? asEntityId((current as any)?.product) ?? undefined;
    const updateProductLabel =
      typeof result.product === "object"
        ? result.product?.Title || result.product?.Name
        : undefined;

    const recordedUpdate = await recordAdminAudit(strapi, {
      event,
      resourceType: "Product",
      resourceId: updateProductId,
      action: "Update",
      title: "ورژن محصول ویرایش شد",
      message: `ورژن #${result.id} محصول ${updateProductLabel || updateProductId || "نامشخص"} بروزرسانی شد`,
      messageEn: `Product variation #${result.id} updated for product ${updateProductLabel || updateProductId || "unknown"}`,
      severity: "info",
      changes,
      metadata: { variationId: result.id },
    });
    if (recordedUpdate) await markProductEditedByAdmin(strapi, updateProductId);
    scheduleHomeProductsRevalidation("product-variation-update", {
      variationId: result.id,
      productId: updateProductId,
      changedFields: Object.keys(changes),
    });
  },

  async beforeDelete(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;
    const existing = await strapi.db
      .query("api::product-variation.product-variation")
      .findOne({
        where: { id },
        populate: { product: true },
      });

    event.state = {
      ...(event.state || {}),
      deletingProductVariationId: id,
      deletingProductId: asEntityId((existing as any)?.product),
    };
  },

  async afterDelete(event) {
    const id = (event as any)?.state?.deletingProductVariationId;
    if (!id) return;
    const actor = resolveAuditActor(event as any);

    await strapi.entityService.create(
      "api::product-variation-log.product-variation-log" as any,
      {
        data: {
          // Avoid referencing a deleted relation; keep the id in the description instead.
          performed_by: actor.userId,
          PerformedBy: actor.label || undefined,
          IP: actor.ip || undefined,
          UserAgent: actor.userAgent || undefined,
          Action: "Delete" as AuditAction,
          Description: `Product variation deleted (id: ${id})`,
        },
      }
    );

    const deletedProductId = (event as any)?.state?.deletingProductId ?? undefined;
    const recordedDelete = await recordAdminAudit(strapi, {
      event,
      resourceType: "Product",
      resourceId: deletedProductId,
      action: "Delete",
      title: "ورژن محصول حذف شد",
      message: `ورژن ${id} حذف شد`,
      messageEn: `Product variation #${id} deleted`,
      severity: "warning",
      metadata: { variationId: id },
    });
    if (recordedDelete) await markProductEditedByAdmin(strapi, deletedProductId);
    scheduleHomeProductsRevalidation("product-variation-delete", {
      variationId: id,
      productId: deletedProductId,
    });
  },
};
