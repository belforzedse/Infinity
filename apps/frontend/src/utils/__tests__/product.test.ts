import {
  getMinInStockVariationPrice,
  getProductPrimaryPricing,
  hasAvailableStock,
} from "@/utils/product";

describe("product utilities", () => {
  it("identifies stock availability from published variations", () => {
    const inStockProduct = {
      attributes: {
        product_variations: {
          data: [
            {
              attributes: {
                IsPublished: true,
                product_stock: { data: { attributes: { Count: 3 } } },
              },
            },
            {
              attributes: {
                IsPublished: false,
                product_stock: { data: { attributes: { Count: 10 } } },
              },
            },
          ],
        },
      },
    };

    const outOfStockProduct = {
      attributes: {
        product_variations: {
          data: [
            {
              attributes: {
                IsPublished: true,
                product_stock: { data: { attributes: { Count: 0 } } },
              },
            },
          ],
        },
      },
    };

    expect(hasAvailableStock(inStockProduct)).toBe(true);
    expect(hasAvailableStock(outOfStockProduct)).toBe(false);
  });

  it("calculates primary pricing using general discounts", () => {
    const product = {
      attributes: {
        product_variations: {
          data: [
            {
              attributes: {
                Price: "200",
                general_discounts: {
                  data: [{ attributes: { Amount: 25 } }],
                },
              },
            },
          ],
        },
      },
    };

    const pricing = getProductPrimaryPricing(product);

    expect(pricing.price).toBe(200);
    expect(pricing.discount).toBe(25);
    expect(pricing.discountPrice).toBe(150);
  });

  it("returns minimum price among published in-stock variations", () => {
    const product = {
      attributes: {
        product_variations: {
          data: [
            {
              attributes: {
                Price: "120",
                IsPublished: true,
                product_stock: { data: { attributes: { Count: 0 } } },
              },
            },
            {
              attributes: {
                Price: "90",
                IsPublished: true,
                product_stock: { data: { attributes: { Count: 3 } } },
              },
            },
            {
              attributes: {
                Price: "80",
                IsPublished: false,
                product_stock: { data: { attributes: { Count: 5 } } },
              },
            },
          ],
        },
      },
    };

    expect(getMinInStockVariationPrice(product)).toBe(90);
  });
});
