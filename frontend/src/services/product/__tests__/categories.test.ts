import { API_BASE_URL, ENDPOINTS } from "@/constants/api";
import fetchWithTimeout from "@/utils/fetchWithTimeout";
import { getProductCategories } from "../categories";

jest.mock("@/utils/fetchWithTimeout", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedFetchWithTimeout = fetchWithTimeout as jest.MockedFunction<typeof fetchWithTimeout>;

describe("getProductCategories", () => {
  beforeEach(() => {
    mockedFetchWithTimeout.mockReset();
  });

  it("adds main category and parent filters when mainOnly is true", async () => {
    mockedFetchWithTimeout.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    await getProductCategories({ mainOnly: true, sort: "Title:asc" });

    expect(mockedFetchWithTimeout).toHaveBeenCalledTimes(1);
    const [calledUrl] = mockedFetchWithTimeout.mock.calls[0];
    const url = new URL(calledUrl as string);

    expect(`${url.origin}${url.pathname}`).toBe(`${API_BASE_URL}${ENDPOINTS.PRODUCT.CATEGORY}`);
    expect(url.searchParams.get("filters[isMainCategory][$eq]")).toBe("true");
    expect(url.searchParams.get("filters[parent][id][$null]")).toBe("true");
    expect(url.searchParams.get("_skip_global_loader")).toBe("1");

    const fieldValues = Array.from(url.searchParams.entries())
      .filter(([key]) => key.startsWith("fields["))
      .map(([, value]) => value);
    expect(fieldValues).toContain("isMainCategory");
  });

  it("normalizes isMainCategory as boolean in mapped output", async () => {
    mockedFetchWithTimeout.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 1,
            attributes: {
              Title: "Main",
              Slug: "main",
              isMainCategory: true,
              parent: { data: null },
            },
          },
          {
            id: 2,
            attributes: {
              Title: "Other",
              Slug: "other",
              parent: { data: null },
            },
          },
        ],
      }),
    } as Response);

    const categories = await getProductCategories();

    expect(categories).toHaveLength(2);
    expect(categories[0].isMainCategory).toBe(true);
    expect(categories[1].isMainCategory).toBe(false);
  });

  it("keeps parentOnly behavior unchanged when mainOnly is false", async () => {
    mockedFetchWithTimeout.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    await getProductCategories({ parentOnly: true });

    expect(mockedFetchWithTimeout).toHaveBeenCalledTimes(1);
    const [calledUrl] = mockedFetchWithTimeout.mock.calls[0];
    const url = new URL(calledUrl as string);

    expect(url.searchParams.get("filters[parent][id][$null]")).toBe("true");
    expect(url.searchParams.get("filters[isMainCategory][$eq]")).toBeNull();
  });

  it("filters by allowedNameSubstrings when provided", async () => {
    mockedFetchWithTimeout.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 1,
            attributes: {
              Title: "کیف دستی",
              Slug: "bag",
              parent: { data: null },
            },
          },
          {
            id: 2,
            attributes: {
              Title: "دامن",
              Slug: "skirt",
              parent: { data: null },
            },
          },
          {
            id: 3,
            attributes: {
              Title: "پلیور",
              Slug: "pullover",
              parent: { data: null },
            },
          },
        ],
      }),
    } as Response);

    const categories = await getProductCategories({
      allowedNameSubstrings: ["کیف", "دامن"],
    });

    expect(categories).toHaveLength(2);
    expect(categories.map((c) => c.name)).toEqual(["کیف دستی", "دامن"]);
  });
});
