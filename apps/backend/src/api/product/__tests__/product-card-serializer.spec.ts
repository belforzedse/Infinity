const mockStrapi = {};

jest.mock("@strapi/strapi", () => ({
  factories: {
    createCoreService: jest.fn((_uid, factory) => factory({ strapi: mockStrapi })),
  },
}));

import productService from "../services/product";

const service = productService as any;

const makeProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  Title: "Card Product",
  Slug: "card-product",
  SeenCount: 4,
  AverageRating: 4.5,
  CoverImage: {
    url: "/uploads/card.jpg",
    formats: {
      thumbnail: { url: "/uploads/card_thumb.jpg" },
    },
  },
  product_main_category: {
    Title: "Category",
    Slug: "category",
  },
  product_variations: [
    {
      id: 1,
      IsPublished: true,
      Price: 100000,
      DiscountPrice: 80000,
      product_stock: { Count: 2 },
      product_variation_color: { id: 1, Title: "Black", ColorCode: "#000000" },
    },
    {
      id: 2,
      IsPublished: true,
      Price: 90000,
      product_stock: { Count: 0 },
      product_variation_color: { id: 2, Title: "White", ColorCode: "#ffffff" },
    },
    {
      id: 3,
      IsPublished: false,
      Price: 50000,
      product_stock: { Count: 10 },
      product_variation_color: { id: 3, Title: "Red", ColorCode: "#ff0000" },
    },
  ],
  ...overrides,
});

describe("product card serializer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockStrapi as any).entityService = undefined;
  });

  it("serializes full card sections without exposing variations", () => {
    const card = service.serializeProductCard(makeProduct());

    expect(card).toMatchObject({
      id: 10,
      attributes: {
        Title: "Card Product",
        Slug: "card-product",
        SeenCount: 4,
        AverageRating: 4.5,
        Price: 100000,
        DiscountPrice: 80000,
        Discount: 20,
        IsAvailable: true,
        InventoryCount: 2,
        ColorsCount: 2,
        ColorCodes: ["#000000", "#ffffff"],
        CoverImage: {
          url: "/uploads/card.jpg",
        },
        product_main_category: {
          Title: "Category",
          Slug: "category",
        },
      },
    });
    expect(card.attributes.product_variations).toBeUndefined();
  });

  it("marks zero-stock published products unavailable while preserving display data", () => {
    const card = service.serializeProductCard(
      makeProduct({
        product_variations: [
          {
            id: 1,
            IsPublished: true,
            Price: 90000,
            product_stock: { Count: 0 },
            product_variation_color: { id: 1, Title: "White", ColorCode: "#ffffff" },
          },
        ],
      }),
    );

    expect(card.attributes.Price).toBe(90000);
    expect(card.attributes.IsAvailable).toBe(false);
    expect(card.attributes.InventoryCount).toBe(0);
    expect(card.attributes.ColorsCount).toBe(1);
  });

  it("does not treat unpublished, zero-price, or zero-stock variations as purchasable", () => {
    expect(
      service.hasPublishedStockedVariation({
        product_variations: [
          { IsPublished: false, Price: 100000, product_stock: { Count: 10 } },
          { IsPublished: true, Price: 0, product_stock: { Count: 10 } },
          { IsPublished: true, Price: 100000, product_stock: { Count: 0 } },
        ],
      }),
    ).toBe(false);

    expect(
      service.hasPublishedStockedVariation({
        product_variations: [
          { IsPublished: true, Price: 100000, product_stock: { Count: 1 } },
        ],
      }),
    ).toBe(true);
  });

  it("dedupes requested product IDs when fetching card entities", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    (mockStrapi as any).entityService = { findMany };

    await service.findProductCardEntitiesByIds([12, 12, 5], {
      Status: { $eq: "Active" },
    });

    expect(findMany).toHaveBeenCalledWith(
      "api::product.product",
      expect.objectContaining({
        filters: expect.objectContaining({
          id: { $in: [12, 5] },
          Status: { $eq: "Active" },
        }),
        limit: 2,
      }),
    );
  });
});
