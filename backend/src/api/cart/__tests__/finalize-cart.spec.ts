import { finalizeToOrderHandler } from "../controllers/handlers/finalizeToOrder";
import {
  requestMellatPayment,
  requestSamanPayment,
  requestSnappPayment,
} from "../controllers/handlers/gateway-helpers";
import { deductWalletBalanceAtomic } from "../../local-user-wallet/services/local-user-wallet";

jest.mock("../controllers/handlers/gateway-helpers", () => ({
  requestMellatPayment: jest.fn(),
  requestSamanPayment: jest.fn(),
  requestSnappPayment: jest.fn(),
}));

jest.mock("../../local-user-wallet/services/local-user-wallet", () => ({
  deductWalletBalanceAtomic: jest.fn().mockResolvedValue({
    success: true,
    walletId: 99,
    newBalance: 5000000,
  }),
}));

type StrapiMockHelpers = ReturnType<typeof createStrapiMock>;

// Creates a lightweight Koa-like ctx with error helpers that throw, allowing tests to assert on badRequest/unauthorized behaviours.
const createCtx = (overrides: Partial<any> = {}) => {
  const ctx: any = {
    request: {
      body: {},
      header: {},
      ...overrides.request,
    },
    state: {
      user: { id: 1 },
      ...overrides.state,
    },
    badRequest: jest.fn((message: string, payload?: unknown) => {
      const error: any = new Error(message);
      error.status = 400;
      error.payload = payload;
      throw error;
    }),
    unauthorized: jest.fn((message: string) => {
      const error: any = new Error(message);
      error.status = 401;
      throw error;
    }),
    ...overrides,
  };

  return ctx;
};

// Minimal Strapi mock with registries so tests can attach per-UID services/queries.
const createStrapiMock = () => {
  const serviceMap: Record<string, any> = {};
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
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
    },
    service: jest.fn((uid: string) => serviceMap[uid]),
    db: {
      query: jest.fn((uid: string) => queryMap[uid]),
      connection: {
        raw: jest.fn().mockResolvedValue({ rows: [] }),
      },
    },
  };

  const registerService = (uid: string, impl: any) => {
    serviceMap[uid] = impl;
  };

  const registerQuery = (uid: string, impl: any) => {
    queryMap[uid] = impl;
  };

  return { strapi, registerService, registerQuery };
};

// Convenience helper for supplying multiple entityService.findOne implementations in one go.
const mockEntityFindOne = (
  strapi: StrapiMockHelpers["strapi"],
  implementations: Record<string, (...args: any[]) => any>,
) => {
  (strapi.entityService.findOne as jest.Mock).mockImplementation(
    async (uid: string, ...args: any[]) => {
      const handler = implementations[uid];
      return handler ? handler(...args) : null;
    },
  );
};

const mockedRequestMellatPayment = requestMellatPayment as jest.MockedFunction<
  typeof requestMellatPayment
>;
const mockedRequestSnappPayment = requestSnappPayment as jest.MockedFunction<
  typeof requestSnappPayment
>;
const mockedRequestSamanPayment = requestSamanPayment as jest.MockedFunction<
  typeof requestSamanPayment
>;

