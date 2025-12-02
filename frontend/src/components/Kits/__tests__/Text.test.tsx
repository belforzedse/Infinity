import { render, screen, fireEvent } from "@testing-library/react";
import Text from "../Text";

describe("Text", () => {
  it("should render children", () => {
    render(<Text>Hello World</Text>);

    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("should render with default helper variant", () => {
    render(<Text>Default text</Text>);

    const element = screen.getByText("Default text");
    expect(element).toHaveClass("text-sm");
    expect(element).toHaveClass("text-foreground-muted/80");
  });

  it("should render with label variant", () => {
    render(<Text variant="label">Label text</Text>);

    const element = screen.getByText("Label text");
    expect(element).toHaveClass("text-lg");
    expect(element).toHaveClass("text-foreground-primary/80");
    expect(element).toHaveClass("text-right");
  });

  it("should render with helper variant", () => {
    render(<Text variant="helper">Helper text</Text>);

    const element = screen.getByText("Helper text");
    expect(element).toHaveClass("text-sm");
    expect(element).toHaveClass("text-foreground-muted/80");
  });

  it("should render with link variant", () => {
    render(<Text variant="link">Link text</Text>);

    const element = screen.getByText("Link text");
    expect(element).toHaveClass("text-sm");
    expect(element).toHaveClass("text-pink-500");
    expect(element).toHaveClass("cursor-pointer");
  });

  it("should apply custom className", () => {
    render(<Text className="custom-class">Text</Text>);

    const element = screen.getByText("Text");
    expect(element).toHaveClass("custom-class");
  });

  it("should call onClick when clicked and not disabled", () => {
    const mockOnClick = jest.fn();

    render(
      <Text variant="link" onClick={mockOnClick}>
        Clickable
      </Text>,
    );

    const element = screen.getByText("Clickable");
    fireEvent.click(element);

    expect(mockOnClick).toHaveBeenCalled();
  });

  it("should not call onClick when disabled", () => {
    const mockOnClick = jest.fn();

    render(
      <Text variant="link" onClick={mockOnClick} disabled={true}>
        Disabled
      </Text>,
    );

    const element = screen.getByText("Disabled");
    fireEvent.click(element);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("should apply disabled styles for link variant", () => {
    render(
      <Text variant="link" disabled={true}>
        Disabled link
      </Text>,
    );

    const element = screen.getByText("Disabled link");
    expect(element).toHaveClass("text-foreground-muted");
    expect(element).not.toHaveClass("text-pink-500");
  });

  it("should have hover styles for enabled link", () => {
    render(<Text variant="link">Hover link</Text>);

    const element = screen.getByText("Hover link");
    expect(element).toHaveClass("hover:text-pink-600");
  });

  it("should render as span element", () => {
    const { container } = render(<Text>Content</Text>);

    const span = container.querySelector("span");
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent("Content");
  });

  it("should not have onClick when variant is not link", () => {
    const mockOnClick = jest.fn();

    render(
      <Text variant="label" onClick={mockOnClick}>
        Label
      </Text>,
    );

    const element = screen.getByText("Label");
    fireEvent.click(element);

    expect(mockOnClick).toHaveBeenCalled();
  });

  it("should render complex children", () => {
    render(
      <Text>
        <strong>Bold</strong> and <em>italic</em>
      </Text>,
    );

    expect(screen.getByText("Bold")).toBeInTheDocument();
    expect(screen.getByText("and")).toBeInTheDocument();
    expect(screen.getByText("italic")).toBeInTheDocument();
  });
});
