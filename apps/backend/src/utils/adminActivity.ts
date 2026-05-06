import type { Strapi } from "@strapi/strapi";
import { logManualActivity } from "./manualAdminActivity";

export type Severity = "info" | "success" | "warning" | "error";

export type AdminActivityParams = {
  resourceType: "Order" | "Product" | "User" | "Contract" | "Discount" | "Stock" | "Other";
  resourceId?: string | number | null;
  action: "Create" | "Update" | "Delete" | "Publish" | "Unpublish" | "Adjust" | "Other";
  title?: string;
  message?: string;
  messageEn?: string;
  severity?: Severity;
  changes?: Record<string, { from?: any; to?: any }>;
  description?: string;
  metadata?: Record<string, unknown>;
  performedBy?: {
    id?: number;
    name?: string | null;
    role?: string | null;
  };
  ip?: string | null;
  userAgent?: string | null;
};

export async function logAdminActivity(
  strapi: Strapi,
  params: AdminActivityParams,
) {
  try {
    // Normalize name to always be a string (never an object)
    let performedByName: string = "System";
    let performedByRole: string | null = null;

    if (params.performedBy?.id) {
      // If we have a user ID, try to fetch the user to get name and role
      try {
        const user = await strapi.entityService.findOne(
          "plugin::users-permissions.user",
          params.performedBy.id,
          { populate: { role: true } }
        ) as any;

        if (user) {
          performedByName =
            user.username ||
            user.email ||
            user.phone ||
            `User ${params.performedBy.id}`;

          // Extract role name if available
          if (user.role) {
            performedByRole =
              typeof user.role === "object" && user.role.name
                ? user.role.name
                : typeof user.role === "string"
                  ? user.role
                  : null;
          }
        } else {
          performedByName = params.performedBy.name
            ? String(params.performedBy.name)
            : `User ${params.performedBy.id}`;
        }
      } catch (userError) {
        // Fallback to provided name or User ID
        performedByName =
          params.performedBy.name && typeof params.performedBy.name === "string"
            ? params.performedBy.name
            : `User ${params.performedBy.id}`;
      }

      // Use provided role if we didn't fetch one
      if (!performedByRole && params.performedBy.role) {
        performedByRole =
          typeof params.performedBy.role === "string"
            ? params.performedBy.role
            : null;
      }
    } else if (params.performedBy?.name) {
      // If we only have a name (no ID), use it directly
      performedByName =
        typeof params.performedBy.name === "string"
          ? params.performedBy.name
          : String(params.performedBy.name);
      performedByRole =
        params.performedBy.role && typeof params.performedBy.role === "string"
          ? params.performedBy.role
          : null;
    }

    await strapi.entityService.create("api::admin-activity.admin-activity" as any, {
      data: {
        ResourceType: params.resourceType,
        Action: params.action,
        ResourceId: params.resourceId ? String(params.resourceId) : undefined,
        Title: params.title,
        Message: params.message,
        MessageEn: params.messageEn,
        Severity: params.severity || "info",
        Changes: params.changes || null,
        Description: params.description,
        Metadata: params.metadata,
        performed_by: params.performedBy?.id || undefined,
        PerformedByName: performedByName,
        PerformedByRole: performedByRole,
        IP: params.ip,
        UserAgent: params.userAgent,
      },
    });
  } catch (error) {
    strapi.log.error("Failed to log admin activity", {
      error: error instanceof Error ? error.message : error,
      payload: params,
    });
  }
}

/**
 * Log order edit action with detailed changes
 */
export async function logAdminOrderEdit(
  strapi: Strapi,
  orderId: number,
  changes: Record<string, { from?: any; to?: any }>,
  adminId: number,
  reason?: string,
  ip?: string | null,
  userAgent?: string | null,
  adminRole?: string,
) {
  const changesKeys = Object.keys(changes || {});
  const hasChanges = changesKeys.length > 0;
  const messageEn = hasChanges
    ? `Order #${orderId} was edited${reason ? `. Reason: ${reason}` : ""}. Changes: ${changesKeys.join(
        ", ",
      )}`
    : `Order #${orderId} was edited${reason ? `. Reason: ${reason}` : ""}`;

  const result = await logAdminActivity(strapi, {
    resourceType: "Order",
    resourceId: orderId,
    action: "Update",
    title: "سفارش ویرایش شد",
    message: hasChanges
      ? `سفارش #${orderId} ویرایش شد${reason ? `. دلیل: ${reason}` : ""}. تغییرات: ${changesKeys.join(", ")}`
      : `سفارش #${orderId} ویرایش شد${reason ? `. دلیل: ${reason}` : ""}`,
    messageEn,
    severity: "info",
    changes,
    description: `Order #${orderId} edited`,
    metadata: { reason, changesCount: changesKeys.length },
    performedBy: { id: adminId },
    ip,
    userAgent,
  });

  await logManualActivity(strapi, {
    resourceType: "Order",
    resourceId: orderId,
    action: "Update",
    title: "سفارش ویرایش شد",
    message: hasChanges
      ? `سفارش #${orderId} ویرایش شد${reason ? `. دلیل: ${reason}` : ""}. تغییرات: ${changesKeys.join(
          ", ",
        )}`
      : `سفارش #${orderId} ویرایش شد${reason ? `. دلیل: ${reason}` : ""}`,
    messageEn,
    severity: "info",
    changes,
    description: `Order #${orderId} edited`,
    metadata: { reason, changesCount: changesKeys.length },
    performedBy: { id: adminId, role: adminRole },
    ip,
    userAgent,
  });

  return result;
}

