import AuthService from "@/services/auth";
import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";

jest.mock("@/services", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe("Authentication Flow Integration", () => {
  const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

  beforeEach(() => {
    mockPost.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("OTP authentication", () => {
    it("completes send and verify using the stored OTP token", async () => {
      mockPost
        .mockResolvedValueOnce({ otpToken: "otp-token-123" })
        .mockResolvedValueOnce({ token: "auth-token-456" });

      const otpResponse = await AuthService.sendOTP("09123456789");
      const verifyResponse = await AuthService.verifyOTP("123456");

      expect(otpResponse).toEqual({ otpToken: "otp-token-123" });
      expect(sessionStorage.getItem("otpToken")).toBe("otp-token-123");
      expect(verifyResponse).toEqual({ token: "auth-token-456" });
      expect(mockPost).toHaveBeenNthCalledWith(1, ENDPOINTS.AUTH.SEND_OTP, {
        phone: "+989123456789",
      });
      expect(mockPost).toHaveBeenNthCalledWith(
        2,
        ENDPOINTS.AUTH.VERIFY_OTP,
        {
          otpToken: "otp-token-123",
          otp: "123456",
        },
        { suppressAuthRedirect: true },
      );
    });

    it("propagates OTP verification failures", async () => {
      sessionStorage.setItem("otpToken", "otp-token-123");
      const verifyError = new Error("Invalid OTP");
      mockPost.mockRejectedValueOnce(verifyError);

      await expect(AuthService.verifyOTP("000000")).rejects.toThrow("Invalid OTP");
      expect(mockPost).toHaveBeenCalledWith(
        ENDPOINTS.AUTH.VERIFY_OTP,
        { otpToken: "otp-token-123", otp: "000000" },
        { suppressAuthRedirect: true },
      );
    });

    it("still sends verification when the OTP token is missing so the backend owns validation", async () => {
      mockPost.mockResolvedValueOnce({ token: "auth-token-456" });

      const result = await AuthService.verifyOTP("123456");

      expect(mockPost).toHaveBeenCalledWith(
        ENDPOINTS.AUTH.VERIFY_OTP,
        { otpToken: null, otp: "123456" },
        { suppressAuthRedirect: true },
      );
      expect(result).toEqual({ token: "auth-token-456" });
    });
  });

  describe("password authentication", () => {
    it("logs in with normalized phone and suppresses auth redirects", async () => {
      mockPost.mockResolvedValueOnce({ token: "auth-token-789" });

      const result = await AuthService.loginPassword("09123456789", "password123");

      expect(mockPost).toHaveBeenCalledWith(
        ENDPOINTS.AUTH.LOGIN_PASSWORD,
        {
          phone: "+989123456789",
          password: "password123",
        },
        { suppressAuthRedirect: true },
      );
      expect(result).toEqual({ token: "auth-token-789" });
    });

    it("propagates invalid credential errors", async () => {
      const error = new Error("Invalid credentials");
      mockPost.mockRejectedValueOnce(error);

      await expect(AuthService.loginPassword("09123456789", "wrongpassword")).rejects.toThrow(
        "Invalid credentials",
      );
    });
  });

  describe("registration and user existence", () => {
    it("registers a new user with a normalized phone number", async () => {
      mockPost.mockResolvedValueOnce({ token: "auth-token-new" });

      const result = await AuthService.register({
        phone: "09123456789",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      });

      expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.REGISTER, {
        phone: "+989123456789",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      });
      expect(result).toEqual({ token: "auth-token-new" });
    });

    it("checks user existence with a normalized phone number", async () => {
      mockPost.mockResolvedValueOnce({ hasUser: true });

      const result = await AuthService.checkUserExists("09123456789");

      expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.EXISTS, {
        phone: "+989123456789",
      });
      expect(result).toEqual({ hasUser: true });
    });
  });

  describe("password reset", () => {
    it("resets password using an explicit OTP token and normalized phone", async () => {
      mockPost.mockResolvedValueOnce({ success: true });

      const result = await AuthService.resetPassword({
        phone: "09123456789",
        newPassword: "newpassword123",
        otpToken: "otp-token-reset",
        otp: "123456",
      });

      expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.RESET_PASSWORD, {
        phone: "+989123456789",
        newPassword: "newpassword123",
        otpToken: "otp-token-reset",
        otp: "123456",
      });
      expect(result).toEqual({ success: true });
    });

    it("falls back to the stored OTP token during reset", async () => {
      sessionStorage.setItem("otpToken", "stored-token");
      mockPost.mockResolvedValueOnce({ success: true });

      await AuthService.resetPassword({
        newPassword: "newpassword123",
        otp: "123456",
      });

      expect(mockPost).toHaveBeenCalledWith(ENDPOINTS.AUTH.RESET_PASSWORD, {
        phone: undefined,
        newPassword: "newpassword123",
        otpToken: "stored-token",
        otp: "123456",
      });
    });

    it("fails locally when no reset OTP token is available", async () => {
      await expect(
        AuthService.resetPassword({
          newPassword: "newpassword123",
          otp: "123456",
        }),
      ).rejects.toThrow("Missing OTP token");

      expect(mockPost).not.toHaveBeenCalled();
    });
  });
});
