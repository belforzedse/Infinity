import { fireEvent, render, waitFor } from "@testing-library/react";
import AuthForm from "./index";

const mockCheck = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/hooks/useCheckPhoneNumber", () => ({
  useCheckPhoneNumber: () => ({
    isLoading: false,
    error: null,
    checkPhoneNumber: mockCheck,
  }),
}));

describe("AuthForm component", () => {
  beforeEach(() => {
    mockCheck.mockReset();
    mockCheck.mockResolvedValue(undefined);
  });

  it("submits phone number for checking", async () => {
    const { getByPlaceholderText, container } = render(<AuthForm />);
    const input = getByPlaceholderText("09122032114");
    fireEvent.change(input, { target: { value: "09123456789" } });
    const form = container.querySelector("form");
    if (!form) throw new Error("form not found");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockCheck).toHaveBeenCalledWith("09123456789");
    });
  });
});
