import {
  getDefaultProductVariation,
  getProductColors,
  getProductSizes,
  getProductModels,
  hasStockForVariation,
  getAvailableStockCount,
  findProductVariation,
  formatProductsToCardProps,
  formatGalleryAssets,
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

    it("should add default placeholder when no images", () => {
      const product = createMockProduct();
      product.attributes.CoverImage.data = null as any;

      const result = formatGalleryAssets(product);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("default");
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
