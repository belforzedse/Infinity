"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import FilterBar from "@/components/SuperAdmin/reports/products/FilterBar";
import OverviewTab from "@/components/SuperAdmin/reports/products/OverviewTab";
import TrendsTab from "@/components/SuperAdmin/reports/products/TrendsTab";
import PerformanceTab from "@/components/SuperAdmin/reports/products/PerformanceTab";
import InventoryTab from "@/components/SuperAdmin/reports/products/InventoryTab";
import {
  useReportFilters,
  type ReportTab,
} from "@/components/SuperAdmin/reports/products/useReportFilters";

const TABS: Array<{ key: ReportTab; label: string }> = [
  { key: "overview", label: "نمای کلی" },
  { key: "trends", label: "روند" },
  { key: "performance", label: "عملکرد محصولات" },
  { key: "inventory", label: "موجودی" },
];

export default function ProductReportsPage() {
  const { tab, setTab } = useReportFilters();

  return (
    <ContentWrapper title="گزارش محصولات">
      <div className="space-y-5" dir="rtl">
        <div className="flex flex-wrap gap-1 rounded-2xl bg-neutral-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-infinity-primary shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <FilterBar showProductFilters={tab === "performance"} />

        {tab === "overview" && <OverviewTab />}
        {tab === "trends" && <TrendsTab />}
        {tab === "performance" && <PerformanceTab />}
        {tab === "inventory" && <InventoryTab />}
      </div>
    </ContentWrapper>
  );
}
