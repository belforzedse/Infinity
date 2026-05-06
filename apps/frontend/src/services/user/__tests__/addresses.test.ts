import {
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  type AddAddressRequest,
} from "../addresses";
import { apiClient } from "../../index";

jest.mock("../../index", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("@/utils/auth", () => ({
  handleAuthErrors: jest.fn(),
}));

describe("User Addresses Service", () => {
  const mockToken = "mock-access-token";

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("getUserAddresses", () => {
    it("should fetch user addresses successfully", async () => {
      localStorage.setItem("accessToken", mockToken);

      const mockAddresses = [
        {
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
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAddresses });

      const result = await getUserAddresses();

      expect(apiClient.get).toHaveBeenCalledWith("/local-user-addresses/me", {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
      expect(result).toEqual(mockAddresses);
    });

    it("should throw error when no token", async () => {
      await expect(getUserAddresses()).rejects.toThrow("Authentication required");
    });

    it("should handle fetch errors", async () => {
      localStorage.setItem("accessToken", mockToken);
      const consoleError = jest.spyOn(console, "error").mockImplementation();
      (apiClient.get as jest.Mock).mockRejectedValue(new Error("Network error"));

      await expect(getUserAddresses()).rejects.toThrow();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe("addUserAddress", () => {
    const validAddress: AddAddressRequest = {
      PostalCode: "1234567890",
      Description: "Home",
      FullAddress: "123 Main St",
      shipping_city: 1,
    };

    it("should add address successfully", async () => {
      localStorage.setItem("accessToken", mockToken);

      const mockResponse = {
        id: 1,
        ...validAddress,
        createdAt: "2024-01-01",
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

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
      expect(result).toEqual(mockResponse);
    });

    it("should validate postal code format", async () => {
      localStorage.setItem("accessToken", mockToken);

      const invalidAddress = { ...validAddress, PostalCode: "12345" };

      await expect(addUserAddress(invalidAddress)).rejects.toThrow(
        "Postal code must be a 10-digit number",
      );
    });

    it("should validate postal code is numeric", async () => {
      localStorage.setItem("accessToken", mockToken);

      const invalidAddress = { ...validAddress, PostalCode: "abcd123456" };

      await expect(addUserAddress(invalidAddress)).rejects.toThrow(
        "Postal code must be a 10-digit number",
      );
    });

    it("should validate full address is not empty", async () => {
      localStorage.setItem("accessToken", mockToken);

      const invalidAddress = { ...validAddress, FullAddress: "" };

      await expect(addUserAddress(invalidAddress)).rejects.toThrow(
        "Full address is required",
      );
    });

    it("should validate full address is not just whitespace", async () => {
      localStorage.setItem("accessToken", mockToken);

      const invalidAddress = { ...validAddress, FullAddress: "   " };

      await expect(addUserAddress(invalidAddress)).rejects.toThrow(
        "Full address is required",
      );
    });

    it("should validate shipping city is provided", async () => {
      localStorage.setItem("accessToken", mockToken);

      const invalidAddress = { ...validAddress, shipping_city: 0 };

      await expect(addUserAddress(invalidAddress)).rejects.toThrow(
        "Shipping city is required",
      );
    });

    it("should throw error when no token", async () => {
      await expect(addUserAddress(validAddress)).rejects.toThrow("Authentication required");
    });
  });

  describe("updateUserAddress", () => {
    const updateData: AddAddressRequest = {
      PostalCode: "1234567890",
      Description: "Updated",
      FullAddress: "456 Oak St",
      shipping_city: 2,
    };

    it("should update address successfully", async () => {
      localStorage.setItem("accessToken", mockToken);

      const mockResponse = {
        id: 1,
        ...updateData,
        createdAt: "2024-01-01",
      };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await updateUserAddress(1, updateData);

      expect(apiClient.put).toHaveBeenCalledWith("/local-user-addresses/1", updateData, {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when no token", async () => {
      await expect(updateUserAddress(1, updateData)).rejects.toThrow(
        "Authentication required",
      );
    });
  });

  describe("deleteUserAddress", () => {
    it("should delete address successfully", async () => {
      localStorage.setItem("accessToken", mockToken);

      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await deleteUserAddress(1);

      expect(apiClient.delete).toHaveBeenCalledWith("/local-user-addresses/1", {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
    });

    it("should throw error when no token", async () => {
      await expect(deleteUserAddress(1)).rejects.toThrow("Authentication required");
    });

    it("should handle delete errors", async () => {
      localStorage.setItem("accessToken", mockToken);
      const consoleError = jest.spyOn(console, "error").mockImplementation();
      (apiClient.delete as jest.Mock).mockRejectedValue(new Error("Network error"));

      await expect(deleteUserAddress(1)).rejects.toThrow();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });
});
