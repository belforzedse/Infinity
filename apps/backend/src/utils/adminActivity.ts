import type { Strapi } from "@strapi/strapi";

import { recordAdminAudit } from "./adminAudit";

/**
 * HTTP-handler helpers for the admin audit log. Each delegates to the single gated writer
 * `recordAdminAudit` with an explicit `actor`, so an entry is recorded only when the caller is a
 * verified admin. The legacy `logAdminActivity` (which wrote the now-retired `admin_activities`
 * table unconditionally) has been removed — `recordAdminAudit` is the only audit writer.
 */

/**
 * Log order edit action with detailed changes.
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

  return recordAdminAudit(strapi, {
    resourceType: "Order",
    resourceId: orderId,
    action: "Update",
    title: "سفارش ویرایش شد",
    message: hasChanges
      ? `سفارش #${orderId} ویرایش شد${reason ? `. دلیل: ${reason}` : ""}. تغییرات: ${changesKeys.join("، ")}`
      : `سفارش #${orderId} ویرایش شد${reason ? `. دلیل: ${reason}` : ""}`,
    messageEn: hasChanges
      ? `Order #${orderId} was edited${reason ? `. Reason: ${reason}` : ""}. Changes: ${changesKeys.join(", ")}`
      : `Order #${orderId} was edited${reason ? `. Reason: ${reason}` : ""}`,
    severity: "info",
    changes,
    description: `Order #${orderId} edited`,
    metadata: { reason, changesCount: changesKeys.length },
    actor: { id: adminId, role: adminRole },
    ip,
    userAgent,
  });
}

/**
 * Log order cancellation + refund action.
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
  return recordAdminAudit(strapi, {
    resourceType: "Order",
    resourceId: orderId,
    action: "Refund",
    title: "سفارش لغو و بازپرداخت شد",
    message: `سفارش #${orderId} توسط ادمین لغو شد. دلیل: ${reason}`,
    messageEn: `Order #${orderId} was cancelled/refunded by admin. Reason: ${reason}`,
    severity: "warning",
    description: `Order #${orderId} cancelled`,
    metadata: { reason },
    actor: { id: adminId, role: adminRole },
    ip,
    userAgent,
  });
}

/**
 * Log shipping barcode generation/void operation.
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

  return recordAdminAudit(strapi, {
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
      ? {
          ShippingBarcode: {
            from: isGenerate ? null : barcode,
            to: isGenerate ? barcode : null,
          },
        }
      : undefined,
    description: isGenerate
      ? `Barcode generated for order #${orderId}`
      : `Barcode voided for order #${orderId}`,
    metadata: { barcode, reason, operation: action },
    actor: { id: adminId, role: adminRole },
    ip,
    userAgent,
  });
}

/**
 * Log invoice printing action.
 */
export async function logAdminInvoicePrint(
  strapi: Strapi,
  orderId: number,
  adminId: number,
  ip?: string | null,
  userAgent?: string | null,
  adminRole?: string,
) {
  return recordAdminAudit(strapi, {
    resourceType: "Order",
    resourceId: orderId,
    action: "Other",
    title: "فاکتور پرینت شد",
    message: `فاکتور سفارش #${orderId} پرینت شد`,
    messageEn: `Invoice for order #${orderId} was printed`,
    severity: "info",
    description: `Invoice printed for order #${orderId}`,
    metadata: {},
    actor: { id: adminId, role: adminRole },
    ip,
    userAgent,
  });
}
