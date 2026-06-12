import { renderHook, waitFor } from "@testing-library/react";
import { apiClient } from "@/services";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

jest.mock("@/services", () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.Mock;

const countResponse = (total: number) => ({
  data: [],
  meta: {
    pagination: {
      total,
    },
  },
});

const latestOrdersResponse = {
  data: [],
};

describe("useDashboardMetrics", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedGet.mockImplementation((url: string) => {
      if (url.startsWith("/orders?sort")) {
        return Promise.resolve(latestOrdersResponse);
      }
      if (url.startsWith("/orders?") && url.includes("filters[Status][$eq]=Done")) {
        return Promise.resolve(countResponse(4));
      }
      if (url.startsWith("/orders?")) {
        return Promise.resolve(countResponse(12));
      }
      if (url.startsWith("/products?")) {
        return Promise.resolve(countResponse(8));
      }
      if (url.startsWith("/users?")) {
        return Promise.resolve(countResponse(20));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it("does not request users or return a user metric when includeUserMetric is false", async () => {
    const { result } = renderHook(() => useDashboardMetrics({ includeUserMetric: false }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGet).not.toHaveBeenCalledWith(expect.stringMatching(/^\/users\?/));
    expect(result.current.metrics).toHaveLength(3);
  });

  it("requests users and returns the user metric by default", async () => {
    const { result } = renderHook(() => useDashboardMetrics());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGet).toHaveBeenCalledWith(expect.stringMatching(/^\/users\?/));
    expect(result.current.metrics).toHaveLength(4);
  });
});
