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

    await strapi.entityService.create(
      "api::product-variation-log.product-variation-log" as any,
      {
        data: {
          product_variation: result.id,
          Action: "Create" as AuditAction,
          Description: "Product variation created",
        },
      }
    );
  },

  async beforeUpdate(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;

    const previous = await strapi.entityService.findOne(
      "api::product-variation.product-variation",
      id,
      {
        fields: ["IsPublished", "SKU", "Price"],
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

    const previous = state?.previousProductVariation || {};
    const current = await strapi.entityService.findOne(
      "api::product-variation.product-variation",
      result.id,
      {
        fields: ["IsPublished", "SKU", "Price"],
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
          Action: "Update" as AuditAction,
          Changes: changes,
          Description: "Product variation updated",
        },
      }
    );
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

    await strapi.entityService.create(
      "api::product-variation-log.product-variation-log" as any,
      {
        data: {
          product_variation: id,
          Action: "Delete" as AuditAction,
          Description: "Product variation deleted",
        },
      }
    );
  },
};
