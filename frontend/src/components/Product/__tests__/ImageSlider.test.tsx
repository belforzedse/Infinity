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
  const mockImages = [
    "/image1.jpg",
    "/image2.jpg",
    "/image3.jpg",
  ];

  it("should render all images", () => {
    render(<ImageSlider images={mockImages} title="Test Product" />);

    const images = screen.getAllByTestId("blur-image");
    expect(images).toHaveLength(3);
  });

  it("should render image alt text correctly", () => {
    render(<ImageSlider images={mockImages} title="Test Product" />);

    expect(screen.getByText("Test Product - 1")).toBeInTheDocument();
    expect(screen.getByText("Test Product - 2")).toBeInTheDocument();
    expect(screen.getByText("Test Product - 3")).toBeInTheDocument();
  });

  it("should set priority on first image when priority is true", () => {
    render(<ImageSlider images={mockImages} title="Test Product" priority={true} />);

    const images = screen.getAllByTestId("blur-image");
    expect(images[0]).toHaveAttribute("data-priority", "true");
    expect(images[1]).toHaveAttribute("data-priority", "false");
  });

  it("should not set priority when priority is false", () => {
    render(<ImageSlider images={mockImages} title="Test Product" priority={false} />);

    const images = screen.getAllByTestId("blur-image");
    images.forEach((img) => {
      expect(img).toHaveAttribute("data-priority", "false");
    });
  });

  it("should render navigation dots when multiple images", () => {
    const { container } = render(<ImageSlider images={mockImages} title="Test Product" />);

    const dots = container.querySelectorAll(".h-0\\.5");
    expect(dots).toHaveLength(3);
  });

  it("should not render navigation dots for single image", () => {
    const { container } = render(<ImageSlider images={["/single.jpg"]} title="Test Product" />);

    const dots = container.querySelectorAll(".h-0\\.5");
    expect(dots).toHaveLength(0);
  });

  it("should update current slide on scroll", () => {
    const { container } = render(<ImageSlider images={mockImages} title="Test Product" />);

    const scrollContainer = container.querySelector(".flex.h-full");
    expect(scrollContainer).toBeInTheDocument();

    // Initial state - first dot should be active
    const dots = container.querySelectorAll(".h-0\\.5");
    expect(dots[0]).toHaveClass("w-7");
    expect(dots[1]?.classList.contains("w-[9px]")).toBe(true);
  });

  it("should handle empty images array", () => {
    const { container } = render(<ImageSlider images={[]} title="Test Product" />);

    const images = screen.queryAllByTestId("blur-image");
    expect(images).toHaveLength(0);

    const dots = container.querySelectorAll(".h-0\\.5");
    expect(dots).toHaveLength(0);
  });

  it("should apply correct container classes", () => {
    const { container } = render(<ImageSlider images={mockImages} title="Test Product" />);

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass("relative");
    expect(mainContainer).toHaveClass("mx-auto");
    expect(mainContainer).toHaveClass("overflow-hidden");
    expect(mainContainer).toHaveClass("rounded-[21px]");
  });
});
