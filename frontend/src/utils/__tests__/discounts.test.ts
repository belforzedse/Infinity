import {
  parseNumber,
  computeDiscountForVariation,
  hasActiveDiscount,
  applyDiscountToProductCard,
  type DiscountComputationResult,
} from "../discounts";
import type { ProductCardProps } from "@/components/Product/Card";

describe("parseNumber", () => {
  it("should parse number values", () => {
    expect(parseNumber(100)).toBe(100);
    expect(parseNumber(0)).toBe(0);
    expect(parseNumber(-50)).toBe(-50);
  });

  it("should parse string numbers", () => {
    expect(parseNumber("100")).toBe(100);
    expect(parseNumber("1,000")).toBe(1000);
    expect(parseNumber("1,234.56")).toBe(1234.56);
    expect(parseNumber(" 42 ")).toBe(42);
  });

  it("should return undefined for invalid values", () => {
    expect(parseNumber(null)).toBeUndefined();
    expect(parseNumber(undefined)).toBeUndefined();
    expect(parseNumber("")).toBeUndefined();
    expect(parseNumber("   ")).toBeUndefined();
    expect(parseNumber("abc")).toBeUndefined();
    expect(parseNumber(NaN)).toBeUndefined();
    expect(parseNumber(Infinity)).toBeUndefined();
  });
});

describe("computeDiscountForVariation", () => {
  it("should return null when no price is provided", () => {
    expect(computeDiscountForVariation({})).toBeNull();
    expect(computeDiscountForVariation({ Price: null })).toBeNull();
    expect(computeDiscountForVariation({ Price: 0 })).toBeNull();
    expect(computeDiscountForVariation({ Price: -100 })).toBeNull();
  });

  it("should return no discount when no discount is available", () => {
    const result = computeDiscountForVariation({ Price: 100 });
    expect(result).toEqual({
      basePrice: 100,
      finalPrice: 100,
      discountAmount: 0,
    });
  });

  it("should compute listed discount price", () => {
    const result = computeDiscountForVariation({
      Price: 1000,
      DiscountPrice: 800,
    });
    expect(result).toEqual({
      basePrice: 1000,
      finalPrice: 800,
      discountAmount: 200,
      discountPercent: 20,
      discountSource: "listed",
    });
  });

  it("should ignore invalid discount prices", () => {
    const result1 = computeDiscountForVariation({
      Price: 1000,
      DiscountPrice: 0,
    });
    expect(result1?.discountAmount).toBe(0);

    const result2 = computeDiscountForVariation({
      Price: 1000,
      DiscountPrice: 1000,
    });
    expect(result2?.discountAmount).toBe(0);

    const result3 = computeDiscountForVariation({
      Price: 1000,
      DiscountPrice: 1200,
    });
    expect(result3?.discountAmount).toBe(0);
  });

  it("should compute general percentage discount", () => {
    const now = new Date("2024-06-15");
    const result = computeDiscountForVariation(
      {
        Price: 1000,
        general_discounts: {
          data: [
            {
              id: 1,
              attributes: {
                IsActive: true,
                Type: "Discount",
                Amount: 25,
                StartDate: "2024-06-01",
                EndDate: "2024-06-30",
              },
            },
          ],
        },
      },
      { now },
    );

    expect(result).toEqual({
      basePrice: 1000,
      finalPrice: 750,
      discountAmount: 250,
      discountPercent: 25,
      discountSource: "general",
      generalDiscountId: 1,
    });
  });

  it("should compute general fixed amount discount", () => {
    const now = new Date("2024-06-15");
    const result = computeDiscountForVariation(
      {
        Price: 1000,
        general_discounts: {
          data: {
            id: 2,
            attributes: {
              IsActive: true,
              Type: "Fixed",
              Amount: 150,
              StartDate: "2024-06-01",
              EndDate: "2024-06-30",
            },
          },
        },
      },
      { now },
    );

    expect(result).toEqual({
      basePrice: 1000,
      finalPrice: 850,
      discountAmount: 150,
      discountPercent: 15,
      discountSource: "general",
      generalDiscountId: 2,
    });
  });

  it("should respect discount limit amount", () => {
    const now = new Date("2024-06-15");
    const result = computeDiscountForVariation(
      {
        Price: 10000,
        general_discounts: {
          data: {
            id: 3,
            attributes: {
              IsActive: true,
              Type: "Discount",
              Amount: 50,
              LimitAmount: 2000,
              StartDate: "2024-06-01",
              EndDate: "2024-06-30",
            },
          },
        },
      },
      { now },
    );

    expect(result?.discountAmount).toBe(2000);
    expect(result?.finalPrice).toBe(8000);
  });

  it("should ignore inactive discounts", () => {
    const now = new Date("2024-06-15");
    const result = computeDiscountForVariation(
      {
        Price: 1000,
        general_discounts: {
          data: {
            attributes: {
              IsActive: false,
              Type: "Discount",
              Amount: 50,
            },
          },
        },
      },
      { now },
    );

    expect(result?.discountAmount).toBe(0);
  });

  it("should ignore discounts outside date range", () => {
    const now = new Date("2024-06-15");

    const beforeStart = computeDiscountForVariation(
      {
        Price: 1000,
        general_discounts: {
          data: {
            attributes: {
              IsActive: true,
              Type: "Discount",
              Amount: 25,
              StartDate: "2024-06-20",
            },
          },
        },
      },
      { now },
    );
    expect(beforeStart?.discountAmount).toBe(0);

    const afterEnd = computeDiscountForVariation(
      {
        Price: 1000,
        general_discounts: {
          data: {
            attributes: {
              IsActive: true,
              Type: "Discount",
              Amount: 25,
              EndDate: "2024-06-10",
            },
          },
        },
      },
      { now },
    );
    expect(afterEnd?.discountAmount).toBe(0);
  });

  it("should respect minimum amount", () => {
    const now = new Date("2024-06-15");
    const result = computeDiscountForVariation(
      {
        Price: 500,
        general_discounts: {
          data: {
            attributes: {
              IsActive: true,
              Type: "Discount",
              Amount: 20,
              MinimumAmount: 1000,
            },
          },
        },
      },
      { now },
    );

    expect(result?.discountAmount).toBe(0);
  });

  it("should choose the best discount from multiple options", () => {
    const now = new Date("2024-06-15");
    const result = computeDiscountForVariation(
      {
        Price: 1000,
        DiscountPrice: 800,
        general_discounts: {
          data: [
            {
              id: 1,
              attributes: {
                IsActive: true,
                Type: "Discount",
                Amount: 30,
              },
            },
            {
              id: 2,
              attributes: {
                IsActive: true,
                Type: "Discount",
                Amount: 25,
              },
            },
          ],
        },
      },
      { now },
    );

    expect(result?.discountAmount).toBe(300);
    expect(result?.discountPercent).toBe(30);
    expect(result?.generalDiscountId).toBe(1);
  });

  it("should handle discount in general_discount field", () => {
    const now = new Date("2024-06-15");
    const result = computeDiscountForVariation(
      {
        Price: 1000,
        general_discount: {
          data: {
            id: 5,
            attributes: {
              IsActive: true,
              Type: "Discount",
              Amount: 15,
            },
          },
        },
      },
      { now },
    );

    expect(result?.discountAmount).toBe(150);
    expect(result?.generalDiscountId).toBe(5);
  });
});

