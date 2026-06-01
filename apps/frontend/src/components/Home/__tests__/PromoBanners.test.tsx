import { render, screen } from "@testing-library/react";
import HomePromoBanners from "../PromoBanners";

describe("HomePromoBanners", () => {
  it("renders ready banners with compact configurable content", () => {
    render(
      <HomePromoBanners
        previewMode="desktop"
        banners={[
          {
            id: "one",
            imageUrl: "/uploads/banner.jpg",
            title: "آخرای تابستونه",
            subtitle: "مانتو جدید",
            buttonText: "دیدن",
            buttonHref: "/plp",
            imageFit: "contain",
            imagePosition: "top right",
            textAlign: "center",
          },
        ]}
      />,
    );

    expect(screen.getByText("آخرای تابستونه")).toBeInTheDocument();
    expect(screen.getByText("مانتو جدید")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /دیدن/ })).toHaveAttribute("href", "/plp");
    expect(screen.getByAltText("آخرای تابستونه")).toHaveStyle({
      objectFit: "contain",
      objectPosition: "top right",
    });
  });

  it("does not render incomplete banners", () => {
    const { container } = render(
      <HomePromoBanners banners={[{ id: "one", imageUrl: "/uploads/banner.jpg", title: "" }]} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
