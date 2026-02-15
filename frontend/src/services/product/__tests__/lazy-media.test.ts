import { apiClient } from "@/services";
import {
  extractLazySecondaryMediaUrls,
  getLazySecondaryMediaByProductId,
} from "../product";

jest.mock("@/services", () => ({
  apiClient: {
    getPublic: jest.fn(),
  },
}));

describe("lazy media helpers", () => {
  const mockedGetPublic = apiClient.getPublic as jest.Mock;

  beforeEach(() => {
    mockedGetPublic.mockReset();
  });

  it("filters non-image media, removes empty urls, and excludes cover image", () => {
    const urls = extractLazySecondaryMediaUrls({
      attributes: {
        CoverImage: {
          data: {
            attributes: {
              url: "/uploads/cover.webp",
            },
          },
        },
        Media: {
          data: [
            { attributes: { url: "/uploads/cover.webp", mime: "image/webp" } },
            { attributes: { url: "/uploads/gallery-1.webp", mime: "image/webp" } },
            { attributes: { url: "/uploads/gallery-2.webp", mime: "image/webp" } },
            { attributes: { url: "/uploads/demo.mp4", mime: "video/mp4" } },
            { attributes: { url: "   ", mime: "image/webp" } },
            { attributes: { url: "/uploads/gallery-1.webp", mime: "image/webp" } },
          ],
        },
      },
    });

    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain("/uploads/gallery-1.webp");
    expect(urls[1]).toContain("/uploads/gallery-2.webp");
  });

  it("enforces limit when returning lazy secondary media", async () => {
    mockedGetPublic.mockResolvedValueOnce({
      data: [
        {
          attributes: {
            CoverImage: {
              data: {
                attributes: { url: "/uploads/cover.webp" },
              },
            },
            Media: {
              data: [
                { attributes: { url: "/uploads/gallery-1.webp", mime: "image/webp" } },
                { attributes: { url: "/uploads/gallery-2.webp", mime: "image/webp" } },
                { attributes: { url: "/uploads/gallery-3.webp", mime: "image/webp" } },
                { attributes: { url: "/uploads/gallery-4.webp", mime: "image/webp" } },
              ],
            },
          },
        },
      ],
    });

    const urls = await getLazySecondaryMediaByProductId(1101, 3);

    expect(mockedGetPublic).toHaveBeenCalledTimes(1);
    expect(urls).toHaveLength(3);
    expect(urls[0]).toContain("/uploads/gallery-1.webp");
    expect(urls[2]).toContain("/uploads/gallery-3.webp");
  });

  it("deduplicates concurrent requests and reuses resolved cache", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    mockedGetPublic.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const first = getLazySecondaryMediaByProductId(1202, 3);
    const second = getLazySecondaryMediaByProductId(1202, 3);

    expect(mockedGetPublic).toHaveBeenCalledTimes(1);

    resolveRequest({
      data: [
        {
          attributes: {
            CoverImage: { data: { attributes: { url: "/uploads/cover.webp" } } },
            Media: {
              data: [
                { attributes: { url: "/uploads/gallery-1.webp", mime: "image/webp" } },
                { attributes: { url: "/uploads/gallery-2.webp", mime: "image/webp" } },
              ],
            },
          },
        },
      ],
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);
    const cachedResult = await getLazySecondaryMediaByProductId(1202, 3);

    expect(mockedGetPublic).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(secondResult);
    expect(cachedResult).toEqual(firstResult);
  });

  it("returns empty array and caches failure result", async () => {
    mockedGetPublic.mockRejectedValueOnce(new Error("network failure"));

    const first = await getLazySecondaryMediaByProductId(1303, 3);
    const second = await getLazySecondaryMediaByProductId(1303, 3);

    expect(first).toEqual([]);
    expect(second).toEqual([]);
    expect(mockedGetPublic).toHaveBeenCalledTimes(1);
  });
});
