"use client";

import type { UserAccountOverview } from "@/hooks/useUserAccountOverview";
import Link from "next/link";
import { faNum } from "@/utils/faNum";
import clsx from "clsx";

interface RecentOrdersProps {
  data: UserAccountOverview["orders"]["recent"];
  loading: boolean;
}

const statusLabelMap: Record<string, { label: string; tone: "info" | "success" | "warning" | "danger" }> =
  {
    started: { label: "ثبت شده", tone: "info" },
    processing: { label: "در حال آماده‌سازی", tone: "info" },
    shipment: { label: "در حال ارسال", tone: "warning" },
    done: { label: "تحویل شده", tone: "success" },
    delivered: { label: "تحویل شده", tone: "success" },
    cancelled: { label: "لغو شده", tone: "danger" },
    canceled: { label: "لغو شده", tone: "danger" },
  };

const getStatus = (status: string) => {
  const key = status?.toLowerCase?.() || "info";
  return statusLabelMap[key] ?? { label: "نامشخص", tone: "info" };
};

const formatDateTime = (value: string) => {
  try {
    const date = new Date(value);
    const dateText = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
    const timeText = new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
    return `${timeText} - ${dateText}`;
  } catch {
    return "—";
  }
};

const statusToneClass = (tone: "info" | "success" | "warning" | "danger") =>
  clsx(
    "rounded-full px-2 py-1 text-xs font-medium",
    tone === "info" && "bg-blue-50 text-blue-600",
    tone === "success" && "bg-green-50 text-green-600",
    tone === "warning" && "bg-yellow-50 text-yellow-600",
    tone === "danger" && "bg-red-50 text-red-600",
  );

export default function RecentOrders({ data, loading }: RecentOrdersProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-2">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="h-5 w-16 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
        <span className="text-sm font-medium text-slate-500 lg:text-base">
          هنوز سفارشی ثبت نکرده‌اید
        </span>
        <Link
          href="/"
          className="mx-auto rounded-lg bg-gradient-to-l from-pink-500 to-rose-500 px-5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:shadow-lg"
        >
          شروع خرید
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground-primary lg:text-base">آخرین سفارش‌ها</span>
        <Link href="/orders" className="text-xs font-medium text-pink-500 hover:text-pink-600 lg:text-sm">
          مشاهده همه
        </Link>
      </div>

      <div className="flex flex-col divide-y divide-slate-100">
        {data.map((order) => {
          const status = getStatus(order.status);
          return (
            <div key={order.id} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-1 text-right">
                <span className="text-sm font-medium text-foreground-primary lg:text-base">
                  سفارش شماره #{faNum(order.id)}
                </span>
                <span className="text-xs text-slate-500 lg:text-sm">{formatDateTime(order.createdAt)}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground-primary lg:text-base">
                  {faNum(order.total)} تومان
                </span>
                <span className={statusToneClass(status.tone)}>{status.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

