import fs from "fs";
import path from "path";

import contractLifecycle from "../../api/contract/content-types/contract/lifecycles";
import orderItemLifecycle from "../../api/order-item/content-types/order-item/lifecycles";
import orderLifecycle from "../../api/order/content-types/order/lifecycles";
import productStockLifecycle from "../../api/product-stock/content-types/product-stock/lifecycles";
import { recordAdminAudit } from "../../utils/adminAudit";
import { logAdminEvent, logOrderEvent } from "../../utils/eventLogger";
import { registerAppLifecycles } from "../registerAppLifecycles";

jest.mock("../../utils/audit", () => ({
  resolveAuditActor: jest.fn(() => ({
    userId: 42,
    label: "Admin User",
    ip: "127.0.0.1",
    userAgent: "jest",
  })),
}));

jest.mock("../../utils/adminAudit", () => ({
  recordAdminAudit: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../utils/eventLogger", () => ({
  logOrderEvent: jest.fn(),
  logAdminEvent: jest.fn(),
}));

function createMockStrapi() {
  const subscribers: any[] = [];
  const update = jest.fn().mockResolvedValue(1);
  const where = jest.fn(() => ({ update }));
  const connection = jest.fn(() => ({ where }));
  (connection as any).raw = jest.fn();

  const queryMocks: Record<string, any> = {
    "api::contract.contract": {
      findOne: jest.fn().mockResolvedValue({ order: { id: 777 } }),
    },
    "api::product-variation.product-variation": {
      findOne: jest.fn().mockResolvedValue({ product: { id: 888 } }),
    },
    "api::order-item.order-item": {
      findOne: jest.fn().mockResolvedValue({ order: { id: 999 } }),
    },
  };
  const activityService = {
    logOrderPlaced: jest.fn(),
    logOrderShipped: jest.fn(),
    logOrderDelivered: jest.fn(),
    logOrderCancelled: jest.fn(),
  };

  const strapi = {
    db: {
      lifecycles: {
        subscribe: jest.fn((subscriber: any) => subscribers.push(subscriber)),
      },
      connection,
      query: jest.fn((uid: string) => queryMocks[uid]),
    },
    entityService: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findOne: jest.fn(),
    },
    service: jest.fn(() => activityService),
    log: {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    },
  } as any;

  return { strapi, subscribers, activityService, connection, update };
}

function getSubscriber(subscribers: any[], uid: string) {
  const subscriber = subscribers.find((entry) => entry.models?.includes(uid));
  if (!subscriber) throw new Error(`Subscriber not registered for ${uid}`);
  return subscriber;
}

