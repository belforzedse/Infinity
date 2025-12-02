import { render, screen, fireEvent } from "@testing-library/react";
import AuthInput from "../index";

jest.mock("../../../Text", () => ({
  __esModule: true,
  default: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

describe("AuthInput", () => {
  it("should render input element", () => {
    render(<AuthInput />);

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should display value", () => {
    render(<AuthInput value="test value" readOnly />);

    expect(screen.getByRole("textbox")).toHaveValue("test value");
  });

  it("should call onEdit when value changes", () => {
    const handleEdit = jest.fn();

    render(<AuthInput onEdit={handleEdit} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new value" } });

    expect(handleEdit).toHaveBeenCalledWith("new value");
  });

  it("should display error message", () => {
    render(<AuthInput error="This field is required" />);

    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("should apply error styles when error exists", () => {
    render(<AuthInput error="Error message" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-red-500");
  });

  it("should render right element", () => {
    render(<AuthInput rightElement={<button>Right</button>} />);

    expect(screen.getByText("Right")).toBeInTheDocument();
  });

  it("should render left element", () => {
    render(<AuthInput leftElement={<span>Left</span>} />);

    expect(screen.getByText("Left")).toBeInTheDocument();
  });

  it("should apply correct padding when right element exists", () => {
    render(<AuthInput rightElement={<button>→</button>} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("pr-[4.5rem]");
  });

  it("should apply correct padding when left element exists", () => {
    render(<AuthInput leftElement={<span>←</span>} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("pl-12");
  });

  it("should apply custom className", () => {
    render(<AuthInput className="custom-input" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-input");
  });

  it("should apply parent className", () => {
    const { container } = render(<AuthInput parentClassNames="parent-class" />);

    expect(container.firstChild).toHaveClass("parent-class");
  });

  it("should pass through HTML input attributes", () => {
    render(
      <AuthInput
        placeholder="Enter text"
        type="email"
        name="email"
        disabled
        readOnly
      />,
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("placeholder", "Enter text");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toBeDisabled();
  });

  it("should not display error when error is null", () => {
    render(<AuthInput error={null} />);

    const container = screen.getByRole("textbox").parentElement?.parentElement;
    expect(container?.querySelector(".text-red-500")).not.toBeInTheDocument();
  });

  it("should have default styles", () => {
    render(<AuthInput />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("h-12", "w-full", "rounded-lg");
  });

  it("should have focus styles", () => {
    render(<AuthInput />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("focus:outline-none", "focus:ring-2", "focus:ring-pink-400");
  });

  it("should handle controlled input", () => {
    const { rerender } = render(<AuthInput value="initial" readOnly />);

    expect(screen.getByRole("textbox")).toHaveValue("initial");

    rerender(<AuthInput value="updated" readOnly />);

    expect(screen.getByRole("textbox")).toHaveValue("updated");
  });
});
