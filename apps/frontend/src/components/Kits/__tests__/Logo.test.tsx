import { render, screen } from "@testing-library/react";
import { StorefrontLogo } from "@repo/brand";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ fill, priority, src, ...props }: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return (
      <img
        data-fill={fill ? "true" : undefined}
        data-priority={priority ? "true" : undefined}
        src={typeof src === "string" ? src : ""}
        {...props}
      />
    );
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("StorefrontLogo", () => {
  it("should render logo image", () => {
    render(<StorefrontLogo />);

    const img = screen.getByAltText("Logo");
    expect(img).toBeInTheDocument();
  });

  it("should render as a link to home page", () => {
    render(<StorefrontLogo />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
  });

  it("should use correct image source", () => {
    render(<StorefrontLogo />);

    const img = screen.getByAltText("Logo");
    expect(img).toHaveAttribute("src", "/images/full-logo.png");
  });

  it("should have priority loading", () => {
    render(<StorefrontLogo />);

    const img = screen.getByAltText("Logo");
    expect(img).toHaveAttribute("data-priority", "true");
  });

  it("should have responsive sizes", () => {
    render(<StorefrontLogo />);

    const img = screen.getByAltText("Logo");
    expect(img).toHaveAttribute("sizes", "(max-width: 768px) 150px, 210px");
  });

  it("should have fill layout", () => {
    render(<StorefrontLogo />);

    const img = screen.getByAltText("Logo");
    expect(img).toHaveAttribute("data-fill", "true");
  });

  it("should have object-contain class", () => {
    render(<StorefrontLogo />);

    const img = screen.getByAltText("Logo");
    expect(img).toHaveClass("object-contain");
  });

  it("should have responsive dimensions container", () => {
    const { container } = render(<StorefrontLogo />);

    const imageContainer = container.querySelector(".relative");
    expect(imageContainer).toHaveClass("h-[52px]");
    expect(imageContainer).toHaveClass("w-[150px]");
    expect(imageContainer).toHaveClass("md:h-[72px]");
    expect(imageContainer).toHaveClass("md:w-[210px]");
  });
});
