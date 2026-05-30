import { render, screen } from "@testing-library/react";
import MobileHero from "../mobileHero";
import type { MobileLayout } from "../types";

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  motion: {
    div: ({ children, className, ...props }: React.ComponentProps<"div">) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  useReducedMotion: () => false,
}));

jest.mock("../Banners/LeftBanner", () => ({
  LeftBanner: ({ spec }: { spec: { foregroundImage: { alt: string } } }) => (
    <div data-testid="left-banner">{spec.foregroundImage.alt}</div>
  ),
}));

jest.mock("../Banners/ActionBanner", () => ({
  ActionBanner: ({
    spec,
    variant,
  }: {
    spec: { title: string };
    variant?: string;
  }) => (
    <div data-testid="action-banner" data-variant={variant ?? "default"}>
      {spec.title}
    </div>
  ),
}));

jest.mock("../Banners/TextBanner", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <h1 data-testid="text-banner">{title}</h1>,
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
    primaryBanner: {
      title: "تیتر موبایل",
      subtitle: "زیرتیتر",
      className: "rounded-3xl",
    },
    heroBanner: {
      background: { type: "color", value: "#f8fafc" },
      foregroundImage: {
        src: "/hero-mobile.webp",
        alt: "Hero Mobile",
        width: 600,
        height: 600,
      },
    },
    bottomActionBannerLeft: {
      title: "پلیورها",
      image: {
        src: "/card-left.webp",
        alt: "Left card",
        width: 400,
        height: 500,
      },
      button: { label: "", href: "/plp", showArrow: true },
    },
    bottomActionBannerRight: {
      title: "دامن ها",
      image: {
        src: "/card-right.webp",
        alt: "Right card",
        width: 400,
        height: 500,
      },
      button: { label: "", href: "/plp", showArrow: true },
    },
  };

  it("renders headline, hero, and compact action cards", () => {
    render(<MobileHero layout={mockLayout} slideKey={0} />);

    expect(screen.getByTestId("text-banner")).toHaveTextContent("تیتر موبایل");
    expect(screen.getByTestId("left-banner")).toHaveTextContent("Hero Mobile");
    expect(screen.getAllByTestId("action-banner")).toHaveLength(2);
    expect(screen.getByText("پلیورها")).toBeInTheDocument();
    expect(screen.getByText("دامن ها")).toBeInTheDocument();
  });

  it("uses compact variant for bottom action banners", () => {
    render(<MobileHero layout={mockLayout} />);

    const cards = screen.getAllByTestId("action-banner");
    cards.forEach((card) => {
      expect(card).toHaveAttribute("data-variant", "compact");
    });
  });

  it("uses Figma-ratio layout structure", () => {
    const { container } = render(<MobileHero layout={mockLayout} />);

    expect(container.querySelector(".aspect-\\[361\\/245\\]")).toBeInTheDocument();
    expect(container.querySelectorAll(".aspect-\\[176\\/118\\]")).toHaveLength(2);
    expect(container.querySelector(".gap-2")).toBeInTheDocument();
  });
});
