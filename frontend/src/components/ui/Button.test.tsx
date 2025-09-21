import { render, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button component", () => {
  it("renders with text and handles click", () => {
    const handleClick = jest.fn();
    const { getByRole } = render(<Button onClick={handleClick}>Click</Button>);
    const button = getByRole("button", { name: /click/i });
    expect(button).toHaveClass("btn");
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  it("does not trigger click when disabled", () => {
    const handleClick = jest.fn();
    const { getByRole } = render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );
    const button = getByRole("button", { name: /disabled/i });
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies variant classes correctly", () => {
    const { getByRole: getPrimary } = render(<Button variant="primary">Primary</Button>);
    const { getByRole: getOutline } = render(<Button variant="outline">Outline</Button>);

    expect(getPrimary("button")).toHaveClass("btn-primary");
    expect(getOutline("button")).toHaveClass("btn-outline");
  });

  it("applies size classes correctly", () => {
    const { getByRole: getDefault } = render(<Button size="default">Default</Button>);
    const { getByRole: getSmall } = render(<Button size="sm">Small</Button>);
    const { getByRole: getLarge } = render(<Button size="lg">Large</Button>);
    const { getByRole: getXL } = render(<Button size="xl">Extra Large</Button>);
    const { getByRole: getIcon } = render(<Button size="icon">Icon</Button>);

    expect(getDefault("button")).toHaveClass("h-10", "px-4", "py-2");
    expect(getSmall("button")).toHaveClass("h-8", "px-3");
    expect(getLarge("button")).toHaveClass("h-12", "px-8");
    expect(getXL("button")).toHaveClass("text-xl", "h-[54px]", "px-8");
    expect(getIcon("button")).toHaveClass("h-10", "w-10");
  });

  it("applies fullWidth class when prop is true", () => {
    const { getByRole } = render(<Button fullWidth>Full Width</Button>);
    expect(getByRole("button")).toHaveClass("w-full");
  });

  it("does not apply fullWidth class when prop is false", () => {
    const { getByRole } = render(<Button fullWidth={false}>Not Full Width</Button>);
    expect(getByRole("button")).not.toHaveClass("w-full");
  });

  it("merges custom className with default classes", () => {
    const { getByRole } = render(<Button className="custom-class">Custom</Button>);
    const button = getByRole("button");
    expect(button).toHaveClass("btn", "custom-class");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null };
    render(<Button ref={ref}>Ref Test</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("passes through all button HTML attributes", () => {
    const { getByRole } = render(
      <Button type="submit" name="test-button" data-testid="custom-button">
        Submit
      </Button>,
    );
    const button = getByRole("button");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("name", "test-button");
    expect(button).toHaveAttribute("data-testid", "custom-button");
  });

  it("uses default variants when none specified", () => {
    const { getByRole } = render(<Button>Default</Button>);
    const button = getByRole("button");
    expect(button).toHaveClass("btn-primary", "h-10", "px-4", "py-2");
    expect(button).not.toHaveClass("w-full");
  });
});
