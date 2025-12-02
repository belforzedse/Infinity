import { loginPassword } from "../loginPassword";
import { apiClient } from "../../index";
import { ENDPOINTS } from "@/constants/api";

// Mock the API client
jest.mock("../../index", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe("loginPassword", () => {
  const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

  beforeEach(() => {
    mockPost.mockClear();
  });

  it("logs in with phone and password", async () => {
    const phone = "09123456789";
    const password = "password123";
    const mockResponse = { data: { token: "auth-token" } };

    mockPost.mockResolvedValueOnce(mockResponse);

    const result = await loginPassword(phone, password);

    expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.LOGIN_PASSWORD, {
      phone,
      password,
    });
    expect(result).toEqual(mockResponse.data);
  });

  it("handles API errors correctly", async () => {
    const phone = "09123456789";
    const password = "wrongpassword";
    const error = new Error("Invalid credentials");

    mockPost.mockRejectedValueOnce(error);

    await expect(loginPassword(phone, password)).rejects.toThrow("Invalid credentials");
  });

  it("works with different phone number formats", async () => {
    const phoneNumbers = ["09123456789", "+989123456789", "989123456789"];
    const password = "password123";
    const mockResponse = { data: { token: "auth-token" } };

    mockPost.mockResolvedValue(mockResponse);

    for (const phone of phoneNumbers) {
      await loginPassword(phone, password);

      expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.LOGIN_PASSWORD, {
        phone,
        password,
      });
    }
  });

  it("handles empty credentials", async () => {
    const phone = "";
    const password = "";
    const mockResponse = { data: { token: "auth-token" } };

    mockPost.mockResolvedValueOnce(mockResponse);

    const result = await loginPassword(phone, password);

    expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.LOGIN_PASSWORD, {
      phone: "",
      password: "",
    });
    expect(result).toEqual(mockResponse.data);
  });

  it("calls correct API endpoint", async () => {
    const phone = "09123456789";
    const password = "password123";
    const mockResponse = { data: { token: "auth-token" } };

    mockPost.mockResolvedValueOnce(mockResponse);

    await loginPassword(phone, password);

    expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.LOGIN_PASSWORD, expect.any(Object));
  });

  it("returns response as expected", async () => {
    const phone = "09123456789";
    const password = "password123";
    const mockResponse = {
      data: {
        token: "auth-token",
        user: { id: 1, name: "John Doe", phone },
      }
    };

    mockPost.mockResolvedValueOnce(mockResponse);

    const result = await loginPassword(phone, password);

    expect(result).toEqual(mockResponse.data);
  });

  it("handles special characters in password", async () => {
    const phone = "09123456789";
    const password = "p@ssw0rd!#$%";
    const mockResponse = { data: { token: "auth-token" } };

    mockPost.mockResolvedValueOnce(mockResponse);

    const result = await loginPassword(phone, password);

    expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.LOGIN_PASSWORD, {
      phone,
      password,
    });
    expect(result).toEqual(mockResponse.data);
  });

  it("handles unicode characters in credentials", async () => {
    const phone = "09123456789";
    const password = "پسورد۱۲۳";
    const mockResponse = { data: { token: "auth-token" } };

    mockPost.mockResolvedValueOnce(mockResponse);

    const result = await loginPassword(phone, password);

    expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.LOGIN_PASSWORD, {
      phone,
      password,
    });
    expect(result).toEqual(mockResponse.data);
  });
});