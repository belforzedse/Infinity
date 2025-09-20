import { render } from "@testing-library/react";
import Breadcrumb from "../Breadcrumb";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({ href, children }: any) {
    return <a href={href}>{children}</a>;
  };
});

// Mock LeftArrowIcon component
jest.mock("../Icons/LeftArrowIcon", () => {
  return function MockLeftArrowIcon() {
    return <span data-testid="left-arrow-icon">→</span>;
  };
});

describe("Breadcrumb component", () => {
  const sampleBreadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Electronics", href: "/products/electronics" },
    { label: "Current Page" },
  ];

  it("renders all breadcrumb items", () => {
    const { getByText } = render(<Breadcrumb breadcrumbs={sampleBreadcrumbs} />);

    expect(getByText("Home")).toBeInTheDocument();
    expect(getByText("Products")).toBeInTheDocument();
    expect(getByText("Electronics")).toBeInTheDocument();
    expect(getByText("Current Page")).toBeInTheDocument();
  });

  it("renders links with correct href attributes", () => {
    const { container } = render(<Breadcrumb breadcrumbs={sampleBreadcrumbs} />);

    const links = container.querySelectorAll("a");
    expect(links[0]).toHaveAttribute("href", "/");
    expect(links[1]).toHaveAttribute("href", "/products");
    expect(links[2]).toHaveAttribute("href", "/products/electronics");
  });

  it("handles breadcrumb items without href", () => {
    const { container } = render(<Breadcrumb breadcrumbs={sampleBreadcrumbs} />);

    const links = container.querySelectorAll("a");
    // Last item should have href="#" since no href is provided
    expect(links[3]).toHaveAttribute("href", "#");
  });

  it("applies correct text styling for intermediate and final items", () => {
    const { getByText } = render(<Breadcrumb breadcrumbs={sampleBreadcrumbs} />);

    // Intermediate items should have muted text color
    expect(getByText("Home").parentElement).toHaveClass("text-foreground-muted");
    expect(getByText("Products").parentElement).toHaveClass("text-foreground-muted");
    expect(getByText("Electronics").parentElement).toHaveClass("text-foreground-muted");

    // Last item should have primary text color
    expect(getByText("Current Page").parentElement).toHaveClass("text-foreground-primary");
  });

  it("renders separators between breadcrumb items", () => {
    const { getAllByTestId } = render(<Breadcrumb breadcrumbs={sampleBreadcrumbs} />);

    const separators = getAllByTestId("left-arrow-icon");
    // Should have n-1 separators for n breadcrumb items
    expect(separators).toHaveLength(sampleBreadcrumbs.length - 1);
  });

  it("does not render separator after the last item", () => {
    const { getAllByTestId } = render(<Breadcrumb breadcrumbs={sampleBreadcrumbs} />);

    const separators = getAllByTestId("left-arrow-icon");
    expect(separators).toHaveLength(3); // 4 items - 1 = 3 separators
  });

  it("handles single breadcrumb item", () => {
    const singleBreadcrumb = [{ label: "Home", href: "/" }];
    const { getByText, queryAllByTestId } = render(<Breadcrumb breadcrumbs={singleBreadcrumb} />);

    expect(getByText("Home")).toBeInTheDocument();
    expect(getByText("Home").parentElement).toHaveClass("text-foreground-primary");

    // No separators for single item
    const separators = queryAllByTestId("left-arrow-icon");
    expect(separators).toHaveLength(0);
  });

  it("handles empty breadcrumbs array", () => {
    const { container } = render(<Breadcrumb breadcrumbs={[]} />);

    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it("applies correct container styles", () => {
    const { container } = render(<Breadcrumb breadcrumbs={sampleBreadcrumbs} />);

    const breadcrumbContainer = container.firstChild;
    expect(breadcrumbContainer).toHaveClass("flex", "items-center", "gap-1");
  });

  it("applies text-xs class to all breadcrumb labels", () => {
    const { getByText } = render(<Breadcrumb breadcrumbs={sampleBreadcrumbs} />);

    sampleBreadcrumbs.forEach((breadcrumb) => {
      expect(getByText(breadcrumb.label).parentElement).toHaveClass("text-xs");
    });
  });

  it("renders breadcrumbs with special characters in labels", () => {
    const specialBreadcrumbs = [
      { label: "Home & Garden", href: "/" },
      { label: "Tools & Equipment", href: "/tools" },
      { label: "Drills (10mm-20mm)", href: "/drills" },
    ];

    const { getByText } = render(<Breadcrumb breadcrumbs={specialBreadcrumbs} />);

    expect(getByText("Home & Garden")).toBeInTheDocument();
    expect(getByText("Tools & Equipment")).toBeInTheDocument();
    expect(getByText("Drills (10mm-20mm)")).toBeInTheDocument();
  });

  it("maintains proper gap spacing between elements", () => {
    const { container } = render(<Breadcrumb breadcrumbs={sampleBreadcrumbs} />);

    const breadcrumbItems = container.querySelectorAll("div > div");
    breadcrumbItems.forEach((item) => {
      expect(item).toHaveClass("flex", "items-center", "gap-1");
    });
  });
});