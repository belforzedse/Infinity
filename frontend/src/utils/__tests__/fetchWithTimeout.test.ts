import { fetchWithTimeout } from "../fetchWithTimeout";

describe("fetchWithTimeout", () => {
  let mockFetch: jest.Mock;
  let mockAbort: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockAbort = jest.fn();
    mockFetch = jest.fn();

    global.fetch = mockFetch;
    global.AbortController = jest.fn(() => ({
      abort: mockAbort,
      signal: {} as AbortSignal,
    })) as any;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should fetch successfully within timeout", async () => {
    const mockResponse = new Response("success");
    mockFetch.mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout("https://api.example.com/data");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/data",
      expect.objectContaining({ signal: {} }),
    );
    expect(result).toBe(mockResponse);
  });

  it("should use default timeout of 15000ms", async () => {
    const mockResponse = new Response("success");
    mockFetch.mockResolvedValue(mockResponse);

    await fetchWithTimeout("https://api.example.com/data");

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 15000);
  });

  it("should use custom timeout when provided", async () => {
    const mockResponse = new Response("success");
    mockFetch.mockResolvedValue(mockResponse);

    await fetchWithTimeout("https://api.example.com/data", {
      timeoutMs: 5000,
    });

    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
  });

  it("should abort request when timeout is reached", async () => {
    mockFetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(new Response()), 20000)),
    );

    const fetchPromise = fetchWithTimeout("https://api.example.com/data", {
      timeoutMs: 1000,
    });

    jest.advanceTimersByTime(1000);

    expect(mockAbort).toHaveBeenCalled();

    // Let the promise settle
    await expect(fetchPromise).rejects.toThrow();
  });

  it("should pass through fetch options", async () => {
    const mockResponse = new Response("success");
    mockFetch.mockResolvedValue(mockResponse);

    await fetchWithTimeout("https://api.example.com/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ test: "data" }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/data",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ test: "data" }),
      }),
    );
  });

  it("should clear timeout after successful fetch", async () => {
    const mockResponse = new Response("success");
    mockFetch.mockResolvedValue(mockResponse);

    await fetchWithTimeout("https://api.example.com/data");

    expect(clearTimeout).toHaveBeenCalled();
  });

  it("should clear timeout even if fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    await expect(
      fetchWithTimeout("https://api.example.com/data"),
    ).rejects.toThrow("Network error");

    expect(clearTimeout).toHaveBeenCalled();
  });

  it("should handle URL object as input", async () => {
    const mockResponse = new Response("success");
    mockFetch.mockResolvedValue(mockResponse);

    const url = new URL("https://api.example.com/data");
    await fetchWithTimeout(url);

    expect(mockFetch).toHaveBeenCalledWith(url, expect.any(Object));
  });

  it("should not include timeoutMs in fetch options", async () => {
    const mockResponse = new Response("success");
    mockFetch.mockResolvedValue(mockResponse);

    await fetchWithTimeout("https://api.example.com/data", {
      timeoutMs: 5000,
      method: "GET",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/data",
      expect.not.objectContaining({ timeoutMs: 5000 }),
    );
  });
});
