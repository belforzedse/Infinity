jest.mock("@strapi/strapi", () => ({
  factories: {
    createCoreController: (_uid: string, extension: any) => (params: any) => extension(params),
  },
}));

import { createStrapiMock, mockContext } from "../../../__tests__/mocks/factories";

describe("payment-gateway.availableGateways", () => {
  let controllerFactory: any;

  beforeAll(async () => {
    const mod = await import("../controllers/payment-gateway");
    controllerFactory = mod.default;
  });

  it("returns all supported gateways when no backend rows exist", async () => {
    const { strapi } = createStrapiMock();
    (strapi.entityService.findMany as jest.Mock).mockResolvedValue([]);
    const controller = controllerFactory({ strapi });
    const ctx = mockContext({});

    await controller.availableGateways(ctx);

    expect(ctx.send).toHaveBeenCalledWith({
      data: {
        gateways: [
          { code: "samankish", title: "سامان‌کیش" },
          { code: "mellat", title: "بانک ملت" },
          { code: "snappay", title: "پرداخت اقساطی اسنپ‌پی" },
          { code: "wallet", title: "کیف پول" },
        ],
      },
    });
  });

  it("excludes explicitly disabled gateways", async () => {
    const { strapi } = createStrapiMock();
    (strapi.entityService.findMany as jest.Mock).mockResolvedValue([
      { Title: "SnappPay", IsActive: false },
      { Title: "Saman Kish", IsActive: true },
    ]);
    const controller = controllerFactory({ strapi });
    const ctx = mockContext({});

    await controller.availableGateways(ctx);

    expect(ctx.send).toHaveBeenCalledWith({
      data: {
        gateways: [
          { code: "samankish", title: "سامان‌کیش" },
          { code: "mellat", title: "بانک ملت" },
          { code: "wallet", title: "کیف پول" },
        ],
      },
    });
  });

  it("ignores unknown gateway titles", async () => {
    const { strapi } = createStrapiMock();
    (strapi.entityService.findMany as jest.Mock).mockResolvedValue([
      { Title: "Unknown Gateway", IsActive: false },
      { Title: "Another Gateway", IsActive: false },
    ]);
    const controller = controllerFactory({ strapi });
    const ctx = mockContext({});

    await controller.availableGateways(ctx);

    expect(ctx.send).toHaveBeenCalledWith({
      data: {
        gateways: [
          { code: "samankish", title: "سامان‌کیش" },
          { code: "mellat", title: "بانک ملت" },
          { code: "snappay", title: "پرداخت اقساطی اسنپ‌پی" },
          { code: "wallet", title: "کیف پول" },
        ],
      },
    });
  });
});
