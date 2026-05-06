import { render, screen } from "@testing-library/react";
import Tabs from "../Tabs";
import type { TabItem } from "@/types/Tabs";

jest.mock("@headlessui/react", () => ({
  TabGroup: ({ children }: any) => <div data-testid="tab-group">{children}</div>,
  TabList: ({ children, className }: any) => (
    <div data-testid="tab-list" className={className}>
      {children}
    </div>
  ),
  Tab: ({ children, className }: any) => {
    const classes = typeof className === "function" ? className({ selected: false }) : className;
    return (
      <button data-testid="tab" className={classes}>
        {children}
      </button>
    );
  },
  TabPanels: ({ children, className }: any) => (
    <div data-testid="tab-panels" className={className}>
      {children}
    </div>
  ),
  TabPanel: ({ children, className }: any) => (
    <div data-testid="tab-panel" className={className}>
      {children}
    </div>
  ),
}));

describe("Tabs", () => {
  const mockTabs: TabItem[] = [
    { key: "tab1", value: "Tab 1" },
    { key: "tab2", value: "Tab 2" },
    { key: "tab3", value: "Tab 3" },
  ];

  const mockChildren = [
    <div key="panel1">Panel 1 Content</div>,
    <div key="panel2">Panel 2 Content</div>,
    <div key="panel3">Panel 3 Content</div>,
  ];

  it("should render all tabs", () => {
    render(<Tabs tabs={mockTabs}>{mockChildren}</Tabs>);

    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
    expect(screen.getByText("Tab 3")).toBeInTheDocument();
  });

  it("should render all tab panels", () => {
    render(<Tabs tabs={mockTabs}>{mockChildren}</Tabs>);

    expect(screen.getByText("Panel 1 Content")).toBeInTheDocument();
    expect(screen.getByText("Panel 2 Content")).toBeInTheDocument();
    expect(screen.getByText("Panel 3 Content")).toBeInTheDocument();
  });

  it("should render correct number of tabs", () => {
    render(<Tabs tabs={mockTabs}>{mockChildren}</Tabs>);

    const tabs = screen.getAllByTestId("tab");
    expect(tabs).toHaveLength(3);
  });

  it("should render correct number of panels", () => {
    render(<Tabs tabs={mockTabs}>{mockChildren}</Tabs>);

    const panels = screen.getAllByTestId("tab-panel");
    expect(panels).toHaveLength(3);
  });

  it("should apply custom tabsClassName", () => {
    render(
      <Tabs tabs={mockTabs} tabsClassName="custom-tab-class">
        {mockChildren}
      </Tabs>,
    );

    const tabs = screen.getAllByTestId("tab");
    tabs.forEach((tab) => {
      expect(tab.className).toContain("custom-tab-class");
    });
  });

  it("should have responsive grid layout for tab list", () => {
    render(<Tabs tabs={mockTabs}>{mockChildren}</Tabs>);

    const tabList = screen.getByTestId("tab-list");
    expect(tabList).toHaveClass("grid");
    expect(tabList).toHaveClass("grid-cols-3");
  });

  it("should apply rounded-xl class to tab panels", () => {
    render(<Tabs tabs={mockTabs}>{mockChildren}</Tabs>);

    const panels = screen.getAllByTestId("tab-panel");
    panels.forEach((panel) => {
      expect(panel).toHaveClass("rounded-xl");
    });
  });

  it("should handle empty tabs array", () => {
    render(<Tabs tabs={[]}>{[]}</Tabs>);

    const tabs = screen.queryAllByTestId("tab");
    expect(tabs).toHaveLength(0);
  });

  it("should render tab group wrapper", () => {
    render(<Tabs tabs={mockTabs}>{mockChildren}</Tabs>);

    expect(screen.getByTestId("tab-group")).toBeInTheDocument();
  });
});
