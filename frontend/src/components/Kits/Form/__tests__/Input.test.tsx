import { render, screen, fireEvent } from "@testing-library/react";
import Input from "../Input";

jest.mock("@/components/ui/Input", () => ({
  Input: ({ ref, ...props }: any) => <input ref={ref} {...props} />,
}));

jest.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("Form Input", () => {
  it("should render input with name", () => {
    render(<Input name="test-input" />);

    expect(screen.getByRole("textbox")).toHaveAttribute("name", "test-input");
  });

  it("should render label when provided", () => {
    render(<Input name="email" label="Email Address" />);

    expect(screen.getByText("Email Address")).toBeInTheDocument();
  });

  it("should show required asterisk when required", () => {
    render(<Input name="email" label="Email" required />);

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("should display error message", () => {
    render(<Input name="email" error="Invalid email" />);

    expect(screen.getByText("Invalid email")).toBeInTheDocument();
  });

  it("should call onChange when input changes", () => {
    const handleChange = jest.fn();

    render(<Input name="test" onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new value" } });

    expect(handleChange).toHaveBeenCalled();
  });

  it("should handle different input types", () => {
    const { rerender } = render(<Input name="test" type="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");

    rerender(<Input name="test" type="password" />);
    expect(screen.getByRole("textbox", { hidden: true })).toHaveAttribute("type", "password");

    rerender(<Input name="test" type="tel" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "tel");
  });

  it("should apply placeholder", () => {
    render(<Input name="test" placeholder="Enter text..." />);

    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Input name="test" disabled />);

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("should render icon when provided", () => {
    render(<Input name="test" icon={<span data-testid="custom-icon">🔍</span>} />);

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("should call onIconClick when icon is clicked", () => {
    const handleIconClick = jest.fn();

    render(
      <Input
        name="test"
        icon={<span>icon</span>}
        onIconClick={handleIconClick}
      />,
    );

    const iconButton = screen.getByRole("button");
    fireEvent.click(iconButton);

    expect(handleIconClick).toHaveBeenCalled();
  });

  it("should disable icon button when input is disabled", () => {
    render(
      <Input
        name="test"
        icon={<span>icon</span>}
        onIconClick={jest.fn()}
        disabled
      />,
    );

    const iconButton = screen.getByRole("button");
    expect(iconButton).toBeDisabled();
  });

  it("should apply maxLength and minLength", () => {
    render(<Input name="test" maxLength={10} minLength={3} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("maxLength", "10");
    expect(input).toHaveAttribute("minLength", "3");
  });

  it("should apply pattern attribute", () => {
    render(<Input name="test" pattern="[0-9]*" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("pattern", "[0-9]*");
  });

  it("should apply dir attribute", () => {
    render(<Input name="test" dir="ltr" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("dir", "ltr");
  });

  it("should use rtl dir by default", () => {
    render(<Input name="test" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("dir", "rtl");
  });

  it("should apply autoComplete attribute", () => {
    render(<Input name="email" autoComplete="email" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("autoComplete", "email");
  });

  it("should apply custom className", () => {
    render(<Input name="test" className="custom-input" />);

    const input = screen.getByRole("textbox");
    expect(input.className).toContain("custom-input");
  });

  it("should apply error border class when error exists", () => {
    render(<Input name="test" error="Error message" />);

    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-red-500");
  });

  it("should apply icon padding when icon is present", () => {
    render(<Input name="test" icon={<span>icon</span>} />);

    const input = screen.getByRole("textbox");
    expect(input.className).toContain("pl-10");
  });

  it("should link label to input with htmlFor", () => {
    render(<Input name="email" label="Email" />);

    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", "email");
  });

  it("should handle value changes in controlled mode", () => {
    const { rerender } = render(<Input name="test" value="initial" readOnly />);

    expect(screen.getByRole("textbox")).toHaveValue("initial");

    rerender(<Input name="test" value="updated" readOnly />);

    expect(screen.getByRole("textbox")).toHaveValue("updated");
  });
});
