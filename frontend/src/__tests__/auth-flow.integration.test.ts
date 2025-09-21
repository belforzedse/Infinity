import AuthService from "@/services/auth";
import { apiClient } from "@/services";
import { handleAuthErrors } from "@/utils/auth";

// Mock the API client
jest.mock("@/services", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

// Mock auth utils
jest.mock("@/utils/auth");

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "localStorage", { value: localStorageMock });
Object.defineProperty(window, "sessionStorage", { value: sessionStorageMock });

describe("Authentication Flow Integration", () => {
  const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
  const mockHandleAuthErrors = handleAuthErrors as jest.MockedFunction<typeof handleAuthErrors>;

  beforeEach(() => {
    mockPost.mockClear();
    mockHandleAuthErrors.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    sessionStorageMock.getItem.mockClear();
  });

  describe("OTP Authentication Flow", () => {
    it("completes full OTP flow successfully", async () => {
      const phoneNumber = "09123456789";
      const otp = "123456";
      const otpToken = "otp-token-123";
      const authToken = "auth-token-456";

      // Mock sendOTP response
      mockPost.mockResolvedValueOnce({ otpToken });

      // Mock verifyOTP response
      sessionStorageMock.getItem.mockReturnValue(otpToken);
      mockPost.mockResolvedValueOnce({ token: authToken });

      // Step 1: Send OTP
      const otpResponse = await AuthService.sendOTP(phoneNumber);
      expect(otpResponse.otpToken).toBe(otpToken);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith("otpToken", otpToken);

      // Step 2: Verify OTP
      const verifyResponse = await AuthService.verifyOTP(otp);
      expect(verifyResponse.token).toBe(authToken);
      expect(sessionStorageMock.getItem).toHaveBeenCalledWith("otpToken");
    });

    it("handles OTP verification failure", async () => {
      const phoneNumber = "09123456789";
      const invalidOtp = "000000";
      const otpToken = "otp-token-123";

      // Mock sendOTP success
      mockPost.mockResolvedValueOnce({ otpToken });

      // Mock verifyOTP failure
      sessionStorageMock.getItem.mockReturnValue(otpToken);
      const verifyError = new Error("Invalid OTP");
      mockPost.mockRejectedValueOnce(verifyError);

      // Send OTP successfully
      await AuthService.sendOTP(phoneNumber);

      // Verify OTP fails
      await expect(AuthService.verifyOTP(invalidOtp)).rejects.toThrow("Invalid OTP");
    });

    it("handles missing OTP token during verification", async () => {
      const otp = "123456";
      const authToken = "auth-token-456";

      // Mock missing otpToken in sessionStorage
      sessionStorageMock.getItem.mockReturnValue(null);
      mockPost.mockResolvedValueOnce({ token: authToken });

      const result = await AuthService.verifyOTP(otp);

      expect(mockPost).toHaveBeenCalledWith(expect.any(String), { otpToken: null, otp });
      expect(result.token).toBe(authToken);
    });
  });

  describe("Password Authentication Flow", () => {
    it("logs in with phone and password successfully", async () => {
      const phone = "09123456789";
      const password = "password123";
      const authToken = "auth-token-789";

      mockPost.mockResolvedValueOnce({ token: authToken });

      const result = await AuthService.loginPassword(phone, password);

      expect(mockPost).toHaveBeenCalledWith(expect.any(String), { phone, password });
      expect(result.token).toBe(authToken);
    });

    it("handles invalid credentials", async () => {
      const phone = "09123456789";
      const password = "wrongpassword";
      const error = new Error("Invalid credentials");

      mockPost.mockRejectedValueOnce(error);

      await expect(AuthService.loginPassword(phone, password)).rejects.toThrow(
        "Invalid credentials",
      );
    });
  });

  describe("User Registration Flow", () => {
    it("registers new user successfully", async () => {
      const registrationData = {
        phone: "09123456789",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      };
      const authToken = "auth-token-new";

      mockPost.mockResolvedValueOnce({ token: authToken });

      const result = await AuthService.register(registrationData);

      expect(mockPost).toHaveBeenCalledWith(expect.any(String), registrationData);
      expect(result.token).toBe(authToken);
    });

    it("handles registration with existing phone number", async () => {
      const registrationData = {
        phone: "09123456789",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      };
      const error = new Error("Phone number already exists");

      mockPost.mockRejectedValueOnce(error);

      await expect(AuthService.register(registrationData)).rejects.toThrow(
        "Phone number already exists",
      );
    });
  });

  describe("User Existence Check", () => {
    it("checks if user exists successfully", async () => {
      const phone = "09123456789";
      const mockResponse = { exists: true };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await AuthService.checkUserExists(phone);

      expect(mockPost).toHaveBeenCalledWith(expect.any(String), { phone });
      expect(result.exists).toBe(true);
    });

    it("handles non-existent user", async () => {
      const phone = "09999999999";
      const mockResponse = { exists: false };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await AuthService.checkUserExists(phone);

      expect(result.exists).toBe(false);
    });
  });

  describe("Password Reset Flow", () => {
    it("resets password successfully", async () => {
      const resetData = {
        phone: "09123456789",
        newPassword: "newpassword123",
        otpToken: "otp-token-reset",
      };
      const mockResponse = { success: true };

      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await AuthService.resetPassword(resetData);

      expect(mockPost).toHaveBeenCalledWith(expect.any(String), resetData);
      expect(result.success).toBe(true);
    });

    it("handles invalid reset token", async () => {
      const resetData = {
        phone: "09123456789",
        newPassword: "newpassword123",
        otpToken: "invalid-token",
      };
      const error = new Error("Invalid or expired token");

      mockPost.mockRejectedValueOnce(error);

      await expect(AuthService.resetPassword(resetData)).rejects.toThrow(
        "Invalid or expired token",
      );
    });
  });

  describe("Authentication Error Handling", () => {
    it("handles network errors gracefully", async () => {
      const phone = "09123456789";
      const networkError = new Error("Network Error");

      mockPost.mockRejectedValueOnce(networkError);

      await expect(AuthService.sendOTP(phone)).rejects.toThrow("Network Error");
    });

    it("handles server errors during authentication", async () => {
      const phone = "09123456789";
      const password = "password123";
      const serverError = {
        status: 500,
        message: "Internal Server Error",
      };

      mockPost.mockRejectedValueOnce(serverError);

      await expect(AuthService.loginPassword(phone, password)).rejects.toEqual(serverError);
    });

    it("handles authentication errors through error handler", async () => {
      const phone = "09123456789";
      const password = "wrongpassword";
      const authError = {
        status: 401,
        message: "Unauthorized",
      };

      mockPost.mockRejectedValueOnce(authError);

      try {
        await AuthService.loginPassword(phone, password);
      } catch (error) {
        // Error should be the same object that was thrown
        expect(error).toEqual(authError);
      }
    });
  });

  describe("Session Management", () => {
    it("manages OTP token in session storage correctly", async () => {
      const phoneNumber = "09123456789";
      const otpToken = "session-otp-token";

      mockPost.mockResolvedValueOnce({ otpToken });

      await AuthService.sendOTP(phoneNumber);

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith("otpToken", otpToken);
    });

    it("retrieves OTP token from session storage for verification", async () => {
      const otp = "123456";
      const storedToken = "stored-otp-token";
      const authToken = "final-auth-token";

      sessionStorageMock.getItem.mockReturnValue(storedToken);
      mockPost.mockResolvedValueOnce({ token: authToken });

      await AuthService.verifyOTP(otp);

      expect(sessionStorageMock.getItem).toHaveBeenCalledWith("otpToken");
      expect(mockPost).toHaveBeenCalledWith(expect.any(String), { otpToken: storedToken, otp });
    });
  });
});