describe("hasActiveDiscount", () => {
  it("should return true when there is an active discount", () => {
    expect(
      hasActiveDiscount({
        Price: 1000,
        DiscountPrice: 800,
      }),
    ).toBe(true);
  });

  it("should return false when there is no discount", () => {
    expect(
      hasActiveDiscount({
        Price: 1000,
      }),
    ).toBe(false);
  });

  it("should return false for invalid variations", () => {
    expect(hasActiveDiscount({})).toBe(false);
    expect(hasActiveDiscount({ Price: 0 })).toBe(false);
  });
});

describe("applyDiscountToProductCard", () => {
  it("should apply discount to product card", () => {
    const product: ProductCardProps = {
      id: 1,
      title: "Test Product",
      price: 1000,
      image: "/test.jpg",
      slug: "test",
      href: "/test",
    };

    const discount: DiscountComputationResult = {
      basePrice: 1000,
      finalPrice: 750,
      discountAmount: 250,
      discountPercent: 25,
      discountSource: "general",
    };

    const result = applyDiscountToProductCard(product, discount);

    expect(result).toEqual({
      ...product,
      discount: 25,
      discountPrice: 750,
    });
  });

  it("should remove discount properties when no valid discount", () => {
    const product: ProductCardProps = {
      id: 1,
      title: "Test Product",
      price: 1000,
      image: "/test.jpg",
      slug: "test",
      href: "/test",
      discount: 20,
      discountPrice: 800,
    };

    const noDiscount: DiscountComputationResult = {
      basePrice: 1000,
      finalPrice: 1000,
      discountAmount: 0,
    };

    const result = applyDiscountToProductCard(product, noDiscount);

    expect(result.discount).toBeUndefined();
    expect(result.discountPrice).toBeUndefined();
  });

  it("should handle null discount", () => {
    const product: ProductCardProps = {
      id: 1,
      title: "Test Product",
      price: 1000,
      image: "/test.jpg",
      slug: "test",
      href: "/test",
      discount: 10,
      discountPrice: 900,
    };

    const result = applyDiscountToProductCard(product, null);

    expect(result.discount).toBeUndefined();
    expect(result.discountPrice).toBeUndefined();
  });
});
