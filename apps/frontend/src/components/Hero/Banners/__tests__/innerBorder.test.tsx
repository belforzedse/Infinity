import { render } from "@testing-library/react";
import { ActionBanner } from "@/components/Hero/Banners/ActionBanner";
import { LeftBanner } from "@/components/Hero/Banners/LeftBanner";
import type { ActionBannerSpec, LeftBannerSpec } from "@/components/Hero/types";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { loader: _loader, priority: _priority, ...imgProps } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...imgProps} alt={props.alt} />;
  },
}));

const baseActionSpec: ActionBannerSpec = {
  title: "Card title",
  subtitle: "",
  image: {
    src: "",
    alt: "",
    width: 100,
    height: 100,
  },
  colors: {
    background: "#d8cabc",
  },
  background: {
    type: "color",
    value: "#d8cabc",
    innerBorder: {
      enabled: true,
      color: "#ffffff",
      widthPx: 2,
      offsetPx: 12,
    },
  },
};

const baseLeftSpec: LeftBannerSpec = {
  background: {
    type: "color",
    value: "#d8cabc",
    innerBorder: {
      enabled: true,
      color: "#ffffff",
      widthPx: 2,
      offsetPx: 12,
    },
  },
  foregroundImage: {
    src: "",
    alt: "",
    width: 100,
    height: 100,
  },
};

describe("hero banner inner border rendering", () => {
  it("renders an inner border for color action banner backgrounds", () => {
    const { container } = render(<ActionBanner spec={baseActionSpec} />);

    const border = container.querySelector<HTMLElement>("[data-hero-inner-border='true']");

    expect(border).toBeInTheDocument();
    expect(border).toHaveStyle({
      inset: "12px",
      border: "2px solid #ffffff",
    });
  });

  it("does not render an inner border for image action banner backgrounds", () => {
    const { container } = render(
      <ActionBanner
        spec={{
          ...baseActionSpec,
          background: {
            ...baseActionSpec.background!,
            type: "image",
            value: "/uploads/bg.png",
          },
        }}
      />,
    );

    expect(container.querySelector("[data-hero-inner-border='true']")).not.toBeInTheDocument();
  });

  it("renders an inner border for color main visual backgrounds", () => {
    const { container } = render(<LeftBanner spec={baseLeftSpec} />);

    expect(container.querySelector("[data-hero-inner-border='true']")).toBeInTheDocument();
  });
});
