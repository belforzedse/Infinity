/**
 * Event Message Templates
 *
 * Human-readable Persian message templates for event logging.
 * These templates support placeholders for dynamic values.
 */

export type EventType = "Order" | "Payment" | "User" | "Product" | "Cart" | "Wallet" | "Shipping" | "Admin" | "System";
export type EventCategory = "StatusChange" | "Action" | "Notification" | "Error" | "Info";
export type Severity = "info" | "success" | "warning" | "error";
export type Audience = "user" | "admin" | "superadmin" | "all";

export interface EventContext {
  orderId?: string | number;
  orderStatus?: string;
  oldStatus?: string;
  newStatus?: string;
  amount?: number;
  productName?: string;
  adminName?: string;
  userName?: string;
  paymentGateway?: string;
  errorMessage?: string;
  resourceId?: string | number;
  [key: string]: unknown;
}

export interface EventMessageResult {
  message: string;
  messageEn?: string;
  severity: Severity;
  category: EventCategory;
  audience: Audience;
}

/**
 * Replace placeholders in template strings
 */
function replacePlaceholders(template: string, context: EventContext): string {
  let result = template;

  // Replace ${variable} placeholders
  result = result.replace(/\$\{(\w+)\}/g, (match, key) => {
    const value = context[key];
    if (value === undefined || value === null) {
      return match; // Keep placeholder if value not found
    }
    return String(value);
  });

  return result;
}

/**
 * Format currency amounts (IRR to Toman for display)
 */
function formatAmount(amount?: number): string {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "مبلغ نامشخص";
  }
  // Convert IRR to Toman (divide by 10)
  const toman = Math.floor(amount / 10);
  // Format with thousand separators
  return toman.toLocaleString("fa-IR") + " تومان";
}

/**
 * Translate order status to Persian
 */
function getOrderStatusLabel(status?: string): string {
  if (!status) return "نامشخص";
  // Import would fail at runtime, so we'll use a simple mapping here
  const statusMap: Record<string, string> = {
    paying: "در حال پرداخت",
    "paying offline": "در حال پرداخت",
    started: "ثبت شده",
    pending: "در انتظار",
    processing: "در حال پردازش",
    "in progress": "در حال پردازش",
    shipment: "در حال ارسال",
    shipped: "ارسال شده",
    delivery: "در حال تحویل",
    delivered: "تحویل شده",
    done: "تکمیل شده",
    completed: "تکمیل شده",
    success: "موفق",
    cancelled: "لغو شده",
    canceled: "لغو شده",
    returned: "مرجوع شده",
    failed: "ناموفق",
    refund: "بازپرداخت شده",
  };
  const normalized = status.toLowerCase().trim();
  return statusMap[normalized] || status;
}

/**
 * Order event messages
 */
function getOrderMessage(
  category: EventCategory,
  context: EventContext,
  audience: Audience
): EventMessageResult {
  const orderId = context.orderId ? `#${context.orderId}` : "سفارش";

  switch (category) {
    case "StatusChange": {
      const oldStatus = context.oldStatus ? getOrderStatusLabel(context.oldStatus) : "نامشخص";
      const newStatus = context.newStatus ? getOrderStatusLabel(context.newStatus) : "نامشخص";

      if (audience === "user") {
        return {
          message: `وضعیت سفارش ${orderId} به "${newStatus}" تغییر کرد`,
          messageEn: `Order ${orderId} status changed to "${newStatus}"`,
          severity: newStatus.includes("موفق") || newStatus.includes("تکمیل") ? "success" :
                   newStatus.includes("لغو") || newStatus.includes("ناموفق") ? "error" : "info",
          category: "StatusChange",
          audience: "user",
        };
      } else {
        return {
          message: `وضعیت سفارش ${orderId} از "${oldStatus}" به "${newStatus}" تغییر کرد`,
          messageEn: `Order ${orderId} status changed from "${oldStatus}" to "${newStatus}"`,
          severity: newStatus.includes("موفق") || newStatus.includes("تکمیل") ? "success" :
                   newStatus.includes("لغو") || newStatus.includes("ناموفق") ? "error" : "info",
          category: "StatusChange",
          audience: audience === "all" ? "all" : "admin",
        };
      }
    }

    case "Action": {
      // Check for order creation statuses (case-insensitive, handle both enum and lowercase)
      const normalizedStatus = context.newStatus?.toLowerCase();
      if (normalizedStatus === "started" || normalizedStatus === "pending" || normalizedStatus === "paying") {
        return {
          message: audience === "user"
            ? `سفارش ${orderId} با موفقیت ثبت شد`
            : `سفارش ${orderId} ایجاد شد${context.userName ? ` توسط ${context.userName}` : ""}`,
          messageEn: audience === "user"
            ? `Order ${orderId} was successfully created`
            : `Order ${orderId} was created${context.userName ? ` by ${context.userName}` : ""}`,
          severity: "success",
          category: "Action",
          audience: audience === "all" ? "all" : audience,
        };
      }

      return {
        message: `عملیات روی سفارش ${orderId} انجام شد`,
        messageEn: `Action performed on order ${orderId}`,
        severity: "info",
        category: "Action",
        audience: audience === "all" ? "all" : audience,
      };
    }

    default:
      return {
        message: `رویداد مربوط به سفارش ${orderId}`,
        messageEn: `Event related to order ${orderId}`,
        severity: "info",
        category: "Info",
        audience: audience === "all" ? "all" : audience,
      };
  }
}