/**
 * Log order cancellation action
 */
export async function logAdminOrderCancel(
  strapi: Strapi,
  orderId: number,
  reason: string,
  adminId: number,
  ip?: string | null,
  userAgent?: string | null,
  adminRole?: string,
) {
  const result = await logAdminActivity(strapi, {
    resourceType: "Order",
    resourceId: orderId,
    action: "Adjust",
    title: "سفارش لغو شد",
    message: `سفارش #${orderId} توسط ادمین لغو شد. دلیل: ${reason}`,
    messageEn: `Order #${orderId} was cancelled by admin. Reason: ${reason}`,
    severity: "warning",
    description: `Order #${orderId} cancelled`,
    metadata: { reason },
    performedBy: { id: adminId },
    ip,
    userAgent,
  });

  await logManualActivity(strapi, {
    resourceType: "Order",
    resourceId: orderId,
    action: "Adjust",
    title: "سفارش لغو شد",
    message: `سفارش #${orderId} توسط ادمین لغو شد. دلیل: ${reason}`,
    messageEn: `Order #${orderId} was cancelled by admin. Reason: ${reason}`,
    severity: "warning",
    description: `Order #${orderId} cancelled`,
    metadata: { reason },
    performedBy: { id: adminId, role: adminRole },
    ip,
    userAgent,
  });

  return result;
}

/**
 * Log barcode generation/void operation
 */
export async function logAdminBarcodeOperation(
  strapi: Strapi,
  orderId: number,
  action: "generate" | "void",
  adminId: number,
  barcode?: string,
  reason?: string,
  ip?: string | null,
  userAgent?: string | null,
  adminRole?: string,
) {
  const isGenerate = action === "generate";
  const result = await logAdminActivity(strapi, {
    resourceType: "Order",
    resourceId: orderId,
    action: "Adjust",
    title: isGenerate ? "بارکد ارسال ایجاد شد" : "بارکد ارسال لغو شد",
    message: isGenerate
      ? `بارکد ارسال برای سفارش #${orderId} ایجاد شد${barcode ? `. بارکد: ${barcode}` : ""}`
      : `بارکد ارسال برای سفارش #${orderId} لغو شد${reason ? `. دلیل: ${reason}` : ""}`,
    messageEn: isGenerate
      ? `Shipping barcode generated for order #${orderId}${barcode ? `. Barcode: ${barcode}` : ""}`
      : `Shipping barcode voided for order #${orderId}${reason ? `. Reason: ${reason}` : ""}`,
    severity: isGenerate ? "success" : "warning",
    changes: barcode ? { ShippingBarcode: { from: isGenerate ? null : barcode, to: isGenerate ? barcode : null } } : undefined,
    description: isGenerate ? `Barcode generated for order #${orderId}` : `Barcode voided for order #${orderId}`,
    metadata: { barcode, reason, operation: action },
    performedBy: { id: adminId },
    ip,
    userAgent,
  });

  await logManualActivity(strapi, {
    resourceType: "Order",
    resourceId: orderId,
    action: "Adjust",
    title: isGenerate ? "بارکد ارسال ایجاد شد" : "بارکد ارسال لغو شد",
    message: isGenerate
      ? `بارکد ارسال برای سفارش #${orderId} ایجاد شد${barcode ? `. بارکد: ${barcode}` : ""}`
      : `بارکد ارسال برای سفارش #${orderId} لغو شد${reason ? `. دلیل: ${reason}` : ""}`,
    messageEn: isGenerate
      ? `Shipping barcode generated for order #${orderId}${barcode ? `. Barcode: ${barcode}` : ""}`
      : `Shipping barcode voided for order #${orderId}${reason ? `. Reason: ${reason}` : ""}`,
    severity: isGenerate ? "success" : "warning",
    changes: barcode
      ? { ShippingBarcode: { from: isGenerate ? null : barcode, to: isGenerate ? barcode : null } }
      : undefined,
    description: isGenerate
      ? `Barcode generated for order #${orderId}`
      : `Barcode voided for order #${orderId}`,
    metadata: { barcode, reason, operation: action },
    performedBy: { id: adminId, role: adminRole },
    ip,
    userAgent,
  });

  return result;
}

