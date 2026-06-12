import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import useUser from "../useUser";
import UserService from "@/services/user";
import { currentUserAtom, userErrorAtom, userLoadingAtom } from "@/lib/atoms/auth";
import type { MeResponse } from "@/services/user/me";

jest.mock("@/services/user", () => ({
  __esModule: true,
  default: {
    me: jest.fn(),
  },
}));

const mockedMe = UserService.me as jest.MockedFunction<typeof UserService.me>;

const buildUser = (overrides: Partial<MeResponse> = {}): MeResponse => ({
  Bio: null,
  BirthDate: null,
  FirstName: "Test",
  IsActive: true,
  IsVerified: true,
  LastName: "User",
  NationalCode: null,
  Phone: "+989123456789",
  Sex: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  id: 1,
  updatedAt: "2026-01-01T00:00:00.000Z",
  isAdmin: false,
  roleName: "Customer",
  UserName: "+989123456789",
  ...overrides,
});

const renderUseUser = (
  setupStore?: (store: ReturnType<typeof createStore>) => void,
) => {
  const store = createStore();
  store.set(userLoadingAtom, false);
  setupStore?.(store);

  return {
    store,
    ...renderHook(() => useUser(), {
      wrapper: ({ children }) => React.createElement(Provider, { store }, children),
    }),
  };
};

describe("useUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("reads empty auth state without fetching automatically", () => {
    const { result } = renderUseUser();

    expect(result.current).toMatchObject({
      userData: null,
      isLoading: false,
      error: null,
    });
    expect(mockedMe).not.toHaveBeenCalled();
  });

  it("returns the current user from the shared auth atom", () => {
    const user = buildUser({ id: 7, roleName: "Store manager" });

    const { result } = renderUseUser((store) => {
      store.set(currentUserAtom, user);
    });

    expect(result.current.userData).toEqual(user);
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches user data when refetch is called", async () => {
    const user = buildUser({ id: 2, roleName: "SuperAdmin", isAdmin: true });
    mockedMe.mockResolvedValueOnce(user);

    const { result } = renderUseUser();

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockedMe).toHaveBeenCalledTimes(1);
    expect(result.current.userData).toEqual(user);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("stores fetch errors and clears loading", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const error = new Error("Failed to fetch");
    mockedMe.mockRejectedValueOnce(error);

    const { result } = renderUseUser();

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe(error);
    expect(result.current.userData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(consoleError).toHaveBeenCalledWith("Error fetching user data:", error);

    consoleError.mockRestore();
  });

  it("normalizes non-Error failures into an Error object", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    mockedMe.mockRejectedValueOnce("String error" as never);

    const { result } = renderUseUser();

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Failed to fetch user data");

    consoleError.mockRestore();
  });

  it("clears a previous error after a successful refetch", async () => {
    const user = buildUser();
    mockedMe.mockResolvedValueOnce(user);

    const { result } = renderUseUser((store) => {
      store.set(userErrorAtom, new Error("Previous error"));
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.userData).toEqual(user);
  });

  it("sets loading while a refetch is in flight", async () => {
    let resolveUser!: (value: MeResponse) => void;
    mockedMe.mockImplementationOnce(
      () =>
        new Promise<MeResponse>((resolve) => {
          resolveUser = resolve;
        }),
    );

    const { result } = renderUseUser();

    let refetchPromise!: Promise<void>;
    act(() => {
      refetchPromise = result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolveUser(buildUser({ id: 3 }));
      await refetchPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
