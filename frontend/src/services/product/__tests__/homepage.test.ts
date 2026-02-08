import { API_BASE_URL } from "@/constants/api";
import { getFeaturedCategoryProductsByRating } from "../homepage";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("homepage service", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

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
