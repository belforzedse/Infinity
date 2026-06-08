import { render, screen } from "@testing-library/react";
import ImageSlider from "../ImageSlider";

jest.mock("@/components/ui/BlurImage", () => ({
  __esModule: true,
  default: ({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) => (
    <div data-testid="blur-image" data-src={src} data-priority={priority}>
      {alt}
    </div>
  ),
}));

jest.mock("@/utils/imageLoader", () => ({
  __esModule: true,
  default: jest.fn((props) => props.src),
}));

describe("ImageSlider", () => {
  const mockImages = ["/image1.jpg", "/image2.jpg", "/image3.jpg"];

  it("should render only the cover (first) image", () => {
    render(<ImageSlider images={mockImages} title="Test Product" />);

    const images = screen.getAllByTestId("blur-image");
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("data-src", "/image1.jpg");
  });

  it("should render image alt text as product title", () => {
    render(<ImageSlider images={mockImages} title="Test Product" />);

    expect(screen.getByText("Test Product")).toBeInTheDocument();
  });

  it("should set priority on cover image when priority is true", () => {
    render(<ImageSlider images={mockImages} title="Test Product" priority={true} />);

    const images = screen.getAllByTestId("blur-image");
    expect(images[0]).toHaveAttribute("data-priority", "true");
  });

  it("should not set priority when priority is false", () => {
    render(<ImageSlider images={mockImages} title="Test Product" priority={false} />);

    const images = screen.getAllByTestId("blur-image");
    expect(images[0]).toHaveAttribute("data-priority", "false");
  });

  it("should render single image for single-image array", () => {
    render(<ImageSlider images={["/single.jpg"]} title="Test Product" />);

    const images = screen.getAllByTestId("blur-image");
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("data-src", "/single.jpg");
  });

  it("should handle empty images array", () => {
    render(<ImageSlider images={[]} title="Test Product" />);

    const images = screen.queryAllByTestId("blur-image");
    expect(images).toHaveLength(0);
  });

  it("should apply correct container classes", () => {
    const { container } = render(<ImageSlider images={mockImages} title="Test Product" />);

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass("relative");
    expect(mainContainer).toHaveClass("overflow-hidden");
    expect(mainContainer).toHaveClass("rounded-xl");
  });
});
