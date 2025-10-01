import { render, screen, fireEvent } from "@testing-library/react";
import ProductCard, { type ProductCardProps } from "../Card";
import { faNum } from "@/utils/faNum";

jest.mock("@/hooks/useProductLike", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isLiked: false,
    isLoading: false,
    toggleLike: jest.fn(),
  })),
}));

jest.mock("../ImageSlider", () => ({
  __esModule: true,
  default: ({ images, title }: { images: string[]; title: string }) => (
    <div data-testid="image-slider">{title}</div>
  ),
}));

jest.mock("../Icons/HeartIcon", () => ({
  __esModule: true,
  default: ({ filled }: { filled: boolean }) => (
    <div data-testid="heart-icon" data-filled={filled} />
  ),
}));

jest.mock("../Icons/GridIcon", () => ({
  __esModule: true,
  default: () => <div data-testid="grid-icon" />,
}));

describe("ProductCard", () => {
  const mockProps: ProductCardProps = {
    images: ["/image1.jpg", "/image2.jpg"],
    category: "Category Name",
    title: "Product Title",
    price: 100000,
    id: 1,
    seenCount: 50,
    isAvailable: true,
  };

  it("should render product card with basic information", () => {
    render(<ProductCard {...mockProps} />);

    expect(screen.getByRole("heading", { name: "Product Title" })).toBeInTheDocument();
    expect(screen.getByText("Category Name")).toBeInTheDocument();
    expect(screen.getByText(`${faNum(100000)} تومان`)).toBeInTheDocument();
  });

  it("should render discount badge when discount is provided", () => {
    render(<ProductCard {...mockProps} discount={20} />);

    expect(screen.getByText("٪20 تخفیف")).toBeInTheDocument();
  });

  it("should not render discount badge when no discount", () => {
    render(<ProductCard {...mockProps} />);

    expect(screen.queryByText(/تخفیف/)).not.toBeInTheDocument();
  });

  it("should render discounted price correctly", () => {
    render(<ProductCard {...mockProps} price={100000} discountPrice={80000} discount={20} />);

    expect(screen.getByText(`${faNum(80000)} تومان`)).toBeInTheDocument();
    expect(screen.getByText(`${faNum(100000)} تومان`)).toBeInTheDocument();
  });

  it("should show original price as strikethrough when discounted", () => {
    const { container } = render(
      <ProductCard {...mockProps} price={100000} discountPrice={80000} discount={20} />,
    );

    const strikethrough = container.querySelector(".line-through");
    expect(strikethrough).toHaveTextContent(`${faNum(100000)} تومان`);
  });

  it("should render seen count when greater than 0", () => {
    render(<ProductCard {...mockProps} seenCount={50} />);

    expect(screen.getByText(/50 نفر در ۲۴ ساعت گذشته آن را دیده‌اند!/)).toBeInTheDocument();
  });

  it("should not render seen count when 0", () => {
    render(<ProductCard {...mockProps} seenCount={0} />);

    expect(screen.queryByText(/نفر در ۲۴ ساعت گذشته/)).not.toBeInTheDocument();
  });

  it("should render color count badge when provided", () => {
    render(<ProductCard {...mockProps} colorsCount={3} />);

    expect(screen.getByText("3+")).toBeInTheDocument();
  });

  it("should not render color count badge when not provided", () => {
    render(<ProductCard {...mockProps} />);

    expect(screen.queryByText("3+")).not.toBeInTheDocument();
  });

  it("should show unavailable message when product is not available", () => {
    render(<ProductCard {...mockProps} isAvailable={false} />);

    expect(screen.getByText("ناموجود")).toBeInTheDocument();
    expect(screen.queryByText(/تومان/)).not.toBeInTheDocument();
  });

  it("should render as a link to product detail page", () => {
    render(<ProductCard {...mockProps} id={123} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/pdp/123");
  });

  it("should render ImageSlider with correct props", () => {
    render(<ProductCard {...mockProps} priority={true} />);

    const slider = screen.getByTestId("image-slider");
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveTextContent("Product Title");
  });

  it("should render favorite button with correct aria-label", () => {
    render(<ProductCard {...mockProps} />);

    const button = screen.getByLabelText("Add to favorites");
    expect(button).toBeInTheDocument();
  });

  it("should show different aria-label when liked", () => {
    const useProductLike = require("@/hooks/useProductLike").default;
    useProductLike.mockReturnValue({
      isLiked: true,
      isLoading: false,
      toggleLike: jest.fn(),
    });

    render(<ProductCard {...mockProps} />);

    expect(screen.getByLabelText("Remove from favorites")).toBeInTheDocument();
  });

  it("should disable favorite button when loading", () => {
    const useProductLike = require("@/hooks/useProductLike").default;
    useProductLike.mockReturnValue({
      isLiked: false,
      isLoading: true,
      toggleLike: jest.fn(),
    });

    render(<ProductCard {...mockProps} />);

    const button = screen.getByLabelText("Add to favorites");
    expect(button).toBeDisabled();
  });

  it("should call toggleLike when favorite button is clicked", () => {
    const mockToggleLike = jest.fn();
    const useProductLike = require("@/hooks/useProductLike").default;
    useProductLike.mockReturnValue({
      isLiked: false,
      isLoading: false,
      toggleLike: mockToggleLike,
    });

    render(<ProductCard {...mockProps} />);

    const button = screen.getByLabelText("Add to favorites");
    fireEvent.click(button);

    expect(mockToggleLike).toHaveBeenCalled();
  });

  it("should not show discounted price if it is greater than or equal to price", () => {
    render(<ProductCard {...mockProps} price={100000} discountPrice={100000} />);

    const priceElements = screen.getAllByText(`${faNum(100000)} تومان`);
    expect(priceElements).toHaveLength(1);
  });

  it("should not show discounted price if it is 0", () => {
    render(<ProductCard {...mockProps} price={100000} discountPrice={0} />);

    expect(screen.queryByText(`${faNum(0)} تومان`)).not.toBeInTheDocument();
  });
});
