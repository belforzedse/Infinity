import type { Strapi } from "@strapi/strapi";

import { recordAdminAudit } from "../utils/adminAudit";
import { resolveAuditActor } from "../utils/audit";
import { logAdminEvent, logOrderEvent } from "../utils/eventLogger";
import { asEntityId } from "../utils/lastEdited";

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
    ) {
      continue;
    }

    const beforeVal = previous?.[key];
    const afterVal = current?.[key];
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changes[key] = { from: beforeVal, to: afterVal };
    }
  }

  return changes;
}

function registerOrderLifecycle(strapi: Strapi) {
  strapi.db.lifecycles.subscribe({
    models: ["api::order.order"],

    async afterCreate(event) {
      const { result } = event as any;
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

      // Only logs when the actor is a verified admin (e.g. an admin-created order); customer
      // checkout orders are intentionally not recorded in the admin audit log.
      await recordAdminAudit(strapi as any, {
        event,
        resourceType: "Order",
        resourceId: result.id,
        action: "Create",
        title: "سفارش ایجاد شد",
        message: `سفارش #${result.id} توسط ادمین ایجاد شد`,
        messageEn: `Order #${result.id} created`,
        severity: "success",
        metadata: {
          orderId: result.id,
          orderType: result.Type,
          orderStatus: result.Status,
        },
      });

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
          newStatus: result.Status,
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

        try {
          const activityService = strapi.service("api::user-activity.user-activity") as any;
          const orderWithContract = await strapi.entityService.findOne(
            "api::order.order",
            result.id,
            {
              populate: { contract: true, order_items: true },
            }
          ) as any;
          const totalAmount = orderWithContract?.contract?.Amount
            ? Number(orderWithContract.contract.Amount)
            : orderWithContract?.Total
            ? Number(orderWithContract.Total)
            : 0;

          if (activityService?.logOrderPlaced) {
            await activityService.logOrderPlaced(orderUserId, result.id, totalAmount);
          }
        } catch (activityError) {
          strapi.log.error("Failed to log order placed to user activity", {
            orderId: result.id,
            userId: orderUserId,
            error: (activityError as Error).message,
          });
        }
      }

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
      const where = (event as any)?.params?.where || {};
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

      (event as any).state = { ...((event as any).state || {}), previousOrder: previous };
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

      const changes = diffChanges(previous, current as any);
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

      const orderStatusChange = changes.Status as
        | { from?: unknown; to?: unknown }
        | undefined;
      await recordAdminAudit(strapi as any, {
        event,
        resourceType: "Order",
        resourceId: result.id,
        action: orderStatusChange ? "StatusChange" : "Update",
        title: orderStatusChange ? "وضعیت سفارش تغییر کرد" : "سفارش بروزرسانی شد",
        message: orderStatusChange
          ? `وضعیت سفارش #${result.id} از ${orderStatusChange.from ?? "-"} به ${orderStatusChange.to ?? "-"} تغییر کرد`
          : `سفارش #${result.id} توسط ادمین بروزرسانی شد`,
        messageEn: orderStatusChange
          ? `Order #${result.id} status changed from ${orderStatusChange.from ?? "-"} to ${orderStatusChange.to ?? "-"}`
          : `Order #${result.id} updated`,
        severity: "info",
        changes,
        metadata: { orderId: result.id, status: (current as any)?.Status },
      });

      const orderUserId = typeof (current as any)?.user === "object" && (current as any).user?.id
        ? (current as any).user.id
        : typeof (current as any)?.user === "number"
        ? (current as any).user
        : userId;

      const oldStatus = previous?.Status;
      const newStatus = (current as any)?.Status;

      if (oldStatus !== newStatus && newStatus && orderUserId) {
        await logOrderEvent(strapi as any, {
          category: "StatusChange",
          orderId: result.id,
          orderStatus: newStatus,
          oldStatus,
          newStatus,
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

        try {
          const activityService = strapi.service("api::user-activity.user-activity") as any;
          const normalizedStatus = newStatus?.toLowerCase();

          if (normalizedStatus === "shipment" && activityService?.logOrderShipped) {
            const trackingCode = changes?.ShippingBarcode || changes?.barcode || undefined;
            await activityService.logOrderShipped(orderUserId, result.id, trackingCode);
          } else if (normalizedStatus === "done" && activityService?.logOrderDelivered) {
            await activityService.logOrderDelivered(orderUserId, result.id);
          } else if (normalizedStatus === "cancelled" && activityService?.logOrderCancelled) {
            const reason = changes?.Description || changes?.Note || undefined;
            await activityService.logOrderCancelled(orderUserId, result.id, reason);
          }
        } catch (activityError) {
          strapi.log.error("Failed to log status change to user activity", {
            orderId: result.id,
            userId: orderUserId,
            oldStatus,
            newStatus,
            error: (activityError as Error).message,
          });
        }
      }

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
      const where = (event as any)?.params?.where || {};
      const id = (where && (where.id || where.documentId)) || null;
      if (!id) return;
      (event as any).state = { ...((event as any).state || {}), deletingOrderId: id };
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

      await recordAdminAudit(strapi as any, {
        event,
        resourceType: "Order",
        resourceId: id,
        action: "Delete",
        title: "سفارش حذف شد",
        message: `سفارش #${id} حذف شد`,
        messageEn: `Order #${id} deleted`,
        severity: "warning",
        metadata: { orderId: id },
      });

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
  });
}

function registerContractLifecycle(strapi: Strapi) {
  strapi.db.lifecycles.subscribe({
    models: ["api::contract.contract"],

    async afterCreate(event) {
      const { result } = event as any;
      if (!result?.id) return;
      const actor = resolveAuditActor(event as any);

      await strapi.entityService.create("api::contract-log.contract-log" as any, {
        data: {
          contract: result.id,
          performed_by: actor.userId,
          PerformedBy: actor.label || undefined,
          IP: actor.ip || undefined,
          UserAgent: actor.userAgent || undefined,
          Action: "Create" as AuditAction,
          Description: "Contract created",
        },
      });

      await recordAdminAudit(strapi as any, {
        event,
        resourceType: "Contract",
        resourceId: result.id,
        action: "Create",
        title: "قرارداد ایجاد شد",
        message: `قرارداد #${result.id} ایجاد شد`,
        messageEn: `Contract #${result.id} created`,
        severity: "info",
        metadata: {
          contractId: result.id,
          contractType: result.Type,
          contractStatus: result.Status,
          amount: result.Amount,
        },
      });
    },

    async beforeUpdate(event) {
      const where = (event as any)?.params?.where || {};
      const id = (where && (where.id || where.documentId)) || null;
      if (!id) return;

      const previous = await strapi.entityService.findOne(
        "api::contract.contract",
        id,
        {
          fields: ["Type", "Status", "Amount", "TaxPercent", "Date"],
          populate: { local_user: true, order: true },
        }
      );

      (event as any).state = { ...((event as any).state || {}), previousContract: previous };
    },

    async afterUpdate(event) {
      const { result, state } = event as any;
      if (!result?.id) return;
      const actor = resolveAuditActor(event as any);

      const previous = state?.previousContract || {};
      const current = await strapi.entityService.findOne(
        "api::contract.contract",
        result.id,
        {
          fields: ["Type", "Status", "Amount", "TaxPercent", "Date"],
          populate: { local_user: true, order: true },
        }
      );

      const changes = diffChanges(previous, current as any);
      if (Object.keys(changes).length === 0) return;

      await strapi.entityService.create("api::contract-log.contract-log" as any, {
        data: {
          contract: result.id,
          performed_by: actor.userId,
          PerformedBy: actor.label || undefined,
          IP: actor.ip || undefined,
          UserAgent: actor.userAgent || undefined,
          Action: "Update" as AuditAction,
          Changes: changes,
          Description: "Contract updated",
        },
      });

      await recordAdminAudit(strapi as any, {
        event,
        resourceType: "Contract",
        resourceId: result.id,
        action: "Update",
        title: "قرارداد بروزرسانی شد",
        message: `قرارداد #${result.id} بروزرسانی شد`,
        messageEn: `Contract #${result.id} updated`,
        severity: "info",
        changes,
        metadata: { contractId: result.id },
      });
    },

    async beforeDelete(event) {
      const where = (event as any)?.params?.where || {};
      const id = (where && (where.id || where.documentId)) || null;
      if (!id) return;

      const existing = await strapi.db.query("api::contract.contract").findOne({
        where: { id },
        populate: { order: true },
      });

      (event as any).state = {
        ...((event as any).state || {}),
        deletingContractId: id,
        deletingOrderId: asEntityId((existing as any)?.order),
      };
    },

    async afterDelete(event) {
      const id = (event as any)?.state?.deletingContractId;
      if (!id) return;
      const actor = resolveAuditActor(event as any);

      await strapi.entityService.create("api::contract-log.contract-log" as any, {
        data: {
          contract: id,
          performed_by: actor.userId,
          PerformedBy: actor.label || undefined,
          IP: actor.ip || undefined,
          UserAgent: actor.userAgent || undefined,
          Action: "Delete" as AuditAction,
          Description: "Contract deleted",
        },
      });

      await recordAdminAudit(strapi as any, {
        event,
        resourceType: "Contract",
        resourceId: id,
        action: "Delete",
        title: "قرارداد حذف شد",
        message: `قرارداد #${id} حذف شد`,
        messageEn: `Contract #${id} deleted`,
        severity: "warning",
        metadata: { contractId: id },
      });
    },
  });
}

function registerProductStockLifecycle(strapi: Strapi) {
  strapi.db.lifecycles.subscribe({
    models: ["api::product-stock.product-stock"],

    async afterCreate(event) {
      const { result } = event as any;

      const initialCount = result?.Count ?? 0;
      if (result?.id && initialCount > 0) {
        await strapi.entityService.create(
          "api::product-stock-log.product-stock-log" as any,
          {
            data: {
              product_stock: result.id,
              Count: initialCount,
              Type: "Add",
              Description: "Initial stock",
            },
          }
        );
      }
    },

    async beforeUpdate(event) {
      const where = (event as any)?.params?.where || {};
      const id = (where && (where.id || where.documentId)) || null;
      if (!id) return;

      const existing = await strapi.entityService.findOne(
        "api::product-stock.product-stock",
        id,
        {
          fields: ["Count"],
          populate: { product_variation: true },
        }
      );

      (event as any).state = {
        ...((event as any).state || {}),
        previousCount: (existing as any)?.Count ?? 0,
        productVariationId: asEntityId((existing as any)?.product_variation),
      };
    },

    async afterUpdate(event) {
      const { result, state } = event as any;
      const previous = state?.previousCount;
      const current = result?.Count;

      if (typeof previous !== "number" || typeof current !== "number") return;
      if (!result?.id || previous === current) return;

      const delta = Math.abs(current - previous);
      const type = current > previous ? "Add" : "Minus";

      await strapi.entityService.create(
        "api::product-stock-log.product-stock-log" as any,
        {
          data: {
            product_stock: result.id,
            Count: delta,
            Type: type,
            Description: "Stock updated",
          },
        }
      );

      // Only a verified admin's manual stock change is audited; purchases (stock decrement on
      // payment) and reservation-expiry jobs have no admin actor and are skipped.
      await recordAdminAudit(strapi as any, {
        event,
        resourceType: "Stock",
        resourceId: result.id,
        action: "Adjust",
        title: "موجودی تغییر کرد",
        message: `موجودی ${result.id} از ${previous} به ${current} تغییر یافت`,
        messageEn: `Stock ${result.id} changed from ${previous} to ${current}`,
        severity: "info",
        changes: { Count: { from: previous, to: current } },
        metadata: { previous, current, delta, type },
      });
    },
  });
}

export function registerAppLifecycles(strapi: Strapi) {
  registerOrderLifecycle(strapi);
  registerContractLifecycle(strapi);
  registerProductStockLifecycle(strapi);
}
