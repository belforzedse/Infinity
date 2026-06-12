import {
  getDefaultProductVariation,
  getInitialPdpSelection,
  getProductColors,
  getProductSizes,
  getProductModels,
  hasStockForVariation,
  getAvailableStockCount,
  findProductVariation,
  formatProductsToCardProps,
  formatGalleryAssets,
  calculateUniqueColorsCount,
  getUniqueColorCodes,
  type ProductDetail,
} from "../product";

describe("Product Service Helpers", () => {
  const createMockProduct = (): ProductDetail => ({
    id: 1,
    attributes: {
      Title: "Test Product",
      Description: "Test Description",
      Status: "Active",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-02",
      CoverImage: {
        data: {
          id: 1,
          attributes: {
            name: "cover.jpg",
            alternativeText: null,
            caption: null,
            width: 800,
            height: 600,
            formats: null,
            mime: "image/jpeg",
            url: "/uploads/cover.jpg",
            ext: ".jpg",
          },
        },
      },
      Media: { data: [] },
      product_variations: {
        data: [
          {
            id: 1,
            attributes: {
              IsPublished: true,
              SKU: "SKU-001",
              Price: 100000,
              product_stock: {
                data: {
                  id: 1,
                  attributes: {
                    Count: 10,
                  },
                },
              },
              product_variation_color: {
                data: {
                  id: 1,
                  attributes: {
                    Title: "Red",
                    ColorCode: "#FF0000",
                  },
                },
              },
              product_variation_size: {
                data: {
                  id: 1,
                  attributes: {
                    Title: "L",
                  },
                },
              },
            },
          },
        ],
      },
      product_main_category: {
        data: {
          id: 1,
          attributes: {
            Title: "Clothing",
          },
        },
      },
    },
  });

  describe("getDefaultProductVariation", () => {
    it("should return null when no variations exist", () => {
      const product = createMockProduct();
      product.attributes.product_variations.data = [];

      const result = getDefaultProductVariation(product);

      expect(result).toBeNull();
    });

    it("should return published variation with stock", () => {
      const product = createMockProduct();

      const result = getDefaultProductVariation(product);

      expect(result).toBeTruthy();
      expect(result?.attributes.IsPublished).toBe(true);
    });

    it("should fallback to any published variation when no stock", () => {
      const product = createMockProduct();
      product.attributes.product_variations.data[0].attributes.product_stock!.data.attributes.Count = 0;

      const result = getDefaultProductVariation(product);

      expect(result?.attributes.IsPublished).toBe(true);
    });

    it("should return first variation as last resort", () => {
      const product = createMockProduct();
      product.attributes.product_variations.data[0].attributes.IsPublished = false;

      const result = getDefaultProductVariation(product);

      expect(result).toBeTruthy();
    });
  });

  describe("getProductColors", () => {
    it("should return empty array when no variations", () => {
      const product = createMockProduct();
      product.attributes.product_variations.data = [];

      const result = getProductColors(product);

      expect(result).toEqual([]);
    });

    it("should return unique colors", () => {
      const product = createMockProduct();

      const result = getProductColors(product);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        title: "Red",
        colorCode: "#FF0000",
      });
    });

    it("should filter out unpublished variations", () => {
      const product = createMockProduct();
      product.attributes.product_variations.data[0].attributes.IsPublished = false;

      const result = getProductColors(product);

      expect(result).toEqual([]);
    });
  });

  describe("getProductSizes", () => {
    it("should return empty array when no variations", () => {
      const product = createMockProduct();
      product.attributes.product_variations.data = [];

      const result = getProductSizes(product);

      expect(result).toEqual([]);
    });

    it("should return all sizes", () => {
      const product = createMockProduct();

      const result = getProductSizes(product);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        title: "L",
      });
    });

    it("should filter by color when colorId provided", () => {
      const product = createMockProduct();

      const result = getProductSizes(product, 1);

      expect(result).toHaveLength(1);
    });
  });

  describe("getProductModels", () => {
    it("should return empty array when no model variations", () => {
      const product = createMockProduct();

      const result = getProductModels(product);

      expect(result).toEqual([]);
    });

    it("should return unique models", () => {
      const product = createMockProduct();
      product.attributes.product_variations.data[0].attributes.product_variation_model = {
        data: {
          id: 1,
          attributes: {
            Title: "Model A",
          },
        },
      };

      const result = getProductModels(product);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Model A");
    });
  });

  describe("hasStockForVariation", () => {
    it("should return true when stock is available", () => {
      const product = createMockProduct();
      const variation = product.attributes.product_variations.data[0];

      const result = hasStockForVariation(variation);

      expect(result).toBe(true);
    });

    it("should return false when no stock", () => {
      const product = createMockProduct();
      const variation = product.attributes.product_variations.data[0];
      variation.attributes.product_stock!.data.attributes.Count = 0;

      const result = hasStockForVariation(variation);

      expect(result).toBe(false);
    });

    it("should check requested quantity", () => {
      const product = createMockProduct();
      const variation = product.attributes.product_variations.data[0];

      expect(hasStockForVariation(variation, 5)).toBe(true);
      expect(hasStockForVariation(variation, 15)).toBe(false);
    });

    it("should treat numeric string Count as in stock", () => {
      const product = createMockProduct();
      const variation = product.attributes.product_variations.data[0];
      variation.attributes.product_stock!.data.attributes.Count = "8" as unknown as number;

      expect(hasStockForVariation(variation)).toBe(true);
    });
  });

  describe("getInitialPdpSelection", () => {
    it("selects first in-stock variation when earlier colors are out of stock", () => {
      const product = createMockProduct();
      product.attributes.product_variations.data = [
        {
          id: 1,
          attributes: {
            IsPublished: true,
            SKU: "SKU-1",
            Price: 100000,
            product_stock: { data: { id: 1, attributes: { Count: 0 } } },
            product_variation_color: {
              data: { id: 10, attributes: { Title: "Red", ColorCode: "#f00" } },
            },
            product_variation_size: {
              data: { id: 1, attributes: { Title: "S" } },
            },
          },
        },
        {
          id: 2,
          attributes: {
            IsPublished: true,
            SKU: "SKU-2",
            Price: 100000,
            product_stock: { data: { id: 2, attributes: { Count: 5 } } },
            product_variation_color: {
              data: { id: 11, attributes: { Title: "Blue", ColorCode: "#00f" } },
            },
            product_variation_size: {
              data: { id: 2, attributes: { Title: "M" } },
            },
          },
        },
      ];

      const selection = getInitialPdpSelection(
        product,
        [
          { id: "10", title: "Red", colorCode: "#f00" },
          { id: "11", title: "Blue", colorCode: "#00f" },
        ],
        [
          { id: "1", title: "S" },
          { id: "2", title: "M" },
        ],
        [],
      );

      expect(selection.colorId).toBe("11");
      expect(selection.sizeId).toBe("2");
      expect(selection.hasStock).toBe(true);
    });
  });

  describe("product card color helpers", () => {
    it("ignores color relations that do not have a color code", () => {
      const variations = [
        {
          id: 1,
          attributes: {
            IsPublished: true,
            product_variation_color: {
              data: {
                id: 10,
                attributes: {
                  Title: "Code 1",
                  ColorCode: null,
                },
              },
            },
          },
        },
        {
          id: 2,
          attributes: {
            IsPublished: true,
            product_variation_color: {
              data: {
                id: 11,
                attributes: {
                  Title: "Red",
                  ColorCode: "#ff0000",
                },
              },
            },
          },
        },
      ] as any;

      expect(calculateUniqueColorsCount(variations)).toBe(1);
      expect(getUniqueColorCodes(variations)).toEqual(["#ff0000"]);
    });
  });

  describe("getAvailableStockCount", () => {
    it("should return stock count", () => {
      const product = createMockProduct();
      const variation = product.attributes.product_variations.data[0];

      const result = getAvailableStockCount(variation);

      expect(result).toBe(10);
    });

    it("should return 0 when no stock data", () => {
      const product = createMockProduct();
      const variation = product.attributes.product_variations.data[0];
      variation.attributes.product_stock = undefined;

      const result = getAvailableStockCount(variation);

      expect(result).toBe(0);
    });
  });

  describe("findProductVariation", () => {
    it("should find variation by color and size", () => {
      const product = createMockProduct();

      const result = findProductVariation(product, 1, 1);

      expect(result).toBeTruthy();
    });

    it("should return undefined when no match", () => {
      const product = createMockProduct();

      const result = findProductVariation(product, 999, 999);

      expect(result).toBeUndefined();
    });
  });

  describe("formatGalleryAssets", () => {
    it("should format cover image", () => {
      const product = createMockProduct();

      const result = formatGalleryAssets(product);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("image");
    });

    it("should return empty gallery when no images", () => {
      const product = createMockProduct();
      product.attributes.CoverImage.data = null as any;

      const result = formatGalleryAssets(product);

      expect(result).toEqual([]);
    });
  });

  describe("formatProductsToCardProps", () => {
    it("should format products correctly", () => {
      const mockProducts = [
        {
          id: "1",
          attributes: {
            Title: "Test Product",
            CoverImage: {
              data: {
                attributes: {
                  url: "/uploads/image.jpg",
                },
              },
            },
            product_main_category: {
              data: {
                attributes: {
                  Title: "Category",
                },
              },
            },
            product_variations: {
              data: [
                {
                  id: 1,
                  attributes: {
                    IsPublished: true,
                    Price: 100000,
                    product_stock: {
                      data: {
                        attributes: {
                          Count: 5,
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      ];

      const result = formatProductsToCardProps(mockProducts);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Test Product");
      expect(result[0].price).toBe(100000);
    });

    it("should format compact card projection without variations", () => {
      const result = formatProductsToCardProps([
        {
          id: 12,
          attributes: {
            Title: "Projected Product",
            Slug: "projected-product",
            SeenCount: 9,
            Price: 120000,
            DiscountPrice: 90000,
            Discount: 25,
            IsAvailable: true,
            InventoryCount: 3,
            ColorsCount: 2,
            ColorCodes: ["#111111", "#ffffff"],
            CoverImage: {
              url: "/uploads/projected.jpg",
            },
            product_main_category: {
              Title: "Bags",
              Slug: "bags",
            },
          },
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 12,
        slug: "projected-product",
        title: "Projected Product",
        category: "Bags",
        price: 120000,
        discountPrice: 90000,
        discount: 25,
        isAvailable: true,
        colorsCount: 2,
        colorCodes: ["#111111", "#ffffff"],
      });
      expect(result[0].images[0]).toContain("/uploads/projected.jpg");
    });

    it("should omit compact projection color count when color codes are missing", () => {
      const result = formatProductsToCardProps([
        {
          id: 13,
          attributes: {
            Title: "Colorless Projected Product",
            Price: 120000,
            IsAvailable: true,
            ColorsCount: 2,
            ColorCodes: [],
            CoverImage: {
              url: "/uploads/projected.jpg",
            },
          },
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].colorsCount).toBeUndefined();
      expect(result[0].colorCodes).toBeUndefined();
    });

    it("should handle empty array", () => {
      const result = formatProductsToCardProps([]);

      expect(result).toEqual([]);
    });

    it("should filter out products without stock", () => {
      const mockProducts = [
        {
          id: "1",
          attributes: {
            Title: "Test Product",
            product_variations: {
              data: [
                {
                  attributes: {
                    IsPublished: true,
                    Price: 100000,
                    product_stock: {
                      data: {
                        attributes: {
                          Count: 0,
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      ];

      const result = formatProductsToCardProps(mockProducts);

      expect(result).toEqual([]);
    });
  });
});
