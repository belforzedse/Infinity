import { renderHook, waitFor } from "@testing-library/react";
import useUser from "../useUser";
import { me } from "@/services/user/me";

jest.mock("@/services/user/me", () => ({
  me: jest.fn(),
}));

describe("useUser", () => {
  const mockUserData = {
    id: 1,
    username: "testuser",
    email: "test@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() => useUser());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.userData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should not fetch user data when no access token", async () => {
    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(me).not.toHaveBeenCalled();
    expect(result.current.userData).toBeNull();
  });

  it("should fetch user data when access token exists", async () => {
    localStorage.setItem("accessToken", "mock-token");
    (me as jest.Mock).mockResolvedValue(mockUserData);

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(me).toHaveBeenCalled();
    expect(result.current.userData).toEqual(mockUserData);
  });

  it("should handle fetch errors", async () => {
    localStorage.setItem("accessToken", "mock-token");
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const mockError = new Error("Failed to fetch");
    (me as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.userData).toBeNull();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("should handle non-Error objects", async () => {
    localStorage.setItem("accessToken", "mock-token");
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    (me as jest.Mock).mockRejectedValue("String error");

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Failed to fetch user data");

    consoleError.mockRestore();
  });

  it("should refetch user data when calling refetch", async () => {
    localStorage.setItem("accessToken", "mock-token");
    (me as jest.Mock).mockResolvedValue(mockUserData);

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.userData).toEqual(mockUserData);
    });

    const updatedUserData = { ...mockUserData, username: "updated" };
    (me as jest.Mock).mockResolvedValue(updatedUserData);

    await waitFor(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.userData).toEqual(updatedUserData);
    });

    expect(me).toHaveBeenCalledTimes(2);
  });

  it("should clear error on successful refetch", async () => {
    localStorage.setItem("accessToken", "mock-token");
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    (me as jest.Mock).mockRejectedValueOnce(new Error("First error"));

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    (me as jest.Mock).mockResolvedValue(mockUserData);

    await waitFor(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.userData).toEqual(mockUserData);
    });

    consoleError.mockRestore();
  });

  it("should set loading during refetch", async () => {
    localStorage.setItem("accessToken", "mock-token");
    (me as jest.Mock).mockResolvedValue(mockUserData);

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (me as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockUserData), 100)),
    );

    await waitFor(async () => {
      const refetchPromise = result.current.refetch();
      expect(result.current.isLoading).toBe(true);
      await refetchPromise;
    });
  });
});