describe("finalizeToOrderHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects the request when required shipping data is missing", async () => {
    const { strapi } = createStrapiMock();
    const handler = finalizeToOrderHandler(strapi);
    const ctx = createCtx({
      request: { body: { addressId: 10 } },
    });

    await expect(handler(ctx)).rejects.toMatchObject({
      message: "روش ارسال الزامی است",
      status: 400,
    });

    expect(ctx.badRequest).toHaveBeenCalledWith(
      "روش ارسال الزامی است",
      expect.objectContaining({
        data: expect.objectContaining({ errorCode: "SHIPPING_REQUIRED" }),
      }),
    );
    expect(strapi.entityService.findOne).not.toHaveBeenCalled();
  });

  it("rejects the request when the shipping method cannot be found", async () => {
    const { strapi } = createStrapiMock();
    mockEntityFindOne(strapi, {
      "api::shipping.shipping": () => null,
    });
    const handler = finalizeToOrderHandler(strapi);
    const ctx = createCtx({
      request: { body: { shipping: 99, addressId: 1 } },
    });

    await expect(handler(ctx)).rejects.toMatchObject({
      message: "خطا در بررسی روش ارسال",
    });

    expect(ctx.badRequest).toHaveBeenCalledWith(
      "روش ارسال انتخاب شده معتبر نیست",
      expect.objectContaining({
        data: expect.objectContaining({ errorCode: "INVALID_SHIPPING" }),
      }),
    );
  });

  it("settles the order immediately when wallet funding succeeds", async () => {
    const { strapi, registerService, registerQuery } = createStrapiMock();
    const cartService = {
      finalizeCartToOrder: jest.fn().mockResolvedValue({
        success: true,
        order: { id: 42 },
        contract: { id: 7, Amount: 250_000 },
        financialSummary: { payable: 250_000 },
      }),
    };
    registerService("api::cart.cart", cartService);

    const walletRecord = { id: 99, Balance: 3_000_000 };
    registerQuery("api::local-user-wallet.local-user-wallet", {
      findOne: jest.fn().mockResolvedValue(walletRecord),
    });

    const orderWithItems = {
      id: 42,
      order_items: [
        {
          Count: 2,
          product_variation: {
            product_stock: { id: 55, Count: 10 },
          },
        },
      ],
    };

  mockEntityFindOne(strapi, {
    "api::shipping.shipping": () => ({ id: 4, Title: "Pickup" }),
    "api::local-user-address.local-user-address": () => ({
      id: 18,
      shipping_city: {},
      user: { id: 1 },
    }),
      "api::order.order": () => orderWithItems,
    });

    const ctx = createCtx({
      request: {
        body: {
          shipping: 4,
          addressId: 18,
          gateway: "wallet",
          shippingCost: 0,
          mobile: "09120000000",
        },
      },
    });

    const handler = finalizeToOrderHandler(strapi);
    const response = await handler(ctx);

    expect(response.data).toMatchObject({
      success: true,
      message: "Order paid via wallet.",
      orderId: 42,
      contractId: 7,
      requestId: "wallet",
    });

    expect(cartService.finalizeCartToOrder).toHaveBeenCalledWith(
      ctx.state.user.id,
      expect.objectContaining({
        shippingId: 4,
        addressId: 18,
      }),
    );

    expect(strapi.entityService.create).toHaveBeenCalledWith(
      "api::local-user-wallet-transaction.local-user-wallet-transaction",
      expect.objectContaining({
        data: expect.objectContaining({
          Amount: 2_500_000,
          Type: "Minus",
          user_wallet: walletRecord.id,
        }),
      }),
    );

    expect(strapi.entityService.update).toHaveBeenCalledWith(
      "api::order.order",
      42,
      { data: { Status: "Started" } },
    );

    expect(strapi.entityService.create).toHaveBeenCalledWith(
      "api::order-log.order-log",
      expect.objectContaining({
        data: expect.objectContaining({
          Description: expect.stringContaining("Wallet payment success"),
        }),
      }),
    );
  });

  it("fails fast when wallet balance is insufficient", async () => {
    const { strapi, registerService, registerQuery } = createStrapiMock();
    registerService("api::cart.cart", {
      finalizeCartToOrder: jest.fn().mockResolvedValue({
        success: true,
        order: { id: 10 },
        contract: { id: 20, Amount: 100_000 },
        financialSummary: { payable: 100_000 },
      }),
    });
    registerQuery("api::local-user-wallet.local-user-wallet", {
      findOne: jest.fn().mockResolvedValue({ id: 5, Balance: 100_000 }),
    });
    (deductWalletBalanceAtomic as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: "Wallet balance is insufficient",
    });
    mockEntityFindOne(strapi, {
      "api::shipping.shipping": () => ({ id: 1 }),
      "api::local-user-address.local-user-address": () => ({ id: 2, shipping_city: {}, user: { id: 1 } }),
    });

    const ctx = createCtx({
      request: {
        body: {
          shipping: 1,
          addressId: 2,
          gateway: "wallet",
        },
      },
    });

    const handler = finalizeToOrderHandler(strapi);
    await expect(handler(ctx)).rejects.toMatchObject({
      message: "Wallet balance is insufficient",
    });

    expect(ctx.badRequest).toHaveBeenCalledWith(
      "Wallet balance is insufficient",
      expect.objectContaining({
        data: expect.objectContaining({ error: "insufficient_wallet" }),
      }),
    );
  });

  it("propagates stock issues reported by finalizeCartToOrder", async () => {
    const { strapi, registerService } = createStrapiMock();
    registerService("api::cart.cart", {
      finalizeCartToOrder: jest.fn().mockResolvedValue({
        success: false,
        message: "Stock issues prevent order creation",
        itemsRemoved: [{ id: 1 }],
      }),
    });
  mockEntityFindOne(strapi, {
    "api::shipping.shipping": () => ({ id: 2 }),
    "api::local-user-address.local-user-address": () => ({ id: 3, shipping_city: {}, user: { id: 1 } }),
  });

    const ctx = createCtx({
      request: {
        body: {
          shipping: 2,
          addressId: 3,
          gateway: "mellat",
        },
      },
    });

    const handler = finalizeToOrderHandler(strapi);
    await expect(handler(ctx)).rejects.toMatchObject({
      message: "Stock issues prevent order creation",
    });

    expect(ctx.badRequest).toHaveBeenCalledWith(
      "Stock issues prevent order creation",
      expect.objectContaining({
        data: expect.objectContaining({
          success: false,
          itemsRemoved: [{ id: 1 }],
        }),
      }),
    );
  });

  it("cancels the order when the external gateway rejects the payment", async () => {
    const { strapi, registerService } = createStrapiMock();
    const cartService = {
      finalizeCartToOrder: jest.fn().mockResolvedValue({
        success: true,
        order: { id: 501 },
        contract: { id: 77, Amount: 180_000 },
        financialSummary: { payable: 180_000 },
      }),
    };
    registerService("api::cart.cart", cartService);

  mockEntityFindOne(strapi, {
    "api::shipping.shipping": () => ({ id: 4 }),
    "api::local-user-address.local-user-address": () => ({
      id: 22,
      shipping_city: {},
      user: { id: 9 },
    }),
  });

    mockedRequestMellatPayment.mockResolvedValue({
      success: false,
      error: "Gateway down",
      requestId: "REQ-123",
      detailedError: { code: "XX" },
    });

    const ctx = createCtx({
      request: {
        body: {
          shipping: 4,
          addressId: 22,
          gateway: "mellat",
          shippingCost: 0,
        },
      },
      state: { user: { id: 9 } },
    });

    const handler = finalizeToOrderHandler(strapi);

    await expect(handler(ctx)).rejects.toMatchObject({
      message: "Gateway down",
      status: 400,
    });

    expect(mockedRequestMellatPayment).toHaveBeenCalledWith(
      strapi,
      expect.objectContaining({
        orderId: 501,
        amount: 1_800_000,
        userId: 9,
        contractId: 77,
        callbackURL: undefined,
      }),
    );

    expect(strapi.entityService.create).toHaveBeenCalledWith(
      "api::order-log.order-log",
      expect.objectContaining({
        data: expect.objectContaining({
          Description: expect.stringContaining("Gateway payment request failed"),
          Changes: expect.objectContaining({ requestId: "REQ-123" }),
        }),
      }),
    );

    expect(strapi.entityService.update).toHaveBeenCalledWith(
      "api::order.order",
      501,
      { data: { Status: "Cancelled" } },
    );
    expect(strapi.entityService.update).toHaveBeenCalledWith(
      "api::contract.contract",
      77,
      { data: { Status: "Cancelled" } },
    );

    expect(ctx.badRequest).toHaveBeenCalledWith(
      "Gateway down",
      expect.objectContaining({
        data: expect.objectContaining({
          error: "Gateway down",
          requestId: "REQ-123",
        }),
      }),
    );
  });

  it("returns redirect information when Mellat payment request succeeds", async () => {
    const { strapi, registerService } = createStrapiMock();
    const cartService = {
      finalizeCartToOrder: jest.fn().mockResolvedValue({
        success: true,
        order: { id: 88 },
        contract: { id: 44, Amount: 320_000 },
        financialSummary: { payable: 320_000 },
      }),
    };
    registerService("api::cart.cart", cartService);

  mockEntityFindOne(strapi, {
    "api::shipping.shipping": () => ({ id: 4 }),
    "api::local-user-address.local-user-address": () => ({
      id: 12,
      shipping_city: {},
      user: { id: 1 },
    }),
  });

    mockedRequestMellatPayment.mockResolvedValue({
      success: true,
      redirectUrl: "https://bank.example/start/ABC",
      refId: "REF-1",
      requestId: "REQ-success",
    });

    const ctx = createCtx({
      request: {
        body: {
          shipping: 4,
          addressId: 12,
          gateway: "mellat",
          shippingCost: 0,
          callbackURL: "/custom/callback",
        },
      },
    });

    const handler = finalizeToOrderHandler(strapi);
    const response = await handler(ctx);

    expect(response.data).toMatchObject({
      success: true,
      message:
        "Order created successfully. Redirecting to payment gateway.",
      orderId: 88,
      contractId: 44,
      redirectUrl: "https://bank.example/start/ABC",
      refId: "REF-1",
      requestId: "REQ-success",
    });

    expect(mockedRequestMellatPayment).toHaveBeenCalledWith(
      strapi,
      expect.objectContaining({
        callbackURL: "/custom/callback",
      }),
    );

    expect(strapi.entityService.create).toHaveBeenCalledWith(
      "api::order-log.order-log",
      expect.objectContaining({
        data: expect.objectContaining({
          Description: expect.stringContaining("Gateway payment request initiated"),
          Changes: expect.objectContaining({
            redirectUrl: "https://bank.example/start/ABC",
            refId: "REF-1",
            requestId: "REQ-success",
          }),
        }),
      }),
    );

    expect(ctx.badRequest).not.toHaveBeenCalled();
  });

  it("returns redirect information when Saman payment request succeeds", async () => {
    const { strapi, registerService } = createStrapiMock();
    registerService("api::cart.cart", {
      finalizeCartToOrder: jest.fn().mockResolvedValue({
        success: true,
        order: { id: 91 },
        contract: { id: 55, Amount: 220_000 },
        financialSummary: { payable: 220_000 },
      }),
    });

  mockEntityFindOne(strapi, {
    "api::shipping.shipping": () => ({ id: 3 }),
    "api::local-user-address.local-user-address": () => ({
      id: 9,
      shipping_city: {},
      user: { id: 1 },
    }),
  });

    mockedRequestSamanPayment.mockResolvedValue({
      paymentResult: {
        success: true,
        redirectUrl: "https://saman.example/start",
        refId: "SAM-REF",
        requestId: "SAM-REQUEST",
        resNum: "SAM-RES",
      },
    });

    const ctx = createCtx({
      request: {
        body: {
          shipping: 3,
          addressId: 9,
          gateway: "samankish",
          mobile: "09121234567",
        },
      },
    });

    const handler = finalizeToOrderHandler(strapi);
    const response = await handler(ctx);

    expect(response.data).toMatchObject({
      success: true,
      orderId: 91,
      contractId: 55,
      redirectUrl: "https://saman.example/start",
      refId: "SAM-REF",
      requestId: "SAM-REQUEST",
    });

    expect(mockedRequestSamanPayment).toHaveBeenCalledWith(
      strapi,
      expect.objectContaining({
        order: { id: 91 },
        contract: { id: 55, Amount: 220_000 },
        financialSummary: { payable: 220_000 },
        callbackURL: undefined,
        userId: ctx.state.user.id,
        cellNumber: "09121234567",
      }),
    );
    expect(mockedRequestMellatPayment).not.toHaveBeenCalled();
  });

  it("returns gateway-provided response for SnappPay", async () => {
    const { strapi, registerService } = createStrapiMock();
    registerService("api::cart.cart", {
      finalizeCartToOrder: jest.fn().mockResolvedValue({
        success: true,
        order: { id: 60 },
        contract: { id: 70, Amount: 200_000 },
        financialSummary: { payable: 200_000 },
      }),
    });

  mockEntityFindOne(strapi, {
    "api::shipping.shipping": () => ({ id: 5 }),
    "api::local-user-address.local-user-address": () => ({
      id: 6,
      shipping_city: {},
      user: { id: 1 },
    }),
  });

    mockedRequestSnappPayment.mockResolvedValue({
      response: { data: { redirectUrl: "https://snapp.test" } },
      paymentResult: undefined,
    } as any);

    const ctx = createCtx({
      request: {
        body: {
          shipping: 5,
          addressId: 6,
          gateway: "snappay",
        },
      },
    });

    const handler = finalizeToOrderHandler(strapi);
    const response = await handler(ctx);

    expect(response).toEqual({ data: { redirectUrl: "https://snapp.test" } });
    expect(mockedRequestSnappPayment).toHaveBeenCalledWith(
      strapi,
      ctx,
      expect.objectContaining({
        order: { id: 60 },
        contract: { id: 70, Amount: 200_000 },
      }),
    );
  });
});
