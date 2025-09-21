import { sendOTP } from "../sendOTP";
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

describe("sendOTP", () => {
  const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

  beforeEach(() => {
    mockPost.mockClear();
    sessionStorageMock.setItem.mockClear();
  });

  it("sends OTP request with correct phone number", async () => {
    const phoneNumber = "09123456789";
    const mockResponse = { otpToken: "mock-otp-token" };

    mockPost.mockResolvedValueOnce(mockResponse);

    const result = await sendOTP(phoneNumber);

    expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.SEND_OTP, { phone: phoneNumber });
    expect(result).toEqual(mockResponse);
  });

  it("stores otpToken in sessionStorage", async () => {
    const phoneNumber = "09123456789";
    const mockResponse = { otpToken: "mock-otp-token" };

    mockPost.mockResolvedValueOnce(mockResponse);

    await sendOTP(phoneNumber);

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith("otpToken", "mock-otp-token");
  });

  it("handles API errors correctly", async () => {
    const phoneNumber = "09123456789";
    const error = new Error("Network error");

    mockPost.mockRejectedValueOnce(error);

    await expect(sendOTP(phoneNumber)).rejects.toThrow("Network error");
    expect(sessionStorageMock.setItem).not.toHaveBeenCalled();
  });

  it("works with different phone number formats", async () => {
    const phoneNumbers = ["09123456789", "+989123456789", "989123456789"];

    const mockResponse = { otpToken: "mock-otp-token" };
    mockPost.mockResolvedValue(mockResponse);

    for (const phoneNumber of phoneNumbers) {
      await sendOTP(phoneNumber);

      expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.SEND_OTP, { phone: phoneNumber });
    }
  });

  it("handles response without otpToken gracefully", async () => {
    const phoneNumber = "09123456789";
    const mockResponse = {}; // No otpToken

    mockPost.mockResolvedValueOnce(mockResponse);

    const result = await sendOTP(phoneNumber);

    expect(result).toEqual(mockResponse);
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith("otpToken", undefined);
  });

  it("calls correct API endpoint", async () => {
    const phoneNumber = "09123456789";
    const mockResponse = { otpToken: "mock-otp-token" };

    mockPost.mockResolvedValueOnce(mockResponse);

    await sendOTP(phoneNumber);

    expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.SEND_OTP, expect.any(Object));
  });
});
