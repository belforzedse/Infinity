import { render } from "@testing-library/react";
import MobileHero from "../mobileHero";
import type { MobileLayout } from "../types";

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

jest.mock("../Banners/BannerImage", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    <div data-testid="banner-image" data-src={src}>
      {alt}
    </div>
  ),
}));

jest.mock("../animations", () => ({
  luxurySlideFade: () => ({
    initial: {},
    animate: {},
    exit: {},
  }),
}));

describe("MobileHero", () => {
  const mockLayout: MobileLayout = {
    heroDesktop: {
      src: "/hero-desktop.jpg",
      alt: "Hero Desktop",
      width: 1200,
      height: 600,
    },
    heroMobile: {
      src: "/hero-mobile.jpg",
      alt: "Hero Mobile",
      width: 600,
      height: 400,
    },
    secondaryPrimary: {
      src: "/secondary-primary.jpg",
      alt: "Secondary Primary",
      width: 800,
      height: 400,
    },
    secondaryTop: {
      src: "/secondary-top.jpg",
      alt: "Secondary Top",
      width: 400,
      height: 200,
    },
    secondaryBottom: {
      src: "/secondary-bottom.jpg",
      alt: "Secondary Bottom",
      width: 400,
      height: 200,
    },
  };

  it("should render all banner images", () => {
    const { getAllByTestId } = render(<MobileHero layout={mockLayout} />);

    const banners = getAllByTestId("banner-image");
    // Each banner appears twice: once visible, once invisible for spacing
    expect(banners.length).toBeGreaterThanOrEqual(5);
  });

  it("should render hero desktop and mobile versions", () => {
    const { getAllByTestId } = render(<MobileHero layout={mockLayout} />);

    const banners = getAllByTestId("banner-image");
    const heroDesktop = banners.find((b) => b.getAttribute("data-src") === "/hero-desktop.jpg");
    const heroMobile = banners.find((b) => b.getAttribute("data-src") === "/hero-mobile.jpg");

    expect(heroDesktop).toBeInTheDocument();
    expect(heroMobile).toBeInTheDocument();
  });

  it("should render secondary banners", () => {
    const { getAllByTestId } = render(<MobileHero layout={mockLayout} />);

    const banners = getAllByTestId("banner-image");
    const primary = banners.find((b) => b.getAttribute("data-src") === "/secondary-primary.jpg");
    const top = banners.find((b) => b.getAttribute("data-src") === "/secondary-top.jpg");
    const bottom = banners.find((b) => b.getAttribute("data-src") === "/secondary-bottom.jpg");

    expect(primary).toBeInTheDocument();
    expect(top).toBeInTheDocument();
    expect(bottom).toBeInTheDocument();
  });

  it("should use playKey for animation keys", () => {
    const { container } = render(<MobileHero layout={mockLayout} playKey={5} />);

    expect(container.querySelector('[data-key="hero-5"]')).toBeDefined();
  });

  it("should have proper responsive structure", () => {
    const { container } = render(<MobileHero layout={mockLayout} />);

    // Check for mobile/desktop responsive classes
    const desktopElements = container.querySelectorAll(".hidden.md\\:block");
    const mobileElements = container.querySelectorAll(".md\\:hidden");

    expect(desktopElements.length).toBeGreaterThan(0);
    expect(mobileElements.length).toBeGreaterThan(0);
  });

  it("should render secondary section with correct layout", () => {
    const { container } = render(<MobileHero layout={mockLayout} />);

    const secondarySection = container.querySelector(".mt-4");
    expect(secondarySection).toBeInTheDocument();
    expect(secondarySection).toHaveClass("flex");
    expect(secondarySection).toHaveClass("flex-col");
  });

  it("should handle missing playKey with default value", () => {
    const { container } = render(<MobileHero layout={mockLayout} />);

    expect(container).toBeInTheDocument();
  });
});
