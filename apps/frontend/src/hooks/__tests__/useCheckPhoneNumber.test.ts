import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { useCheckPhoneNumber } from "../useCheckPhoneNumber";
import { AuthService } from "@/services";

const mockPush = jest.fn();
const mockSearchParamsGet = jest.fn(() => null as string | null);

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}));

jest.mock("@/services", () => ({
  AuthService: {
    checkUserExists: jest.fn(),
  },
}));

const renderUseCheckPhoneNumber = () => {
  const store = createStore();

  return renderHook(() => useCheckPhoneNumber(), {
    wrapper: ({ children }) => React.createElement(Provider, { store }, children),
  });
};

describe("useCheckPhoneNumber", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
  });

  it("initializes with empty state", () => {
    const { result } = renderUseCheckPhoneNumber();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.phoneNumber).toBe("");
  });

  it("rejects invalid phone numbers before calling the API", async () => {
    const { result } = renderUseCheckPhoneNumber();

    await act(async () => {
      await result.current.checkPhoneNumber("123456");
    });

    expect(result.current.error).toBe("شماره تلفن نامعتبر است");
    expect(AuthService.checkUserExists).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("accepts local and international Iranian phone formats", async () => {
    (AuthService.checkUserExists as jest.Mock).mockResolvedValue({ hasUser: true });

    const { result } = renderUseCheckPhoneNumber();

    await act(async () => {
      await result.current.checkPhoneNumber("09123456789");
      await result.current.checkPhoneNumber("+989123456789");
    });

    expect(AuthService.checkUserExists).toHaveBeenNthCalledWith(1, "09123456789");
    expect(AuthService.checkUserExists).toHaveBeenNthCalledWith(2, "+989123456789");
  });

  it("navigates to login and stores the phone when the user exists", async () => {
    (AuthService.checkUserExists as jest.Mock).mockResolvedValue({ hasUser: true });

    const { result } = renderUseCheckPhoneNumber();

    await act(async () => {
      await result.current.checkPhoneNumber("09123456789");
    });

    expect(result.current.phoneNumber).toBe("09123456789");
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });

  it("navigates to register when the phone is new", async () => {
    (AuthService.checkUserExists as jest.Mock).mockResolvedValue({ hasUser: false });

    const { result } = renderUseCheckPhoneNumber();

    await act(async () => {
      await result.current.checkPhoneNumber("09123456789");
    });

    expect(mockPush).toHaveBeenCalledWith("/auth/register");
  });

  it("preserves the redirect query when routing", async () => {
    mockSearchParamsGet.mockImplementation((key) =>
      key === "redirect" ? "/checkout?step=payment" : null,
    );
    (AuthService.checkUserExists as jest.Mock).mockResolvedValue({ hasUser: true });

    const { result } = renderUseCheckPhoneNumber();

    await act(async () => {
      await result.current.checkPhoneNumber("09123456789");
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/auth/login?redirect=%2Fcheckout%3Fstep%3Dpayment",
    );
  });

  it("sets loading while the existence check is in flight", async () => {
    let resolveCheck!: (value: { hasUser: boolean }) => void;
    (AuthService.checkUserExists as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCheck = resolve;
        }),
    );

    const { result } = renderUseCheckPhoneNumber();

    let checkPromise!: Promise<void>;
    act(() => {
      checkPromise = result.current.checkPhoneNumber("09123456789");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolveCheck({ hasUser: true });
      await checkPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("shows an error and avoids navigation when the API fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const error = new Error("Network error");
    (AuthService.checkUserExists as jest.Mock).mockRejectedValue(error);

    const { result } = renderUseCheckPhoneNumber();

    await act(async () => {
      await result.current.checkPhoneNumber("09123456789");
    });

    expect(result.current.error).toBe("خطا در بررسی شماره تلفن");
    expect(mockPush).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(error);

    consoleError.mockRestore();
  });

  it("clears a previous validation error on the next valid check", async () => {
    const { result } = renderUseCheckPhoneNumber();

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
});
