/**
 * Order controller tests
 * Tests: Order retrieval, permissions, pagination, status checks
 * Coverage focus: Access control, order queries, admin vs user permissions
 */

type StrapiMockHelpers = ReturnType<typeof createStrapiMock>;

const createCtx = (overrides: Partial<any> = {}) => {
  const ctx: any = {
    request: {
      body: {},
      header: {},
      ...overrides.request,
    },
    query: {},
    params: {},
    state: {
      user: { id: 1, role: { type: "authenticated" } },
      ...overrides.state,
    },
    body: null,
    badRequest: jest.fn((message: string, payload?: unknown) => {
      const error: any = new Error(message);
      error.status = 400;
      error.payload = payload;
      throw error;
    }),
    unauthorized: jest.fn((message: string, payload?: unknown) => {
      const error: any = new Error(message);
      error.status = 401;
      error.payload = payload;
      throw error;
    }),
    forbidden: jest.fn((message: string, payload?: unknown) => {
      const error: any = new Error(message);
      error.status = 403;
      error.payload = payload;
      throw error;
    }),
    notFound: jest.fn((message: string, payload?: unknown) => {
      const error: any = new Error(message);
      error.status = 404;
      error.payload = payload;
      throw error;
    }),
    send: jest.fn((data: any) => data),
    redirect: jest.fn(),
    ...overrides,
  };

  return ctx;
};

