import { resolveAuditActor } from "../../../../utils/audit";
import { logAdminActivity } from "../../../../utils/adminActivity";
import { logOrderEvent, logAdminEvent } from "../../../../utils/eventLogger";

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

    // Log human-readable event for user
    // Extract userId: result.user can be an object {id: number} or just a number
    const orderUserId = typeof result.user === "object" && result.user?.id
      ? result.user.id
      : typeof result.user === "number"
      ? result.user
      : userId;

    if (orderUserId) {
      await logOrderEvent(strapi as any, {
        category: "Action",
        orderId: result.id,
        orderStatus: result.Status,
        newStatus: result.Status, // Required for message generator "Action" category check
        userId: orderUserId,
        performedBy: {
          id: actor.userId || undefined,
          name: actor.label || undefined,
        },
        audience: "user",
        metadata: {
          orderType: result.Type,
        },
      });
    }

    // Log event for admin if created by admin
    if (actor.userId && actor.label) {
      await logAdminEvent(strapi as any, {
        category: "Action",
        resourceType: "Order",
        resourceId: result.id,
        action: "Create",
        adminName: actor.label,
        adminId: actor.userId,
        audience: "admin",
        metadata: {
          orderType: result.Type,
          orderStatus: result.Status,
        },
      });
    }
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

    // Log human-readable events for status changes
    // Extract userId: current.user can be an object {id: number} or just a number
    const orderUserId = typeof current?.user === "object" && current.user?.id
      ? current.user.id
      : typeof current?.user === "number"
      ? current.user
      : userId;

    const oldStatus = previous?.Status;
    const newStatus = current?.Status;

    // If status changed, log user-facing event
    if (oldStatus !== newStatus && newStatus && orderUserId) {
      await logOrderEvent(strapi as any, {
        category: "StatusChange",
        orderId: result.id,
        orderStatus: newStatus,
        oldStatus: oldStatus,
        newStatus: newStatus,
        userId: orderUserId,
        performedBy: {
          id: actor.userId || undefined,
          name: actor.label || undefined,
        },
        audience: "user",
        metadata: {
          changes,
        },
      });
    }

    // Log admin event if updated by admin
    if (actor.userId && actor.label && Object.keys(changes).length > 0) {
      await logAdminEvent(strapi as any, {
        category: "Action",
        resourceType: "Order",
        resourceId: result.id,
        action: "Update",
        adminName: actor.label,
        adminId: actor.userId,
        audience: "admin",
        metadata: {
          changes,
          oldStatus,
          newStatus,
        },
      });
    }
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

    // Log admin event for deletion
    if (actor.userId && actor.label) {
      await logAdminEvent(strapi as any, {
        category: "Action",
        resourceType: "Order",
        resourceId: id,
        action: "Delete",
        adminName: actor.label,
        adminId: actor.userId,
        audience: "admin",
        metadata: {
          orderId: id,
        },
      });
    }
  },
};
