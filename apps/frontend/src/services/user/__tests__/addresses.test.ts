import {
  addUserAddress,
  deleteUserAddress,
  getUserAddresses,
  updateUserAddress,
  type AddAddressRequest,
  type UserAddress,
} from "../addresses";
import { apiClient } from "@/lib/api-client";
import { apiCache } from "@/lib/api-cache";
import { CHECKOUT_MAX_RETRIES, CHECKOUT_REQUEST_TIMEOUT_MS } from "@/constants/api";
import { handleAuthErrors } from "@/utils/auth";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("@/lib/api-cache", () => ({
  apiCache: {
    clearByPattern: jest.fn(),
  },
}));

jest.mock("@/utils/auth", () => ({
  handleAuthErrors: jest.fn(),
}));

describe("User Addresses Service", () => {
  const mockToken = "mock-access-token";
  const validAddress: AddAddressRequest = {
    PostalCode: "1234567890",
    Description: "Home",
    FullAddress: "123 Main St",
    shipping_city: 1,
  };
  const persistedAddress: UserAddress = {
    id: 1,
    PostalCode: "1234567890",
    Description: "Home",
    FullAddress: "123 Main St",
    createdAt: "2024-01-01",
    shipping_city: {
      id: 1,
      Title: "Tehran",
      Code: "01",
      shipping_province: {
        id: 1,
        Title: "Tehran Province",
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("getUserAddresses", () => {
    it("fetches the current user's addresses through the cached checkout endpoint", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: [persistedAddress] });

      const result = await getUserAddresses();

      expect(apiClient.get).toHaveBeenCalledWith(
        "/local-user-addresses/me?pagination[page]=1&pagination[pageSize]=100&sort=createdAt:desc",
        {
          timeout: CHECKOUT_REQUEST_TIMEOUT_MS,
          retries: CHECKOUT_MAX_RETRIES,
        },
      );
      expect(result).toEqual([persistedAddress]);
    });

    it("forwards fetch errors through the shared auth error handler", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Network error");
      (apiClient.get as jest.Mock).mockRejectedValue(error);

      await expect(getUserAddresses()).rejects.toThrow("Network error");
      expect(handleAuthErrors).toHaveBeenCalledWith(error);
      expect(consoleError).toHaveBeenCalledWith("Error fetching user addresses:", error);

      consoleError.mockRestore();
    });
  });

  describe("addUserAddress", () => {
    it("adds an address, returns the created address, and invalidates address cache", async () => {
      localStorage.setItem("accessToken", mockToken);
      (apiClient.post as jest.Mock).mockResolvedValue({ data: persistedAddress });

      const result = await addUserAddress(validAddress);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/local-user-addresses/create",
        validAddress,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        },
      );
      expect(apiCache.clearByPattern).toHaveBeenCalledWith(/local-user-addresses/);
      expect(result).toEqual(persistedAddress);
    });

    it("fetches the full address when the create response is missing relations", async () => {
      localStorage.setItem("accessToken", mockToken);
      (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: persistedAddress.id } });
      (apiClient.get as jest.Mock).mockResolvedValue({ data: [persistedAddress] });
      const consoleWarn = jest.spyOn(console, "warn").mockImplementation();

      const result = await addUserAddress(validAddress);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/local-user-addresses/me?pagination[page]=1&pagination[pageSize]=100&sort=createdAt:desc",
        expect.any(Object),
      );
      expect(result).toEqual(persistedAddress);

      consoleWarn.mockRestore();
    });

    it.each([
      [{ PostalCode: "12345" }, "Postal code must be a 10-digit number"],
      [{ PostalCode: "abcd123456" }, "Postal code must be a 10-digit number"],
      [{ FullAddress: "" }, "Full address is required"],
      [{ FullAddress: "   " }, "Full address is required"],
      [{ shipping_city: 0 }, "Shipping city is required"],
    ])("validates %p", async (override, message) => {
      localStorage.setItem("accessToken", mockToken);

      await expect(addUserAddress({ ...validAddress, ...override })).rejects.toThrow(message);
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it("requires an access token for mutations", async () => {
      await expect(addUserAddress(validAddress)).rejects.toThrow("Authentication required");
      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  describe("updateUserAddress", () => {
    it("updates an address and invalidates address cache", async () => {
      localStorage.setItem("accessToken", mockToken);
      (apiClient.put as jest.Mock).mockResolvedValue({ data: persistedAddress });

      const result = await updateUserAddress(1, validAddress);

      expect(apiClient.put).toHaveBeenCalledWith("/local-user-addresses/1", validAddress, {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
      expect(apiCache.clearByPattern).toHaveBeenCalledWith(/local-user-addresses/);
      expect(result).toEqual(persistedAddress);
    });

    it("requires an access token", async () => {
      await expect(updateUserAddress(1, validAddress)).rejects.toThrow(
        "Authentication required",
      );
      expect(apiClient.put).not.toHaveBeenCalled();
    });
  });

  describe("deleteUserAddress", () => {
    it("deletes an address and invalidates address cache", async () => {
      localStorage.setItem("accessToken", mockToken);
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await deleteUserAddress(1);

      expect(apiClient.delete).toHaveBeenCalledWith("/local-user-addresses/1", {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
      expect(apiCache.clearByPattern).toHaveBeenCalledWith(/local-user-addresses/);
    });

    it("requires an access token", async () => {
      await expect(deleteUserAddress(1)).rejects.toThrow("Authentication required");
      expect(apiClient.delete).not.toHaveBeenCalled();
    });

    it("forwards delete errors through the shared auth error handler", async () => {
      localStorage.setItem("accessToken", mockToken);
      const consoleError = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("Network error");
      (apiClient.delete as jest.Mock).mockRejectedValue(error);

      await expect(deleteUserAddress(1)).rejects.toThrow("Network error");
      expect(handleAuthErrors).toHaveBeenCalledWith(error);
      expect(consoleError).toHaveBeenCalledWith("Error deleting user address:", error);

      consoleError.mockRestore();
    });
  });
});
