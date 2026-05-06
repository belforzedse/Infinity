import { describe, it, expect, jest } from "@jest/globals";
import { finalizeToOrderHandler } from "../controllers/handlers/finalizeToOrder";
import { createCtx, createStrapiMock } from "../../../__tests__/helpers/test-utils";

describe("finalizeToOrder handler - inline billing address", () => {
  it("rejects when no addressId or addressPayload is provided", async () => {
    const { strapi } = createStrapiMock();
    const handler = finalizeToOrderHandler(strapi as any);

    const ctx = createCtx({
      request: { body: { shipping: 1, shippingCost: 0 } },
      state: { user: { id: 1 } },
    });

    await expect(handler(ctx)).rejects.toMatchObject({
      status: 400,
      payload: expect.objectContaining({
        data: expect.objectContaining({ errorCode: "ADDRESS_REQUIRED" }),
      }),
    });
  });

  it("rejects inline address with invalid postal code", async () => {
    const { strapi, registerService } = createStrapiMock();

    // Minimal shipping + city mocks for validation steps
    strapi.entityService.findOne = (jest.fn((uid: string) => {
      if (uid === "api::shipping.shipping") return { id: 1, Title: "Mock Shipping" };
      if (uid === "api::shipping-city.shipping-city")
        return { id: 10, shipping_province: { id: 20, Title: "Tehran" } };
      return null;
    }) as any);

    // Cart service is never called in this validation path, but register stub to avoid undefined
    registerService("api::cart.cart", {
      finalizeCartToOrder: jest.fn(),
    });

    const handler = finalizeToOrderHandler(strapi as any);
    const ctx = createCtx({
      request: {
        body: {
          shipping: 1,
          shippingCost: 0,
          addressPayload: {
            shipping_city: 10,
            PostalCode: "123", // invalid
            FullAddress: "Test address",
            save: false,
          },
        },
      },
      state: { user: { id: 1 } },
    });

    await expect(handler(ctx)).rejects.toMatchObject({
      status: 400,
      payload: expect.objectContaining({
        data: expect.objectContaining({ errorCode: "INVALID_POSTAL_CODE" }),
      }),
    });
  });
});

