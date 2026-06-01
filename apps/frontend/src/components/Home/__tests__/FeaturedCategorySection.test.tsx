import { render, screen } from "@testing-library/react";
import FeaturedCategorySection from "../FeaturedCategorySection";
import type { ProductSmallCardProps } from "@/components/Product/SmallCard";

jest.mock("@/components/Product/SmallCard", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="small-card">{title}</div>,
}));

describe("FeaturedCategorySection", () => {
  const products: ProductSmallCardProps[] = [
    {
      id: 1,
      slug: "item-1",
      title: "Product 1",
      category: "Cat",
      likedCount: 10,
      price: 100000,
      image: "/uploads/p1.jpg",
    },
    {
      id: 2,
      slug: "item-2",
      title: "Product 2",
      category: "Cat",
      likedCount: 11,
      price: 110000,
      image: "/uploads/p2.jpg",
    },
  ];

  it("renders title, CTA and small cards", () => {
    render(
      <FeaturedCategorySection
        bannerImageUrl="/uploads/featured-banner.jpg"
        categorySlug="special-category"
        products={products}
      />,
    );

    expect(screen.getByText("شاید بپسندید")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /مشاهده همه/ });
    expect(cta).toHaveAttribute("href", "/plp/category/special-category");
    expect(screen.getAllByTestId("small-card")).toHaveLength(2);
    expect(screen.getByLabelText("Featured category banner")).toBeInTheDocument();
  });

  it("renders configurable heading, CTA and banner styles", () => {
    render(
      <FeaturedCategorySection
        bannerImageUrl="/uploads/featured-banner.jpg"
        categorySlug="special-category"
        products={products}
        title="منتخب فصل"
        subtitle="برای استایل روزانه"
        ctaText="دیدن کالکشن"
        ctaHref="/custom"
        bannerImageFit="contain"
        bannerImagePosition="top right"
      />,
    );

    expect(screen.getByText("منتخب فصل")).toBeInTheDocument();
    expect(screen.getByText("برای استایل روزانه")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /دیدن کالکشن/ })).toHaveAttribute(
      "href",
      "/custom",
    );
    expect(screen.getByLabelText("Featured category banner")).toHaveStyle({
      objectFit: "contain",
      objectPosition: "top right",
    });
  });

  it("does not render when required fields are missing", () => {
    const { container } = render(
      <FeaturedCategorySection bannerImageUrl="" categorySlug="" products={products} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
