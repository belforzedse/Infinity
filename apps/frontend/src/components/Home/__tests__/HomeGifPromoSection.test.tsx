import { render, screen } from "@testing-library/react";
import HomeGifPromoSection from "../HomeGifPromoSection";
import type { ProductCardProps } from "@/components/Product/Card";

jest.mock("@/components/Product/SmallCard", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="small-card">{title}</div>,
}));

const product = (id: number): ProductCardProps => ({
  id,
  slug: `product-${id}`,
  title: `Product ${id}`,
  category: "Category",
  price: 100000,
  seenCount: 0,
  images: [`/uploads/product-${id}.jpg`],
});

describe("HomeGifPromoSection", () => {
  it("renders two independent GIF slots and compact cards", () => {
    const { container } = render(
      <HomeGifPromoSection
        slots={[
          {
            id: "slot-1",
            imageUrl: "/uploads/slot-1.gif",
            products: [product(1), product(2), product(3), product(4)],
          },
          {
            id: "slot-2",
            imageUrl: "/uploads/slot-2.gif",
            products: [product(5), product(6), product(7), product(8)],
          },
        ]}
      />,
    );

    expect(screen.getAllByTestId("small-card")).toHaveLength(8);
    const images = Array.from(container.querySelectorAll("img"));
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", expect.stringContaining("/uploads/slot-1.gif"));
    expect(images[1]).toHaveAttribute("src", expect.stringContaining("/uploads/slot-2.gif"));
  });

  it("suppresses incomplete slots", () => {
    const { container } = render(
      <HomeGifPromoSection
        slots={[
          {
            id: "slot-1",
            imageUrl: "",
            products: [product(1)],
          },
          {
            id: "slot-2",
            imageUrl: "/uploads/slot-2.gif",
            products: [],
          },
        ]}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders at most four cards per slot", () => {
    render(
      <HomeGifPromoSection
        slots={[
          {
            id: "slot-1",
            imageUrl: "/uploads/slot-1.gif",
            products: [product(1), product(2), product(3), product(4), product(5)],
          },
        ]}
      />,
    );

    expect(screen.getAllByTestId("small-card")).toHaveLength(4);
  });
});
