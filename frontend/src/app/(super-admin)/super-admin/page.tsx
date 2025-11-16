"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useMe } from "@/hooks/api/useMe";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";
import Link from "next/link";
import { faNum } from "@/utils/faNum";
import { DashboardMetric, useDashboardMetrics } from "@/hooks/useDashboardMetrics";

const quickActions = [
  { href: "/super-admin/orders", label: "پیگیری سفارش‌ها" },
  { href: "/super-admin/products", label: "مدیریت محصولات" },
  { href: "/super-admin/users", label: "مشتریان" },
];


const badgeVariants: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  default: "bg-slate-100 text-slate-600",
};

export default function SuperAdminPage() {
  const { data: me, isLoading, error } = useMe();
  const {
    metrics,
    latestOrders,
    latestRevenue,
    loading: metricsLoading,
    error: metricsError,
  } = useDashboardMetrics();

  const name = `${me?.FirstName || ""} ${me?.LastName || ""}`;
  const userFacingError = error
    ? getUserFacingErrorMessage(error, "خطا در دریافت اطلاعات کاربری")
    : null;

  const notifications = (latestOrders ?? []).map((order: any) => {
    // Extract nested Strapi attributes
    const attributes = order?.attributes || {};
    const userAttributes = order?.attributes?.user?.data?.attributes || {};
    const userInfoAttributes = userAttributes?.user_info?.data?.attributes || {};
    const contractAttributes = order?.attributes?.contract?.data?.attributes || {};

    const firstName = userInfoAttributes?.FirstName || "";
    const lastName = userInfoAttributes?.LastName || "";
    const fullName = `${firstName} ${lastName}`.trim();

    const key = order?.id ?? Math.random();
    const time = new Date(attributes?.updatedAt ?? attributes?.createdAt ?? Date.now()).toLocaleTimeString(
      "fa-IR",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
    return {
      title: `سفارش #${order.id}`,
      details: `${fullName || "مشتری نامشخص"} - ${attributes.Status || "وضعیت نامشخص"}`,
      statusLabel: attributes.Status || "وضعیت نامشخص",
      time,
      badge:
        attributes.Status === "Done"
          ? badgeVariants.paid
          : attributes.Status === "Cancelled"
          ? badgeVariants.failed
          : attributes.Status === "Shipment"
          ? badgeVariants.pending
          : badgeVariants.default,
      amount: Number(contractAttributes?.Amount ?? 0),
      id: key,
    };
  });

  return (
    <ContentWrapper title={`سلام ${name.trim() || "همکار گرامی"}`}>
      {userFacingError && (
        <p className="text-sm text-red-500" dir="rtl">
          {userFacingError}
        </p>
      )}
      {isLoading && !error && <p className="text-sm text-neutral-500">در حال بارگذاری...</p>}
      {metricsError && (
        <p className="mt-3 text-sm text-red-500" dir="rtl">
          {metricsError}
        </p>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(metricsLoading || !metrics
          ? Array.from({ length: 4 }, () => null as DashboardMetric | null)
          : metrics
        ).map((metric, index) => (
          <article
            key={metric?.label ?? index}
            className={`flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              !metric ? "animate-pulse" : ""
            }`}
          >
            <span className="text-xs uppercase tracking-wide text-slate-500">
              {metric?.label ?? "\u00A0"}
            </span>
            <strong className="text-3xl font-semibold text-slate-900">
              {metric ? faNum(metric.value) : "\u00A0"}
            </strong>
            <p className="text-sm text-slate-500">{metric?.helper ?? "\u00A0"}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-slate-900">اقدامات سریع</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm font-semibold text-pink-600 transition hover:bg-pink-50"
            >
              <span className="h-2 w-2 rounded-full bg-pink-500" aria-hidden />
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">سفارش‌های اخیر</h2>
          {latestOrders?.length ? (
            <p className="text-sm text-slate-500">
              جمع {faNum(latestRevenue ?? 0)} تومان · {faNum(latestOrders.length)} سفارش
            </p>
          ) : metricsLoading ? (
            <span className="text-sm text-slate-400">در حال دریافت داده‌ها…</span>
          ) : (
            <span className="text-sm text-slate-400">هنوز سفارشی ثبت نشده</span>
          )}
        </div>
        <div className="mt-3 space-y-3">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <article
                key={notification.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-base text-slate-900">{notification.title}</strong>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${notification.badge}`}
                  >
                    {notification.statusLabel}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{notification.details}</p>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{notification.time}</span>
                  <span>{faNum(notification.amount)} تومان</span>
                </div>
              </article>
            ))
          ) : (
            <article className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm">
              <p className="text-sm text-slate-500">اطلاعات سفارش‌ها هنوز در دسترس نیست.</p>
            </article>
          )}
        </div>
      </section>
    </ContentWrapper>
  );
}