/**
 * Payment event messages
 */
function getPaymentMessage(
  category: EventCategory,
  context: EventContext,
  audience: Audience
): EventMessageResult {
  const orderId = context.orderId ? `سفارش #${context.orderId}` : "پرداخت";
  const amount = formatAmount(context.amount);
  const gateway = context.paymentGateway || "درگاه پرداخت";

  switch (category) {
    case "StatusChange": {
      if (context.newStatus === "success" || context.newStatus === "succeeded") {
        return {
          message: audience === "user"
            ? `پرداخت ${orderId} با مبلغ ${amount} با موفقیت انجام شد`
            : `پرداخت ${orderId} با مبلغ ${amount} از طریق ${gateway} انجام شد`,
          messageEn: audience === "user"
            ? `Payment for ${orderId} of ${amount} was successful`
            : `Payment for ${orderId} of ${amount} via ${gateway} was successful`,
          severity: "success",
          category: "StatusChange",
          audience: audience === "all" ? "all" : audience,
        };
      }

      if (context.newStatus === "failed" || context.newStatus === "error") {
        return {
          message: audience === "user"
            ? `پرداخت ${orderId} ناموفق بود. لطفاً دوباره تلاش کنید`
            : `پرداخت ${orderId} ناموفق بود${context.errorMessage ? `: ${context.errorMessage}` : ""}`,
          messageEn: audience === "user"
            ? `Payment for ${orderId} failed. Please try again`
            : `Payment for ${orderId} failed${context.errorMessage ? `: ${context.errorMessage}` : ""}`,
          severity: "error",
          category: "Error",
          audience: audience === "all" ? "all" : audience,
        };
      }

      if (context.newStatus === "pending" || context.newStatus === "processing") {
        return {
          message: `پرداخت ${orderId} در حال پردازش است`,
          messageEn: `Payment for ${orderId} is being processed`,
          severity: "warning",
          category: "StatusChange",
          audience: audience === "all" ? "all" : audience,
        };
      }

      return {
        message: `وضعیت پرداخت ${orderId} تغییر کرد`,
        messageEn: `Payment status for ${orderId} changed`,
        severity: "info",
        category: "StatusChange",
        audience: audience === "all" ? "all" : audience,
      };
    }

    case "Action": {
      return {
        message: `پرداخت ${orderId} آغاز شد`,
        messageEn: `Payment for ${orderId} initiated`,
        severity: "info",
        category: "Action",
        audience: audience === "all" ? "all" : audience,
      };
    }

    case "Error": {
      return {
        message: `خطا در پرداخت ${orderId}${context.errorMessage ? `: ${context.errorMessage}` : ""}`,
        messageEn: `Error in payment for ${orderId}${context.errorMessage ? `: ${context.errorMessage}` : ""}`,
        severity: "error",
        category: "Error",
        audience: audience === "all" ? "all" : audience,
      };
    }

    default:
      return {
        message: `رویداد مربوط به پرداخت ${orderId}`,
        messageEn: `Event related to payment for ${orderId}`,
        severity: "info",
        category: "Info",
        audience: audience === "all" ? "all" : audience,
      };
  }
}

/**
 * Admin event messages
 */
function getAdminMessage(
  category: EventCategory,
  context: EventContext,
  audience: Audience
): EventMessageResult {
  const adminName = context.adminName || "سیستم";
  const resourceType = context.resourceType || "منبع";
  const resourceId = context.resourceId ? `#${context.resourceId}` : "";

  switch (category) {
    case "Action": {
      if (context.action === "Update") {
        return {
          message: `${resourceType} ${resourceId} توسط ${adminName} ویرایش شد`,
          messageEn: `${resourceType} ${resourceId} was edited by ${adminName}`,
          severity: "info",
          category: "Action",
          audience: audience === "all" ? "all" : "admin",
        };
      }

      if (context.action === "Create") {
        return {
          message: `${resourceType} ${resourceId} توسط ${adminName} ایجاد شد`,
          messageEn: `${resourceType} ${resourceId} was created by ${adminName}`,
          severity: "success",
          category: "Action",
          audience: audience === "all" ? "all" : "admin",
        };
      }

      if (context.action === "Delete") {
        return {
          message: `${resourceType} ${resourceId} توسط ${adminName} حذف شد`,
          messageEn: `${resourceType} ${resourceId} was deleted by ${adminName}`,
          severity: "warning",
          category: "Action",
          audience: audience === "all" ? "all" : "admin",
        };
      }

      return {
        message: `عملیات روی ${resourceType} ${resourceId} توسط ${adminName} انجام شد`,
        messageEn: `Action on ${resourceType} ${resourceId} performed by ${adminName}`,
        severity: "info",
        category: "Action",
        audience: audience === "all" ? "all" : "admin",
      };
    }

    default:
      return {
        message: `رویداد مربوط به ${resourceType} ${resourceId}`,
        messageEn: `Event related to ${resourceType} ${resourceId}`,
        severity: "info",
        category: "Info",
        audience: audience === "all" ? "all" : "admin",
      };
  }
}

