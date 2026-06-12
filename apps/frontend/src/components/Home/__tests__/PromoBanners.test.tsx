import { render, screen } from "@testing-library/react";
import HomePromoBanners from "../PromoBanners";

describe("HomePromoBanners", () => {
  it("renders configured banner images and links without overlay content", () => {
    const { container } = render(
      <HomePromoBanners
        previewMode="desktop"
        banners={[
          {
            id: "one",
            imageUrl: "/uploads/banner.jpg",
            title: "Ù†Ø¨Ø§ÛŒØ¯ Ø±Ù†Ø¯Ø± Ø´ÙˆØ¯",
            subtitle: "Ù†Ø¨Ø§ÛŒØ¯ Ø±Ù†Ø¯Ø± Ø´ÙˆØ¯",
            buttonText: "Ù†Ø¨Ø§ÛŒØ¯ Ø±Ù†Ø¯Ø± Ø´ÙˆØ¯",
            buttonHref: "/plp",
            imageFit: "contain",
            imagePosition: "top right",
            textAlign: "center",
          },
        ]}
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/plp");

    const image = container.querySelector("img");
    expect(image).toBeInTheDocument();
    expect(decodeURIComponent(image?.getAttribute("src") || "")).toContain(
      "/uploads/banner.jpg",
    );
    expect(image).toHaveClass("object-cover");
    expect(image).toHaveAttribute("alt", "");

    expect(screen.queryByText("Ù†Ø¨Ø§ÛŒØ¯ Ø±Ù†Ø¯Ø± Ø´ÙˆØ¯")).not.toBeInTheDocument();
  });

  it("does not render banners without an image URL", () => {
    const { container } = render(
      <HomePromoBanners
        banners={[
          { id: "empty", imageUrl: "", title: "Hidden" },
          { id: "spaces", imageUrl: "   ", title: "Hidden" },
        ]}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
