import { render, screen } from "@testing-library/react";
import Logo from "../Logo";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return (
      <img
        data-fill={fill ? "true" : undefined}
        data-priority={priority ? "true" : undefined}
        {...props}
      />
    );
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe("Logo", () => {
  it("should render logo image", () => {
    render(<Logo />);

    const img = screen.getByAltText("Logo");
    expect(img).toBeInTheDocument();
  });

  it("should render as a link to home page", () => {
    render(<Logo />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
  });

  it("should use correct image source", () => {
    render(<Logo />);

    const img = screen.getByAltText("Logo");
    expect(img).toHaveAttribute("src", "/images/cropped-021.webp");
  });

  it("should have priority loading", () => {
    render(<Logo />);

    const img = screen.getByAltText("Logo");
    expect(img).toHaveAttribute("data-priority", "true");
  });

  it("should have responsive sizes", () => {
    render(<Logo />);

    const img = screen.getByAltText("Logo");
    expect(img).toHaveAttribute("sizes", "(max-width: 768px) 90px, 110px");
  });

  it("should have fill layout", () => {
    render(<Logo />);

    const img = screen.getByAltText("Logo");
    expect(img).toHaveAttribute("data-fill", "true");
  });

  it("should have object-contain class", () => {
    render(<Logo />);

    const img = screen.getByAltText("Logo");
    expect(img).toHaveClass("object-contain");
  });

  it("should have responsive dimensions container", () => {
    const { container } = render(<Logo />);

    const imageContainer = container.querySelector(".relative");
    expect(imageContainer).toHaveClass("h-[56px]");
    expect(imageContainer).toHaveClass("w-[90px]");
    expect(imageContainer).toHaveClass("md:h-[95px]");
    expect(imageContainer).toHaveClass("md:w-[152px]");
  });
});
