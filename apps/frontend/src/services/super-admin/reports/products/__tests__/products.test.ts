import {
  buildPerformanceUrl,
  getProductOverview,
  getProductPerformance,
  downloadProductReportCsv,
} from "../index";
import { apiClient } from "@/services";

jest.mock("@/services", () => ({
  apiClient: { get: jest.fn() },
}));

const getMock = apiClient.get as jest.Mock;

describe("product report services", () => {
  beforeEach(() => getMock.mockReset());

  describe("buildPerformanceUrl", () => {
    it("encodes active filters and sort, omitting empty values", () => {
      const url = buildPerformanceUrl(
        {
          start: "2026-05-01",
          end: "2026-05-31",
          q: "کفش",
          categoryId: 3,
          productType: "Variable",
          stockStatus: "low",
        },
        { key: "net", direction: "desc" },
      );
      expect(url).toContain("/reports/products/performance?");
      expect(url).toContain("start=2026-05-01");
      expect(url).toContain("end=2026-05-31");
      expect(url).toContain("categoryId=3");
      expect(url).toContain("productType=Variable");
      expect(url).toContain("stockStatus=low");
      expect(url).toContain(encodeURIComponent("net:desc"));
      expect(url).toContain(encodeURIComponent("کفش"));
    });

    it("omits empty filters", () => {
      const url = buildPerformanceUrl({ start: "2026-05-01", end: "2026-05-31", categoryId: "" });
      expect(url).not.toContain("categoryId");
      expect(url).not.toContain("productType");
      expect(url).not.toContain("stockStatus");
    });
  });

  it("getProductOverview unwraps the data envelope", async () => {
    getMock.mockResolvedValueOnce({ data: { kpis: { gross: { current: 5150000 } } } });
    const res = await getProductOverview({ start: "2026-05-01", end: "2026-05-31" });
    expect(res.kpis.gross.current).toBe(5150000);
    expect(getMock).toHaveBeenCalledWith(
      expect.stringContaining("/reports/products/overview?"),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("getProductPerformance returns the full result (data + meta)", async () => {
    getMock.mockResolvedValueOnce({
      data: [{ productSKU: "SKU-1" }],
      meta: { pagination: { total: 1 } },
    });
    const res = await getProductPerformance(
      { start: "2026-05-01", end: "2026-05-31" },
      { page: 2, pageSize: 50 },
    );
    expect(res.meta.pagination.total).toBe(1);
    const calledUrl = getMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain(encodeURIComponent("pagination[page]") + "=2");
    expect(calledUrl).toContain(encodeURIComponent("pagination[pageSize]") + "=50");
  });

  describe("downloadProductReportCsv", () => {
    const origFetch = global.fetch;
    afterEach(() => {
      global.fetch = origFetch;
      jest.restoreAllMocks();
    });

    it("calls the export endpoint with the bearer token and triggers a download", async () => {
      localStorage.setItem("accessToken", "tok-123");
      const blob = new Blob(["x"], { type: "text/csv" });
      const fetchMock = jest
        .fn()
        .mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) });
      global.fetch = fetchMock as any;
      (URL as any).createObjectURL = jest.fn(() => "blob:x");
      (URL as any).revokeObjectURL = jest.fn();
      const clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});

      await downloadProductReportCsv(
        { start: "2026-05-01", end: "2026-05-31", q: "کفش" },
        { key: "gross", direction: "desc" },
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toContain("/reports/products/export?");
      expect(url).toContain("start=2026-05-01");
      expect(opts.headers.Authorization).toBe("Bearer tok-123");
      expect(clickSpy).toHaveBeenCalled();
    });

    it("throws when the export request fails", async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 }) as any;
      await expect(downloadProductReportCsv({ start: "a", end: "b" })).rejects.toThrow();
    });
  });
});
