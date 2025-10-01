import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForgotPasswordForm from "../Form";

jest.mock("@/components/Kits/Auth/Button", () => ({
  __esModule: true,
  default: ({ children, disabled, icon, type }: any) => (
    <button type={type} disabled={disabled} data-testid="auth-button">
      {icon}
      {children}
    </button>
  ),
}));

jest.mock("@/components/Kits/Text", () => ({
  __esModule: true,
  default: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

jest.mock("@/components/Kits/Auth/Input", () => ({
  __esModule: true,
  default: ({ value, onEdit }: any) => (
    <input
      data-testid="phone-input"
      value={value}
      onChange={(e) => onEdit(e.target.value)}
    />
  ),
}));

describe("ForgotPasswordForm", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render form with phone number input", () => {
    render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText("شماره همراه")).toBeInTheDocument();
    expect(screen.getByTestId("phone-input")).toBeInTheDocument();
  });

  it("should render submit button", () => {
    render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText("تایید شماره همراه")).toBeInTheDocument();
  });

  it("should update phone number on input change", () => {
    render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

    const input = screen.getByTestId("phone-input");
    fireEvent.change(input, { target: { value: "09123456789" } });

    expect(input).toHaveValue("09123456789");
  });

  it("should call onSubmit with form data when submitted", async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

    const input = screen.getByTestId("phone-input");
    fireEvent.change(input, { target: { value: "09123456789" } });

    const form = screen.getByTestId("auth-button").closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        phoneNumber: "09123456789",
      });
    });
  });

  it("should disable submit button while loading", async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

    const button = screen.getByTestId("auth-button");
    const form = button.closest("form");

    fireEvent.submit(form!);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it("should show loading spinner when submitting", async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

    const form = screen.getByTestId("auth-button").closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      const spinner = screen.getByTestId("auth-button").querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  it("should handle submit error gracefully", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    mockOnSubmit.mockRejectedValue(new Error("Submit failed"));

    render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

    const form = screen.getByTestId("auth-button").closest("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it("should re-enable button after submit completes", async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

    const button = screen.getByTestId("auth-button");
    const form = button.closest("form");

    fireEvent.submit(form!);

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it("should prevent default form submission", () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(<ForgotPasswordForm onSubmit={mockOnSubmit} />);

    const form = screen.getByTestId("auth-button").closest("form");
    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });

    fireEvent(form!, submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
  });
});
