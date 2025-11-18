import { resolveAuditActor } from "../../../../utils/audit";
import { logAdminActivity } from "../../../../utils/adminActivity";

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
    const userId = actor.userId || (event as any)?.state?.user?.id;

    await strapi.entityService.create("api::order-log.order-log" as any, {
      data: {
        order: result.id,
        performed_by: userId || null,
        Action: "Create" as AuditAction,
        Description: "Order created",
      },
    });

    // Log to admin activity
    await logAdminActivity(strapi as any, {
      resourceType: "Order",
      resourceId: result.id,
      action: "Create",
      description: "سفارش ایجاد شد",
      metadata: {
        orderId: result.id,
        orderType: result.Type,
        orderStatus: result.Status,
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
        populate: {
          user: true,
          contract: {
            populate: { contract_transactions: true },
          },
          shipping: true,
        },
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

    const actor = resolveAuditActor(event as any);
    const userId = actor.userId || (event as any)?.state?.user?.id;

    await strapi.entityService.create("api::order-log.order-log" as any, {
      data: {
        order: result.id,
        performed_by: userId || null,
        Action: "Update" as AuditAction,
        Changes: changes,
        Description: "Order updated",
      },
    });

    // Log to admin activity
    await logAdminActivity(strapi as any, {
      resourceType: "Order",
      resourceId: result.id,
      action: "Update",
      description: "سفارش بروزرسانی شد",
      metadata: {
        orderId: result.id,
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
    event.state = { ...(event.state || {}), deletingOrderId: id };
  },

  async afterDelete(event) {
    const id = (event as any)?.state?.deletingOrderId;
    if (!id) return;

    const actor = resolveAuditActor(event as any);
    const userId = actor.userId || (event as any)?.state?.user?.id;

    await strapi.entityService.create("api::order-log.order-log" as any, {
      data: {
        order: id,
        performed_by: userId || null,
        Action: "Delete" as AuditAction,
        Description: "Order deleted",
      },
    });

    // Log to admin activity
    await logAdminActivity(strapi as any, {
      resourceType: "Order",
      resourceId: id,
      action: "Delete",
      description: "سفارش حذف شد",
      metadata: {
        orderId: id,
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