describe("registerAppLifecycles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (global as any).strapi;
  });

  it("registers bootstrap subscribers for checkout-related models", () => {
    const { strapi, subscribers } = createMockStrapi();

    registerAppLifecycles(strapi);

    expect(subscribers.map((entry) => entry.models[0])).toEqual([
      "api::order.order",
      "api::contract.contract",
      "api::product-stock.product-stock",
    ]);
  });

  it("keeps old declarative lifecycle files inert to avoid duplicate handlers", () => {
    expect(orderLifecycle).toEqual({});
    expect(contractLifecycle).toEqual({});
    expect(productStockLifecycle).toEqual({});
    expect(orderItemLifecycle).toEqual({});
  });

  it("guards high-risk declarative lifecycle files against bare global strapi references", () => {
    const lifecycleFiles = [
      "../../api/order/content-types/order/lifecycles.ts",
      "../../api/contract/content-types/contract/lifecycles.ts",
      "../../api/product-stock/content-types/product-stock/lifecycles.ts",
      "../../api/order-item/content-types/order-item/lifecycles.ts",
    ];

    for (const relativeFile of lifecycleFiles) {
      const contents = fs.readFileSync(path.join(__dirname, relativeFile), "utf8");
      expect(contents).not.toMatch(/\bstrapi\./);
    }
  });

  it("logs order status updates using the closed-over Strapi instance", async () => {
    const { strapi, subscribers, activityService } = createMockStrapi();
    strapi.entityService.findOne
      .mockResolvedValueOnce({
        id: 10,
        Status: "Paying",
        Type: "Cart",
        user: { id: 5 },
      })
      .mockResolvedValueOnce({
        id: 10,
        Status: "Shipment",
        Type: "Cart",
        user: { id: 5 },
      });

    registerAppLifecycles(strapi);
    const subscriber = getSubscriber(subscribers, "api::order.order");
    const event = { params: { where: { id: 10 } }, result: { id: 10 }, state: {} };

    await subscriber.beforeUpdate(event);
    await subscriber.afterUpdate(event);

    expect(strapi.entityService.create).toHaveBeenCalledWith(
      "api::order-log.order-log",
      expect.objectContaining({
        data: expect.objectContaining({
          order: 10,
          Action: "Update",
        }),
      })
    );
    expect(recordAdminAudit).toHaveBeenCalledWith(
      strapi,
      expect.objectContaining({
        resourceType: "Order",
        resourceId: 10,
        action: "StatusChange",
      })
    );
    expect(logOrderEvent).toHaveBeenCalledWith(
      strapi,
      expect.objectContaining({
        category: "StatusChange",
        orderId: 10,
        oldStatus: "Paying",
        newStatus: "Shipment",
      })
    );
    expect(activityService.logOrderShipped).toHaveBeenCalledWith(5, 10, undefined);
    expect(logAdminEvent).toHaveBeenCalledWith(
      strapi,
      expect.objectContaining({
        resourceType: "Order",
        resourceId: 10,
        action: "Update",
      })
    );
  });

  it("logs contract updates through the gated admin-audit writer", async () => {
    const { strapi, subscribers } = createMockStrapi();
    strapi.entityService.findOne
      .mockResolvedValueOnce({
        id: 20,
        Status: "Pending",
        Amount: 1000,
      })
      .mockResolvedValueOnce({
        id: 20,
        Status: "Cancelled",
        Amount: 1000,
      });

    registerAppLifecycles(strapi);
    const subscriber = getSubscriber(subscribers, "api::contract.contract");
    const event = { params: { where: { id: 20 } }, result: { id: 20 }, state: {} };

    await subscriber.beforeUpdate(event);
    await subscriber.afterUpdate(event);

    expect(strapi.entityService.create).toHaveBeenCalledWith(
      "api::contract-log.contract-log",
      expect.objectContaining({
        data: expect.objectContaining({
          contract: 20,
          Action: "Update",
        }),
      })
    );
    expect(recordAdminAudit).toHaveBeenCalledWith(
      strapi,
      expect.objectContaining({
        resourceType: "Contract",
        resourceId: 20,
        action: "Update",
      })
    );
  });

  it("logs product-stock deltas once through the bootstrap subscriber", async () => {
    const { strapi, subscribers } = createMockStrapi();
    strapi.entityService.findOne.mockResolvedValueOnce({
      id: 30,
      Count: 2,
      product_variation: { id: 44 },
    });

    registerAppLifecycles(strapi);
    const subscriber = getSubscriber(subscribers, "api::product-stock.product-stock");
    const event = { params: { where: { id: 30 } }, result: { id: 30, Count: 5 }, state: {} };

    await subscriber.beforeUpdate(event);
    await subscriber.afterUpdate(event);

    expect(strapi.entityService.create).toHaveBeenCalledWith(
      "api::product-stock-log.product-stock-log",
      expect.objectContaining({
        data: expect.objectContaining({
          product_stock: 30,
          Count: 3,
          Type: "Add",
        }),
      })
    );
    expect(recordAdminAudit).toHaveBeenCalledWith(
      strapi,
      expect.objectContaining({
        resourceType: "Stock",
        resourceId: 30,
        action: "Adjust",
      })
    );
  });
});
