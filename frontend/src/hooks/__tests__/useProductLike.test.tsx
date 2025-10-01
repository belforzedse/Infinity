import { renderHook, act, waitFor } from "@testing-library/react";
import { apiClient } from "@/services";

// Mock the apiClient
jest.mock("@/services", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock jotai
let mockLikedProducts: any[] = [];
jest.mock("jotai", () => ({
  atom: (initialValue: any) => initialValue,
  useAtom: (atom: any) => {
    if (Array.isArray(atom)) {
      return [mockLikedProducts, (value: any) => { mockLikedProducts = typeof value === 'function' ? value(mockLikedProducts) : value; }];
    }
    return [false, jest.fn()];
  },
}));

describe("useProductLike", () => {
  const mockToken = "mock-token";

  beforeEach(() => {
    jest.clearAllMocks();
    mockLikedProducts = [];
    localStorage.clear();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });
    (apiClient.post as jest.Mock).mockResolvedValue({});
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("should initialize with isLiked false", async () => {
    const useProductLike = (await import("../useProductLike")).default;
    const { result } = renderHook(() => useProductLike({ productId: "123" }));

    expect(result.current.isLiked).toBe(false);
  });

  it("should fetch liked products on mount when authenticated", async () => {
    localStorage.setItem("accessToken", mockToken);
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        { id: 1, product: { id: 123 }, createdAt: "2024-01-01", updatedAt: "2024-01-01" },
      ],
    });

    const useProductLike = (await import("../useProductLike")).default;
    renderHook(() => useProductLike({ productId: "123" }));

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  it("should redirect to auth when toggling like without token", async () => {
    const mockHref = jest.fn();
    Object.defineProperty(window, "location", {
      value: { href: mockHref },
      writable: true,
    });

    const useProductLike = (await import("../useProductLike")).default;
    const { result } = renderHook(() => useProductLike({ productId: "123" }));

    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as React.MouseEvent<HTMLButtonElement>;

    await act(async () => {
      await result.current.toggleLike(mockEvent);
    });

    await waitFor(() => {
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  it("should toggle like status when clicking", async () => {
    localStorage.setItem("accessToken", mockToken);
    (apiClient.post as jest.Mock).mockResolvedValue({});

    const useProductLike = (await import("../useProductLike")).default;
    const { result } = renderHook(() => useProductLike({ productId: "123" }));

    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as React.MouseEvent<HTMLButtonElement>;

    await act(async () => {
      await result.current.toggleLike(mockEvent);
    });

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });
  });

  it("should handle errors when fetching liked products", async () => {
    localStorage.setItem("accessToken", mockToken);
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    (apiClient.get as jest.Mock).mockRejectedValue(new Error("Network error"));

    const useProductLike = (await import("../useProductLike")).default;
    renderHook(() => useProductLike({ productId: "123" }));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it("should handle errors when toggling like", async () => {
    localStorage.setItem("accessToken", mockToken);
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    (apiClient.post as jest.Mock).mockRejectedValue(new Error("Network error"));

    const useProductLike = (await import("../useProductLike")).default;
    const { result } = renderHook(() => useProductLike({ productId: "123" }));

    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as React.MouseEvent<HTMLButtonElement>;

    await act(async () => {
      await result.current.toggleLike(mockEvent);
    });

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});
