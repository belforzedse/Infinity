import { API_BASE_URL } from "@/constants/api";
import { PRODUCT_BOOST_KEYWORDS } from "@/constants/productKeywords";
import {
  getFeaturedCategoryProductsByRating,
  getGifPromoProducts,
  getGifPromoProductsForSlot,
  getHomepageSections,
} from "../homepage";
import { defaultSettings } from "@/types/super-admin/settings";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("homepage service", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("getHomepageSections", () => {
    it("should make two requests: batch for discounted/favorites and separate for new (title matches boost keywords)", async () => {
      mockFetch
        .mockResolvedValueOnce({
          json: async () => ({ data: [] }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ data: [] }),
        });

      await getHomepageSections(defaultSettings());

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const [batchUrl, newUrl] = mockFetch.mock.calls.map(([url]) => new URL(url as string));

      expect(`${batchUrl.origin}${batchUrl.pathname}`).toBe(`${API_BASE_URL}/products`);
      expect(batchUrl.searchParams.get("pagination[limit]")).toBe("36");

      expect(`${newUrl.origin}${newUrl.pathname}`).toBe(`${API_BASE_URL}/products`);
      // Single keyword uses filters[Title][$containsi]; multiple use filters[$or][n][Title][$containsi]
      const titleFilter =
        newUrl.searchParams.get("filters[Title][$containsi]") ??
        newUrl.searchParams.get("filters[$or][0][Title][$containsi]");
      expect(PRODUCT_BOOST_KEYWORDS).toContain(titleFilter);
      expect(newUrl.searchParams.get("sort[0]")).toBe("createdAt:desc");
      expect(newUrl.searchParams.get("pagination[limit]")).toBe("20");
    });

    it("should return empty sections when both requests fail", async () => {
      mockFetch.mockRejectedValueOnce(new Error("network failure"));

      const result = await getHomepageSections();

      expect(result).toEqual({
        discounted: [],
        new: [],
        favorites: [],
      });
    });
  });

  describe("getFeaturedCategoryProductsByRating", () => {
    it("should query featured category products with top-rated sort and limit", async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ data: [] }),
      });

      await getFeaturedCategoryProductsByRating("special-category", 6);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl] = mockFetch.mock.calls[0];
      const url = new URL(calledUrl as string);

      expect(`${url.origin}${url.pathname}`).toBe(`${API_BASE_URL}/products`);
      expect(url.searchParams.get("filters[product_main_category][Slug][$eq]")).toBe(
        "special-category",
      );
      expect(url.searchParams.get("sort[0]")).toBe("AverageRating:desc");
      expect(url.searchParams.get("pagination[limit]")).toBe("6");
    });

    it("should return empty list without calling API when slug is empty", async () => {
      const result = await getFeaturedCategoryProductsByRating("   ", 6);

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return empty list when API fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("network failure"));

      const result = await getFeaturedCategoryProductsByRating("special-category", 6);

      expect(result).toEqual([]);
    });
  });

  describe("getGifPromoProductsForSlot", () => {
    it("preserves manual product filters and caps at four", async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ data: [] }),
      });

      await getGifPromoProductsForSlot({
        mode: "manual",
        productIds: [4, 3, 2, 1],
        categorySlug: "",
      });

      const [calledUrl] = mockFetch.mock.calls[0];
      const url = new URL(calledUrl as string);

      expect(url.searchParams.get("view")).toBe("card");
      expect(url.searchParams.get("filters[id][$in][0]")).toBe("4");
      expect(url.searchParams.get("filters[id][$in][3]")).toBe("1");
      expect(url.searchParams.get("filters[Status][$eq]")).toBe("Active");
      expect(url.searchParams.get("filters[removedAt][$null]")).toBe("true");
      expect(url.searchParams.get("filters[product_variations][product_stock][Count][$gt]")).toBe(
        "0",
      );
    });

    it("queries category mode with main category slug and limit 4", async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ data: [] }),
      });

      await getGifPromoProductsForSlot({
        mode: "category",
        categorySlug: "coats",
        productIds: [],
      });

      const [calledUrl] = mockFetch.mock.calls[0];
      const url = new URL(calledUrl as string);

      expect(url.searchParams.get("filters[product_main_category][Slug][$eq]")).toBe("coats");
      expect(url.searchParams.get("pagination[limit]")).toBe("4");
      expect(url.searchParams.get("sort[0]")).toBe("createdAt:desc");
    });
  });

  describe("getGifPromoProducts", () => {
    it("returns empty slots when disabled", async () => {
      const result = await getGifPromoProducts(defaultSettings());

      expect(result).toEqual({ slot1: [], slot2: [] });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("does not fetch incomplete slots without GIFs", async () => {
      const settings = {
        ...defaultSettings(),
        homeGifPromoEnabled: true,
        homeGifPromoSlot1Assignment: { mode: "manual" as const, productIds: [1], categorySlug: "" },
        homeGifPromoSlot2Assignment: {
          mode: "category" as const,
          categorySlug: "coats",
          productIds: [],
        },
      };

      const result = await getGifPromoProducts(settings);

      expect(result).toEqual({ slot1: [], slot2: [] });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
