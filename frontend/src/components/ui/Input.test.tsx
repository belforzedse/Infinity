import { render, fireEvent } from "@testing-library/react";
import { Input } from "./Input";

describe("Input component", () => {
  it("renders and handles change events", () => {
    const handleChange = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="name" onChange={handleChange} />,
    );
    const input = getByPlaceholderText("name");
    fireEvent.change(input, { target: { value: "John" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("displays error message when error prop is provided", () => {
    const { getByText } = render(<Input error="This field is required" />);
    expect(getByText("This field is required")).toBeInTheDocument();
  });

  it("applies error styling when error prop is provided", () => {
    const { getByRole } = render(<Input error="Error message" />);
    const input = getByRole("textbox");
    expect(input).toHaveClass("border-red-500");
  });

  it("applies size variants correctly", () => {
    const { getByRole: getDefault } = render(<Input size="default" />);
    const { getByRole: getSmall } = render(<Input size="sm" />);
    const { getByRole: getLarge } = render(<Input size="lg" />);

    expect(getDefault("textbox")).toHaveClass("h-10", "px-3", "py-2");
    expect(getSmall("textbox")).toHaveClass("h-8", "px-2");
    expect(getLarge("textbox")).toHaveClass("h-12", "px-4");
  });

  it("applies auth variant styling", () => {
    const { getByRole } = render(<Input variant="auth" />);
    const input = getByRole("textbox");
    expect(input).toHaveClass("text-base", "text-foreground-primary", "rounded-xl", "border", "border-slate-200");
  });

  it("renders right element correctly", () => {
    const rightElement = <button>Right</button>;
    const { getByRole } = render(<Input rightElement={rightElement} />);

    expect(getByRole("button", { name: "Right" })).toBeInTheDocument();
    expect(getByRole("textbox")).toHaveClass("pr-[6rem]");
  });

  it("renders left element correctly", () => {
    const leftElement = <span>Left</span>;
    const { getByText } = render(<Input leftElement={leftElement} />);

    expect(getByText("Left")).toBeInTheDocument();
    expect(getByRole("textbox")).toHaveClass("pl-12");
  });

  it("applies custom className", () => {
    const { getByRole } = render(<Input className="custom-class" />);
    expect(getByRole("textbox")).toHaveClass("custom-class");
  });

  it("applies parent className to wrapper div", () => {
    const { container } = render(<Input parentClassName="parent-class" />);
    expect(container.firstChild).toHaveClass("parent-class");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("handles different input types", () => {
    const { getByRole: getPassword } = render(<Input type="password" />);
    const { getByRole: getEmail } = render(<Input type="email" />);
    const { getByRole: getNumber } = render(<Input type="number" />);

    expect(getPassword("textbox")).toHaveAttribute("type", "password");
    expect(getEmail("textbox")).toHaveAttribute("type", "email");
    expect(getNumber("spinbutton")).toHaveAttribute("type", "number");
  });

  it("renders error message with red styling", () => {
    const { getByText } = render(<Input error="Error message" />);
    const errorElement = getByText("Error message");
    expect(errorElement).toHaveClass("text-red-500");
  });

  it("does not render error when error prop is null", () => {
    const { container } = render(<Input error={null} />);
    expect(container.querySelector(".text-red-500")).not.toBeInTheDocument();
  });

  it("positions elements correctly with absolute positioning", () => {
    const rightElement = <button>Right</button>;
    const leftElement = <span>Left</span>;
    const { container } = render(
      <Input rightElement={rightElement} leftElement={leftElement} />
    );

    const rightElementContainer = container.querySelector(".absolute.right-4");
    const leftElementContainer = container.querySelector(".absolute.left-4");

    expect(rightElementContainer).toBeInTheDocument();
    expect(leftElementContainer).toBeInTheDocument();
    expect(rightElementContainer).toHaveClass("top-1/2", "-translate-y-1/2");
    expect(leftElementContainer).toHaveClass("top-1/2", "-translate-y-1/2");
  });

  it("passes through all input HTML attributes", () => {
    const { getByRole } = render(
      <Input
        name="test-input"
        data-testid="custom-input"
        maxLength={50}
        required
      />
    );
    const input = getByRole("textbox");
    expect(input).toHaveAttribute("name", "test-input");
    expect(input).toHaveAttribute("data-testid", "custom-input");
    expect(input).toHaveAttribute("maxLength", "50");
    expect(input).toBeRequired();
  });
});
