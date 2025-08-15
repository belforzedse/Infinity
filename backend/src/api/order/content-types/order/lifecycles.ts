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

    await strapi.entityService.create("api::order-log.order-log" as any, {
      data: {
        order: result.id,
        Action: "Create" as AuditAction,
        Description: "Order created",
      },
    });
  },

  async beforeUpdate(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;

    const previous = await strapi.entityService.findOne(
      "api::order.order",
      id,
      {
        fields: [
          "Status",
          "Date",
          "Type",
          "ShippingCost",
          "Description",
          "Note",
        ],
        populate: { user: true, contract: true, shipping: true },
      }
    );

    event.state = { ...(event.state || {}), previousOrder: previous };
  },

  async afterUpdate(event) {
    const { result, state } = event as any;
    if (!result?.id) return;

    const previous = state?.previousOrder || {};
    const current = await strapi.entityService.findOne(
      "api::order.order",
      result.id,
      {
        fields: [
          "Status",
          "Date",
          "Type",
          "ShippingCost",
          "Description",
          "Note",
        ],
        populate: { user: true, contract: true, shipping: true },
      }
    );

    const changes = diffChanges(previous, current);
    if (Object.keys(changes).length === 0) return;

    await strapi.entityService.create("api::order-log.order-log" as any, {
      data: {
        order: result.id,
        Action: "Update" as AuditAction,
        Changes: changes,
        Description: "Order updated",
      },
    });
  },

  async beforeDelete(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;
    event.state = { ...(event.state || {}), deletingOrderId: id };
  },

  async afterDelete(event) {
    const id = (event as any)?.state?.deletingOrderId;
    if (!id) return;

    await strapi.entityService.create("api::order-log.order-log" as any, {
      data: {
        order: id,
        Action: "Delete" as AuditAction,
        Description: "Order deleted",
      },
    });
  },
};
