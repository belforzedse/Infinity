import { API_BASE_URL } from "@/constants/api";
import { getFeaturedCategoryProductsByRating, getHomepageSections } from "../homepage";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("homepage service", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("getHomepageSections", () => {
    it("should make two requests: batch for discounted/favorites and separate for new (title contains G)", async () => {
      mockFetch
        .mockResolvedValueOnce({
          json: async () => ({ data: [] }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ data: [] }),
        });

      await getHomepageSections();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const [batchUrl, newUrl] = mockFetch.mock.calls.map(([url]) => new URL(url as string));

      expect(`${batchUrl.origin}${batchUrl.pathname}`).toBe(`${API_BASE_URL}/products`);
      expect(batchUrl.searchParams.get("pagination[limit]")).toBe("48");

      expect(`${newUrl.origin}${newUrl.pathname}`).toBe(`${API_BASE_URL}/products`);
      expect(newUrl.searchParams.get("filters[Title][$containsi]")).toBe("G");
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
});
