import { verifyOTP } from "../verifyOTP";
import { apiClient } from "../../index";
import { ENDPOINTS } from "@/constants/api";

// Mock the API client
jest.mock("../../index", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

describe("verifyOTP", () => {
  const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

  beforeEach(() => {
    mockPost.mockClear();
    sessionStorageMock.getItem.mockClear();
  });

  it("verifies OTP with correct parameters", async () => {
    const otp = "123456";
    const otpToken = "mock-otp-token";
    const mockResponse = { data: { token: "auth-token" } };

    sessionStorageMock.getItem.mockReturnValue(otpToken);
    mockPost.mockResolvedValueOnce(mockResponse);

    const result = await verifyOTP(otp);

    expect(sessionStorageMock.getItem).toHaveBeenCalledWith("otpToken");
    expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.VERIFY_OTP, {
      otpToken,
      otp,
    });
    expect(result).toEqual(mockResponse.data);
  });

  it("handles missing otpToken in sessionStorage", async () => {
    const otp = "123456";
    const mockResponse = { data: { token: "auth-token" } };

    sessionStorageMock.getItem.mockReturnValue(null);
    mockPost.mockResolvedValueOnce(mockResponse);

    const result = await verifyOTP(otp);

    expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.VERIFY_OTP, {
      otpToken: null,
      otp,
    });
    expect(result).toEqual(mockResponse.data);
  });

  it("verifies OTP with different codes", async () => {
    const otpCodes = ["123456", "000000", "999999"];
    const otpToken = "mock-otp-token";
    const mockResponse = { data: { token: "auth-token" } };

    sessionStorageMock.getItem.mockReturnValue(otpToken);
    mockPost.mockResolvedValue(mockResponse);

    for (const otp of otpCodes) {
      await verifyOTP(otp);
      expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.VERIFY_OTP, {
        otpToken,
        otp,
      });
    }
  });

  it("handles API errors correctly", async () => {
    const otp = "123456";
    const otpToken = "mock-otp-token";
    const error = new Error("Invalid OTP");

    sessionStorageMock.getItem.mockReturnValue(otpToken);
    mockPost.mockRejectedValueOnce(error);

    await expect(verifyOTP(otp)).rejects.toThrow("Invalid OTP");
  });

  it("returns response with user data", async () => {
    const otp = "123456";
    const otpToken = "mock-otp-token";
    const mockResponse = {
      data: {
        token: "auth-token",
        user: { id: 1, name: "John" },
      }
    };

    sessionStorageMock.getItem.mockReturnValue(otpToken);
    mockPost.mockResolvedValueOnce(mockResponse);

    const result = await verifyOTP(otp);

    expect(result).toEqual(mockResponse.data);
  });

  it("calls correct API endpoint", async () => {
    const otp = "123456";
    const otpToken = "mock-otp-token";
    const mockResponse = { data: { token: "auth-token" } };

    sessionStorageMock.getItem.mockReturnValue(otpToken);
    mockPost.mockResolvedValueOnce(mockResponse);

    await verifyOTP(otp);

    expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.VERIFY_OTP, expect.any(Object));
  });
});