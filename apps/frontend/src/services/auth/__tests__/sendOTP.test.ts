import { sendOTP } from "../sendOTP";
import { apiClient } from "../../index";
import { ENDPOINTS } from "@/constants/api";

jest.mock("../../index", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe("sendOTP", () => {
  const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

  beforeEach(() => {
    mockPost.mockReset();
    sessionStorage.clear();
  });

  it("posts a normalized phone number and returns the API payload", async () => {
    const response = { otpToken: "mock-otp-token" };
    mockPost.mockResolvedValueOnce(response);

    const result = await sendOTP("09123456789");

    expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.SEND_OTP, {
      phone: "+989123456789",
    });
    expect(result).toEqual(response);
  });

  it.each([
    ["09123456789", "+989123456789"],
    ["+989123456789", "+989123456789"],
    ["989123456789", "+989123456789"],
    [" 09123456789 ", "+989123456789"],
  ])("normalizes %s to %s", async (input, expected) => {
    mockPost.mockResolvedValue({ otpToken: "mock-otp-token" });

    await sendOTP(input);

    expect(mockPost).toHaveBeenLastCalledWith(ENDPOINTS.AUTH.SEND_OTP, {
      phone: expected,
    });
  });

  it("stores the returned otpToken in sessionStorage", async () => {
    mockPost.mockResolvedValueOnce({ otpToken: "mock-otp-token" });

    await sendOTP("09123456789");

    expect(sessionStorage.getItem("otpToken")).toBe("mock-otp-token");
  });

  it("propagates API errors without storing a token", async () => {
    const error = new Error("Network Error");
    mockPost.mockRejectedValueOnce(error);

    await expect(sendOTP("09123456789")).rejects.toThrow("Network Error");
    expect(sessionStorage.getItem("otpToken")).toBeNull();
  });
});
