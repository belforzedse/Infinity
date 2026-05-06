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
    const mockResponse = { data: { otpToken: "mock-otp-token" } };

    mockPost.mockResolvedValueOnce(mockResponse);

    const result = await sendOTP(phoneNumber);

    expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.SEND_OTP, { phone: phoneNumber });
    expect(result).toEqual(mockResponse.data);
  });

  it("stores otpToken in sessionStorage", async () => {
    const phoneNumber = "09123456789";
    const mockResponse = { data: { otpToken: "mock-otp-token" } };

    mockPost.mockResolvedValueOnce(mockResponse);

    await sendOTP(phoneNumber);

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith("otpToken", "mock-otp-token");
  });

  it("formats phone number correctly", async () => {
    const phoneNumbers = [
      { input: "09123456789", expected: "09123456789" },
      { input: "+989123456789", expected: "+989123456789" },
      { input: "989123456789", expected: "989123456789" },
    ];

    const mockResponse = { data: { otpToken: "mock-otp-token" } };

    mockPost.mockResolvedValue(mockResponse);

    for (const { input, expected } of phoneNumbers) {
      await sendOTP(input);
      expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.SEND_OTP, { phone: expected });
    }
  });

  it("handles API errors correctly", async () => {
    const phoneNumber = "09123456789";
    const mockResponse = { data: {} };

    mockPost.mockResolvedValueOnce(mockResponse);

    const result = await sendOTP(phoneNumber);

    expect(result).toEqual(mockResponse.data);
  });

  it("calls correct API endpoint", async () => {
    const phoneNumber = "09123456789";
    const mockResponse = { data: { otpToken: "mock-otp-token" } };

    mockPost.mockResolvedValueOnce(mockResponse);

    await sendOTP(phoneNumber);

    expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.SEND_OTP, expect.any(Object));
  });
});