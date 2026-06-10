import { render, screen } from "@testing-library/react";
import KpiCard from "../KpiCard";

describe("KpiCard", () => {
  it("renders a loading skeleton when no delta is provided", () => {
    const { container } = render(<KpiCard title="فروش" format="toman" loading />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("فروش")).not.toBeInTheDocument();
  });

  it("renders a positive change with an up arrow and percentage", () => {
    render(
      <KpiCard
        title="فروش ناخالص محصولات"
        format="toman"
        delta={{ current: 150, previous: 100, change: 50, changePct: 50 }}
      />,
    );
    expect(screen.getByText("فروش ناخالص محصولات")).toBeInTheDocument();
    // Up arrow present
    expect(screen.getByText(/↑/)).toBeInTheDocument();
  });

  it("renders a dash for percentage when the previous period is zero", () => {
    render(
      <KpiCard
        title="مرجوعی"
        format="toman"
        delta={{ current: 120, previous: 0, change: 120, changePct: null }}
      />,
    );
    expect(screen.getByText(/—/)).toBeInTheDocument();
  });

  it("shows an estimate badge when flagged", () => {
    render(
      <KpiCard
        title="خالص فروش"
        format="toman"
        estimate
        delta={{ current: 1, previous: 1, change: 0, changePct: 0 }}
      />,
    );
    expect(screen.getByText("تخمینی")).toBeInTheDocument();
  });
});
