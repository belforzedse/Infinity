import { loginPassword } from "../loginPassword";
import { apiClient } from "../../index";
import { ENDPOINTS } from "@/constants/api";

jest.mock("../../index", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe("loginPassword", () => {
  const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

  beforeEach(() => {
    mockPost.mockReset();
  });

  it("posts normalized phone and password with auth redirect suppression", async () => {
    const response = { token: "auth-token" };
    mockPost.mockResolvedValueOnce(response);

    const result = await loginPassword("09123456789", "password123");

    expect(mockPost).toHaveBeenCalledWith(
      ENDPOINTS.AUTH.LOGIN_PASSWORD,
      {
        phone: "+989123456789",
        password: "password123",
      },
      { suppressAuthRedirect: true },
    );
    expect(result).toEqual(response);
  });

  it.each([
    ["09123456789", "+989123456789"],
    ["+989123456789", "+989123456789"],
    ["989123456789", "+989123456789"],
  ])("normalizes %s to %s", async (phone, expected) => {
    mockPost.mockResolvedValue({ token: "auth-token" });

    await loginPassword(phone, "password123");

    expect(mockPost).toHaveBeenLastCalledWith(
      ENDPOINTS.AUTH.LOGIN_PASSWORD,
      {
        phone: expected,
        password: "password123",
      },
      { suppressAuthRedirect: true },
    );
  });

  it("passes empty credentials through for backend validation", async () => {
    const response = { token: "auth-token" };
    mockPost.mockResolvedValueOnce(response);

    const result = await loginPassword("", "");

    expect(mockPost).toHaveBeenCalledWith(
      ENDPOINTS.AUTH.LOGIN_PASSWORD,
      { phone: "", password: "" },
      { suppressAuthRedirect: true },
    );
    expect(result).toEqual(response);
  });

  it("does not alter special or unicode password characters", async () => {
    const password = "p@ssw0rd!#$%-Ù¾Ø³ÙˆØ±Ø¯";
    mockPost.mockResolvedValueOnce({ token: "auth-token" });

    await loginPassword("09123456789", password);

    expect(mockPost).toHaveBeenCalledWith(
      ENDPOINTS.AUTH.LOGIN_PASSWORD,
      {
        phone: "+989123456789",
        password,
      },
      { suppressAuthRedirect: true },
    );
  });

  it("propagates API errors", async () => {
    const error = new Error("Invalid credentials");
    mockPost.mockRejectedValueOnce(error);

    await expect(loginPassword("09123456789", "wrongpassword")).rejects.toThrow(
      "Invalid credentials",
    );
  });
});
