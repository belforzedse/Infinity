import { resolveAuditActor } from "../../../../utils/audit";
import {
  recordAdminAudit,
  markProductEditedByAdmin,
  type AdminAuditAction,
} from "../../../../utils/adminAudit";
import { generateUniqueProductSlug } from "../../../../utils/productSlug";

type AuditAction = "Create" | "Update" | "Delete";
const PRODUCT_COUNTER_ONLY_FIELDS = new Set(["SeenCount"]);
const UPDATE_METADATA_FIELDS = new Set([
  "updatedAt",
  "updated_at",
  "updatedBy",
  "updated_by",
  "publishedAt",
  "published_at",
]);

function isCounterOnlyProductUpdate(data: Record<string, unknown> | undefined): boolean {
  if (!data || typeof data !== "object") return false;
  const fields = Object.keys(data).filter((field) => !UPDATE_METADATA_FIELDS.has(field));
  if (fields.length === 0) return false;
  return fields.every((field) => PRODUCT_COUNTER_ONLY_FIELDS.has(field));
}

/**
 * Call Next.js revalidation API to invalidate cache for product pages
 * Supports multiple frontend URLs (staging, production)
 */
async function triggerProductRevalidation(slug: string) {
  // Hardcoded for now (TODO: move to environment variables)
  const frontendUrls = [
    "https://staging.infinitycolor.org",
    "https://infinitycolor.co",
  ];

  // Get revalidation secret from environment variable
  const revalidationSecret = process.env.REVALIDATION_SECRET;
  if (!revalidationSecret) {
    strapi.log.warn("[Product Lifecycle] REVALIDATION_SECRET not set, skipping revalidation");
    return;
  }

  // Trigger revalidation for all configured frontend URLs
  const revalidationPromises = frontendUrls.map(async (frontendUrl) => {
    try {
      const url = `${frontendUrl.replace(/\/$/, "")}/api/revalidate`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${revalidationSecret}`,
        },
        body: JSON.stringify({
          path: slug, // Product slug
          type: "product",
        }),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        strapi.log.error(`[Product Lifecycle] Revalidation failed for ${frontendUrl}: ${response.status} ${errorText}`);
        return { url: frontendUrl, success: false };
      }

      const result = await response.json();
      strapi.log.info(`[Product Lifecycle] Revalidation triggered for ${frontendUrl}/pdp/${slug}`, result);
      return { url: frontendUrl, success: true };
    } catch (error: any) {
      if (error.name === "AbortError") {
        strapi.log.warn(`[Product Lifecycle] Revalidation timeout for ${frontendUrl}`);
      } else {
        strapi.log.error(`[Product Lifecycle] Error triggering revalidation for ${frontendUrl}:`, error);
      }
      return { url: frontendUrl, success: false };
    }
  });

  const results = await Promise.allSettled(revalidationPromises);
  const successful = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;
  strapi.log.info(`[Product Lifecycle] Revalidation completed: ${successful}/${frontendUrls.length} successful`);
}

/**
 * Compute the field-level differences between two record snapshots.
 *
 * @param previous - The prior state of the record (field name → value).
 * @param current - The new state of the record (field name → value).
 * @returns An object mapping each changed field name to an object with `from` (previous value) and `to` (current value). The fields `"updatedAt"`, `"createdAt"`, `"id"`, and `"documentId"` are ignored.
 */
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
  async beforeCreate(event) {
    const { data } = event.params;

    // Seed the dedicated admin-edit timestamp at creation so it is never NULL (creation is the
    // baseline "last edited" moment). Real admin edits update it later; non-admin events never do.
    if (!data.LastEditedByAdminAt) {
      data.LastEditedByAdminAt = new Date();
    }

    // Auto-generate slug from Title if not provided
    // This must run BEFORE Strapi's uid field auto-generation to preserve Persian characters
    if (!data.Slug && data.Title) {
      try {
        data.Slug = await generateUniqueProductSlug(strapi, data.Title);
        strapi.log.info(`[Product Lifecycle] Auto-generated Persian slug for new product: "${data.Title}" -> "${data.Slug}"`);
      } catch (error) {
        strapi.log.error("[Product Lifecycle] Failed to generate product slug:", error);
        // Fallback to timestamp-based slug
        data.Slug = `product-${Date.now()}`;
      }
    } else if (data.Slug) {
      strapi.log.info(`[Product Lifecycle] Using provided slug: "${data.Slug}"`);
    }
  },

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

    // LastEditedByAdminAt is already seeded in beforeCreate; just record the audit entry (gated).
    await recordAdminAudit(strapi as any, {
      event,
      resourceType: "Product",
      resourceId: result.id,
      action: "Create",
      title: "محصول ایجاد شد",
      message: `محصول «${result.Title}» ایجاد شد`,
      messageEn: `Product #${result.id} created`,
      severity: "success",
      metadata: { productId: result.id, title: result.Title },
    });

    // Trigger revalidation if product has a slug and is active
    if (result.Slug && result.Status === "Active") {
      await triggerProductRevalidation(result.Slug);
    }
  },

  async beforeUpdate(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;

    const { data } = event.params;
    if (isCounterOnlyProductUpdate(data)) {
      event.state = { ...(event.state || {}), counterOnlyUpdate: true };
      return;
    }

    const previous = await strapi.entityService.findOne(
      "api::product.product",
      id,
      {
        // NOTE: AverageRating/RatingCount are intentionally excluded — they are recomputed by
        // customer reviews (a non-admin event) and must never count as an admin edit.
        fields: [
          "Title",
          "Slug",
          "Status",
          "Description",
          "CleaningTips",
          "ReturnConditions",
          "removedAt",
        ],
        populate: { product_main_category: true, product_tags: true },
      }
    );

    // Auto-generate slug if product doesn't have one and has a title
    // Also regenerate if Title changed and we want to update the slug
    if (!previous?.Slug && !data.Slug && (data.Title || previous?.Title)) {
      try {
        const title = data.Title || previous?.Title;
        data.Slug = await generateUniqueProductSlug(strapi, title, id as number);
        strapi.log.info(`[Product Lifecycle] Auto-generated Persian slug for product ${id}: "${title}" -> "${data.Slug}"`);
      } catch (error) {
        strapi.log.error(`[Product Lifecycle] Failed to generate slug for product ${id}:`, error);
      }
    } else if (data.Slug) {
      strapi.log.info(`[Product Lifecycle] Using provided slug for product ${id}: "${data.Slug}"`);
    }

    event.state = { ...(event.state || {}), previousProduct: previous };
  },

  async afterUpdate(event) {
    const { result, state } = event as any;
    if (!result?.id) return;
    if (state?.counterOnlyUpdate || isCounterOnlyProductUpdate((event as any)?.params?.data)) {
      return;
    }
    const actor = resolveAuditActor(event as any);

    const previous = state?.previousProduct || {};
    const current = await strapi.entityService.findOne(
      "api::product.product",
      result.id,
      {
        // NOTE: AverageRating/RatingCount are intentionally excluded — they are recomputed by
        // customer reviews (a non-admin event) and must never count as an admin edit.
        fields: [
          "Title",
          "Slug",
          "Status",
          "Description",
          "CleaningTips",
          "ReturnConditions",
          "removedAt",
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

    // Record a single gated admin-audit entry. A soft-delete (removedAt set) or restore takes
    // priority, then a Status transition (Publish/Unpublish); otherwise it is a generic edit.
    const removedChange = changes.removedAt as { from?: unknown; to?: unknown } | undefined;
    const statusChange = changes.Status as { from?: unknown; to?: unknown } | undefined;
    let action: AdminAuditAction = "Update";
    let title = "محصول ویرایش شد";
    let messageEn = `Product #${result.id} was edited`;
    let isSoftDelete = false;
    if (removedChange && removedChange.to) {
      action = "Delete";
      title = "محصول حذف شد";
      messageEn = `Product #${result.id} was deleted`;
      isSoftDelete = true;
    } else if (removedChange && !removedChange.to) {
      title = "محصول بازیابی شد";
      messageEn = `Product #${result.id} was restored`;
    } else if (statusChange) {
      if (statusChange.to === "Active") {
        action = "Publish";
        title = "محصول منتشر شد";
        messageEn = `Product #${result.id} was published`;
      } else if (statusChange.to === "InActive") {
        action = "Unpublish";
        title = "محصول از انتشار خارج شد";
        messageEn = `Product #${result.id} was unpublished`;
      }
    }
    const changedFields = Object.keys(changes);
    const recordedUpdate = await recordAdminAudit(strapi as any, {
      event,
      resourceType: "Product",
      resourceId: result.id,
      action,
      title,
      message:
        action === "Update"
          ? `محصول #${result.id} ویرایش شد. تغییرات: ${changedFields.join("، ")}`
          : title,
      messageEn,
      severity: isSoftDelete ? "warning" : "info",
      changes,
      metadata: { productId: result.id, changedFields, isSoftDelete },
    });
    if (recordedUpdate) await markProductEditedByAdmin(strapi as any, result.id);

    // Trigger revalidation if product has a slug and is active
    // Get the current slug (may have changed in the update)
    // Use result.Slug first (updated value), then fallback to current.Slug
    const currentSlug = result.Slug || current?.Slug;
    const currentStatus = result.Status || current?.Status;
    if (currentSlug && currentStatus === "Active") {
      await triggerProductRevalidation(currentSlug);
    }
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

    await recordAdminAudit(strapi as any, {
      event,
      resourceType: "Product",
      resourceId: id,
      action: "Delete",
      title: "محصول حذف شد",
      message: `محصول #${id} برای همیشه حذف شد`,
      messageEn: `Product #${id} was permanently deleted`,
      severity: "warning",
      metadata: { productId: id, isSoftDelete: false },
    });
  },
};
