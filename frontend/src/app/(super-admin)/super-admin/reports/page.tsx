"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { faNum } from "@/utils/faNum";
import { getLiquidity } from "@/services/super-admin/reports/liquidity";
import { getProductSales } from "@/services/super-admin/reports/productSales";
import { getGatewayLiquidity } from "@/services/super-admin/reports/gatewayLiquidity";
import { getAdminActivity } from "@/services/super-admin/reports/adminActivity";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface OverviewState {
  liquidityTotal: number;
  liquidityChangePct: number | null;
  productRevenue: number;
  topProduct?: string;
  gatewayTotal: number;
  topGateway?: string;
  adminActions: number;
}

export default function ReportsIndexPage() {
  const router = useRouter();
  const { roleName, isLoading } = useCurrentUser();
  const normalizedRole = (roleName ?? "").toLowerCase().trim();
  const [overview, setOverview] = useState<OverviewState | null>(null);
  const [loading, setLoading] = useState(false);

  const range = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { start: start.toISOString(), end: end.toISOString() };
  }, []);

  useEffect(() => {
    if (!isLoading && normalizedRole !== "superadmin") {
      router.replace("/super-admin");
      return;
    }
  }, [isLoading, normalizedRole, router]);

  useEffect(() => {
    if (isLoading || normalizedRole !== "superadmin") {
      return;
    }

    const fetchOverview = async () => {
      try {
        setLoading(true);
        const [liqRes, productRows, gatewayRows, adminRes] = await Promise.all([
          getLiquidity({ start: range.start, end: range.end, interval: "day" }),
          getProductSales({ start: range.start, end: range.end }),
          getGatewayLiquidity({ start: range.start, end: range.end }),
          getAdminActivity({ startDate: range.start, endDate: range.end, pageSize: 1 }),
        ]);

        const productRevenue = productRows.reduce(
          (sum, row) => sum + Number(row.totalRevenue || 0),
          0,
        );
        const gatewayTotal = gatewayRows.reduce(
          (sum, row) => sum + Number(row.total || 0),
          0,
        );

        setOverview({
          liquidityTotal: liqRes.data.total,
          liquidityChangePct: liqRes.data.summary?.deltaPct ?? null,
          productRevenue,
          topProduct: productRows[0]?.productTitle,
          gatewayTotal,
          topGateway: gatewayRows[0]?.gatewayTitle,
          adminActions:
            adminRes.summary?.total ||
            adminRes.meta?.pagination?.total ||
            adminRes.data?.length ||
            0,
        });
      } catch (error) {
        console.error("Failed to load report overview", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [range.end, range.start, isLoading, normalizedRole]);

  if (!isLoading && normalizedRole !== "superadmin") {
    return null;
  }

  return (
    <ContentWrapper title="داشبورد گزارش‌ها">
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">خلاصه ۳۰ روز اخیر</p>
                <h2 className="text-xl font-bold text-neutral-800">تصویر کلان عملکرد</h2>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-pink-400" />
                  در حال به‌روزرسانی
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <OverviewCard
                title="مجموع نقدینگی"
                value={`${faNum(overview?.liquidityTotal || 0)} تومان`}
                subtitle={`تغییر دوره قبل: ${
                  overview?.liquidityChangePct !== null && overview?.liquidityChangePct !== undefined
                    ? `${faNum(overview.liquidityChangePct.toFixed(1))}%`
                    : "—"
                }`}
                href="/super-admin/reports/liquidity"
              />
              <OverviewCard
                title="درآمد محصولات"
                value={`${faNum(overview?.productRevenue || 0)} تومان`}
                subtitle={overview?.topProduct ? `پرفروش: ${overview.topProduct}` : "پرفروش در دست بررسی"}
                href="/super-admin/reports/product-sales"
              />
              <OverviewCard
                title="نقدینگی درگاه‌ها"
                value={`${faNum(overview?.gatewayTotal || 0)} تومان`}
                subtitle={overview?.topGateway ? `برترین درگاه: ${overview.topGateway}` : "بدون تراکنش"}
                href="/super-admin/reports/gateway-liquidity"
              />
              <OverviewCard
                title="فعالیت ادمین‌ها"
                value={`${faNum(overview?.adminActions || 0)} رویداد`}
                subtitle="ممیزی و کنترل تغییرات"
                href="/super-admin/reports/admin-activity"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-800">گزارش‌های تخصصی</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ReportLinkCard
              title="گزارش نقدینگی"
              description="روندها، مقایسه دوره‌ای و نقاط اوج نقدینگی"
              href="/super-admin/reports/liquidity"
            />
            <ReportLinkCard
              title="گزارش فروش محصول"
              description="پرفروش‌ها، سهم درآمد و سبد محصولات"
              href="/super-admin/reports/product-sales"
            />
            <ReportLinkCard
              title="گزارش درگاه‌ها"
              description="عملکرد هر درگاه و سهم از کل نقدینگی"
              href="/super-admin/reports/gateway-liquidity"
            />
            <ReportLinkCard
              title="فعالیت ادمین"
              description="رخدادهای ممیزی، شدت و کاربر مسئول"
              href="/super-admin/reports/admin-activity"
            />
          </div>
        </div>
      </div>
    </ContentWrapper>
  );
}

function OverviewCard({
  title,
  value,
  subtitle,
  href,
}: {
  title: string;
  value: string;
  subtitle?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:bg-neutral-50"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-700">{title}</span>
          <span className="text-xs text-pink-500 opacity-0 transition-opacity group-hover:opacity-100">
            مشاهده جزئیات →
          </span>
        </div>
        <span className="text-2xl font-bold text-neutral-900">{value}</span>
        {subtitle ? <span className="text-xs text-neutral-500">{subtitle}</span> : null}
      </div>
    </Link>
  );
}

function ReportLinkCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col justify-between rounded-xl border border-neutral-200 p-4 transition-all hover:-translate-y-1 hover:border-pink-200 hover:bg-neutral-50"
    >
      <div className="space-y-2">
        <h4 className="text-base font-semibold text-neutral-800">{title}</h4>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <span className="mt-3 text-xs font-medium text-pink-600 group-hover:underline">
        ورود به گزارش
      </span>
    </Link>
  );
}
