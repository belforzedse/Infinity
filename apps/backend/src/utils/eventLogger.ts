/**
 * Event Logger Utility
 *
 * Main utility for logging human-readable events.
 * Generates messages using templates and stores them in the event-log content type.
 */

import type { Strapi } from "@strapi/strapi";
import {
  generateEventMessage,
  type EventType,
  type EventCategory,
  type EventContext,
  type Audience,
} from "./eventMessages";

export type EventLoggerParams = {
  eventType: EventType;
  category: EventCategory;
  context: EventContext;
  audience?: Audience;
  resourceType?: string;
  resourceId?: string | number;
  relatedUserId?: number;
  performedBy?: {
    id?: number;
    name?: string;
  };
  metadata?: Record<string, unknown>;
};

/**
 * Main function to log a human-readable event
 */
export async function logEvent(
  strapi: Strapi,
  params: EventLoggerParams
): Promise<void> {
  try {
    // Generate message using templates
    const messageResult = generateEventMessage(
      params.eventType,
      params.category,
      params.context,
      params.audience
    );

    // Determine resource info
    const resourceType = params.resourceType || params.eventType;
    const resourceId = params.resourceId || params.context.resourceId;
    const relatedUserId = params.relatedUserId || params.context.userId as number;

    // Create event log entry
    await strapi.entityService.create("api::event-log.event-log" as any, {
      data: {
        EventType: params.eventType,
        EventCategory: messageResult.category,
        Severity: messageResult.severity,
        Message: messageResult.message,
        MessageEn: messageResult.messageEn,
        Audience: messageResult.audience,
        ResourceType: resourceType,
        ResourceId: resourceId ? String(resourceId) : undefined,
        RelatedUserId: relatedUserId || undefined,
        Metadata: params.metadata || params.context,
        performed_by: params.performedBy?.id || undefined,
      },
    });
  } catch (error) {
    // Log error but don't throw - event logging should not break the main flow
    strapi.log.error("Failed to log event", {
      error: error instanceof Error ? error.message : error,
      params,
    });
  }
}

/**
 * Helper function to log order events
 */
export async function logOrderEvent(
  strapi: Strapi,
  params: {
    category: EventCategory;
    orderId: string | number;
    orderStatus?: string;
    oldStatus?: string;
    newStatus?: string;
    userId?: number;
    performedBy?: { id?: number; name?: string };
    audience?: Audience;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  return logEvent(strapi, {
    eventType: "Order",
    category: params.category,
    context: {
      orderId: params.orderId,
      orderStatus: params.orderStatus,
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      userId: params.userId,
    },
    resourceType: "Order",
    resourceId: params.orderId,
    relatedUserId: params.userId,
    performedBy: params.performedBy,
    audience: params.audience || "user",
    metadata: params.metadata,
  });
}

/**
 * Helper function to log payment events
 */
export async function logPaymentEvent(
  strapi: Strapi,
  params: {
    category: EventCategory;
    orderId?: string | number;
    amount?: number;
    paymentGateway?: string;
    status?: string;
    oldStatus?: string;
    newStatus?: string;
    errorMessage?: string;
    userId?: number;
    audience?: Audience;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  return logEvent(strapi, {
    eventType: "Payment",
    category: params.category,
    context: {
      orderId: params.orderId,
      amount: params.amount,
      paymentGateway: params.paymentGateway,
      newStatus: params.newStatus || params.status,
      oldStatus: params.oldStatus,
      errorMessage: params.errorMessage,
      userId: params.userId,
    },
    resourceType: "Order",
    resourceId: params.orderId,
    relatedUserId: params.userId,
    audience: params.audience || "user",
    metadata: params.metadata,
  });
}

/**
 * Helper function to log admin events
 */
export async function logAdminEvent(
  strapi: Strapi,
  params: {
    category: EventCategory;
    resourceType: string;
    resourceId?: string | number;
    action?: string;
    adminName: string;
    adminId?: number;
    audience?: Audience;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  return logEvent(strapi, {
    eventType: "Admin",
    category: params.category,
    context: {
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      action: params.action,
      adminName: params.adminName,
    },
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    performedBy: {
      id: params.adminId,
      name: params.adminName,
    },
    audience: params.audience || "admin",
    metadata: params.metadata,
  });
}

/**
 * Helper function to log shipping events
 */
export async function logShippingEvent(
  strapi: Strapi,
  params: {
    category: EventCategory;
    orderId: string | number;
    status?: string;
    oldStatus?: string;
    newStatus?: string;
    userId?: number;
    audience?: Audience;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  return logEvent(strapi, {
    eventType: "Shipping",
    category: params.category,
    context: {
      orderId: params.orderId,
      newStatus: params.newStatus || params.status,
      oldStatus: params.oldStatus,
      userId: params.userId,
    },
    resourceType: "Order",
    resourceId: params.orderId,
    relatedUserId: params.userId,
    audience: params.audience || "user",
    metadata: params.metadata,
  });
}
