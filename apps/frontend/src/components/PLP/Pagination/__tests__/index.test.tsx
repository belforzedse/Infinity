import { fireEvent, render, screen } from "@testing-library/react";
import PLPPagination from "../index";
import { scrollIntoViewWithOffset } from "@/utils/scroll";

jest.mock("@/utils/scroll", () => ({
  scrollIntoViewWithOffset: jest.fn(),
}));

describe("PLPPagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not call onPageChange when disabled", () => {
    const onPageChange = jest.fn();

    render(<PLPPagination currentPage={2} totalPages={4} onPageChange={onPageChange} disabled />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => expect(button).toBeDisabled());

    fireEvent.click(screen.getByText("3"));
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[buttons.length - 1]);

    expect(onPageChange).not.toHaveBeenCalled();
    expect(scrollIntoViewWithOffset).not.toHaveBeenCalled();
  });

  it("calls onPageChange when enabled", () => {
    const onPageChange = jest.fn();

    render(<PLPPagination currentPage={2} totalPages={4} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByText("3"));

    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(scrollIntoViewWithOffset).toHaveBeenCalled();
  });
});
