# Event Logging System - Extensibility Guide

## Current Architecture Overview

The event logging system is designed to be **highly extensible** with minimal changes needed for new features.

### Core Extensibility Features

1. **Flexible Schema Design**
   - `EventType`: Enum (can add new types via migration)
   - `Metadata`: JSON field (stores any additional data)
   - `ResourceType` + `ResourceId`: String fields (link to any entity)
   - `Audience`: Enum (supports multiple user roles)

2. **Template-Based Messages**
   - Easy to add new event types with message templates
   - Supports placeholders and context data
   - No schema changes needed for new messages

3. **Helper Functions**
   - Can add new helper functions for specific event types
   - Generic `logEvent()` accepts any event type
   - Consistent API across all event types

## Extensibility Assessment

### ✅ Highly Expandable - Easy to Add:

**New Event Types** (e.g., SMS, Email, Push Notifications):
1. Add to `EventType` enum in schema.json
2. Add message function in `eventMessages.ts`
3. Add helper function in `eventLogger.ts` (optional)
4. Use in code

**New Message Templates:**
- Just add functions in `eventMessages.ts`
- No schema changes needed
- Supports any context data

**Webhook Integration:**
- Events can trigger webhooks via lifecycle hooks
- Metadata can store webhook payloads/results
- Can track webhook delivery status

### Current Capabilities

**Schema Supports:**
- ✅ Unlimited event types (via enum expansion - simple migration)
- ✅ Unlimited resource types (string field - no limits)
- ✅ Flexible metadata (JSON - any structure)
- ✅ Multiple audiences (user, admin, superadmin, all)
- ✅ Severity levels (info, success, warning, error)

**Service Layer Supports:**
- ✅ Query by any EventType
- ✅ Query by any ResourceType
- ✅ Filter by date, severity, audience
- ✅ Pagination for all queries

## Adding SMS Webhooks - Recommended Approaches

### Option 1: SMS as Event Type (Simplest - Recommended First)

**Steps:**
1. **Add SMS to EventType enum** (simple schema migration)
2. **Add SMS message templates** (no schema change)
3. **Add SMS helper function** (optional, but recommended)
4. **Integrate with SMS service**

**Implementation:**

```typescript
// 1. Update schema.json - add "SMS" to EventType enum
"enum": ["Order", "Payment", "User", "Product", "Cart", "Wallet", "Shipping", "Admin", "System", "SMS"]

// 2. Add SMS message function in eventMessages.ts
function getSMSMessage(
  category: EventCategory,
  context: EventContext,
  audience: Audience
): EventMessageResult {
  const phoneNumber = context.phoneNumber || "شماره نامشخص";
  
  switch (category) {
    case "Notification": {
      if (context.newStatus === "sent") {
        return {
          message: `پیامک به ${phoneNumber} ارسال شد`,
          messageEn: `SMS sent to ${phoneNumber}`,
          severity: "success",
          category: "Notification",
          audience: "admin", // SMS logs typically for admin monitoring
        };
      }
      if (context.newStatus === "failed") {
        return {
          message: `ارسال پیامک به ${phoneNumber} ناموفق بود`,
          messageEn: `SMS to ${phoneNumber} failed`,
          severity: "error",
          category: "Error",
          audience: "admin",
        };
      }
      return {
        message: `رویداد مربوط به پیامک ${phoneNumber}`,
        messageEn: `SMS event for ${phoneNumber}`,
        severity: "info",
        category: "Notification",
        audience: "admin",
      };
    }
    default:
      return {
        message: `رویداد مربوط به پیامک`,
        messageEn: `SMS event`,
        severity: "info",
        category: "Info",
        audience: "admin",
      };
  }
}

// Add case in generateEventMessage():
case "SMS":
  return getSMSMessage(category, context, defaultAudience);

// 3. Add helper function in eventLogger.ts
export async function logSMSEvent(
  strapi: Strapi,
  params: {
    category: EventCategory;
    phoneNumber: string;
    message?: string;
    status?: "sent" | "failed" | "pending";
    userId?: number;
    orderId?: number;
    smsProvider?: string;
    messageId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  return logEvent(strapi, {
    eventType: "SMS",
    category: params.category,
    context: {
      phoneNumber: params.phoneNumber,
      message: params.message,
      newStatus: params.status,
      userId: params.userId,
      orderId: params.orderId,
      smsProvider: params.smsProvider,
      messageId: params.messageId,
    },
    resourceType: params.orderId ? "Order" : "User",
    resourceId: params.orderId ? String(params.orderId) : params.userId ? String(params.userId) : undefined,
    relatedUserId: params.userId,
    audience: "admin", // SMS logs typically for admin
    metadata: {
      ...params.metadata,
      smsProvider: params.smsProvider,
      messageId: params.messageId,
    },
  });
}

// 4. Use in SMS service/webhook handler
import { logSMSEvent } from "../../../utils/eventLogger";

async function sendSMS(params: { phone: string; message: string; userId?: number; orderId?: number }) {
  try {
    const result = await smsProvider.send(params.phone, params.message);
    
    // Log successful SMS event
    await logSMSEvent(strapi, {
      category: "Notification",
      phoneNumber: params.phone,
      message: params.message,
      status: "sent",
      userId: params.userId,
      orderId: params.orderId,
      smsProvider: "your-sms-service",
      messageId: result.messageId,
      metadata: { providerResponse: result },
    });
    
    return result;
  } catch (error) {
    // Log failed SMS event
    await logSMSEvent(strapi, {
      category: "Error",
      phoneNumber: params.phone,
      message: params.message,
      status: "failed",
      userId: params.userId,
      orderId: params.orderId,
      smsProvider: "your-sms-service",
      metadata: { error: error.message },
    });
    throw error;
  }
}
```