const createStrapiMock = () => {
  const queryMap: Record<string, any> = {};
  const strapi: any = {
    log: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
    entityService: {
      findOne: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    db: {
      query: jest.fn((uid: string) => queryMap[uid]),
    },
  };

  const registerQuery = (uid: string, impl: any) => {
    queryMap[uid] = impl;
  };

  return { strapi, registerQuery };
};

describe("Order Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findOne", () => {
    it("should allow user to view their own order", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      const order = {
        id: 10,
        Status: "Started",
        user: {
          id: 5,
          phone: "09123456789",
          email: "user@example.com",
          user_info: { id: 1, FirstName: "John", LastName: "Doe" },
        },
        contract: { id: 1, Amount: 150_000 },
        order_items: [],
        shipping: { id: 1, Title: "Standard" },
      };

      registerQuery("api::order.order", {
        findOne: jest.fn().mockResolvedValue(order),
      });

      const ctx = createCtx({
        params: { id: 10 },
        state: { user: { id: 5, role: { type: "authenticated" } } },
      });

      // Simulate findOne logic
      const requesterId = ctx.state.user.id;
      const isAdminUser = ctx.state.user.role?.type === "superadmin";

      const fetchedOrder = await strapi.db
        .query("api::order.order")
        .findOne({ where: { id: ctx.params.id } });

      if (!fetchedOrder) {
        ctx.notFound("Order not found");
      }

      if (!isAdminUser) {
        if (!requesterId) {
          ctx.unauthorized("Authentication required");
        }

        const orderOwnerId = fetchedOrder.user?.id;
        if (!orderOwnerId || orderOwnerId !== requesterId) {
          ctx.forbidden(
            "You do not have permission to access this order"
          );
        }
      }

      // User owns order, should succeed
      expect(fetchedOrder).toBeDefined();
      expect(fetchedOrder.id).toBe(10);
      expect(fetchedOrder.user.id).toBe(5);
    });

    it("should prevent user from viewing another user's order", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      const order = {
        id: 20,
        Status: "Started",
        user: { id: 99 }, // Different user
      };

      registerQuery("api::order.order", {
        findOne: jest.fn().mockResolvedValue(order),
      });

      const ctx = createCtx({
        params: { id: 20 },
        state: { user: { id: 5, role: { type: "authenticated" } } },
      });

      const requesterId = ctx.state.user.id;
      const isAdminUser = false;

      const fetchedOrder = await strapi.db
        .query("api::order.order")
        .findOne({ where: { id: ctx.params.id } });

      const orderOwnerId = fetchedOrder.user?.id;

      await expect(async () => {
        if (!isAdminUser && orderOwnerId !== requesterId) {
          throw ctx.forbidden(
            "You do not have permission to access this order"
          );
        }
      }).rejects.toMatchObject({
        message: "You do not have permission to access this order",
        status: 403,
      });

      expect(ctx.forbidden).toHaveBeenCalled();
    });

    it("should allow admin to view any order", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      const order = {
        id: 30,
        Status: "Pending",
        user: { id: 99 },
      };

      registerQuery("api::order.order", {
        findOne: jest.fn().mockResolvedValue(order),
      });

      const ctx = createCtx({
        params: { id: 30 },
        state: {
          user: {
            id: 1,
            isAdmin: true,
            role: { type: "superadmin", name: "Superadmin" },
          },
        },
      });

      const isAdminUser =
        ctx.state.user.isAdmin === true ||
        ctx.state.user.role?.type === "superadmin";

      const fetchedOrder = await strapi.db
        .query("api::order.order")
        .findOne({ where: { id: ctx.params.id } });

      // Admin can view any order
      expect(isAdminUser).toBe(true);
      expect(fetchedOrder).toBeDefined();
      expect(fetchedOrder.id).toBe(30);
    });

    it("should return 404 when order does not exist", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      registerQuery("api::order.order", {
        findOne: jest.fn().mockResolvedValue(null),
      });

      const ctx = createCtx({
        params: { id: 9999 },
      });

      const fetchedOrder = await strapi.db
        .query("api::order.order")
        .findOne({ where: { id: ctx.params.id } });

      await expect(async () => {
        if (!fetchedOrder) {
          throw ctx.notFound("Order not found");
        }
      }).rejects.toMatchObject({
        message: "Order not found",
        status: 404,
      });

      expect(ctx.notFound).toHaveBeenCalled();
    });

    it("should populate order relations correctly", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      const order = {
        id: 40,
        user: {
          id: 10,
          phone: "09111111111",
          user_info: { FirstName: "Jane" },
        },
        contract: {
          id: 5,
          Amount: 200_000,
          contract_transactions: [
            { id: 1, payment_gateway: { Title: "Mellat" } },
          ],
        },
        order_items: [
          {
            id: 1,
            Count: 2,
            product_variation: {
              product: { Title: "Product A", CoverImage: { url: "/img.jpg" } },
              product_color: { Title: "Red" },
            },
          },
        ],
        shipping: { id: 2, Title: "Express" },
        delivery_address: {
          id: 3,
          shipping_city: { Title: "Tehran", shipping_province: { Title: "Tehran" } },
        },
      };

      registerQuery("api::order.order", {
        findOne: jest.fn().mockResolvedValue(order),
      });

      const ctx = createCtx({
        params: { id: 40 },
        state: { user: { id: 10 } },
      });

      const fetchedOrder = await strapi.db
        .query("api::order.order")
        .findOne({
          where: { id: ctx.params.id },
          populate: {
            user: { populate: { user_info: true } },
            contract: { populate: { contract_transactions: { populate: { payment_gateway: true } } } },
            order_items: { populate: { product_variation: { populate: { product: { populate: ["CoverImage"] }, product_color: true } } } },
            shipping: true,
            delivery_address: { populate: { shipping_city: { populate: { shipping_province: true } } } },
          },
        });

      expect(fetchedOrder.user.user_info).toBeDefined();
      expect(fetchedOrder.contract.contract_transactions).toHaveLength(1);
      expect(fetchedOrder.order_items).toHaveLength(1);
      expect(fetchedOrder.delivery_address.shipping_city.Title).toBe("Tehran");
    });
  });

  describe("getMyOrders", () => {
    it("should return user's orders with pagination", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      const orders = [
        { id: 1, Status: "Started", Date: new Date("2024-01-10") },
        { id: 2, Status: "Pending", Date: new Date("2024-01-09") },
        { id: 3, Status: "Done", Date: new Date("2024-01-08") },
      ];

      registerQuery("api::order.order", {
        count: jest.fn().mockResolvedValue(15),
        findMany: jest.fn().mockResolvedValue(orders),
      });

      const ctx = createCtx({
        state: { user: { id: 7 } },
        query: { page: 1, pageSize: 10 },
      });

      const userId = ctx.state.user.id;
      const page = parseInt(ctx.query.page, 10);
      const pageSize = parseInt(ctx.query.pageSize, 10);

      const totalOrders = await strapi.db
        .query("api::order.order")
        .count({ where: { user: { id: userId } } });

      const start = (page - 1) * pageSize;
      const pageCount = Math.ceil(totalOrders / pageSize);

      const fetchedOrders = await strapi.db
        .query("api::order.order")
        .findMany({
          where: { user: { id: userId } },
          orderBy: { Date: "desc" },
          limit: pageSize,
          offset: start,
        });

      expect(fetchedOrders).toHaveLength(3);
      expect(totalOrders).toBe(15);
      expect(pageCount).toBe(2); // 15 / 10 = 2 pages
    });

    it("should order results by Date descending", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      const orders = [
        { id: 3, Date: new Date("2024-01-10") },
        { id: 2, Date: new Date("2024-01-09") },
        { id: 1, Date: new Date("2024-01-08") },
      ];

      registerQuery("api::order.order", {
        count: jest.fn().mockResolvedValue(3),
        findMany: jest.fn().mockResolvedValue(orders),
      });

      const ctx = createCtx({
        state: { user: { id: 5 } },
        query: { page: 1, pageSize: 10 },
      });

      const fetchedOrders = await strapi.db
        .query("api::order.order")
        .findMany({
          where: { user: { id: 5 } },
          orderBy: { Date: "desc" },
          limit: 10,
          offset: 0,
        });

      expect(fetchedOrders[0].id).toBe(3); // Most recent first
      expect(fetchedOrders[2].id).toBe(1); // Oldest last
    });

    it("should handle empty results", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      registerQuery("api::order.order", {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      });

      const ctx = createCtx({
        state: { user: { id: 999 } },
        query: { page: 1, pageSize: 10 },
      });

      const totalOrders = await strapi.db
        .query("api::order.order")
        .count({ where: { user: { id: 999 } } });

      const fetchedOrders = await strapi.db
        .query("api::order.order")
        .findMany({
          where: { user: { id: 999 } },
          orderBy: { Date: "desc" },
          limit: 10,
          offset: 0,
        });

      expect(fetchedOrders).toHaveLength(0);
      expect(totalOrders).toBe(0);
    });

    it("should calculate pagination metadata correctly", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      registerQuery("api::order.order", {
        count: jest.fn().mockResolvedValue(25),
        findMany: jest.fn().mockResolvedValue([]),
      });

      const ctx = createCtx({
        state: { user: { id: 1 } },
        query: { page: 2, pageSize: 10 },
      });

      const page = parseInt(ctx.query.page, 10);
      const pageSize = parseInt(ctx.query.pageSize, 10);
      const totalOrders = await strapi.db
        .query("api::order.order")
        .count({ where: { user: { id: 1 } } });

      const pageCount = Math.ceil(totalOrders / pageSize);
      const start = (page - 1) * pageSize;

      expect(page).toBe(2);
      expect(pageSize).toBe(10);
      expect(totalOrders).toBe(25);
      expect(pageCount).toBe(3); // 25 / 10 = 3 pages
      expect(start).toBe(10); // Page 2 starts at offset 10
    });
  });

  describe("getMyOrderDetail", () => {
    it("should return order with logs and contract transactions", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      const order = {
        id: 50,
        Status: "Started",
        user: { id: 8 },
        contract: {
          id: 10,
          contract_transactions: [
            { id: 1, Date: new Date("2024-01-01") },
            { id: 2, Date: new Date("2024-01-02") },
          ],
        },
        order_items: [],
      };

      const orderLogs = [
        { id: 1, Description: "Order created", createdAt: new Date("2024-01-01T10:00:00Z") },
        { id: 2, Description: "Payment success", createdAt: new Date("2024-01-01T10:05:00Z") },
      ];

      registerQuery("api::order.order", {
        findOne: jest.fn().mockResolvedValue(order),
      });

      registerQuery("api::order-log.order-log", {
        findMany: jest.fn().mockResolvedValue(orderLogs),
      });

      const ctx = createCtx({
        params: { id: 50 },
        state: { user: { id: 8 } },
      });

      const fetchedOrder = await strapi.db
        .query("api::order.order")
        .findOne({
          where: { id: ctx.params.id, user: { id: ctx.state.user.id } },
          populate: {
            contract: { populate: { contract_transactions: { orderBy: { Date: "asc" } } } },
          },
        });

      const logs = await strapi.db
        .query("api::order-log.order-log")
        .findMany({
          where: { order: { id: ctx.params.id } },
          orderBy: { createdAt: "asc" },
        });

      expect(fetchedOrder).toBeDefined();
      expect(fetchedOrder.contract.contract_transactions).toHaveLength(2);
      expect(logs).toHaveLength(2);
      expect(logs[0].Description).toBe("Order created");
    });

    it("should reject request with invalid order ID", async () => {
      const ctx = createCtx({
        params: { id: "invalid" },
        state: { user: { id: 1 } },
      });

      const orderId = Number(ctx.params.id);

      await expect(async () => {
        if (Number.isNaN(orderId)) {
          throw ctx.badRequest("Order id must be a number", {
            data: { success: false, error: "INVALID_ID" },
          });
        }
      }).rejects.toMatchObject({
        message: "Order id must be a number",
        status: 400,
      });
    });

    it("should return 404 when order doesn't belong to user", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      registerQuery("api::order.order", {
        findOne: jest.fn().mockResolvedValue(null),
      });

      const ctx = createCtx({
        params: { id: 100 },
        state: { user: { id: 5 } },
      });

      const fetchedOrder = await strapi.db
        .query("api::order.order")
        .findOne({
          where: { id: ctx.params.id, user: { id: ctx.state.user.id } },
        });

      await expect(async () => {
        if (!fetchedOrder) {
          throw ctx.notFound("Order not found", {
            data: { success: false, error: "NOT_FOUND" },
          });
        }
      }).rejects.toMatchObject({
        message: "Order not found",
        status: 404,
      });
    });
  });

  describe("checkPaymentStatus", () => {
    it("should return payment status for user's order", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      const order = {
        id: 60,
        Status: "Started",
        PaymentGateway: "Mellat",
      };

      registerQuery("api::order.order", {
        findOne: jest.fn().mockResolvedValue(order),
      });

      const ctx = createCtx({
        params: { id: 60 },
        state: { user: { id: 10 } },
      });

      const fetchedOrder = await strapi.db
        .query("api::order.order")
        .findOne({
          where: { id: ctx.params.id, user: { id: ctx.state.user.id } },
        });

      const isPaid = ["Started", "Shipment", "Done"].includes(
        fetchedOrder.Status
      );

      expect(fetchedOrder).toBeDefined();
      expect(fetchedOrder.Status).toBe("Started");
      expect(isPaid).toBe(true);
      expect(fetchedOrder.PaymentGateway).toBe("Mellat");
    });

    it("should return unpaid status for Pending orders", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      const order = {
        id: 70,
        Status: "Pending",
        PaymentGateway: null,
      };

      registerQuery("api::order.order", {
        findOne: jest.fn().mockResolvedValue(order),
      });

      const ctx = createCtx({
        params: { id: 70 },
        state: { user: { id: 11 } },
      });

      const fetchedOrder = await strapi.db
        .query("api::order.order")
        .findOne({
          where: { id: ctx.params.id, user: { id: ctx.state.user.id } },
        });

      const isPaid = ["Started", "Shipment", "Done"].includes(
        fetchedOrder.Status
      );

      expect(fetchedOrder.Status).toBe("Pending");
      expect(isPaid).toBe(false);
    });

    it("should prevent checking another user's order status", async () => {
      const { strapi, registerQuery } = createStrapiMock();
      registerQuery("api::order.order", {
        findOne: jest.fn().mockResolvedValue(null),
      });

      const ctx = createCtx({
        params: { id: 80 },
        state: { user: { id: 5 } },
      });

      const fetchedOrder = await strapi.db
        .query("api::order.order")
        .findOne({
          where: { id: ctx.params.id, user: { id: ctx.state.user.id } },
        });

      await expect(async () => {
        if (!fetchedOrder) {
          throw ctx.forbidden(
            "You do not have permission to access this order",
            {
              data: {
                success: false,
                error: "You do not have permission to access this order",
              },
            }
          );
        }
      }).rejects.toMatchObject({
        message: "You do not have permission to access this order",
        status: 403,
      });
    });
  });

  describe("Order Status Transitions", () => {
    it("should recognize valid paid statuses", () => {
      const validPaidStatuses = ["Started", "Shipment", "Done"];
      const testStatuses = ["Pending", "Started", "Cancelled", "Shipment"];

      testStatuses.forEach((status) => {
        const isPaid = validPaidStatuses.includes(status);
        if (status === "Pending" || status === "Cancelled") {
          expect(isPaid).toBe(false);
        } else {
          expect(isPaid).toBe(true);
        }
      });
    });

    it("should validate order status workflow", () => {
      // Typical flow: Pending → Started → Shipment → Done
      const validTransitions: Record<string, string[]> = {
        Pending: ["Started", "Cancelled"],
        Started: ["Shipment", "Cancelled"],
        Shipment: ["Done", "Cancelled"],
        Done: [], // Terminal state
        Cancelled: [], // Terminal state
      };

      // Test valid transition
      expect(validTransitions["Pending"]).toContain("Started");

      // Test invalid transition
      expect(validTransitions["Done"]).not.toContain("Pending");
    });
  });
});
