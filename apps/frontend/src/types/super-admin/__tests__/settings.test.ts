import {
  normalizeHomeGifPromoAssignment,
  normalizeSuperAdminSettings,
} from "../settings";

describe("home GIF promo settings", () => {
  it("caps manual assignments at four unique positive IDs", () => {
    expect(
      normalizeHomeGifPromoAssignment({
        mode: "manual",
        productIds: [3, 2, 2, 0, -1, "7", 9, 10],
        categorySlug: "ignored",
      }),
    ).toEqual({
      mode: "manual",
      productIds: [3, 2, 7, 9],
      categorySlug: "",
    });
  });

  it("keeps category assignments independent from manual IDs", () => {
    expect(
      normalizeHomeGifPromoAssignment({
        mode: "category",
        categorySlug: " coats ",
        productIds: [1, 2, 3],
      }),
    ).toEqual({
      mode: "category",
      categorySlug: "coats",
      productIds: [],
    });
  });

  it("falls back invalid modes to manual", () => {
    expect(
      normalizeHomeGifPromoAssignment({
        mode: "unknown",
        productIds: [5],
        categorySlug: "coats",
      }),
    ).toEqual({
      mode: "manual",
      productIds: [5],
      categorySlug: "",
    });
  });

  it("normalizes slot assignments independently", () => {
    const settings = normalizeSuperAdminSettings({
      homeGifPromoSlot1Assignment: { mode: "manual", productIds: [1, 2] },
      homeGifPromoSlot2Assignment: { mode: "category", categorySlug: "scarves" },
    });

    expect(settings.homeGifPromoSlot1Assignment).toEqual({
      mode: "manual",
      productIds: [1, 2],
      categorySlug: "",
    });
    expect(settings.homeGifPromoSlot2Assignment).toEqual({
      mode: "category",
      categorySlug: "scarves",
      productIds: [],
    });
  });
});
