import { factories } from "@strapi/strapi";
import type { Strapi } from "@strapi/strapi";
import { ROLE_NAMES } from "../../../utils/roles";
import { normalizeRoleName } from "../../../utils/roles";

type Severity = "info" | "success" | "warning" | "error";

interface LogActivityParams {
  userId: number;
  activityType: string;
  title: string;
  message: string;
  severity?: Severity;
  resourceType?: string;
  resourceId?: string | number;
  metadata?: Record<string, unknown>;
  icon?: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(amount);

export default factories.createCoreService("api::user-activity.user-activity" as any, ({ strapi }) => ({
  async logActivity(params: LogActivityParams) {
    try {
      return await strapi.entityService.create("api::user-activity.user-activity" as any, {
        data: {
          user: params.userId,
          ActivityType: params.activityType,
          Title: params.title,
          Message: params.message,
          Severity: params.severity || "info",
          ResourceType: params.resourceType,
          ResourceId: params.resourceId ? String(params.resourceId) : undefined,
          Metadata: params.metadata,
          Icon: params.icon,
          IsRead: false,
        },
      });
    } catch (error) {
      strapi.log.error("Failed to create user activity log", {
        params,
        error: (error as Error).message,
      });
      return null;
    }
  },

  async logOrderPlaced(userId: number, orderId: number, amount: number) {
    return this.logActivity({
      userId,
      activityType: "order_placed",
      title: "سفارش جدید ثبت شد",
      message: `سفارش شماره ${orderId} به مبلغ ${formatCurrency(amount)} ریال ثبت شد`,
      severity: "info",
      resourceType: "order",
      resourceId: orderId,
      icon: "📦",
      metadata: { amount },
    });
  },

  async logPaymentSuccess(userId: number, orderId: number, amount: number) {
    return this.logActivity({
      userId,
      activityType: "order_payment_success",
      title: "پرداخت موفق",
      message: `پرداخت سفارش ${orderId} به مبلغ ${formatCurrency(amount)} ریال با موفقیت انجام شد`,
      severity: "success",
      resourceType: "order",
      resourceId: orderId,
      icon: "✅",
      metadata: { amount },
    });
  },

  async logPaymentFailed(userId: number, orderId: number, reason: string) {
    return this.logActivity({
      userId,
      activityType: "order_payment_failed",
      title: "پرداخت ناموفق",
      message: `پرداخت سفارش ${orderId} ناموفق بود. دلیل: ${reason}`,
      severity: "error",
      resourceType: "order",
      resourceId: orderId,
      icon: "❌",
      metadata: { reason },
    });
  },

  async logOrderShipped(userId: number, orderId: number, trackingCode?: string) {
    return this.logActivity({
      userId,
      activityType: "order_shipped",
      title: "سفارش ارسال شد",
      message: trackingCode
        ? `سفارش ${orderId} ارسال شد. کد رهگیری: ${trackingCode}`
        : `سفارش ${orderId} ارسال شد`,
      severity: "success",
      resourceType: "order",
      resourceId: orderId,
      icon: "🚚",
      metadata: { trackingCode },
    });
  },

  async logOrderCancelled(userId: number, orderId: number, reason?: string) {
    return this.logActivity({
      userId,
      activityType: "order_cancelled",
      title: "سفارش لغو شد",
      message: reason ? `سفارش ${orderId} لغو شد. دلیل: ${reason}` : `سفارش ${orderId} لغو شد`,
      severity: "warning",
      resourceType: "order",
      resourceId: orderId,
      icon: "⚠️",
      metadata: { reason },
    });
  },

  async logOrderDelivered(userId: number, orderId: number) {
    return this.logActivity({
      userId,
      activityType: "order_delivered",
      title: "سفارش تحویل داده شد",
      message: `سفارش ${orderId} با موفقیت تحویل داده شد`,
      severity: "success",
      resourceType: "order",
      resourceId: orderId,
      icon: "🎉",
    });
  },

  async logWalletTransaction(
    userId: number,
    type: "Add" | "Minus",
    amount: number,
    cause: string,
  ) {
    const isCredit = type === "Add";
    return this.logActivity({
      userId,
      activityType: isCredit ? "wallet_credited" : "wallet_debited",
      title: isCredit ? "افزایش موجودی کیف پول" : "کاهش موجودی کیف پول",
      message: `${formatCurrency(amount)} ریال ${isCredit ? "به" : "از"} کیف پول شما ${
        isCredit ? "اضافه" : "کسر"
      } شد. دلیل: ${cause}`,
      severity: isCredit ? "success" : "info",
      resourceType: "wallet",
      metadata: { amount, type, cause },
      icon: isCredit ? "💰" : "💸",
    });
  },

  async logCartActivity(params: {
    userId: number;
    type: "cart_item_added" | "cart_item_removed" | "cart_cleared";
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.logActivity({
      userId: params.userId,
      activityType: params.type,
      title: params.title,
      message: params.message,
      severity: "info",
      resourceType: "cart",
      metadata: params.metadata,
      icon: "🛒",
    });
  },

  async markAsRead(activityIds: number[]) {
    if (activityIds.length === 0) return [];

    return Promise.all(
      activityIds.map((id) =>
        strapi.entityService.update("api::user-activity.user-activity" as any, id, {
          data: { IsRead: true } as any,
        }),
      ),
    );
  },

  async markAllAsRead(userId: number) {
    const activities = await strapi.db.query("api::user-activity.user-activity" as any).findMany({
      where: { user: { id: userId }, IsRead: false },
      select: ["id"],
    });
    return this.markAsRead(activities.map((a) => a.id));
  },

  async findUserActivitiesByUserId(
    requestedUserId: number,
    authenticatedUserId: number,
    authenticatedUserRole: string | null,
    options?: { page?: number; pageSize?: number }
  ) {
    const roleName = normalizeRoleName(authenticatedUserRole);

    // Allow users to access their own activities, or superadmins to access any user's activities
    if (requestedUserId !== authenticatedUserId && roleName !== ROLE_NAMES.SUPERADMIN) {
      throw new Error("You can only view your own activities");
    }

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;

    const activities = await strapi.entityService.findMany("api::user-activity.user-activity" as any, {
      filters: {
        user: { id: requestedUserId },
      },
      sort: { createdAt: "desc" },
      populate: ["user"],
      pagination: { page, pageSize },
    });

    return activities;
  },
})) as unknown as {
  logActivity: (params: LogActivityParams) => Promise<any>;
  logOrderPlaced: (userId: number, orderId: number, amount: number) => Promise<any>;
  logPaymentSuccess: (userId: number, orderId: number, amount: number) => Promise<any>;
  logPaymentFailed: (userId: number, orderId: number, reason: string) => Promise<any>;
  logOrderShipped: (userId: number, orderId: number, trackingCode?: string) => Promise<any>;
  logOrderDelivered: (userId: number, orderId: number) => Promise<any>;
  logOrderCancelled: (userId: number, orderId: number, reason?: string) => Promise<any>;
  logWalletTransaction: (
    userId: number,
    type: "Add" | "Minus",
    amount: number,
    cause: string,
  ) => Promise<any>;
  logCartActivity: (params: {
    userId: number;
    type: "cart_item_added" | "cart_item_removed" | "cart_cleared";
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) => Promise<any>;
  markAsRead: (activityIds: number[]) => Promise<any>;
  markAllAsRead: (userId: number) => Promise<any>;
  findUserActivitiesByUserId: (
    requestedUserId: number,
    authenticatedUserId: number,
    authenticatedUserRole: string | null,
    options?: { page?: number; pageSize?: number }
  ) => Promise<any>;
};

