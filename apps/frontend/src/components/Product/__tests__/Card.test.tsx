import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

jest.mock("@/services/product/product", () => ({
  __esModule: true,
  getLazySecondaryMediaByProductId: jest.fn(),
}));

jest.mock("../ImageSlider", () => ({
  __esModule: true,
  default: ({ images, title }: { images: string[]; title: string }) => (
    <div
      data-testid="image-slider"
      data-image-count={images.length}
      data-images={images.join(",")}
    >
      {title}
    </div>
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
  const useProductLike = require("@/hooks/useProductLike").default;
  const getLazySecondaryMediaByProductId =
    require("@/services/product/product").getLazySecondaryMediaByProductId;

  const mockProps: ProductCardProps = {
    images: ["/image1.jpg", "/image2.jpg"],
    category: "Category Name",
    title: "Product Title",
    price: 100000,
    id: 1,
    seenCount: 50,
    isAvailable: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useProductLike.mockReturnValue({
      isLiked: false,
      isLoading: false,
      toggleLike: jest.fn(),
    });
    getLazySecondaryMediaByProductId.mockResolvedValue([]);
  });

  it("should render product card with basic information", () => {
    render(<ProductCard {...mockProps} />);

    expect(screen.getByRole("heading", { name: "Product Title" })).toBeInTheDocument();
    expect(screen.getByText("Category Name")).toBeInTheDocument();
    expect(screen.getByText(`${faNum(100000)} تومان`)).toBeInTheDocument();
  });

  it("should render discount badge when product is on sale", () => {
    render(
      <ProductCard {...mockProps} price={100000} discountPrice={80000} discount={20} />,
    );

    expect(screen.getByText(`${faNum(20)}٪ تخفیف`)).toBeInTheDocument();
  });

  it("should not render discount badge when no sale", () => {
    render(<ProductCard {...mockProps} />);

    expect(screen.queryByText(/تخفیف/)).not.toBeInTheDocument();
  });

  it("should compute discount percent from prices when discount prop is missing", () => {
    render(<ProductCard {...mockProps} price={100000} discountPrice={75000} />);

    expect(screen.getByText(`${faNum(25)}٪ تخفیف`)).toBeInTheDocument();
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

  it("should never render the view (seen) count to customers", () => {
    render(<ProductCard {...mockProps} seenCount={5000} />);

    expect(screen.queryByText(/نفر در ۲۴ ساعت گذشته/)).not.toBeInTheDocument();
  });

  it("should always render the color badge", () => {
    const { container } = render(<ProductCard {...mockProps} />);

    expect(container.querySelector('[role="img"][aria-label="پیش‌نمایش رنگ"]')).toBeInTheDocument();
  });

  it("should show remaining color count when colorsCount is provided", () => {
    render(<ProductCard {...mockProps} colorsCount={3} colorCodes={["#111111", "#222222"]} />);

    expect(screen.getAllByText(`+${faNum(1)}`).length).toBeGreaterThanOrEqual(1);
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

    const button = screen.getByLabelText("افزودن به علاقه‌مندی‌ها");
    expect(button).toBeInTheDocument();
  });

  it("should show different aria-label when liked", () => {
    useProductLike.mockReturnValue({
      isLiked: true,
      isLoading: false,
      toggleLike: jest.fn(),
    });

    render(<ProductCard {...mockProps} />);

    expect(screen.getByLabelText("حذف از علاقه‌مندی‌ها")).toBeInTheDocument();
  });

  it("should disable favorite button when loading", () => {
    useProductLike.mockReturnValue({
      isLiked: false,
      isLoading: true,
      toggleLike: jest.fn(),
    });

    render(<ProductCard {...mockProps} />);

    const button = screen.getByLabelText("افزودن به علاقه‌مندی‌ها");
    expect(button).toBeDisabled();
  });

  it("should call toggleLike when favorite button is clicked", () => {
    const mockToggleLike = jest.fn();
    useProductLike.mockReturnValue({
      isLiked: false,
      isLoading: false,
      toggleLike: mockToggleLike,
    });

    render(<ProductCard {...mockProps} />);

    const button = screen.getByLabelText("افزودن به علاقه‌مندی‌ها");
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

  it("should lazy-load secondary images once on hover when initial image count is one", async () => {
    getLazySecondaryMediaByProductId.mockResolvedValue(["/image2.jpg", "/image3.jpg"]);
    const { container } = render(<ProductCard {...mockProps} images={["/image1.jpg"]} />);
    const article = container.querySelector("article");

    expect(article).toBeInTheDocument();
    fireEvent.mouseEnter(article!);
    fireEvent.mouseEnter(article!);

    await waitFor(() => {
      expect(getLazySecondaryMediaByProductId).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      const slider = screen.getByTestId("image-slider");
      expect(slider).toHaveAttribute("data-image-count", "3");
      expect(slider).toHaveAttribute("data-images", "/image1.jpg,/image2.jpg,/image3.jpg");
    });
  });

  it("should not request lazy media when product already has multiple images", () => {
    const { container } = render(<ProductCard {...mockProps} images={["/image1.jpg", "/image2.jpg"]} />);
    const article = container.querySelector("article");

    expect(article).toBeInTheDocument();
    fireEvent.mouseEnter(article!);

    expect(getLazySecondaryMediaByProductId).not.toHaveBeenCalled();
  });

  it("should lazy-load secondary media on keyboard focus intent", async () => {
    getLazySecondaryMediaByProductId.mockResolvedValue(["/image2.jpg"]);
    render(<ProductCard {...mockProps} images={["/image1.jpg"]} />);

    fireEvent.focus(screen.getByRole("link"));

    await waitFor(() => {
      expect(getLazySecondaryMediaByProductId).toHaveBeenCalledTimes(1);
    });
  });

  it("should lazy-load secondary media on first touch intent", async () => {
    getLazySecondaryMediaByProductId.mockResolvedValue(["/image2.jpg"]);
    const { container } = render(<ProductCard {...mockProps} images={["/image1.jpg"]} />);
    const article = container.querySelector("article");

    expect(article).toBeInTheDocument();
    fireEvent.touchStart(article!);

    await waitFor(() => {
      expect(getLazySecondaryMediaByProductId).toHaveBeenCalledTimes(1);
    });
  });

  it("should merge lazy-loaded images without duplicates", async () => {
    getLazySecondaryMediaByProductId.mockResolvedValue(["/image1.jpg", "/image2.jpg", "/image2.jpg"]);
    const { container } = render(<ProductCard {...mockProps} images={["/image1.jpg"]} />);
    const article = container.querySelector("article");

    expect(article).toBeInTheDocument();
    fireEvent.mouseEnter(article!);

    await waitFor(() => {
      expect(getLazySecondaryMediaByProductId).toHaveBeenCalledTimes(1);
    });

    const slider = screen.getByTestId("image-slider");
    expect(slider).toHaveAttribute("data-image-count", "2");
    expect(slider).toHaveAttribute("data-images", "/image1.jpg,/image2.jpg");
  });

  it("should keep original images when lazy media fetch fails", async () => {
    getLazySecondaryMediaByProductId.mockRejectedValue(new Error("fetch failed"));
    const { container } = render(<ProductCard {...mockProps} images={["/image1.jpg"]} />);
    const article = container.querySelector("article");

    expect(article).toBeInTheDocument();
    fireEvent.mouseEnter(article!);

    await waitFor(() => {
      expect(getLazySecondaryMediaByProductId).toHaveBeenCalledTimes(1);
    });

    const slider = screen.getByTestId("image-slider");
    expect(slider).toHaveAttribute("data-image-count", "1");
    expect(slider).toHaveAttribute("data-images", "/image1.jpg");
  });

  it("should not lazy-load secondary media for unavailable products", () => {
    const { container } = render(
      <ProductCard {...mockProps} images={["/image1.jpg"]} isAvailable={false} />,
    );
    const article = container.querySelector("article");

    expect(article).toBeInTheDocument();
    fireEvent.mouseEnter(article!);

    expect(getLazySecondaryMediaByProductId).not.toHaveBeenCalled();
  });
});