/**
 * Shipping event messages
 */
function getShippingMessage(
  category: EventCategory,
  context: EventContext,
  audience: Audience
): EventMessageResult {
  const orderId = context.orderId ? `سفارش #${context.orderId}` : "سفارش";

  switch (category) {
    case "StatusChange": {
      if (context.newStatus === "shipped" || context.newStatus === "shipping") {
        return {
          message: audience === "user"
            ? `${orderId} شما ارسال شد`
            : `${orderId} ارسال شد`,
          messageEn: audience === "user"
            ? `Your ${orderId} has been shipped`
            : `${orderId} was shipped`,
          severity: "success",
          category: "StatusChange",
          audience: audience === "all" ? "all" : audience,
        };
      }

      if (context.newStatus === "delivered") {
        return {
          message: audience === "user"
            ? `${orderId} شما تحویل داده شد`
            : `${orderId} تحویل داده شد`,
          messageEn: audience === "user"
            ? `Your ${orderId} has been delivered`
            : `${orderId} was delivered`,
          severity: "success",
          category: "StatusChange",
          audience: audience === "all" ? "all" : audience,
        };
      }

      return {
        message: `وضعیت ارسال ${orderId} تغییر کرد`,
        messageEn: `Shipping status for ${orderId} changed`,
        severity: "info",
        category: "StatusChange",
        audience: audience === "all" ? "all" : audience,
      };
    }

    default:
      return {
        message: `رویداد مربوط به ارسال ${orderId}`,
        messageEn: `Event related to shipping for ${orderId}`,
        severity: "info",
        category: "Info",
        audience: audience === "all" ? "all" : audience,
      };
  }
}

/**
 * Generate human-readable event message based on type, category, and context
 */
export function generateEventMessage(
  eventType: EventType,
  category: EventCategory,
  context: EventContext,
  audience?: Audience
): EventMessageResult {
  // Determine default audience based on event type
  const defaultAudience: Audience = audience ||
    (eventType === "Admin" ? "admin" :
     eventType === "System" ? "superadmin" : "user");

  switch (eventType) {
    case "Order":
      return getOrderMessage(category, context, defaultAudience);

    case "Payment":
      return getPaymentMessage(category, context, defaultAudience);

    case "Admin":
      return getAdminMessage(category, context, defaultAudience || "admin");

    case "Shipping":
      return getShippingMessage(category, context, defaultAudience);

    case "Wallet": {
      const amount = formatAmount(context.amount);
      return {
        message: context.category === "StatusChange" && context.newStatus === "success"
          ? `مبلغ ${amount} به کیف پول شما اضافه شد`
          : `رویداد مربوط به کیف پول`,
        messageEn: context.category === "StatusChange" && context.newStatus === "success"
          ? `Amount ${amount} was added to your wallet`
          : `Event related to wallet`,
        severity: context.newStatus === "success" ? "success" : "info",
        category: category,
        audience: defaultAudience,
      };
    }

    case "Cart": {
      return {
        message: `رویداد مربوط به سبد خرید`,
        messageEn: `Event related to cart`,
        severity: "info",
        category: category,
        audience: defaultAudience,
      };
    }

    case "Product": {
      const productName = context.productName || "محصول";
      return {
        message: `رویداد مربوط به ${productName}`,
        messageEn: `Event related to ${productName}`,
        severity: "info",
        category: category,
        audience: defaultAudience,
      };
    }

    case "User": {
      return {
        message: `رویداد مربوط به حساب کاربری`,
        messageEn: `Event related to user account`,
        severity: "info",
        category: category,
        audience: defaultAudience,
      };
    }

    case "System": {
      return {
        message: `رویداد سیستمی${context.errorMessage ? `: ${context.errorMessage}` : ""}`,
        messageEn: `System event${context.errorMessage ? `: ${context.errorMessage}` : ""}`,
        severity: context.errorMessage ? "error" : "info",
        category: category,
        audience: "superadmin",
      };
    }

    default:
      return {
        message: `رویداد ثبت شد`,
        messageEn: `Event logged`,
        severity: "info",
        category: "Info",
        audience: defaultAudience,
      };
  }
}
