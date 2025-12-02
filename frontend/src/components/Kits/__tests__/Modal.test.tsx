import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "../Modal";

jest.mock("@headlessui/react", () => {
  const TransitionComponent: any = ({ children, show = true }: any) =>
    show ? <div data-testid="transition">{children}</div> : null;
  TransitionComponent.Child = ({ children }: any) => (
    <div data-testid="transition-child">{children}</div>
  );

  return {
    Dialog: ({ children, onClose }: any) => (
      <div data-testid="dialog" onClick={onClose}>
        {children}
      </div>
    ),
    DialogPanel: ({ children, className }: any) => (
      <div data-testid="dialog-panel" className={className}>
        {children}
      </div>
    ),
    DialogTitle: ({ children, className }: any) => (
      <div data-testid="dialog-title" className={className}>
        {children}
      </div>
    ),
    Transition: TransitionComponent,
  };
});

jest.mock("../Icons/DeleteIcon", () => ({
  __esModule: true,
  default: () => <div data-testid="delete-icon" />,
}));

describe("Modal", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>,
    );

    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose}>
        <div>Modal Content</div>
      </Modal>,
    );

    expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();
  });

  it("should render title when provided", () => {
    render(
      <Modal isOpen={true} title="Test Title" onClose={mockOnClose}>
        <div>Content</div>
      </Modal>,
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("should not render title when not provided", () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Content</div>
      </Modal>,
    );

    const dialogTitle = screen.getByTestId("dialog-title");
    expect(dialogTitle.querySelector("span")).not.toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Content</div>
      </Modal>,
    );

    const closeButton = screen.getByLabelText("بستن");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should render custom close icon when provided", () => {
    const customIcon = <span data-testid="custom-icon">X</span>;

    render(
      <Modal isOpen={true} onClose={mockOnClose} closeIcon={customIcon}>
        <div>Content</div>
      </Modal>,
    );

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("delete-icon")).not.toBeInTheDocument();
  });

  it("should render default delete icon when no custom icon", () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Content</div>
      </Modal>,
    );

    expect(screen.getByTestId("delete-icon")).toBeInTheDocument();
  });

  it("should apply custom className to dialog panel", () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} className="custom-class">
        <div>Content</div>
      </Modal>,
    );

    const dialogPanel = screen.getByTestId("dialog-panel");
    expect(dialogPanel).toHaveClass("custom-class");
  });

  it("should apply custom titleClassName", () => {
    render(
      <Modal
        isOpen={true}
        title="Title"
        onClose={mockOnClose}
        titleClassName="custom-title-class"
      >
        <div>Content</div>
      </Modal>,
    );

    const dialogTitle = screen.getByTestId("dialog-title");
    expect(dialogTitle).toHaveClass("custom-title-class");
  });

  it("should render children correctly", () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </Modal>,
    );

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });
});
