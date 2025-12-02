import AuthService from "../index";
import { sendOTP } from "../sendOTP";
import { verifyOTP } from "../verifyOTP";
import { loginPassword } from "../loginPassword";
import { register } from "../register";
import { checkUserExists } from "../exists";
import { resetPassword } from "../resetPassword";

// Mock the individual auth modules
jest.mock("../sendOTP");
jest.mock("../verifyOTP");
jest.mock("../loginPassword");
jest.mock("../register");
jest.mock("../exists");
jest.mock("../resetPassword");

describe("AuthService", () => {
  it("exports all auth methods", () => {
    expect(AuthService.sendOTP).toBeDefined();
    expect(AuthService.verifyOTP).toBeDefined();
    expect(AuthService.loginPassword).toBeDefined();
    expect(AuthService.register).toBeDefined();
    expect(AuthService.checkUserExists).toBeDefined();
    expect(AuthService.resetPassword).toBeDefined();
  });

  it("exports the correct methods", () => {
    expect(AuthService.sendOTP).toBe(sendOTP);
    expect(AuthService.verifyOTP).toBe(verifyOTP);
    expect(AuthService.loginPassword).toBe(loginPassword);
    expect(AuthService.register).toBe(register);
    expect(AuthService.checkUserExists).toBe(checkUserExists);
    expect(AuthService.resetPassword).toBe(resetPassword);
  });

  it("has all required auth service methods", () => {
    const expectedMethods = [
      "sendOTP",
      "verifyOTP",
      "loginPassword",
      "register",
      "checkUserExists",
      "resetPassword",
    ];

    expectedMethods.forEach((method) => {
      expect(AuthService).toHaveProperty(method);
      expect(typeof AuthService[method as keyof typeof AuthService]).toBe("function");
    });
  });
});
