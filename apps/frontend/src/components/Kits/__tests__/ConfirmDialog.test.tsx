import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmDialog from "../ConfirmDialog";

jest.mock("@/components/Kits/Modal", () => ({
  __esModule: true,
  default: ({ isOpen, children, title, onClose }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <div>{title}</div>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null,
}));

describe("ConfirmDialog", () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    render(
      <ConfirmDialog
        isOpen={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("should render default title", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText("تایید عملیات")).toBeInTheDocument();
  });

  it("should render custom title", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Item"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText("Delete Item")).toBeInTheDocument();
  });

  it("should render description when provided", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        description="Are you sure you want to delete this item?"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText("Are you sure you want to delete this item?")).toBeInTheDocument();
  });

  it("should not render description when not provided", () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(container.querySelector("p")).not.toBeInTheDocument();
  });

  it("should render default confirm button text", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText("تایید")).toBeInTheDocument();
  });

  it("should render custom confirm button text", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        confirmText="Delete"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("should render default cancel button text", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText("انصراف")).toBeInTheDocument();
  });

  it("should render custom cancel button text", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        cancelText="No"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("should call onConfirm when confirm button is clicked", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        confirmText="Yes"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    const confirmButton = screen.getByText("Yes");
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when cancel button is clicked", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        cancelText="No"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    const cancelButton = screen.getByText("No");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("should have correct button styles", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />,
    );

    const confirmButton = screen.getByText("Confirm");
    const cancelButton = screen.getByText("Cancel");

    expect(confirmButton).toHaveClass("bg-actions-primary", "text-white");
    expect(cancelButton).toHaveClass("border", "border-slate-200");
  });
});
