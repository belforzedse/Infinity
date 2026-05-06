import { render, screen, fireEvent } from "@testing-library/react";
import Checkbox from "../Checkbox";

describe("Checkbox", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render unchecked checkbox", () => {
    render(<Checkbox checked={false} onChange={mockOnChange} />);

    const container = screen.getByRole("checkbox").parentElement;
    expect(container).toBeInTheDocument();
  });

  it("should render checked checkbox with checkmark", () => {
    const { container } = render(<Checkbox checked={true} onChange={mockOnChange} />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should not render checkmark when unchecked", () => {
    const { container } = render(<Checkbox checked={false} onChange={mockOnChange} />);

    const svg = container.querySelector("svg");
    expect(svg).not.toBeInTheDocument();
  });

  it("should render label when provided", () => {
    render(<Checkbox checked={false} onChange={mockOnChange} label="Accept terms" />);

    expect(screen.getByText("Accept terms")).toBeInTheDocument();
  });

  it("should not render label when not provided", () => {
    const { container } = render(<Checkbox checked={false} onChange={mockOnChange} />);

    const label = container.querySelector("label");
    expect(label?.textContent).toBe("");
  });

  it("should call onChange with opposite value when clicked", () => {
    render(<Checkbox checked={false} onChange={mockOnChange} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it("should toggle from checked to unchecked", () => {
    render(<Checkbox checked={true} onChange={mockOnChange} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledWith(false);
  });

  it("should apply custom className", () => {
    const { container } = render(
      <Checkbox checked={false} onChange={mockOnChange} className="custom-class" />,
    );

    const label = container.querySelector("label");
    expect(label).toHaveClass("custom-class");
  });

  it("should have checked styles when checked", () => {
    const { container } = render(<Checkbox checked={true} onChange={mockOnChange} />);

    const checkboxDiv = container.querySelector(".h-5.w-5.rounded");
    expect(checkboxDiv).toHaveClass("border-sky-600");
    expect(checkboxDiv).toHaveClass("bg-sky-600");
  });

  it("should have unchecked styles when unchecked", () => {
    const { container } = render(<Checkbox checked={false} onChange={mockOnChange} />);

    const checkboxDiv = container.querySelector(".h-5.w-5.rounded");
    expect(checkboxDiv).toHaveClass("border-slate-400");
    expect(checkboxDiv).not.toHaveClass("bg-sky-600");
  });

  it("should render React node as label", () => {
    const label = (
      <span>
        I agree to <a href="/terms">terms and conditions</a>
      </span>
    );

    render(<Checkbox checked={false} onChange={mockOnChange} label={label} />);

    expect(screen.getByText("I agree to")).toBeInTheDocument();
    expect(screen.getByText("terms and conditions")).toBeInTheDocument();
  });

  it("should have cursor-pointer on label", () => {
    const { container } = render(<Checkbox checked={false} onChange={mockOnChange} />);

    const label = container.querySelector("label");
    expect(label).toHaveClass("cursor-pointer");
  });
});
