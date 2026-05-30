import type { Strapi } from "@strapi/strapi";

import { logAdminActivity } from "../utils/adminActivity";
import { resolveAuditActor } from "../utils/audit";
import { logAdminEvent, logOrderEvent } from "../utils/eventLogger";
import { asEntityId } from "../utils/lastEdited";
import { logManualActivity } from "../utils/manualAdminActivity";

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

async function touchProductLastEdited(strapi: Strapi, productRef: any) {
  const productId = asEntityId(productRef);
  if (!productId) return;

  try {
    await strapi.db.connection("products").where({ id: productId }).update({
      updated_at: new Date(),
    });
  } catch (error: any) {
    strapi.log.warn("[LastEdited] Failed to touch product timestamp", {
      productId,
      error: error?.message || error,
    });
  }
}

async function touchOrderLastEdited(strapi: Strapi, orderRef: any) {
  const orderId = asEntityId(orderRef);
  if (!orderId) return;

  try {
    await strapi.db.connection("orders").where({ id: orderId }).update({
      updated_at: new Date(),
    });
  } catch (error: any) {
    strapi.log.warn("[LastEdited] Failed to touch order timestamp", {
      orderId,
      error: error?.message || error,
    });
  }
}

async function touchProductByVariation(strapi: Strapi, variationRef: any) {
  const variationId = asEntityId(variationRef);
  if (!variationId) return;

  const variation = await strapi.db
    .query("api::product-variation.product-variation")
    .findOne({
      where: { id: variationId },
      populate: { product: true },
    });

  await touchProductLastEdited(strapi, (variation as any)?.product);
}

async function touchOrderByContract(strapi: Strapi, contractRef: any) {
  const contractId = asEntityId(contractRef);
  if (!contractId) return;

  const contract = await strapi.db.query("api::contract.contract").findOne({
    where: { id: contractId },
    populate: { order: true },
  });

  await touchOrderLastEdited(strapi, (contract as any)?.order);
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

      if (actor.userId) {
        await logManualActivity(strapi as any, {
          resourceType: "Order",
          resourceId: result.id,
          action: "Create",
          title: "سفارش ایجاد شد",
          message: `سفارش #${result.id} توسط ادمین ایجاد شد`,
          messageEn: `Order #${result.id} created`,
          severity: "success",
          metadata: { orderId: result.id, status: result.Status },
          performedBy: { id: actor.userId },
          ip: actor.ip,
          userAgent: actor.userAgent,
        });
      }

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

      if (actor.userId) {
        await logManualActivity(strapi as any, {
          resourceType: "Order",
          resourceId: result.id,
          action: "Update",
          title: "سفارش بروزرسانی شد",
          message: `سفارش #${result.id} توسط ادمین بروزرسانی شد`,
          messageEn: `Order #${result.id} updated`,
          severity: "info",
          metadata: { changes, status: (current as any)?.Status },
          performedBy: { id: actor.userId },
          ip: actor.ip,
          userAgent: actor.userAgent,
        });
      }

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

      await logAdminActivity(strapi as any, {
        resourceType: "Contract",
        resourceId: result.id,
        action: "Create",
        description: "قرارداد ایجاد شد",
        metadata: {
          contractId: result.id,
          contractType: result.Type,
          contractStatus: result.Status,
          amount: result.Amount,
        },
        performedBy: {
          id: actor.userId || undefined,
          name: actor.label || undefined,
          role: null,
        },
        ip: actor.ip,
        userAgent: actor.userAgent,
      });

      await touchOrderByContract(strapi, result.id);
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

      await logAdminActivity(strapi as any, {
        resourceType: "Contract",
        resourceId: result.id,
        action: "Update",
        description: "قرارداد بروزرسانی شد",
        metadata: {
          contractId: result.id,
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

      await touchOrderByContract(strapi, result.id);
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

      await logAdminActivity(strapi as any, {
        resourceType: "Contract",
        resourceId: id,
        action: "Delete",
        description: "قرارداد حذف شد",
        metadata: {
          contractId: id,
        },
        performedBy: {
          id: actor.userId || undefined,
          name: actor.label || undefined,
          role: null,
        },
        ip: actor.ip,
        userAgent: actor.userAgent,
      });

      await touchOrderLastEdited(strapi, (event as any)?.state?.deletingOrderId);
    },
  });
}

function registerProductStockLifecycle(strapi: Strapi) {
  strapi.db.lifecycles.subscribe({
    models: ["api::product-stock.product-stock"],

    async afterCreate(event) {
      const { result } = event as any;
      await touchProductByVariation(strapi, result?.product_variation);

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

      const actor = resolveAuditActor(event as any);
      if (actor.userId) {
        await logManualActivity(strapi as any, {
          resourceType: "Stock",
          resourceId: result.id,
          action: "Update",
          title: "موجودی تغییر کرد",
          message: `موجودی ${result.id} از ${previous} به ${current} تغییر یافت`,
          messageEn: `Stock ${result.id} changed from ${previous} to ${current}`,
          severity: "info",
          metadata: { previous, current, delta },
          performedBy: { id: actor.userId },
          ip: actor.ip,
          userAgent: actor.userAgent,
        });
      }

      await touchProductByVariation(strapi, state?.productVariationId || result?.product_variation);
    },

    async beforeDelete(event) {
      const where = (event as any)?.params?.where || {};
      const id = (where && (where.id || where.documentId)) || null;
      if (!id) return;

      const existing = await strapi.entityService.findOne(
        "api::product-stock.product-stock",
        id,
        {
          populate: { product_variation: true },
        }
      );

      (event as any).state = {
        ...((event as any).state || {}),
        deletingProductVariationId: asEntityId((existing as any)?.product_variation),
      };
    },

    async afterDelete(event) {
      await touchProductByVariation(strapi, (event as any)?.state?.deletingProductVariationId);
    },
  });
}

function registerOrderItemLifecycle(strapi: Strapi) {
  strapi.db.lifecycles.subscribe({
    models: ["api::order-item.order-item"],

    async afterCreate(event) {
      const { result, params } = event as any;
      await touchOrderLastEdited(strapi, result?.order || params?.data?.order);
    },

    async afterUpdate(event) {
      const { result, params } = event as any;
      await touchOrderLastEdited(strapi, result?.order || params?.data?.order);
    },

    async beforeDelete(event) {
      const where = (event as any)?.params?.where || {};
      const id = (where && (where.id || where.documentId)) || null;
      if (!id) return;

      const existing = await strapi.db.query("api::order-item.order-item").findOne({
        where: { id },
        populate: { order: true },
      });

      (event as any).state = {
        ...((event as any).state || {}),
        deletingOrderId: asEntityId((existing as any)?.order),
      };
    },

    async afterDelete(event) {
      await touchOrderLastEdited(strapi, (event as any)?.state?.deletingOrderId);
    },
  });
}

export function registerAppLifecycles(strapi: Strapi) {
  registerOrderLifecycle(strapi);
  registerContractLifecycle(strapi);
  registerProductStockLifecycle(strapi);
  registerOrderItemLifecycle(strapi);
}
