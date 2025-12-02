import { renderHook, act, waitFor } from "@testing-library/react";
import { useCheckPhoneNumber } from "../useCheckPhoneNumber";
import { AuthService } from "@/services";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/services", () => ({
  AuthService: {
    checkUserExists: jest.fn(),
  },
}));

jest.mock("jotai", () => ({
  atom: (initialValue: any) => initialValue,
  useAtom: (atom: any) => {
    const [state, setState] = require("react").useState(atom);
    return [state, setState];
  },
}));

describe("useCheckPhoneNumber", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with empty state", () => {
    const { result } = renderHook(() => useCheckPhoneNumber());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.phoneNumber).toBe("");
  });

  it("should validate phone number format", async () => {
    const { result } = renderHook(() => useCheckPhoneNumber());

    await act(async () => {
      await result.current.checkPhoneNumber("123456");
    });

    expect(result.current.error).toBe("شماره تلفن نامعتبر است");
    expect(AuthService.checkUserExists).not.toHaveBeenCalled();
  });

  it("should accept valid phone number format", async () => {
    (AuthService.checkUserExists as jest.Mock).mockResolvedValue({ hasUser: true });

    const { result } = renderHook(() => useCheckPhoneNumber());

    await act(async () => {
      await result.current.checkPhoneNumber("09123456789");
    });

    expect(result.current.error).toBeNull();
    expect(AuthService.checkUserExists).toHaveBeenCalledWith("09123456789");
  });

  it("should navigate to login if user exists", async () => {
    (AuthService.checkUserExists as jest.Mock).mockResolvedValue({ hasUser: true });

    const { result } = renderHook(() => useCheckPhoneNumber());

    await act(async () => {
      await result.current.checkPhoneNumber("09123456789");
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("should navigate to register if user does not exist", async () => {
    (AuthService.checkUserExists as jest.Mock).mockResolvedValue({ hasUser: false });

    const { result } = renderHook(() => useCheckPhoneNumber());

    await act(async () => {
      await result.current.checkPhoneNumber("09123456789");
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/register");
    });
  });

  it("should set loading state during check", async () => {
    (AuthService.checkUserExists as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ hasUser: true }), 100)),
    );

    const { result } = renderHook(() => useCheckPhoneNumber());

    act(() => {
      result.current.checkPhoneNumber("09123456789");
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should handle API errors", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    (AuthService.checkUserExists as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCheckPhoneNumber());

    await act(async () => {
      await result.current.checkPhoneNumber("09123456789");
    });

    expect(result.current.error).toBe("خطا در بررسی شماره تلفن");
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("should clear error on new check", async () => {
    const { result } = renderHook(() => useCheckPhoneNumber());

    await act(async () => {
      await result.current.checkPhoneNumber("123");
    });

    expect(result.current.error).toBeTruthy();

    (AuthService.checkUserExists as jest.Mock).mockResolvedValue({ hasUser: true });

    await act(async () => {
      await result.current.checkPhoneNumber("09123456789");
    });

    expect(result.current.error).toBeNull();
  });

  it("should store phone number in state", async () => {
    (AuthService.checkUserExists as jest.Mock).mockResolvedValue({ hasUser: true });

    const { result } = renderHook(() => useCheckPhoneNumber());

    await act(async () => {
      await result.current.checkPhoneNumber("09123456789");
    });

    await waitFor(() => {
      expect(result.current.phoneNumber).toBe("09123456789");
    });
  });
});
