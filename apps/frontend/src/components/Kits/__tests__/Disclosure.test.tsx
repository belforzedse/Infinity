import { render, screen, fireEvent } from "@testing-library/react";
import DisclosureItem from "../Disclosure";

jest.mock("@headlessui/react", () => ({
  Disclosure: ({ children, defaultOpen }: any) => <div data-open={defaultOpen}>{children}</div>,
  DisclosureButton: ({ children, className }: any) => (
    <button className={className}>{children}</button>
  ),
  DisclosurePanel: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

jest.mock("../../Product/Icons/ArrowDownIcon", () => ({
  __esModule: true,
  default: ({ className }: any) => <div className={className} data-testid="arrow-icon" />,
}));

describe("DisclosureItem", () => {
  it("should render title", () => {
    render(
      <DisclosureItem title="Click to expand">
        <div>Content</div>
      </DisclosureItem>,
    );

    expect(screen.getByText("Click to expand")).toBeInTheDocument();
  });

  it("should render children content", () => {
    render(
      <DisclosureItem title="Title">
        <div>Panel content</div>
      </DisclosureItem>,
    );

    expect(screen.getByText("Panel content")).toBeInTheDocument();
  });

  it("should be open by default", () => {
    const { container } = render(
      <DisclosureItem title="Title">
        <div>Content</div>
      </DisclosureItem>,
    );

    expect(container.querySelector('[data-open="true"]')).toBeInTheDocument();
  });

  it("should respect defaultOpen prop", () => {
    const { container } = render(
      <DisclosureItem title="Title" defaultOpen={false}>
        <div>Content</div>
      </DisclosureItem>,
    );

    expect(container.querySelector('[data-open="false"]')).toBeInTheDocument();
  });

  it("should render arrow icon", () => {
    render(
      <DisclosureItem title="Title">
        <div>Content</div>
      </DisclosureItem>,
    );

    expect(screen.getByTestId("arrow-icon")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <DisclosureItem title="Title" className="custom-class">
        <div>Content</div>
      </DisclosureItem>,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should render React node as title", () => {
    render(
      <DisclosureItem title={<span data-testid="custom-title">Custom Title</span>}>
        <div>Content</div>
      </DisclosureItem>,
    );

    expect(screen.getByTestId("custom-title")).toBeInTheDocument();
  });

  it("should have disclosure button with correct classes", () => {
    render(
      <DisclosureItem title="Title">
        <div>Content</div>
      </DisclosureItem>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("group", "flex", "w-full", "items-center", "justify-between");
  });

  it("should have panel with mt-2 class", () => {
    const { container } = render(
      <DisclosureItem title="Title">
        <div>Panel</div>
      </DisclosureItem>,
    );

    const panel = container.querySelector(".mt-2");
    expect(panel).toBeInTheDocument();
  });
});
