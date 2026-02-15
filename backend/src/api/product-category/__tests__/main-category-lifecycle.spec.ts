import lifecycles from "../content-types/product-category/lifecycles";

describe("product-category main category lifecycle rules", () => {
  const mockStrapi = global.strapi as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("forces isMainCategory=false for child categories during create", async () => {
    const event = {
      params: {
        data: {
          parent: 10,
          isMainCategory: true,
          Image: { any: "value" },
          Color: "#f8fafc",
        },
      },
    };

    await lifecycles.beforeCreate(event as any);

    expect(event.params.data.isMainCategory).toBe(false);
    expect(event.params.data.Image).toBeNull();
    expect(event.params.data.Color).toBeNull();
  });

  it("forces isMainCategory=false when update payload makes category a child", async () => {
    const event = {
      params: {
        data: {
          parent: { connect: [{ id: 11 }] },
          isMainCategory: true,
          Image: { any: "value" },
          Color: "#f8fafc",
        },
      },
    };

    await lifecycles.beforeUpdate(event as any);

    expect(event.params.data.isMainCategory).toBe(false);
    expect(event.params.data.Image).toBeNull();
    expect(event.params.data.Color).toBeNull();
    expect(mockStrapi.entityService.findOne).not.toHaveBeenCalled();
  });

  it("uses persisted parent relation when update payload omits parent", async () => {
    mockStrapi.entityService.findOne.mockResolvedValueOnce({
      id: 42,
      parent: { id: 12 },
    });

    const event = {
      params: {
        where: { id: 42 },
        data: {
          isMainCategory: true,
        },
      },
    };

    await lifecycles.beforeUpdate(event as any);

    expect(mockStrapi.entityService.findOne).toHaveBeenCalledTimes(1);
    expect(event.params.data.isMainCategory).toBe(false);
  });

  it("keeps top-level categories eligible as main categories", async () => {
    const event = {
      params: {
        data: {
          parent: null,
          isMainCategory: true,
          Color: "#ffffff",
        },
      },
    };

    await lifecycles.beforeUpdate(event as any);

    expect(event.params.data.isMainCategory).toBe(true);
    expect(event.params.data.Color).toBe("#ffffff");
  });
});
