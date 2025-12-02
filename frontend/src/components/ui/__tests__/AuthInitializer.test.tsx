import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, waitFor } from "@testing-library/react";
import { Provider } from "jotai";
import AuthInitializer from "../AuthInitializer";
import type { MeResponse } from "../../../services/user/me";
import jotaiStore from "../../../lib/jotaiStore";
import { currentUserAtom } from "../../../lib/atoms/auth";
import { ACCESS_TOKEN_EVENT, ACCESS_TOKEN_STORAGE_KEY } from "../../../utils/accessToken";
import UserService from "../../../services/user";

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
  FirstName: "",
  IsActive: true,
  IsVerified: true,
  LastName: "",
  NationalCode: null,
  Phone: "09120000000",
  Sex: null,
  createdAt: new Date().toISOString(),
  id: overrides.id ?? 1,
  updatedAt: new Date().toISOString(),
  isAdmin: overrides.isAdmin,
  UserName: overrides.UserName,
  roleName: overrides.roleName ?? null,
  ...overrides,
});

describe("AuthInitializer", () => {
  beforeEach(() => {
    mockedMe.mockReset();
    localStorage.clear();
    jotaiStore.set(currentUserAtom, null);
  });

  it("refreshes user data when logging out and logging in as another role", async () => {
    mockedMe.mockResolvedValueOnce(
      buildUser({
        id: 1,
        roleName: "Store manager",
      }),
    );

    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, "token-store");

    await act(async () => {
      render(
        <Provider store={jotaiStore}>
          <AuthInitializer />
        </Provider>,
      );
    });

    await waitFor(() => {
      expect(jotaiStore.get(currentUserAtom)?.roleName).toBe("Store manager");
    });

    await act(async () => {
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(ACCESS_TOKEN_EVENT, { detail: { token: null } }));
    });

    await waitFor(() => {
      expect(jotaiStore.get(currentUserAtom)).toBeNull();
    });

    mockedMe.mockResolvedValueOnce(
      buildUser({
        id: 2,
        roleName: "SuperAdmin",
        isAdmin: true,
      }),
    );

    await act(async () => {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, "token-admin");
      window.dispatchEvent(new CustomEvent(ACCESS_TOKEN_EVENT, { detail: { token: "token-admin" } }));
    });

    await waitFor(() => {
      expect(jotaiStore.get(currentUserAtom)?.roleName).toBe("SuperAdmin");
    });
  });
});

