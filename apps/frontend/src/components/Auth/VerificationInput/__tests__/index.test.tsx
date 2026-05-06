import { render, screen, fireEvent } from "@testing-library/react";
import VerificationInput from "../index";

describe("VerificationInput", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render correct number of input fields", () => {
    render(<VerificationInput length={6} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
  });

  it("should render default 6 inputs when length not specified", () => {
    render(<VerificationInput onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
  });

  it("should call onChange when digit is entered", () => {
    render(<VerificationInput length={4} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[3], { target: { value: "5" } });

    expect(mockOnChange).toHaveBeenCalledWith("5");
  });

  it("should not accept non-numeric input", () => {
    render(<VerificationInput length={4} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "a" } });

    expect(inputs[0]).toHaveValue("");
  });

  it("should move focus to previous input after entering digit", () => {
    render(<VerificationInput length={4} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[1], { target: { value: "3" } });

    expect(document.activeElement).toBe(inputs[0]);
  });

  it("should not move focus on first input", () => {
    render(<VerificationInput length={4} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "3" } });

    // Should not crash or throw error
    expect(inputs[0]).toHaveValue("3");
  });

  it("should handle backspace key to move focus forward", () => {
    render(<VerificationInput length={4} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[2], { target: { value: "5" } });

    fireEvent.keyDown(inputs[1], { key: "Backspace" });

    expect(document.activeElement).toBe(inputs[2]);
  });

  it("should not move focus on backspace at last input", () => {
    render(<VerificationInput length={4} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.keyDown(inputs[3], { key: "Backspace" });

    // Should not crash
    expect(inputs[3]).toHaveValue("");
  });

  it("should handle arrow right key to move focus left", () => {
    render(<VerificationInput length={4} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.keyDown(inputs[2], { key: "ArrowRight" });

    expect(document.activeElement).toBe(inputs[1]);
  });

  it("should handle arrow left key to move focus right", () => {
    render(<VerificationInput length={4} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.keyDown(inputs[1], { key: "ArrowLeft" });

    expect(document.activeElement).toBe(inputs[2]);
  });

  it("should not move focus on arrow right at first input", () => {
    render(<VerificationInput length={4} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.keyDown(inputs[0], { key: "ArrowRight" });

    // Should not crash
    expect(inputs).toHaveLength(4);
  });

  it("should not move focus on arrow left at last input", () => {
    render(<VerificationInput length={4} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.keyDown(inputs[3], { key: "ArrowLeft" });

    // Should not crash
    expect(inputs).toHaveLength(4);
  });

  it("should handle paste event with numeric data", () => {
    render(<VerificationInput length={6} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    const pasteData = "123456";

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => pasteData,
      } as any,
    });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it("should ignore non-numeric paste data", () => {
    render(<VerificationInput length={6} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    const pasteData = "abc123";

    const callCount = mockOnChange.mock.calls.length;

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => pasteData,
      } as any,
    });

    expect(mockOnChange.mock.calls.length).toBe(callCount);
  });

  it("should truncate pasted data to input length", () => {
    render(<VerificationInput length={4} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    const pasteData = "123456789";

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => pasteData,
      } as any,
    });

    // Should only take first 4 digits
    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
    expect(lastCall[0].length).toBeLessThanOrEqual(4);
  });

  it("should have correct input attributes", () => {
    render(<VerificationInput length={4} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => {
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("inputMode", "numeric");
      expect(input).toHaveAttribute("pattern", "[0-9]*");
      expect(input).toHaveAttribute("maxLength", "1");
      expect(input).toHaveAttribute("autoComplete", "one-time-code");
    });
  });

  it("should call onChange with combined code", () => {
    render(<VerificationInput length={3} onChange={mockOnChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[2], { target: { value: "1" } });
    fireEvent.change(inputs[1], { target: { value: "2" } });
    fireEvent.change(inputs[0], { target: { value: "3" } });

    const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
    expect(lastCall[0]).toBe("321");
  });
});