/**
 * Log invoice printing action
 */
export async function logAdminInvoicePrint(
  strapi: Strapi,
  orderId: number,
  adminId: number,
  ip?: string | null,
  userAgent?: string | null,
  adminRole?: string,
) {
  const result = await logAdminActivity(strapi, {
    resourceType: "Order",
    resourceId: orderId,
    action: "Other",
    title: "فاکتور پرینت شد",
    message: `فاکتور سفارش #${orderId} پرینت شد`,
    messageEn: `Invoice for order #${orderId} was printed`,
    severity: "info",
    description: `Invoice printed for order #${orderId}`,
    metadata: {},
    performedBy: { id: adminId },
    ip,
    userAgent,
  });

  await logManualActivity(strapi, {
    resourceType: "Order",
    resourceId: orderId,
    action: "Other",
    title: "فاکتور پرینت شد",
    message: `فاکتور سفارش #${orderId} پرینت شد`,
    messageEn: `Invoice for order #${orderId} was printed`,
    severity: "info",
    description: `Invoice printed for order #${orderId}`,
    metadata: {},
    performedBy: { id: adminId, role: adminRole },
    ip,
    userAgent,
  });

  return result;
}

/**
 * Log product edit action with detailed changes
 */
export async function logAdminProductEdit(
  strapi: Strapi,
  productId: number,
  changes: Record<string, { from?: any; to?: any }>,
  adminId: number,
  ip?: string | null,
  userAgent?: string | null,
  adminRole?: string,
) {
  const changesKeys = Object.keys(changes || {});
  const hasChanges = changesKeys.length > 0;

  const result = await logAdminActivity(strapi, {
    resourceType: "Product",
    resourceId: productId,
    action: "Update",
    title: "محصول ویرایش شد",
    message: hasChanges
      ? `محصول #${productId} ویرایش شد. تغییرات: ${changesKeys.join(", ")}`
      : `محصول #${productId} ویرایش شد`,
    messageEn: hasChanges
      ? `Product #${productId} was edited. Changes: ${changesKeys.join(", ")}`
      : `Product #${productId} was edited`,
    severity: "info",
    changes,
    description: `Product #${productId} edited`,
    metadata: { changesCount: changesKeys.length },
    performedBy: { id: adminId },
    ip,
    userAgent,
  });

  await logManualActivity(strapi, {
    resourceType: "Product",
    resourceId: productId,
    action: "Update",
    title: "محصول ویرایش شد",
    message: hasChanges
      ? `محصول #${productId} ویرایش شد. تغییرات: ${changesKeys.join(", ")}`
      : `محصول #${productId} ویرایش شد`,
    severity: "info",
    changes,
    description: `Product #${productId} edited`,
    metadata: { changesCount: changesKeys.length },
    performedBy: { id: adminId, role: adminRole },
    ip,
    userAgent,
    messageEn: hasChanges
      ? `Product #${productId} was edited. Changes: ${changesKeys.join(", ")}`
      : `Product #${productId} was edited`,
  });

  return result;
}

/**
 * Log user edit action with detailed changes
 */
export async function logAdminUserEdit(
  strapi: Strapi,
  userId: number,
  changes: Record<string, { from?: any; to?: any }>,
  adminId: number,
  ip?: string | null,
  userAgent?: string | null,
  adminRole?: string,
) {
  const changesKeys = Object.keys(changes || {});
  const hasChanges = changesKeys.length > 0;

  const result = await logAdminActivity(strapi, {
    resourceType: "User",
    resourceId: userId,
    action: "Update",
    title: "کاربر ویرایش شد",
    message: hasChanges
      ? `کاربر #${userId} ویرایش شد. تغییرات: ${changesKeys.join(", ")}`
      : `کاربر #${userId} ویرایش شد`,
    messageEn: hasChanges
      ? `User #${userId} was edited. Changes: ${changesKeys.join(", ")}`
      : `User #${userId} was edited`,
    severity: "info",
    changes,
    description: `User #${userId} edited`,
    metadata: { changesCount: changesKeys.length },
    performedBy: { id: adminId },
    ip,
    userAgent,
  });

  await logManualActivity(strapi, {
    resourceType: "User",
    resourceId: userId,
    action: "Update",
    title: "کاربر ویرایش شد",
    message: hasChanges
      ? `کاربر #${userId} ویرایش شد. تغییرات: ${changesKeys.join(", ")}`
      : `کاربر #${userId} ویرایش شد`,
    severity: "info",
    changes,
    description: `User #${userId} edited`,
    metadata: { changesCount: changesKeys.length },
    performedBy: { id: adminId, role: adminRole },
    ip,
    userAgent,
    messageEn: hasChanges
      ? `User #${userId} was edited. Changes: ${changesKeys.join(", ")}`
      : `User #${userId} was edited`,
  });

  return result;
}

