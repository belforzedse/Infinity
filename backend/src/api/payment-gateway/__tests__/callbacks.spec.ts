import { verifyPaymentHandler } from "../../order/controllers/helpers/payment";
import { autoGenerateBarcodeIfEligible } from "../../order/controllers/helpers/autoBarcode";

jest.mock("../../order/controllers/helpers/autoBarcode", () => ({
  autoGenerateBarcodeIfEligible: jest.fn(),
}));

type StrapiMockHelpers = ReturnType<typeof createStrapiMock>;

const createCtx = (overrides: Partial<any> = {}) => {
  const ctx: any = {
    request: {
      method: "POST",
      ip: "127.0.0.1",
      header: {
        "content-type": "application/json",
        "user-agent": "jest",
        "x-forwarded-for": "127.0.0.1",
      },
      body: {},
      query: {},
      ...overrides.request,
    },
    badRequest: jest.fn((message: string, payload?: unknown) => {
      const error: any = new Error(message);
      error.status = 400;
      error.payload = payload;
      throw error;
    }),
    redirect: jest.fn(),
    ...overrides,
  };

  return ctx;
};

const createStrapiMock = () => {
  const serviceMap: Record<string, any> = {};
  const strapi: any = {
    log: {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    },
    entityService: {
      findOne: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    service: jest.fn((uid: string) => serviceMap[uid]),
  };

  const registerService = (uid: string, impl: any) => {
    serviceMap[uid] = impl;
  };

  return { strapi, registerService };
};

describe("verifyPaymentHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("cancels the order and redirects when Mellat reports a failure", async () => {
    const { strapi } = createStrapiMock();
    const ctx = createCtx({
      request: {
        body: {
          ResCode: "17",
          OrderId: "100",
          SaleOrderId: "100",
          SaleReferenceId: "ABC",
          RefId: "XYZ",
        },
      },
    });

    await verifyPaymentHandler(strapi as any, ctx);

    expect(strapi.entityService.update).toHaveBeenCalledWith(
      "api::order.order",
      100,
      { data: { Status: "Cancelled" } },
    );
    expect(strapi.entityService.create).toHaveBeenCalledWith(
      "api::order-log.order-log",
      expect.objectContaining({
        data: expect.objectContaining({
          order: 100,
          Description: "Gateway callback failure/cancellation",
        }),
      }),
    );
    expect(ctx.redirect).toHaveBeenCalledWith(
      "https://infinity.rgbgroup.ir/payment/cancelled?orderId=100&reason=user-cancelled",
    );
  });

  it("settles a successful Mellat callback and decrements stock", async () => {
    const { strapi, registerService } = createStrapiMock();
    const mellatService = {
      verifyTransaction: jest.fn().mockResolvedValue({ success: true }),
      settleTransaction: jest.fn().mockResolvedValue({
        success: true,
        resCode: 0,
      }),
    };
    registerService("api::payment-gateway.mellat-v3", mellatService);

    const orderWithItems = {
      id: 200,
      order_items: [
        {
          Count: 2,
          product_variation: {
            product_stock: { id: 5, Count: 10 },
          },
        },
      ],
    };
    (strapi.entityService.findOne as jest.Mock).mockResolvedValueOnce(
      orderWithItems,
    );

    const ctx = createCtx({
      request: {
        body: {
          ResCode: "0",
          OrderId: "200",
          SaleOrderId: "200",
          SaleReferenceId: "REF-123",
        },
      },
    });

    await verifyPaymentHandler(strapi as any, ctx);

    expect(mellatService.verifyTransaction).toHaveBeenCalledWith({
      orderId: "200",
      saleOrderId: "200",
      saleReferenceId: "REF-123",
    });
    expect(mellatService.settleTransaction).toHaveBeenCalled();

    expect(strapi.entityService.update).toHaveBeenCalledWith(
      "api::product-stock.product-stock",
      5,
      { data: { Count: 8 } },
    );
    expect(strapi.entityService.update).toHaveBeenCalledWith(
      "api::order.order",
      200,
      expect.objectContaining({ data: { Status: "Started" } }),
    );
    expect(autoGenerateBarcodeIfEligible).toHaveBeenCalledWith(
      strapi,
      200,
    );
    expect(strapi.entityService.create).toHaveBeenCalledWith(
      "api::order-log.order-log",
      expect.objectContaining({
        data: expect.objectContaining({
          Description: "Gateway callback success (verify+settle)",
        }),
      }),
    );
    expect(ctx.redirect).toHaveBeenCalledWith(
      "https://infinity.rgbgroup.ir/payment/success?orderId=200",
    );
  });

  it("rejects SnappPay callback without a payment token", async () => {
    const { strapi, registerService } = createStrapiMock();
    registerService("api::payment-gateway.snappay", {
      verify: jest.fn(),
      settle: jest.fn(),
      revert: jest.fn(),
    });

    (strapi.entityService.findMany as jest.Mock).mockImplementation(
      async (uid: string, params: any) => {
        if (
          uid === "api::contract-transaction.contract-transaction" &&
          params.filters?.contract
        ) {
          return [];
        }
        return [];
      },
    );

    const ctx = createCtx({
      request: {
        body: {
          state: "OK",
          transactionId: "SN-1",
          OrderId: "600",
        },
      },
    });

    await verifyPaymentHandler(strapi as any, ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith(
      "Missing payment token for SnappPay",
      expect.objectContaining({
        data: expect.objectContaining({ error: "Missing paymentToken" }),
      }),
    );
    expect(ctx.redirect).toHaveBeenCalledWith(
      "https://infinity.rgbgroup.ir/payment/failure?error=Internal%20server%20error",
    );
  });

  it("verifies and settles a SnappPay callback successfully", async () => {
    const { strapi, registerService } = createStrapiMock();
    const snappayService = {
      status: jest
        .fn()
        .mockResolvedValueOnce({
          successful: true,
          response: { status: "VERIFY_PENDING", transactionId: "SN-OK" },
        })
        .mockResolvedValueOnce({
          successful: true,
          response: { status: "SETTLED", transactionId: "SN-OK" },
        }),
      verify: jest.fn().mockResolvedValue({ successful: true }),
      settle: jest.fn().mockResolvedValue({ successful: true }),
      revert: jest.fn(),
    };
    registerService("api::payment-gateway.snappay", snappayService);

    (strapi.entityService.findOne as jest.Mock).mockImplementation(
      async (uid: string) => {
        if (uid === "api::order.order") {
          return {
            id: 700,
            order_items: [
              {
                Count: 1,
                product_variation: {
                  product_stock: { id: 301, Count: 5 },
                },
              },
            ],
          };
        }
        return null;
      },
    );

    const ctx = createCtx({
      request: {
        body: {
          OrderId: "700",
          state: "OK",
          transactionId: "SN-OK",
          paymentToken: "PT-OK",
        },
      },
    });

    await verifyPaymentHandler(strapi as any, ctx);

    expect(snappayService.status).toHaveBeenCalledTimes(2);
    expect(snappayService.verify).toHaveBeenCalledWith("PT-OK");
    expect(snappayService.settle).toHaveBeenCalledWith("PT-OK");

    expect(strapi.entityService.update).toHaveBeenCalledWith(
      "api::product-stock.product-stock",
      301,
      { data: { Count: 4 } },
    );
    expect(strapi.entityService.update).toHaveBeenCalledWith(
      "api::order.order",
      700,
      { data: { Status: "Started" } },
    );
    expect(autoGenerateBarcodeIfEligible).toHaveBeenCalledWith(strapi, 700);
    expect(strapi.entityService.create).toHaveBeenCalledWith(
      "api::order-log.order-log",
      expect.objectContaining({
        data: expect.objectContaining({
          order: 700,
          Description: expect.stringContaining("SnappPay verify+settle succeeded"),
        }),
      }),
    );
    expect(ctx.redirect).toHaveBeenCalledWith(
      "https://infinity.rgbgroup.ir/payment/success?orderId=700&transactionId=SN-OK",
    );
  });
});