### Option 2: Event-Driven Webhook System (More Scalable)

Create a webhook service that listens to events and triggers actions:

```typescript
// backend/src/services/webhooks/index.ts
import type { Strapi } from "@strapi/strapi";
import { EventEmitter } from "events";

export class WebhookService extends EventEmitter {
  private strapi: Strapi;
  
  constructor(strapi: Strapi) {
    super();
    this.strapi = strapi;
    this.setupListeners();
  }
  
  private setupListeners() {
    // Listen to order status changes
    this.on('order.statusChange', async (data: any) => {
      if (data.newStatus === 'Started' && data.orderId) {
        await this.sendOrderConfirmationSMS(data.orderId, data.userId);
      }
    });
    
    // Listen to payment success
    this.on('payment.statusChange', async (data: any) => {
      if (data.newStatus === 'success' && data.orderId) {
        await this.sendPaymentConfirmationSMS(data.orderId, data.userId);
      }
    });
  }
  
  private async sendOrderConfirmationSMS(orderId: number, userId?: number) {
    if (!userId) return;
    
    const user = await this.strapi.entityService.findOne(
      "plugin::users-permissions.user",
      userId,
      { fields: ["phone"] }
    );
    
    if (user?.phone) {
      // Call your SMS webhook/service
      await this.triggerWebhook({
        type: 'SMS',
        phone: user.phone,
        message: `سفارش #${orderId} شما ثبت شد`,
        orderId,
        userId,
      });
    }
  }
  
  private async triggerWebhook(params: any) {
    // Your webhook implementation
    // Can call external SMS service, webhook endpoint, etc.
  }
}

// Integrate into eventLogger.ts
let webhookService: WebhookService | null = null;

export async function logEvent(strapi: Strapi, params: EventLoggerParams) {
  // ... existing event logging code ...
  
  // Initialize webhook service on first use
  if (!webhookService) {
    webhookService = new WebhookService(strapi);
  }
  
  // Emit event for webhook listeners
  webhookService.emit(`${params.eventType.toLowerCase()}.${params.category.toLowerCase()}`, {
    eventType: params.eventType,
    category: params.category,
    ...params.context,
  });
  
  return eventLog;
}
```

### Option 3: Webhook Configuration Content Type (Most Flexible)

Create a webhook configuration system where admins can configure webhooks:

```typescript
// Schema: backend/src/api/webhook-config/content-types/webhook-config/schema.json
{
  "attributes": {
    "Name": { "type": "string", "required": true },
    "Url": { "type": "string", "required": true },
    "EventTypes": { "type": "json" }, // Array of event types to trigger
    "EventCategories": { "type": "json" }, // Array of categories
    "IsActive": { "type": "boolean", "default": true },
    "Secret": { "type": "string" }, // For webhook signature
    "RetryCount": { "type": "integer", "default": 3 },
    "Timeout": { "type": "integer", "default": 5000 }
  }
}

// Service to deliver webhooks
export async function deliverWebhooks(
  strapi: Strapi,
  eventType: EventType,
  eventData: any
) {
  // Query active webhooks for this event type
  const webhooks = await strapi.entityService.findMany(
    "api::webhook-config.webhook-config",
    {
      filters: {
        IsActive: true,
        $or: [
          { EventTypes: { $contains: [eventType] } },
          { EventTypes: { $null: true } }, // All events
        ],
      },
    }
  );
  
  for (const webhook of webhooks) {
    await deliverWebhook(strapi, webhook, eventData);
  }
}

