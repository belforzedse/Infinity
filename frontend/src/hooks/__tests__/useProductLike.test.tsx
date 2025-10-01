import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider, createStore } from "jotai";
import { apiClient } from "@/services";

// Mock the apiClient
jest.mock("@/services", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe("useProductLike", () => {
  const mockToken = "mock-token";

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });
    (apiClient.post as jest.Mock).mockResolvedValue({});
  });

  afterEach(async () => {
    const { __resetUseProductLikeState } = await import("../useProductLike");
    __resetUseProductLikeState();
  });

  const renderUseProductLike = async () => {
    const module = await import("../useProductLike");
    const useProductLike = module.default;
    const store = createStore();
    let hookResult: ReturnType<typeof renderHook<typeof useProductLike>>;

    await act(async () => {
      hookResult = renderHook(() => useProductLike({ productId: "123" }), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });
    });

    return { hook: hookResult!, module };
  };

  it("should initialize with isLiked false", async () => {
    const { hook } = await renderUseProductLike();
    const { result } = hook;

    expect(result.current.isLiked).toBe(false);
  });

  it("should fetch liked products on mount when authenticated", async () => {
    localStorage.setItem("accessToken", mockToken);
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: [
        { id: 1, product: { id: 123 }, createdAt: "2024-01-01", updatedAt: "2024-01-01" },
      ],
    });

    const { hook } = await renderUseProductLike();
    void hook;

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  it("should redirect to auth when toggling like without token", async () => {
    const originalHref = window.location.href;

    const { hook, module } = await renderUseProductLike();
    const { result } = hook;
    const redirectSpy = jest
      .spyOn(module.navigationUtils, "setWindowLocation")
      .mockImplementation(() => {});

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

    expect(redirectSpy).toHaveBeenCalled();

    window.location.href = originalHref;
    redirectSpy.mockRestore();
  });

  it("should toggle like status when clicking", async () => {
    localStorage.setItem("accessToken", mockToken);
    (apiClient.post as jest.Mock).mockResolvedValue({});

    const { hook } = await renderUseProductLike();
    const { result } = hook;

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

    const { hook } = await renderUseProductLike();
    void hook;

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it("should handle errors when toggling like", async () => {
    localStorage.setItem("accessToken", mockToken);
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    (apiClient.post as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { hook } = await renderUseProductLike();
    const { result } = hook;

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