// Integrate into eventLogger.ts
export async function logEvent(strapi: Strapi, params: EventLoggerParams) {
  // ... create event log ...
  
  // Trigger webhooks asynchronously (don't block)
  setImmediate(async () => {
    try {
      await deliverWebhooks(strapi, params.eventType, eventLog);
    } catch (error) {
      strapi.log.error("Webhook delivery failed", { error, params });
    }
  });
  
  return eventLog;
}
```

## Scalability Features

### Current System Supports:

1. **High Volume Events**
   - Database indexes on key fields (RelatedUserId, ResourceType+ResourceId, createdAt)
   - Pagination for all queries
   - Efficient filtering

2. **Event Archiving** (Future)
   - Can move old events to separate table
   - Keep recent events in main table
   - Archive based on date/volume

3. **Multiple Event Sources**
   - Lifecycles (automatic)
   - Controllers (manual)
   - Background jobs (scheduled)
   - Webhooks (external triggers)

4. **Multiple Consumers**
   - Frontend UI (OrderTimeline, Admin panels)
   - Webhooks (SMS, Email, Push)
   - Reports/Analytics
   - External integrations

## Migration Path

### Phase 1: Add SMS Event Type (Quick Win)
- ✅ Extend EventType enum (simple migration)
- ✅ Add SMS message templates
- ✅ Add logSMSEvent helper
- ✅ Use in SMS service

**Time:** ~1-2 hours
**Risk:** Low (additive only)

### Phase 2: Webhook Infrastructure (Medium)
- Create webhook-config content type
- Create webhook delivery service
- Add retry logic
- Add delivery status tracking

**Time:** ~1 day
**Risk:** Medium (new service, but optional)

### Phase 3: Event Bus (Advanced)
- Create event emitter service
- Register multiple listeners
- Support wildcards
- Add event queuing

**Time:** ~2-3 days
**Risk:** Low (doesn't change existing code)

## Performance Considerations

### Current System:
- ✅ Indexed queries (fast lookups)
- ✅ Pagination (handles large datasets)
- ✅ Async event logging (doesn't block main flow)

### For Webhooks:
- **Async Delivery**: Don't block event logging
- **Queue System**: For high-volume events (e.g., order notifications)
- **Retry Logic**: Handle transient failures
- **Rate Limiting**: Prevent webhook spam
- **Batching**: Group multiple events for efficiency

## Example: Complete SMS Integration

```typescript
// 1. SMS Service with Event Logging
// backend/src/services/sms/index.ts
import { logSMSEvent } from "../../utils/eventLogger";

export async function sendSMS(
  strapi: Strapi,
  params: {
    phone: string;
    message: string;
    userId?: number;
    orderId?: number;
    template?: string;
  }
) {
  const smsProvider = strapi.service("api::sms.sms");
  
  try {
    // Send SMS via webhook/service
    const result = await smsProvider.send({
      phone: params.phone,
      message: params.message,
      template: params.template,
    });
    
    // Log successful SMS event
    await logSMSEvent(strapi, {
      category: "Notification",
      phoneNumber: params.phone,
      message: params.message,
      status: "sent",
      userId: params.userId,
      orderId: params.orderId,
      smsProvider: "your-sms-service",
      messageId: result.messageId,
      metadata: {
        template: params.template,
        providerResponse: result,
      },
    });
    
    return result;
  } catch (error) {
    // Log failed SMS event
    await logSMSEvent(strapi, {
      category: "Error",
      phoneNumber: params.phone,
      message: params.message,
      status: "failed",
      userId: params.userId,
      orderId: params.orderId,
      smsProvider: "your-sms-service",
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        template: params.template,
      },
    });
    
    throw error;
  }
}

// 2. Use in Order Lifecycle
// backend/src/api/order/content-types/order/lifecycles.ts
import { sendSMS } from "../../../../services/sms";

export default {
  async afterUpdate(event) {
    // ... existing code ...
    
    // If order status changed to "Started", send SMS
    if (oldStatus !== newStatus && newStatus === "Started" && orderUserId) {
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        orderUserId,
        { fields: ["phone"] }
      );
      
      if (user?.phone) {
        // Send SMS asynchronously (don't block order update)
        setImmediate(async () => {
          try {
            await sendSMS(strapi, {
              phone: user.phone,
              message: `سفارش #${result.id} شما ثبت شد و در حال پردازش است`,
              userId: orderUserId,
              orderId: result.id,
              template: "order_confirmation",
            });
          } catch (error) {
            strapi.log.error("Failed to send order confirmation SMS", {
              orderId: result.id,
              userId: orderUserId,
              error,
            });
          }
        });
      }
    }
  },
};
```

## Recommendations

### For SMS Webhooks:

**Start Simple (Option 1):**
1. Add "SMS" to EventType enum
2. Add SMS message templates
3. Create SMS service with event logging
4. Integrate with order/payment lifecycles

**Then Expand (Option 3):**
1. Create webhook-config content type
2. Build webhook delivery service
3. Allow admins to configure webhooks
4. Support multiple webhook types (SMS, Email, Push)

**Future Enhancement (Option 2):**
1. Add event bus system
2. Support multiple listeners per event
3. Add event queuing for reliability

## Conclusion

The current system is **highly extensible**:

✅ **Easy to extend** - Add new event types in minutes
✅ **No breaking changes** - All extensions are additive
✅ **Scalable** - Handles high volume with proper indexing
✅ **Flexible** - JSON metadata supports any data structure
✅ **Future-proof** - Can evolve to event-driven architecture

**Recommended Path:**
1. Start with Option 1 (SMS as Event Type) - Quick to implement
2. Add Option 3 (Webhook Config) - When you need flexibility
3. Consider Option 2 (Event Bus) - For complex multi-listener scenarios
